/**
 * "Aujourd'hui" figures (Phase 15, TDY-01 / TDY-02) and parity with the public
 * booking availability (gecko_create_reservation, migration 008).
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { ReservationStatus } from '../src/types/database'
import {
  computeToday,
  groupArrivalsByHour,
  hourlySlots,
  parseBlockMinutes,
  parseMaxCovers,
  peakSimultaneous,
  slotLevel,
  slotUsedCovers,
  wouldAcceptBooking,
  type DayReservation,
} from '../src/utils/today'
import { toMinutes } from '../src/utils/reservation-rules'

let nextId = 1
const r = (time: string, party: number, status: ReservationStatus = 'confirmed'): DayReservation => ({
  id: nextId++,
  reservation_time: time,
  party_size: party,
  status,
})

// ---------------------------------------------------------------------------
// SQL transcription (oracle) — literal port of migration 008, written
// independently from the production code.
// ---------------------------------------------------------------------------

function sqlSetting(value: string | undefined, dflt: number): number {
  // case when s.value ~ '^\s*\d+\s*$' then trim(s.value)::integer else dflt end ; coalesce(.., dflt)
  if (value === undefined) return dflt
  return /^\s*\d+\s*$/.test(value) ? Number(value.trim()) : dflt
}

function sqlAccepts(
  rows: DayReservation[],
  pTime: string,
  pParty: number,
  settings: Record<string, string | undefined>,
): boolean {
  const vMax = sqlSetting(settings.max_covers, 40)
  const vBlock = sqlSetting(settings.table_block_duration_minutes, 120)
  const pMin = toMinutes(pTime)
  let vUsed = 0
  for (const x of rows) {
    if (x.status !== 'pending' && x.status !== 'confirmed') continue
    if (Math.abs(toMinutes(x.reservation_time) - pMin) < vBlock) vUsed += x.party_size
  }
  // if v_used + p_party > v_max then full
  return !(vUsed + pParty > vMax)
}

describe('migration 008 is the source of the rule (guard against drift)', () => {
  const sql = readFileSync('supabase/migrations/008_reservation_booking.sql', 'utf8')
  it('still uses the strict window, pending+confirmed and v_used + p_party > v_max', () => {
    expect(sql).toContain("r.status in ('pending', 'confirmed')")
    expect(sql).toContain('abs(extract(epoch from (r.reservation_time - p_time)) / 60) < v_block')
    expect(sql).toContain('if v_used + p_party > v_max then')
    expect(sql).toContain("'table_block_duration_minutes'")
    expect(sql).toContain("'max_covers'")
  })
})

// ---------------------------------------------------------------------------
// Parity
// ---------------------------------------------------------------------------

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('parity with gecko_create_reservation', () => {
  const STATUSES: ReservationStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']
  const SLOTS = ['11:30', '12:00', '12:30', '13:00', '13:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30']
  const SETTINGS: Record<string, string | undefined>[] = [
    {},
    { max_covers: '40', table_block_duration_minutes: '120' },
    { max_covers: '30', table_block_duration_minutes: '90' },
    { max_covers: ' 25 ', table_block_duration_minutes: ' 60 ' },
    { max_covers: 'abc', table_block_duration_minutes: '' },
    { max_covers: '12.5', table_block_duration_minutes: '-30' },
    { max_covers: '0', table_block_duration_minutes: '0' },
    { max_covers: '50', table_block_duration_minutes: '30' },
    { max_covers: '40', table_block_duration_minutes: '600' },
  ]

  it('agrees on 20 000 random (day, slot, party, settings) cases', () => {
    const rand = rng(20261031)
    let disagreements = 0
    let acceptedCount = 0
    let refusedCount = 0
    for (let i = 0; i < 20000; i++) {
      const n = Math.floor(rand() * 12)
      const rows: DayReservation[] = []
      for (let k = 0; k < n; k++) {
        rows.push({
          id: k + 1,
          reservation_time: SLOTS[Math.floor(rand() * SLOTS.length)] + (rand() < 0.5 ? ':00' : ''),
          party_size: 1 + Math.floor(rand() * 12),
          status: STATUSES[Math.floor(rand() * STATUSES.length)],
        })
      }
      const settings = SETTINGS[Math.floor(rand() * SETTINGS.length)]
      const time = SLOTS[Math.floor(rand() * SLOTS.length)]
      const party = 1 + Math.floor(rand() * 40)
      const expected = sqlAccepts(rows, time, party, settings)
      const actual = wouldAcceptBooking(rows, time, party, settings)
      if (expected) acceptedCount++
      else refusedCount++
      if (expected !== actual) disagreements++
    }
    expect(disagreements).toBe(0)
    // the sample must exercise both outcomes, otherwise the proof is vacuous
    expect(acceptedCount).toBeGreaterThan(2000)
    expect(refusedCount).toBeGreaterThan(2000)
  })

  it('hourly slot figure equals the SQL used-covers at the same time (every hour, many days)', () => {
    const rand = rng(7)
    for (let i = 0; i < 2000; i++) {
      const rows: DayReservation[] = []
      const n = Math.floor(rand() * 15)
      for (let k = 0; k < n; k++) {
        rows.push({
          id: k + 1,
          reservation_time: SLOTS[Math.floor(rand() * SLOTS.length)],
          party_size: 1 + Math.floor(rand() * 10),
          status: STATUSES[Math.floor(rand() * STATUSES.length)],
        })
      }
      const settings = SETTINGS[Math.floor(rand() * SETTINGS.length)]
      const max = sqlSetting(settings.max_covers, 40)
      for (const slot of hourlySlots(rows, settings)) {
        // a 1-cover booking fits iff used + 1 <= max in SQL; used < max <=> accepted
        expect(sqlAccepts(rows, slot.time, 1, settings)).toBe(slot.used + 1 <= max)
        expect(slot.max).toBe(max)
        // and a full slot refuses what the form would refuse
        if (slot.level === 'full') expect(wouldAcceptBooking(rows, slot.time, 1, settings)).toBe(false)
      }
    }
  })

  it('strict window boundary: exactly block minutes apart does NOT block, one minute less does', () => {
    const rows = [r('12:00', 40)]
    expect(wouldAcceptBooking(rows, '14:00', 1, {})).toBe(true) // 120 min apart
    expect(wouldAcceptBooking(rows, '13:30', 1, {})).toBe(false) // 90 min apart
    expect(sqlAccepts(rows, '14:00', 1, {})).toBe(true)
    expect(sqlAccepts(rows, '13:30', 1, {})).toBe(false)
    // symmetric: earlier slot
    expect(wouldAcceptBooking([r('14:00', 40)], '12:00', 1, {})).toBe(true)
    expect(wouldAcceptBooking([r('14:00', 40)], '12:30', 1, {})).toBe(false)
  })

  it('capacity boundary: used + party == max is accepted, +1 is refused', () => {
    const rows = [r('19:00', 30)]
    expect(wouldAcceptBooking(rows, '19:00', 10, {})).toBe(true)
    expect(wouldAcceptBooking(rows, '19:00', 11, {})).toBe(false)
  })

  it('only pending and confirmed block the form; completed / cancelled / no_show do not', () => {
    for (const s of ['completed', 'cancelled', 'no_show'] as const) {
      expect(slotUsedCovers([r('19:00', 20, s)], 19 * 60, 120)).toBe(0)
    }
    for (const s of ['pending', 'confirmed'] as const) {
      expect(slotUsedCovers([r('19:00', 20, s)], 19 * 60, 120)).toBe(20)
    }
  })

  it('invalid party sizes are refused like the API (1..40)', () => {
    expect(wouldAcceptBooking([], '19:00', 0, {})).toBe(false)
    expect(wouldAcceptBooking([], '19:00', 41, {})).toBe(false)
    expect(wouldAcceptBooking([], '19:00', 2.5, {})).toBe(false)
    expect(wouldAcceptBooking([], '19:00', 40, {})).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Settings parsing
// ---------------------------------------------------------------------------

describe('settings parsing (same as the SQL)', () => {
  it('defaults 40 / 120', () => {
    expect(parseMaxCovers({})).toBe(40)
    expect(parseBlockMinutes({})).toBe(120)
  })
  it('digits only, trimmed; anything else -> default', () => {
    expect(parseMaxCovers({ max_covers: ' 32 ' })).toBe(32)
    expect(parseMaxCovers({ max_covers: '3.5' })).toBe(40)
    expect(parseMaxCovers({ max_covers: '-4' })).toBe(40)
    expect(parseMaxCovers({ max_covers: '' })).toBe(40)
    expect(parseBlockMinutes({ table_block_duration_minutes: '90' })).toBe(90)
    expect(parseBlockMinutes({ table_block_duration_minutes: 'x' })).toBe(120)
    expect(parseBlockMinutes({ table_block_duration_minutes: '0' })).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Hourly slots (TDY-02)
// ---------------------------------------------------------------------------

describe('slotLevel', () => {
  it('free < 30, almost 30..39, full >= 40 (max 40)', () => {
    expect(slotLevel(0, 40)).toBe('free')
    expect(slotLevel(29, 40)).toBe('free')
    expect(slotLevel(30, 40)).toBe('almost')
    expect(slotLevel(39, 40)).toBe('almost')
    expect(slotLevel(40, 40)).toBe('full')
    expect(slotLevel(45, 40)).toBe('full')
  })
  it('scales with max_covers and handles max 0', () => {
    expect(slotLevel(15, 20)).toBe('almost')
    expect(slotLevel(14, 20)).toBe('free')
    expect(slotLevel(0, 0)).toBe('full')
  })
})

describe('hourlySlots', () => {
  it('returns 10 columns 12:00..21:00', () => {
    const s = hourlySlots([], {})
    expect(s.map((x) => x.time)).toEqual(['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'])
    expect(s.every((x) => x.used === 0 && x.max === 40 && x.level === 'free')).toBe(true)
  })
  it('example of the D2 mockup: 31 covers at 20h is "presque complet"', () => {
    const rows = [r('19:30', 12), r('20:00', 19, 'pending'), r('13:00', 4)]
    const slots = hourlySlots(rows, {})
    const at20 = slots.find((x) => x.time === '20:00')!
    expect(at20.used).toBe(31)
    expect(at20.level).toBe('almost')
    expect(at20.text).toBe('31 couverts sur 40 à 20h, presque complet')
    expect(slots.find((x) => x.time === '12:00')!.used).toBe(4)
  })
  it('window is strict: a 12:00 booking blocks 13:00 but not 14:00 (block 120)', () => {
    const slots = hourlySlots([r('12:00', 6)], {})
    expect(slots.find((x) => x.time === '13:00')!.used).toBe(6)
    expect(slots.find((x) => x.time === '14:00')!.used).toBe(0)
    expect(slots.find((x) => x.time === '11:00')).toBeUndefined()
  })
  it('full text and singular', () => {
    const slots = hourlySlots([r('19:00', 40), r('15:00', 1)], {})
    expect(slots.find((x) => x.time === '19:00')!.text).toBe('40 couverts sur 40 à 19h, complet')
    expect(slots.find((x) => x.time === '15:00')!.text).toBe('1 couvert sur 40 à 15h')
  })
  it('honours max_covers and block from settings', () => {
    const slots = hourlySlots([r('19:00', 10)], { max_covers: '12', table_block_duration_minutes: '30' })
    const s19 = slots.find((x) => x.time === '19:00')!
    expect(s19.max).toBe(12)
    expect(s19.level).toBe('almost')
    expect(slots.find((x) => x.time === '20:00')!.used).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Peak of simultaneous covers
// ---------------------------------------------------------------------------

describe('peakSimultaneous', () => {
  it('empty -> 0', () => {
    expect(peakSimultaneous([], 120)).toBe(0)
  })
  it('sequential seatings do not add up', () => {
    expect(peakSimultaneous([r('18:00', 10), r('20:00', 12)], 120)).toBe(12) // 20:00 is when 18:00 ends
  })
  it('overlapping seatings add up', () => {
    expect(peakSimultaneous([r('18:00', 10), r('19:00', 12), r('19:30', 4)], 120)).toBe(26)
  })
  it('1 minute of overlap counts', () => {
    expect(peakSimultaneous([r('18:00', 10), r('19:59', 5)], 120)).toBe(15)
    expect(peakSimultaneous([r('18:00', 10), r('20:00', 5)], 120)).toBe(10)
  })
  it('peak can be lower than the total, never higher', () => {
    const rows = [r('18:00', 10), r('20:00', 12), r('21:30', 6)]
    const total = 28
    const p = peakSimultaneous(rows, 120)
    expect(p).toBe(18) // 20:00 + 21:30 overlap
    expect(p).toBeLessThanOrEqual(total)
  })
  it('matches a brute-force minute sweep on random days', () => {
    const rand = rng(99)
    for (let i = 0; i < 300; i++) {
      const rows: DayReservation[] = []
      const n = 1 + Math.floor(rand() * 10)
      for (let k = 0; k < n; k++) {
        const m = 11 * 60 + Math.floor(rand() * 11 * 60)
        const hh = String(Math.floor(m / 60)).padStart(2, '0')
        const mm = String(m % 60).padStart(2, '0')
        rows.push({ id: k, reservation_time: `${hh}:${mm}`, party_size: 1 + Math.floor(rand() * 8), status: 'confirmed' })
      }
      const block = [30, 60, 90, 120][Math.floor(rand() * 4)]
      let brute = 0
      for (let t = 0; t < 24 * 60; t++) {
        let s = 0
        for (const x of rows) {
          const st = toMinutes(x.reservation_time)
          if (st <= t && t < st + block) s += x.party_size
        }
        brute = Math.max(brute, s)
      }
      expect(peakSimultaneous(rows, block)).toBe(brute)
    }
  })
  it('block 0 does not crash and counts each reservation alone', () => {
    expect(peakSimultaneous([r('18:00', 4), r('18:00', 6)], 0)).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// Arrivals + computeToday (TDY-01)
// ---------------------------------------------------------------------------

describe('groupArrivalsByHour', () => {
  it('groups by hour, sorted, excluding cancelled and no_show', () => {
    const rows = [
      r('19:30:00', 4),
      r('12:15', 2, 'pending'),
      r('19:00', 3, 'completed'),
      r('19:45', 9, 'cancelled'),
      r('20:00', 5, 'no_show'),
      r('12:00', 2),
    ]
    const groups = groupArrivalsByHour(rows)
    expect(groups.map((g) => [g.hour, g.covers, g.reservations.map((x) => x.reservation_time)])).toEqual([
      ['12:00', 4, ['12:00', '12:15']],
      ['19:00', 7, ['19:00', '19:30:00']],
    ])
  })
  it('empty day', () => {
    expect(groupArrivalsByHour([])).toEqual([])
  })
  it('does not mutate its input', () => {
    const rows = [r('20:00', 2), r('12:00', 2)]
    const copy = rows.map((x) => ({ ...x }))
    groupArrivalsByHour(rows)
    computeToday(rows, {})
    expect(rows).toEqual(copy)
  })
})

describe('computeToday', () => {
  const rows = [
    r('12:00', 4, 'confirmed'),
    r('12:30', 2, 'pending'),
    r('13:00', 6, 'completed'),
    r('18:30', 8, 'confirmed'),
    r('19:00', 12, 'pending'),
    r('19:30', 4, 'confirmed'),
    r('20:00', 3, 'cancelled'),
    r('20:30', 5, 'no_show'),
    r('21:00', 7, 'confirmed'),
  ]
  const s = computeToday(rows, {})

  it('reserved covers exclude cancelled and no_show; sum of arrivals equals it', () => {
    expect(s.reservedCovers).toBe(4 + 2 + 6 + 8 + 12 + 4 + 7)
    expect(s.arrivals.reduce((a, g) => a + g.covers, 0)).toBe(s.reservedCovers)
    expect(s.maxCovers).toBe(40)
  })
  it('to-confirm lists pending only, earliest first', () => {
    expect(s.toConfirm.map((x) => x.reservation_time)).toEqual(['12:30', '19:00'])
  })
  it('service totals and peaks', () => {
    expect(s.services.dejeuner).toEqual({ peak: 12, total: 12, count: 3 }) // 12:00+12:30+13:00 all overlap
    expect(s.services.diner.total).toBe(31)
    expect(s.services.diner.count).toBe(4)
    // 18:30(8) 19:00(12) 19:30(4) overlap at 19:30 = 24 ; 21:00 (7) overlaps 19:30..21:30 -> 19:30+21:00: 12+4+7 = 23, 19:00 ends 21:00
    expect(s.services.diner.peak).toBe(24)
  })
  it('lunch + dinner totals equal the day total', () => {
    expect(s.services.dejeuner.total + s.services.diner.total).toBe(s.reservedCovers)
  })
  it('the 10 slots are the public availability figures', () => {
    expect(s.slots).toEqual(hourlySlots(rows, {}))
  })
  it('empty day', () => {
    const e = computeToday([], {})
    expect(e.reservedCovers).toBe(0)
    expect(e.toConfirm).toEqual([])
    expect(e.arrivals).toEqual([])
    expect(e.services.diner).toEqual({ peak: 0, total: 0, count: 0 })
    expect(e.slots).toHaveLength(10)
  })
  it('max_covers comes from settings, not hard-coded', () => {
    expect(computeToday([], { max_covers: '32' }).maxCovers).toBe(32)
  })
  it('a lunch booking at 11:30 counts for lunch; 16:00 for dinner', () => {
    const e = computeToday([r('11:30', 2), r('16:00', 3)], {})
    expect(e.services.dejeuner.total).toBe(2)
    expect(e.services.diner.total).toBe(3)
  })
})
