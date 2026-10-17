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

export const LOCALES = ['fr', 'en', 'de', 'sv'] as const
export type SeoLocale = (typeof LOCALES)[number]

export const OG_LOCALE = { fr: 'fr_FR', en: 'en_US', de: 'de_DE', sv: 'sv_SE' } as const

/**
 * Per-page locales (D-14): a page is listed and hreflang'd only in the locales
 * where it exists; FR landing arrives with PAGE-08 in phase 6.
 */
export const PUBLISHED_PAGES: readonly { path: string; locales: readonly SeoLocale[] }[] = [
  { path: '', locales: ['fr', 'en'] },
  { path: '/privacy', locales: ['fr', 'en'] },
  { path: '/menu', locales: ['fr', 'en'] },
  { path: '/french-restaurant-krabi', locales: ['fr', 'en'] },
  { path: '/romantic-dinner-krabi', locales: ['fr', 'en'] },
  { path: '/where-to-eat-krabi-town', locales: ['fr', 'en'] },
  { path: '/getting-here-from-ao-nang', locales: ['en'] },
]

/** Bilingual published paths (D-14), derived from PUBLISHED_PAGES. */
export const PUBLISHED_PATHS: readonly string[] = PUBLISHED_PAGES.filter(
  (p) => p.locales.includes('fr') && p.locales.includes('en')
).map((p) => p.path)

export type PageKey =
  | ''
  | '/privacy'
  | '/menu'
  | '/french-restaurant-krabi'
  | '/romantic-dinner-krabi'
  | '/where-to-eat-krabi-town'
  | '/getting-here-from-ao-nang'
  | '/wine-belgian-beer-krabi'

export type PageDef = {
  key: PageKey
  namespace: string
  slugs: Partial<Record<SeoLocale, string>>
  contentLocales: readonly SeoLocale[]
  related: readonly PageKey[]
}

/**
 * Single slug registry (D-01). EN slug = key (D-02, indexed URLs never change);
 * other locales may override through `slugs`. DE/SV slugs arrive with plan 09.
 */
export const PAGES: readonly PageDef[] = [
  { key: '', namespace: 'home', slugs: {}, contentLocales: ['fr', 'en', 'de', 'sv'], related: [] },
  { key: '/privacy', namespace: 'privacy', slugs: {}, contentLocales: ['fr', 'en'], related: [] },
  { key: '/menu', namespace: 'menuPage', slugs: {}, contentLocales: ['fr', 'en', 'de', 'sv'], related: [] },
  {
    key: '/french-restaurant-krabi',
    namespace: 'frenchRestaurant',
    slugs: { fr: '/restaurant-francais-krabi', de: '/franzoesisches-restaurant-krabi', sv: '/fransk-restaurang-krabi' },
    contentLocales: ['fr', 'en', 'de', 'sv'],
    related: ['/romantic-dinner-krabi', '/where-to-eat-krabi-town', '/wine-belgian-beer-krabi'],
  },
  {
    key: '/romantic-dinner-krabi',
    namespace: 'romanticDinner',
    slugs: { fr: '/diner-romantique-krabi', de: '/romantisches-abendessen-krabi', sv: '/romantisk-middag-krabi' },
    contentLocales: ['fr', 'en', 'de', 'sv'],
    related: ['/french-restaurant-krabi', '/wine-belgian-beer-krabi', '/where-to-eat-krabi-town'],
  },
  {
    key: '/where-to-eat-krabi-town',
    namespace: 'whereToEat',
    slugs: { fr: '/ou-manger-krabi-town', de: '/wo-essen-krabi-town', sv: '/var-ata-krabi-town' },
    contentLocales: ['fr', 'en', 'de', 'sv'],
    related: ['/getting-here-from-ao-nang', '/french-restaurant-krabi', '/romantic-dinner-krabi'],
  },
  {
    key: '/getting-here-from-ao-nang',
    namespace: 'gettingHere',
    slugs: {},
    contentLocales: ['en'],
    related: ['/where-to-eat-krabi-town', '/french-restaurant-krabi'],
  },
  {
    // Owner alcohol gate (plan 12): no content locale yet
    key: '/wine-belgian-beer-krabi',
    namespace: 'wineBeer',
    slugs: {},
    contentLocales: [],
    related: ['/french-restaurant-krabi', '/romantic-dinner-krabi'],
  },
]

export function toSeoLocale(raw: string): SeoLocale {
  return (LOCALES as readonly string[]).includes(raw) ? (raw as SeoLocale) : 'fr'
}

/** Localized slug for a page key (falls back to the key itself). */
export function slugFor(key: PageKey | string, locale: SeoLocale): string {
  const page = PAGES.find((p) => p.key === key)
  return page?.slugs[locale] ?? key
}

export function localeUrl(locale: SeoLocale, key: PageKey | string = ''): string {
  return `${SITE_URL}/${locale}${slugFor(key, locale)}`
}

export function localePath(locale: SeoLocale, key: PageKey | string = ''): string {
  return `/${locale}${slugFor(key, locale)}`
}

export function publishedLocales(key: string): readonly SeoLocale[] {
  return PUBLISHED_PAGES.find((p) => p.path === key)?.locales ?? []
}

export function isPublished(key: string, locale: SeoLocale): boolean {
  return publishedLocales(key).includes(locale)
}

/** hreflang map for a page published in the given locales (x-default -> fr when present). */
export function pageLanguages(path: string, locales: readonly SeoLocale[]): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const l of locales) languages[l] = localeUrl(l, path)
  languages['x-default'] = localeUrl(locales.includes('fr') ? 'fr' : locales[0], path)
  return languages
}

/** Related pages published in the given locale (D-04), never the page itself, max 3. */
export function relatedFor(key: PageKey, locale: SeoLocale): PageKey[] {
  const page = PAGES.find((p) => p.key === key)
  if (!page) return []
  return page.related.filter((k) => k !== key && isPublished(k, locale)).slice(0, 3)
}

/** Guide pages shown in the header menu, footer and home (D-04), in display order. */
export const GUIDE_KEYS: readonly PageKey[] = [
  '/french-restaurant-krabi',
  '/romantic-dinner-krabi',
  '/where-to-eat-krabi-town',
  '/getting-here-from-ao-nang',
  '/wine-belgian-beer-krabi',
]

/** Guides published in the given locale (published only, GUIDE_KEYS order). */
export function guidesFor(locale: SeoLocale): { key: PageKey; namespace: string; href: string }[] {
  const out: { key: PageKey; namespace: string; href: string }[] = []
  for (const key of GUIDE_KEYS) {
    const page = PAGES.find((p) => p.key === key)
    if (!page || !isPublished(key, locale)) continue
    out.push({ key, namespace: page.namespace, href: localePath(locale, key) })
  }
  return out
}

/**
 * Language switcher targets for a browser pathname (D-05): the current locale plus
 * every other locale in which the same page is published, each with its own slug.
 * Hrefs come only from the registry; an unknown path yields [].
 */
export function switcherTargets(
  pathname: string
): { locale: SeoLocale; href: string; current: boolean }[] {
  const current = LOCALES.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  if (!current) return []
  const rest = pathname.slice(current.length + 1).replace(/\/+$/, '')
  const page = PAGES.find((p) => slugFor(p.key, current) === rest)
  if (!page) return []
  return LOCALES.filter((l) => l === current || isPublished(page.key, l)).map((l) => ({
    locale: l,
    href: localePath(l, page.key),
    current: l === current,
  }))
}

/** Noindex gate (D-05): an unpublished (page, locale) gets no canonical/hreflang. */
export function resolvePageSeo(
  key: string,
  locale: SeoLocale
):
  | { index: false }
  | { index: true; canonical: string; languages: Record<string, string> } {
  if (!isPublished(key, locale)) return { index: false }
  return {
    index: true,
    canonical: localeUrl(locale, key),
    languages: pageLanguages(key, publishedLocales(key)),
  }
}

/** next-intl pathnames: only non-EN rewrites, derived from the registry. */
export function buildPathnames(): Record<string, Partial<Record<SeoLocale, string>>> {
  const out: Record<string, Partial<Record<SeoLocale, string>>> = {}
  for (const page of PAGES) {
    if (Object.keys(page.slugs).length === 0) continue
    out[page.key] = { ...page.slugs }
  }
  return out
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
  locales?: readonly SeoLocale[]
}): Metadata {
  const { locale, path = '', title, description, absoluteTitle, locales = publishedLocales(path) } = args
  const others = locales.filter((l) => l !== locale)
  const url = localeUrl(locale, path)

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      languages: pageLanguages(path, locales),
    },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Gecko Cabane',
      url,
      locale: OG_LOCALE[locale],
      ...(others.length > 0 ? { alternateLocale: others.map((l) => OG_LOCALE[l]) } : {}),
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

// Google asks for 5+ decimals. Pin 8.0614728, 98.9156616 (Google Maps, two independent
// sources) rounded to 5 decimals; matches D-06 (8.0615, 98.9157) to rounding. 02-07.
export const GEO = { latitude: 8.06147, longitude: 98.91566 } as const

// D-09: owner-approved/delegated 2026-10-17 (see 02-LAUNCH.md "Owner approvals / Task 2 outcome")
export const SAME_AS: readonly string[] = [
  'https://www.google.com/maps/place/?q=place_id:ChIJozpAo2GUUTARABLcICH3H7I',
  'https://www.tripadvisor.com/Restaurant_Review-g297927-d2413872-Reviews-Gecko_Cabane_Restaurant_krabi-Krabi_Town_Krabi_Province.html',
  'https://www.facebook.com/GeckoCabaneRestaurant/',
  'https://www.instagram.com/geckocabane/',
]

export const TRIPADVISOR_URL: string = SAME_AS.find((u) => u.includes('tripadvisor.com'))!

// Review destinations (D-12). Both URLs are centralized here so they can be swapped
// (e.g. for the g.page/r/.../review link from the GBP dashboard) without touching the UI.
// The TripAdvisor UserReviewEdit schema is undocumented by TripAdvisor: owner device test in 04-07.
export const GOOGLE_PLACE_ID = 'ChIJozpAo2GUUTARABLcICH3H7I'
export const TRIPADVISOR_REVIEW_SLUG =
  'g297927-d2413872-Gecko_Cabane_Restaurant_krabi-Krabi_Town_Krabi_Province'

export function googleReviewUrl(): string {
  return `https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID}`
}

/** Google Maps turn-by-turn directions to the restaurant (PAGE-05). */
export function googleDirectionsUrl(origin = 'Ao Nang'): string {
  return (
    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent('Gecko Cabane Restaurant')}&destination_place_id=${GOOGLE_PLACE_ID}`
  )
}

export function tripAdvisorReviewUrl(): string {
  return `https://www.tripadvisor.com/UserReviewEdit-${TRIPADVISOR_REVIEW_SLUG}.html`
}

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

  // No rating block (D-07: unverifiable). hasMenu = URL of the localized /menu
  // page (phase 3, D-10); the deprecated `menu` property stays absent.
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${SITE_URL}/#restaurant`,
    name: 'Gecko Cabane Restaurant',
    alternateName: 'Gecko Cabane',
    url: localeUrl(locale),
    hasMenu: localeUrl(locale, '/menu'),
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
