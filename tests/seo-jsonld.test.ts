/**
 * Restaurant JSON-LD helper tests
 *
 * Covers mapOpeningHours, buildRestaurantJsonLd and serializeJsonLd:
 * no invented rating (D-07), no menu link (D-08), safe script serialization.
 */

import { describe, it, expect } from 'vitest'
import {
  SITE_URL,
  SAME_AS,
  localeUrl,
  mapOpeningHours,
  buildRestaurantJsonLd,
  serializeJsonLd,
  type OpeningHoursRow,
} from '../src/utils/seo'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function week(overrides: Partial<Record<number, Partial<OpeningHoursRow>>> = {}): OpeningHoursRow[] {
  return [0, 1, 2, 3, 4, 5, 6].map((d) => {
    const base: OpeningHoursRow =
      d === 2
        ? { day_of_week: d, is_open: false, open_time: null, close_time: null }
        : { day_of_week: d, is_open: true, open_time: '12:00:00', close_time: '22:00:00' }
    return { ...base, ...(overrides[d] ?? {}) }
  })
}

// ---------------------------------------------------------------------------
// mapOpeningHours
// ---------------------------------------------------------------------------

describe('mapOpeningHours', () => {
  it('groups identical ranges and omits closed days', () => {
    const specs = mapOpeningHours(week())
    expect(specs).toHaveLength(1)
    expect(specs[0]).toEqual({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday', 'Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '12:00',
      closes: '22:00',
    })
  })

  it('emits one spec per distinct range, in first-seen order', () => {
    const specs = mapOpeningHours(week({ 6: { close_time: '23:00:00' } }))
    expect(specs).toHaveLength(2)
    expect(specs[0].dayOfWeek).toEqual(['Sunday', 'Monday', 'Wednesday', 'Thursday', 'Friday'])
    expect(specs[1]).toMatchObject({ dayOfWeek: ['Saturday'], opens: '12:00', closes: '23:00' })
  })

  it('skips open rows with missing times', () => {
    expect(
      mapOpeningHours([{ day_of_week: 1, is_open: true, open_time: null, close_time: '22:00' }])
    ).toEqual([])
  })

  it('returns [] for empty input', () => {
    expect(mapOpeningHours([])).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// buildRestaurantJsonLd
// ---------------------------------------------------------------------------

describe.each(['fr', 'en'] as const)('buildRestaurantJsonLd(%s)', (locale) => {
  const desc = locale === 'fr' ? 'Restaurant franco-thaï' : 'French-Thai restaurant'
  const ld = buildRestaurantJsonLd({ locale, description: desc, hoursRows: week() })

  it('has the core Restaurant facts', () => {
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('Restaurant')
    expect(ld['@id']).toBe(`${SITE_URL}/#restaurant`)
    expect(ld.url).toBe(localeUrl(locale))
    expect(ld.description).toBe(desc)
    expect(ld.telephone).toBe('+66819585945')
    expect(ld.priceRange).toBe('฿฿')
    expect(ld.acceptsReservations).toBe(true)
    expect(ld.paymentAccepted).toBe('Cash, Credit Card')
    expect(ld.currenciesAccepted).toBe('THB')
    expect(ld.geo).toMatchObject({ latitude: 8.0615, longitude: 98.9157 })
    expect(ld.address).toMatchObject({
      '@type': 'PostalAddress',
      streetAddress: '1/36-37 Soi Ruamjit, Maharat Road',
      addressLocality: 'Krabi Town',
      postalCode: '81000',
      addressCountry: 'TH',
    })
  })

  it('has images on the main domain', () => {
    const images = ld.image as string[]
    expect(images.length).toBeGreaterThan(0)
    for (const i of images) expect(i.startsWith(SITE_URL)).toBe(true)
  })

  it('never claims rating, menu or amenities', () => {
    for (const k of ['aggregateRating', 'hasMenu', 'menu', 'amenityFeature', 'sameAs']) {
      expect(ld).not.toHaveProperty(k)
    }
    expect(JSON.stringify(ld)).not.toContain('gecko-cabane.com')
  })
})

describe('buildRestaurantJsonLd options', () => {
  it('omits openingHoursSpecification when no rows', () => {
    const ld = buildRestaurantJsonLd({ locale: 'fr', description: 'x', hoursRows: [] })
    expect(ld).not.toHaveProperty('openingHoursSpecification')
  })

  it('includes openingHoursSpecification when rows exist', () => {
    const ld = buildRestaurantJsonLd({ locale: 'fr', description: 'x', hoursRows: week() })
    expect(ld.openingHoursSpecification).toHaveLength(1)
  })

  it('emits sameAs only when provided', () => {
    const list = ['https://www.facebook.com/GeckoCabaneRestaurant/']
    const ld = buildRestaurantJsonLd({ locale: 'en', description: 'x', hoursRows: [], sameAs: list })
    expect(ld.sameAs).toEqual(list)
  })

  it('SAME_AS entries are https URLs', () => {
    for (const u of SAME_AS) expect(u.startsWith('https://')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// serializeJsonLd
// ---------------------------------------------------------------------------

describe('serializeJsonLd', () => {
  it('escapes < so content cannot close the script tag', () => {
    const payload = { a: '</script><script>' }
    const out = serializeJsonLd(payload)
    expect(out).not.toContain('<')
    expect(JSON.parse(out)).toEqual(payload)
  })
})
