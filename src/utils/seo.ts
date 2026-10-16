/**
 * SEO helpers: single source of truth for every public SEO URL
 * (canonical, hreflang, OpenGraph, sitemap, JSON-LD).
 *
 * Pure module: only type-only imports so vitest (node env) can load it.
 */

import type { Metadata } from 'next'

// ---------------------------------------------------------------------------
// URLs and locales
// ---------------------------------------------------------------------------

export const SITE_URL = 'https://geckocabanerestaurant.com'

export const LOCALES = ['fr', 'en'] as const
export type SeoLocale = (typeof LOCALES)[number]

export const OG_LOCALE = { fr: 'fr_FR', en: 'en_US' } as const

/** Only published pages (D-14). */
export const PUBLISHED_PATHS = ['', '/privacy'] as const

export function localeUrl(locale: SeoLocale, path = ''): string {
  return `${SITE_URL}/${locale}${path}`
}

// ---------------------------------------------------------------------------
// Page metadata
// ---------------------------------------------------------------------------

/**
 * Builds the complete Metadata for a localized page.
 * Next metadata merging is shallow: every page must return the full object
 * and layouts must not set `alternates`.
 */
export function buildPageMetadata(args: {
  locale: SeoLocale
  path?: string
  title: string
  description: string
  absoluteTitle?: boolean
}): Metadata {
  const { locale, path = '', title, description, absoluteTitle } = args
  const other: SeoLocale = locale === 'fr' ? 'en' : 'fr'
  const url = localeUrl(locale, path)

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      languages: {
        fr: localeUrl('fr', path),
        en: localeUrl('en', path),
        'x-default': localeUrl('fr', path),
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Gecko Cabane',
      url,
      locale: OG_LOCALE[locale],
      alternateLocale: [OG_LOCALE[other]],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// ---------------------------------------------------------------------------
// Restaurant JSON-LD
// ---------------------------------------------------------------------------

// Google prefers 5+ decimals; the owner confirms the map pin in plan 02-07.
export const GEO = { latitude: 8.0615, longitude: 98.9157 } as const

// D-09: only owner-validated/verified official profile URLs; filled in plan 02-06
export const SAME_AS: readonly string[] = []

export type OpeningHoursRow = {
  day_of_week: number
  is_open: boolean | null
  open_time: string | null
  close_time: string | null
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type OpeningHoursSpec = {
  '@type': 'OpeningHoursSpecification'
  dayOfWeek: string[]
  opens: string
  closes: string
}

/** Closed days are omitted; days sharing the same range are grouped. */
export function mapOpeningHours(rows: OpeningHoursRow[]): OpeningHoursSpec[] {
  const groups = new Map<string, OpeningHoursSpec>()
  const sorted = [...rows].sort((a, b) => a.day_of_week - b.day_of_week)
  for (const row of sorted) {
    if (!row.is_open || !row.open_time || !row.close_time) continue
    const day = DAYS[row.day_of_week]
    if (!day) continue
    const opens = row.open_time.slice(0, 5)
    const closes = row.close_time.slice(0, 5)
    const key = `${opens}|${closes}`
    const existing = groups.get(key)
    if (existing) existing.dayOfWeek.push(day)
    else {
      groups.set(key, {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [day],
        opens,
        closes,
      })
    }
  }
  return [...groups.values()]
}

export function buildRestaurantJsonLd(args: {
  locale: SeoLocale
  description: string
  hoursRows: OpeningHoursRow[]
  sameAs?: readonly string[]
}): Record<string, unknown> {
  const { locale, description, hoursRows, sameAs = SAME_AS } = args
  const hours = mapOpeningHours(hoursRows)

  // No rating block (D-07: unverifiable). hasMenu/menu reintroduced in
  // phase 3 with /menu; SEO-03 partial until then (D-08).
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${SITE_URL}/#restaurant`,
    name: 'Gecko Cabane Restaurant',
    alternateName: 'Gecko Cabane',
    url: localeUrl(locale),
    description,
    image: [
      `${SITE_URL}/hero-bg.jpg`,
      `${SITE_URL}/exterior-sign.jpg`,
      `${SITE_URL}/chef-jariya.jpg`,
    ],
    telephone: '+66819585945',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '1/36-37 Soi Ruamjit, Maharat Road',
      addressLocality: 'Krabi Town',
      postalCode: '81000',
      addressCountry: 'TH',
    },
    geo: { '@type': 'GeoCoordinates', ...GEO },
    servesCuisine: ['French', 'Thai', 'Fusion'],
    priceRange: '฿฿',
    acceptsReservations: true,
    paymentAccepted: 'Cash, Credit Card',
    currenciesAccepted: 'THB',
    ...(hours.length > 0 ? { openingHoursSpecification: hours } : {}),
    ...(sameAs.length > 0 ? { sameAs: [...sameAs] } : {}),
  }
}

/** JSON.stringify with '<' escaped so content can never close the script tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
