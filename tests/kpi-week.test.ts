import { describe, it, expect } from 'vitest'
import {
  previousWeek,
  parseWeekParam,
  weekUtcBounds,
  weekEndOf,
  shouldSendNow,
} from '../src/utils/kpi-week'

describe('previousWeek', () => {
  it('lundi 07:00 Krabi => semaine precedente', () => {
    expect(previousWeek(new Date('2026-11-02T00:00:00Z'))).toEqual({ start: '2026-10-26', end: '2026-11-01' })
  })
  it('lundi 01:00 Krabi (dimanche 18:00 UTC) => meme semaine', () => {
    expect(previousWeek(new Date('2026-11-01T18:00:00Z'))).toEqual({ start: '2026-10-26', end: '2026-11-01' })
  })
  it('dimanche soir Krabi => semaine encore precedente', () => {
    expect(previousWeek(new Date('2026-11-01T16:00:00Z'))).toEqual({ start: '2026-10-19', end: '2026-10-25' })
  })
})

describe('parseWeekParam', () => {
  it('accepte un lundi reel', () => expect(parseWeekParam('2026-10-26')).toBe('2026-10-26'))
  it('refuse un non-lundi', () => expect(parseWeekParam('2026-10-27')).toBeNull())
  it('refuse une date inexistante', () => expect(parseWeekParam('2026-02-30')).toBeNull())
  it('refuse le texte et null', () => {
    expect(parseWeekParam('abc')).toBeNull()
    expect(parseWeekParam(null)).toBeNull()
    expect(parseWeekParam('2026-10-26T00:00')).toBeNull()
  })
})

describe('bornes', () => {
  it('weekUtcBounds', () => {
    expect(weekUtcBounds('2026-10-26')).toEqual({
      fromIso: '2026-10-25T17:00:00.000Z',
      toIso: '2026-11-01T17:00:00.000Z',
    })
  })
  it('weekEndOf', () => expect(weekEndOf('2026-10-26')).toBe('2026-11-01'))
})

describe('shouldSendNow', () => {
  it('lundi 07:30 Krabi => false', () => expect(shouldSendNow(new Date('2026-11-02T00:30:00Z'))).toBe(false))
  it('lundi 08:05 Krabi => true', () => expect(shouldSendNow(new Date('2026-11-02T01:05:00Z'))).toBe(true))
  it('lundi 23:59 Krabi => true', () => expect(shouldSendNow(new Date('2026-11-02T16:59:00Z'))).toBe(true))
  it('mardi 08:05 Krabi (autre jour) => false', () => expect(shouldSendNow(new Date('2026-11-03T01:05:00Z'))).toBe(false))
  it('dimanche => false', () => expect(shouldSendNow(new Date('2026-11-01T02:00:00Z'))).toBe(false))
})
