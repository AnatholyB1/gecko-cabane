/**
 * Dynamic opening hours: one source of truth (gecko_opening_hours + gecko_special_hours) for the
 * visible text and the JSON-LD.
 *  - dated exceptions become OpeningHoursSpecification with validFrom / validThrough
 *  - the visible hours text is built from the database values
 *  - no hard-coded hour in messages/*.json, nor in the components that used to carry one
 *  - routes that write the hours revalidate the shared cache tag
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  addDaysToYmd,
  buildRestaurantJsonLd,
  isClosedSpec,
  mapSpecialHours,
  type OpeningHoursRow,
  type SpecialHoursRow,
} from '../src/utils/seo'
import { formatClock, kitchenCloseFor, summarizeUniformHours } from '../src/utils/hours-text'
import { KITCHEN_CLOSE } from '../src/utils/reservation-rules'

const root = process.cwd()
const read = (rel: string) => readFileSync(join(root, rel), 'utf-8')

function uniformWeek(open = '12:00:00', close = '22:00:00'): OpeningHoursRow[] {
  return [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day_of_week: d, is_open: true, open_time: open, close_time: close }))
}

// ---------------------------------------------------------------------------
// Exceptions in the schema
// ---------------------------------------------------------------------------

describe('mapSpecialHours', () => {
  const today = '2026-11-01'

  it('emits a dated spec with validFrom and validThrough (one day)', () => {
    const rows: SpecialHoursRow[] = [
      { date: '2026-11-05', is_open: true, open_time: '12:00:00', close_time: '16:00:00' },
    ]
    expect(mapSpecialHours(rows, today)).toEqual([
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Thursday'],
        opens: '12:00',
        closes: '16:00',
        validFrom: '2026-11-05',
        validThrough: '2026-11-05',
      },
    ])
  })

  it('writes a closed exception as 00:00-00:00', () => {
    const [spec] = mapSpecialHours([{ date: '2026-12-25', is_open: false, open_time: null, close_time: null }], today)
    expect(spec).toMatchObject({ opens: '00:00', closes: '00:00', validFrom: '2026-12-25', validThrough: '2026-12-25' })
    expect(isClosedSpec(spec)).toBe(true)
  })

  it('keeps only the next 60 days, today included, sorted by date', () => {
    const last = addDaysToYmd(today, 60)
    const rows: SpecialHoursRow[] = [
      { date: addDaysToYmd(last, 1), is_open: false, open_time: null, close_time: null },
      { date: last, is_open: false, open_time: null, close_time: null },
      { date: '2026-10-31', is_open: false, open_time: null, close_time: null },
      { date: today, is_open: false, open_time: null, close_time: null },
    ]
    expect(mapSpecialHours(rows, today).map((s) => s.validFrom)).toEqual([today, last])
  })

  it('skips invalid dates and open rows without times, and tolerates an invalid today', () => {
    const rows: SpecialHoursRow[] = [
      { date: '2026-02-31', is_open: false, open_time: null, close_time: null },
      { date: 'not-a-date', is_open: false, open_time: null, close_time: null },
      { date: '2026-11-10', is_open: true, open_time: null, close_time: '22:00' },
      { date: '2026-11-11', is_open: null, open_time: '12:00', close_time: '22:00' },
    ]
    expect(mapSpecialHours(rows, today)).toEqual([])
    expect(mapSpecialHours(rows, 'nope')).toEqual([])
  })

  it('never uses specialOpeningHoursSpecification in the Restaurant schema', () => {
    const ld = buildRestaurantJsonLd({
      locale: 'en',
      description: 'x',
      hoursRows: uniformWeek(),
      specialRows: [{ date: '2026-11-05', is_open: false, open_time: null, close_time: null }],
      today,
    })
    expect(ld).not.toHaveProperty('specialOpeningHoursSpecification')
    const specs = ld.openingHoursSpecification as { validFrom?: string }[]
    expect(specs).toHaveLength(2)
    expect(specs[0]).not.toHaveProperty('validFrom')
    expect(specs[1].validFrom).toBe('2026-11-05')
  })

  it('adds no exception without today (no clock, no guess)', () => {
    const ld = buildRestaurantJsonLd({
      locale: 'en',
      description: 'x',
      hoursRows: uniformWeek(),
      specialRows: [{ date: '2026-11-05', is_open: false, open_time: null, close_time: null }],
    })
    expect(ld.openingHoursSpecification).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Visible text
// ---------------------------------------------------------------------------

describe('hours text from the database values', () => {
  it('formats times per locale', () => {
    expect(formatClock('22:00:00', 'fr')).toBe('22h')
    expect(formatClock('12:30', 'fr')).toBe('12h30')
    expect(formatClock('22:00', 'en')).toBe('10pm')
    expect(formatClock('12:00', 'en')).toBe('12pm')
    expect(formatClock('00:30', 'en')).toBe('12:30am')
    expect(formatClock('22:00', 'de')).toBe('22')
    expect(formatClock('22:30', 'de')).toBe('22:30')
    expect(formatClock('22:30', 'sv')).toBe('22.30')
  })

  it('room closes at 23:00: text 12 to 11pm, last order stays at KITCHEN_CLOSE (22h)', () => {
    expect(KITCHEN_CLOSE).toBe('22:00')
    expect(summarizeUniformHours(uniformWeek('12:00:00', '23:00:00'), 'fr')).toEqual({
      open: '12h',
      close: '23h',
      kitchen: '22h',
      kitchenIsClose: false,
    })
    expect(summarizeUniformHours(uniformWeek('12:00:00', '23:00:00'), 'en')).toMatchObject({ close: '11pm', kitchen: '10pm' })
  })

  it('room closes at 21:00: last order is the earlier close_time (min)', () => {
    expect(kitchenCloseFor('21:00:00')).toBe('21:00')
    expect(kitchenCloseFor('23:00:00')).toBe(KITCHEN_CLOSE)
    expect(summarizeUniformHours(uniformWeek('12:00:00', '21:00:00'), 'fr')).toEqual({
      open: '12h',
      close: '21h',
      kitchen: '21h',
      kitchenIsClose: true,
    })
  })

  it('room and kitchen close together at 22:00', () => {
    expect(summarizeUniformHours(uniformWeek(), 'en')).toEqual({ open: '12pm', close: '10pm', kitchen: '10pm', kitchenIsClose: true })
  })

  it('returns null (text without hours) when the week is not uniform or incomplete', () => {
    const closedTuesday = uniformWeek().map((r) => (r.day_of_week === 2 ? { ...r, is_open: false } : r))
    const lateSaturday = uniformWeek().map((r) => (r.day_of_week === 6 ? { ...r, close_time: '23:00:00' } : r))
    expect(summarizeUniformHours(closedTuesday, 'en')).toBeNull()
    expect(summarizeUniformHours(lateSaturday, 'en')).toBeNull()
    expect(summarizeUniformHours(uniformWeek().slice(0, 6), 'en')).toBeNull()
    expect(summarizeUniformHours([], 'en')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// No hard-coded hour
// ---------------------------------------------------------------------------

function strings(value: unknown, path = ''): { path: string; text: string }[] {
  if (typeof value === 'string') return [{ path, text: value }]
  if (typeof value !== 'object' || value === null) return []
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k))
}

// 22h, 12h30, 10 pm, 10:00 PM, 22:00, 22.00, 22 Uhr, kl. 22, klockan 22, 10 p.m.
const HARD_CODED_HOUR = new RegExp(
  [
    String.raw`\b\d{1,2}\s?h(\s?\d{2})?\b`,
    String.raw`\b\d{1,2}([:.]\d{2})?\s?(am|pm|a\.m\.|p\.m\.)(?![a-z])`,
    String.raw`\b\d{1,2}[:.]\d{2}\b`,
    String.raw`\b\d{1,2}\s?Uhr\b`,
    String.raw`\b(kl\.?|klockan)\s?\d{1,2}\b`,
  ].join('|'),
  'i'
)

describe('no hard-coded opening hour', () => {
  for (const locale of ['fr', 'en', 'de', 'sv']) {
    it(`messages/${locale}.json contains no literal hour`, () => {
      const offenders = strings(JSON.parse(read(`messages/${locale}.json`)))
        .filter((s) => HARD_CODED_HOUR.test(s.text))
        .map((s) => `${s.path}: ${s.text}`)
      expect(offenders, offenders.join('\n')).toEqual([])
    })
  }

  it('the strings that show an hour take it as a value', () => {
    for (const locale of ['fr', 'en', 'de', 'sv']) {
      const m = JSON.parse(read(`messages/${locale}.json`))
      expect(m.footer.openHours, locale).toContain('{open}')
      expect(m.footer.openHours, locale).toContain('{close}')
      expect(m.footer.openHours, locale).not.toContain('{kitchen}')
      expect(m.footer.lastOrder, locale).toContain('{kitchen}')
      expect(m.footer.lastOrder, locale).not.toContain('{close}')
      expect(m.about.kitchenClose, locale).toContain('{kitchen}')
      expect(m.about.kitchenClose, locale).not.toContain('{close}')
      expect(m.hoursText.dailyKitchenUntil, locale).toContain('{kitchen}')
      expect(m.hoursText.dailyRoomAndKitchen, locale).toContain('{close}')
      expect(m.hoursText.dailyRoomAndKitchen, locale).toContain('{kitchen}')
      expect(m.romanticDinner.sections.ambiance.p2, locale).toContain('{hoursSentence}')
      expect(m.whereToEat.sections.dinner.p2, locale).toContain('{hoursSentence}')
    }
  })

  it('HoursDisplay has no literal hour and derives the last order from the kitchen rule', () => {
    const src = read('src/components/HoursDisplay.tsx')
    expect(src).not.toMatch(/22h|22:00|12:00/)
    expect(src).toContain('kitchenCloseFor')
  })
})

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

describe('opening-hours cache tag', () => {
  it('exceptions are read under the same tag as the weekly hours', () => {
    const src = read('src/utils/opening-hours.ts')
    expect(src.match(/tags: \[OPENING_HOURS_TAG\]/g)).toHaveLength(2)
  })

  for (const route of ['hours', 'special-hours', 'service-closure']) {
    it(`/api/${route} revalidates OPENING_HOURS_TAG after a write`, () => {
      expect(read(`src/app/api/${route}/route.ts`)).toContain("revalidateTag(OPENING_HOURS_TAG, 'max')")
    })
  }
})
