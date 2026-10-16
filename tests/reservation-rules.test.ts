/**
 * Reservation rules tests (Krabi time, hours resolution, slot checks).
 * All time-dependent cases pass `now` explicitly, so they are deterministic.
 */

import { describe, it, expect } from 'vitest'
import {
  MAX_PARTY_SIZE,
  TIME_SLOTS,
  bangkokNow,
  dayOfWeek,
  toMinutes,
  resolveHours,
  computeLastBookableMinutes,
  bookableSlots,
  checkSlot,
  type HoursRow,
} from '../src/utils/reservation-rules'

const regular: (HoursRow & { day_of_week: number })[] = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
  day_of_week: d,
  is_open: d !== 2,
  open_time: d === 2 ? null : '11:00:00',
  close_time: d === 2 ? null : '23:00:00',
}))

// Saturday 2026-10-24, Krabi 18:45 (= 11:45 UTC)
const NOW = new Date('2026-10-24T11:45:00Z')
// Earlier reference: Tuesday 2026-10-20 17:00 Krabi
const EARLIER = new Date('2026-10-20T10:00:00Z')

const base = { partySize: 2, regular, special: [], settings: {}, now: EARLIER }

describe('constants', () => {
  it('caps party size at 40', () => {
    expect(MAX_PARTY_SIZE).toBe(40)
    expect(TIME_SLOTS).toHaveLength(13)
  })
})

describe('bangkokNow / dayOfWeek / toMinutes', () => {
  it('rolls over to the next day in Krabi time', () => {
    expect(bangkokNow(new Date('2026-10-20T18:30:00Z'))).toEqual({ date: '2026-10-21', minutes: 90 })
  })
  it('computes the weekday', () => {
    expect(dayOfWeek('2026-10-20')).toBe(2)
    expect(dayOfWeek('2026-10-24')).toBe(6)
  })
  it('parses HH:MM and HH:MM:SS', () => {
    expect(toMinutes('19:30:00')).toBe(1170)
    expect(toMinutes('19:30')).toBe(1170)
  })
})

describe('resolveHours', () => {
  it('uses the regular day when no special row exists', () => {
    expect(resolveHours('2026-10-24', regular, [])?.is_open).toBe(true)
    expect(resolveHours('2026-10-20', regular, [])?.is_open).toBe(false)
  })
  it('lets a special closed row win over an open regular day', () => {
    const special = [{ date: '2026-10-24', is_open: false, open_time: null, close_time: null }]
    expect(resolveHours('2026-10-24', regular, special)?.is_open).toBe(false)
  })
  it('lets a special open row win over a closed regular day', () => {
    const special = [{ date: '2026-10-20', is_open: true, open_time: '18:00', close_time: '22:00' }]
    expect(resolveHours('2026-10-20', regular, special)?.is_open).toBe(true)
  })
  it('returns null when nothing matches', () => {
    expect(resolveHours('2026-10-24', [], [])).toBeNull()
  })
})

describe('computeLastBookableMinutes / bookableSlots', () => {
  it('defaults to 22:00 minus 120 minutes', () => {
    expect(computeLastBookableMinutes({})).toBe(1200)
  })
  it('honours table_block_duration_minutes', () => {
    expect(computeLastBookableMinutes({ table_block_duration_minutes: '90' })).toBe(1230)
  })
  it('prefers last_reservation_time', () => {
    expect(computeLastBookableMinutes({ last_reservation_time: '21:30' })).toBe(1290)
  })
  it('ignores an invalid last_reservation_time', () => {
    expect(computeLastBookableMinutes({ last_reservation_time: 'soon' })).toBe(1200)
  })
  it('filters slots', () => {
    expect(bookableSlots({}).at(-1)).toBe('20:00')
    expect(bookableSlots({ last_reservation_time: '21:30' }).at(-1)).toBe('21:30')
  })
})

describe('checkSlot', () => {
  it('accepts a normal Saturday dinner for 40', () => {
    expect(checkSlot({ ...base, date: '2026-10-24', time: '19:00', partySize: 40 })).toEqual({ ok: true })
  })
  it('refuses party size 41, 0 and non-integers', () => {
    expect(checkSlot({ ...base, date: '2026-10-24', time: '19:00', partySize: 41 })).toEqual({ ok: false, code: 'invalid_party_size' })
    expect(checkSlot({ ...base, date: '2026-10-24', time: '19:00', partySize: 0 })).toEqual({ ok: false, code: 'invalid_party_size' })
    expect(checkSlot({ ...base, date: '2026-10-24', time: '19:00', partySize: 2.5 })).toEqual({ ok: false, code: 'invalid_party_size' })
  })
  it('refuses Tuesday', () => {
    expect(checkSlot({ ...base, date: '2026-10-27', time: '19:00' })).toEqual({ ok: false, code: 'slot_unavailable' })
  })
  it('refuses a special closed date', () => {
    const special = [{ date: '2026-10-24', is_open: false, open_time: null, close_time: null }]
    expect(checkSlot({ ...base, special, date: '2026-10-24', time: '19:00' })).toEqual({ ok: false, code: 'slot_unavailable' })
  })
  it('refuses a time outside the grid', () => {
    expect(checkSlot({ ...base, date: '2026-10-24', time: '17:00' })).toEqual({ ok: false, code: 'slot_unavailable' })
  })
  it('refuses after the last bookable time', () => {
    expect(checkSlot({ ...base, date: '2026-10-24', time: '21:00' })).toEqual({ ok: false, code: 'slot_unavailable' })
  })
  it('allows a later slot when last_reservation_time is set', () => {
    const settings = { last_reservation_time: '21:30' }
    expect(checkSlot({ ...base, settings, date: '2026-10-24', time: '21:00' })).toEqual({ ok: true })
  })
  it('never exceeds the day close_time', () => {
    const early = regular.map((r) => ({ ...r, close_time: r.is_open ? '20:00:00' : null }))
    const settings = { last_reservation_time: '21:30' }
    expect(checkSlot({ ...base, regular: early, settings, date: '2026-10-24', time: '20:30' })).toEqual({ ok: false, code: 'slot_unavailable' })
  })
  it('refuses before opening time', () => {
    const late = regular.map((r) => ({ ...r, open_time: r.is_open ? '18:00:00' : null }))
    expect(checkSlot({ ...base, regular: late, date: '2026-10-24', time: '12:00' })).toEqual({ ok: false, code: 'slot_unavailable' })
  })
  it('refuses yesterday in Krabi time', () => {
    expect(checkSlot({ ...base, now: NOW, date: '2026-10-23', time: '19:00' })).toEqual({ ok: false, code: 'date_past' })
  })
  it('refuses a same-day slot less than 30 minutes ahead', () => {
    expect(checkSlot({ ...base, now: NOW, date: '2026-10-24', time: '19:00' })).toEqual({ ok: false, code: 'date_past' })
  })
  it('accepts a same-day slot at least 30 minutes ahead', () => {
    expect(checkSlot({ ...base, now: NOW, date: '2026-10-24', time: '19:30' })).toEqual({ ok: true })
  })
  it('refuses a date more than 180 days ahead', () => {
    const far = new Date(Date.UTC(2026, 9, 20) + 200 * 86400000).toISOString().slice(0, 10)
    expect(checkSlot({ ...base, date: far, time: '19:00' })).toEqual({ ok: false, code: 'slot_unavailable' })
  })
})
