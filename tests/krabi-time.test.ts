/**
 * Krabi time helpers (Phase 15, RSV-05). Boundaries: UTC midnight vs Krabi
 * midnight (UTC+7), day change, outside service hours, no timezone drift on
 * stored wall-clock values.
 */
import { describe, expect, it } from 'vitest'
import {
  addDaysYmd,
  formatHourFr,
  formatReservationDate,
  formatReservationTime,
  isServiceHours,
  isYmd,
  krabiClock,
  krabiTodayYmd,
  minutesToClock,
  relativeDayLabel,
  serviceOf,
} from '../src/utils/krabi-time'

const at = (iso: string) => new Date(iso)

describe('krabiTodayYmd', () => {
  it('23:59 UTC is already the next day in Krabi (06:59)', () => {
    expect(krabiTodayYmd(at('2026-10-30T23:59:00Z'))).toBe('2026-10-31')
  })
  it('00:00 UTC is 07:00 the same day in Krabi', () => {
    expect(krabiTodayYmd(at('2026-10-31T00:00:00Z'))).toBe('2026-10-31')
  })
  it('00:30 Krabi (17:30 UTC the day before) is the new day: the old UTC page showed yesterday', () => {
    const now = at('2026-10-30T17:30:00Z')
    expect(now.toISOString().split('T')[0]).toBe('2026-10-30') // the defect
    expect(krabiTodayYmd(now)).toBe('2026-10-31') // the fix
  })
  it('16:59:59 UTC is still 23:59 Krabi, 17:00:00 UTC is midnight Krabi', () => {
    expect(krabiTodayYmd(at('2026-10-30T16:59:59Z'))).toBe('2026-10-30')
    expect(krabiTodayYmd(at('2026-10-30T17:00:00Z'))).toBe('2026-10-31')
  })
  it('crosses month and year ends', () => {
    expect(krabiTodayYmd(at('2026-12-31T17:00:00Z'))).toBe('2027-01-01')
    expect(krabiTodayYmd(at('2028-02-28T17:00:00Z'))).toBe('2028-02-29')
  })
  it('does not depend on the host timezone (same instant, same answer)', () => {
    const d = at('2026-10-31T10:00:00+07:00')
    expect(krabiTodayYmd(d)).toBe('2026-10-31')
  })
})

describe('krabiClock / minutesToClock', () => {
  it('formats the Krabi wall clock', () => {
    expect(krabiClock(at('2026-10-30T17:30:00Z'))).toBe('00:30')
    expect(krabiClock(at('2026-10-31T09:10:00Z'))).toBe('16:10')
    expect(krabiClock(at('2026-10-30T16:59:00Z'))).toBe('23:59')
  })
  it('minutesToClock pads', () => {
    expect(minutesToClock(0)).toBe('00:00')
    expect(minutesToClock(9 * 60 + 5)).toBe('09:05')
  })
})

describe('isServiceHours (12:00 incl. - 22:00 excl. Krabi)', () => {
  it.each([
    ['2026-10-31T04:59:00Z', false], // 11:59
    ['2026-10-31T05:00:00Z', true], // 12:00
    ['2026-10-31T14:59:00Z', true], // 21:59
    ['2026-10-31T15:00:00Z', false], // 22:00
    ['2026-10-30T17:30:00Z', false], // 00:30
  ])('%s -> %s', (iso, expected) => {
    expect(isServiceHours(at(iso))).toBe(expected)
  })
})

describe('addDaysYmd / isYmd / relativeDayLabel', () => {
  it('adds days across boundaries', () => {
    expect(addDaysYmd('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDaysYmd('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDaysYmd('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDaysYmd('2026-10-31', 0)).toBe('2026-10-31')
  })
  it('validates real calendar dates only', () => {
    expect(isYmd('2026-10-31')).toBe(true)
    expect(isYmd('2026-02-29')).toBe(false)
    expect(isYmd('2026-13-01')).toBe(false)
    expect(isYmd('2026-1-1')).toBe(false)
    expect(isYmd('')).toBe(false)
  })
  it('labels yesterday / today / tomorrow in Krabi', () => {
    const now = at('2026-10-30T17:30:00Z') // 00:30 on the 31st in Krabi
    expect(relativeDayLabel('2026-10-30', now)).toBe('Hier')
    expect(relativeDayLabel('2026-10-31', now)).toBe("Aujourd'hui")
    expect(relativeDayLabel('2026-11-01', now)).toBe('Demain')
    expect(relativeDayLabel('2026-11-02', now)).toBeNull()
  })
})

describe('formatReservationTime (verbatim, no Date)', () => {
  it('keeps the stored wall clock', () => {
    expect(formatReservationTime('19:30:00')).toBe('19:30')
    expect(formatReservationTime('19:30')).toBe('19:30')
    expect(formatReservationTime('09:05:00')).toBe('09:05')
    expect(formatReservationTime('9:05')).toBe('09:05')
    expect(formatReservationTime('00:00:00')).toBe('00:00')
  })
  it('returns invalid input untouched', () => {
    expect(formatReservationTime('25:00')).toBe('25:00')
    expect(formatReservationTime('abc')).toBe('abc')
    expect(formatReservationTime('')).toBe('')
  })
  it('formatHourFr', () => {
    expect(formatHourFr('19:30:00')).toBe('19h30')
    expect(formatHourFr('12:00')).toBe('12h')
    expect(formatHourFr('09:05')).toBe('9h05')
  })
})

describe('formatReservationDate', () => {
  it('formats without timezone shifts', () => {
    expect(formatReservationDate('2026-10-31')).toBe('samedi 31 octobre 2026')
    expect(formatReservationDate('2026-11-01')).toBe('dimanche 1 novembre 2026')
    expect(formatReservationDate('2026-12-25')).toBe('vendredi 25 décembre 2026')
  })
  it('returns invalid input untouched', () => {
    expect(formatReservationDate('2026-02-30')).toBe('2026-02-30')
    expect(formatReservationDate('nope')).toBe('nope')
  })
})

describe('serviceOf', () => {
  it.each([
    ['11:30', 'dejeuner'],
    ['12:00', 'dejeuner'],
    ['15:59', 'dejeuner'],
    ['16:00', 'diner'],
    ['18:00:00', 'diner'],
    ['21:30', 'diner'],
  ])('%s -> %s', (t, s) => {
    expect(serviceOf(t)).toBe(s)
  })
})
