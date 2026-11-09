/**
 * SEO helpers: single source of truth for every public SEO URL
 * (canonical, hreflang, OpenGraph, sitemap, JSON-LD).
 *
 * Pure module: only type-only imports so vitest (node env) can load it.
 */

import type { Metadata } from 'next'
import { aggregateRatingFor } from './social-proof'

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
  { path: '', locales: ['fr', 'en', 'de', 'sv'] },
  { path: '/privacy', locales: ['fr', 'en'] },
  { path: '/menu', locales: ['fr', 'en', 'de', 'sv'] },
  { path: '/french-restaurant-krabi', locales: ['fr', 'en', 'de', 'sv'] },
  { path: '/romantic-dinner-krabi', locales: ['fr', 'en', 'de', 'sv'] },
  { path: '/where-to-eat-krabi-town', locales: ['fr', 'en', 'de', 'sv'] },
  // ONP-04: fr published; de/sv content exists but stays unlisted until the human review (ONP-11)
  { path: '/getting-here-from-ao-nang', locales: ['fr', 'en'] },
  // Owner alcohol-advertising sign-off: publish, 2026-10-18 (plan 12)
  // ONP-05: the alcohol sign-off covers the EN text; the FR text needs the same owner OK
  { path: '/wine-belgian-beer-krabi', locales: ['fr', 'en'] },
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
    slugs: { fr: '/venir-depuis-ao-nang', de: '/anreise-von-ao-nang', sv: '/resa-fran-ao-nang' },
    contentLocales: ['fr', 'en', 'de', 'sv'],
    related: ['/where-to-eat-krabi-town', '/french-restaurant-krabi'],
  },
  {
    // Owner alcohol gate cleared 2026-10-18 (plan 12): EN only
    key: '/wine-belgian-beer-krabi',
    namespace: 'wineBeer',
    slugs: { fr: '/vins-bieres-belges-krabi', de: '/wein-belgisches-bier-krabi', sv: '/vin-belgisk-ol-krabi' },
    contentLocales: ['fr', 'en', 'de', 'sv'],
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
 * Share image (ONP-08): the existing `[locale]/opengraph-image.tsx` route, 1200x630. Next drops the
 * file-convention image as soon as a page returns its own openGraph, so every page repeats it here.
 * The URL carries no cache-busting hash: the route serves the same PNG without it.
 */
export function ogImage(locale: SeoLocale): { url: string; width: number; height: number; alt: string } {
  return {
    url: `${SITE_URL}/${locale}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: 'Gecko Cabane Restaurant - Franco-Thai Cuisine in Krabi',
  }
}

/**
 * og:/twitter: share tags with no URL, alternates or description, for noindex pages (utility pages,
 * unpublished locales) that people can still share (ONP-08).
 */
export function buildShareMetadata(args: {
  locale: SeoLocale
  title: string
  description?: string
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  const { locale, title, description } = args
  const image = ogImage(locale)
  return {
    openGraph: {
      title,
      ...(description ? { description } : {}),
      type: 'website',
      siteName: 'Gecko Cabane',
      locale: OG_LOCALE[locale],
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      ...(description ? { description } : {}),
      images: [image.url],
    },
  }
}

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
      images: [ogImage(locale)],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage(locale).url],
    },
  }
}

// ---------------------------------------------------------------------------
// Restaurant JSON-LD
// ---------------------------------------------------------------------------

// Google asks for 5+ decimals. Owner-provided pin (Apple Maps place, 2026-10-30):
// 8.061436, 98.915598 (replaces the earlier 8.06147, 98.91566).
export const GEO = { latitude: 8.061436, longitude: 98.915598 } as const

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

/** Google reviews page for the place (official URL, opens in the Maps app on phones). */
export function googleReadReviewsUrl(): string {
  return `https://search.google.com/local/reviews?placeid=${GOOGLE_PLACE_ID}`
}

/** Google Maps place page by place id (official Maps URLs format, works on iOS and Android). */
export function googleMapsPlaceUrl(): string {
  return `https://www.google.com/maps/search/?api=1&query=Gecko%20Cabane%20Restaurant&query_place_id=${GOOGLE_PLACE_ID}`
}

export function tripAdvisorReviewUrl(): string {
  return `https://www.tripadvisor.com/UserReviewEdit-${TRIPADVISOR_REVIEW_SLUG}.html`
}

// D-19: single directions button target (coordinates + place id).
export function googleDirectionsUrl(): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${GEO.latitude},${GEO.longitude}&destination_place_id=${GOOGLE_PLACE_ID}`
}

// D-20: keyless legacy embed (RESEARCH A1); swap for the pb= URL from Google Maps > Share > Embed if it stops rendering.
export function googleMapsEmbedUrl(): string {
  return `https://www.google.com/maps?q=${GEO.latitude},${GEO.longitude}&z=16&output=embed`
}

export type OpeningHoursRow = {
  day_of_week: number
  is_open: boolean | null
  open_time: string | null
  close_time: string | null
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export type SpecialHoursRow = {
  date: string
  is_open: boolean | null
  open_time: string | null
  close_time: string | null
}

type OpeningHoursSpec = {
  '@type': 'OpeningHoursSpecification'
  dayOfWeek: string[]
  opens: string
  closes: string
  validFrom?: string
  validThrough?: string
}

/** schema.org/Google convention for a closed day or period: opens and closes at midnight. */
export const CLOSED_TIME = '00:00'

/** True for a spec that stands for a closed day ("00:00" - "00:00"). */
export function isClosedSpec(spec: Pick<OpeningHoursSpec, 'opens' | 'closes'>): boolean {
  return spec.opens === CLOSED_TIME && spec.closes === CLOSED_TIME
}

/**
 * Weekly specs: days sharing the same range are grouped, in first-seen order. A closed day
 * (is_open === false) is emitted as 00:00-00:00 (pass `includeClosed: false` for visible text).
 * A row with an unknown state (null) or an open row without times is skipped.
 */
export function mapOpeningHours(
  rows: OpeningHoursRow[],
  options: { includeClosed?: boolean } = {}
): OpeningHoursSpec[] {
  const { includeClosed = true } = options
  const groups = new Map<string, OpeningHoursSpec>()
  const sorted = [...rows].sort((a, b) => a.day_of_week - b.day_of_week)
  for (const row of sorted) {
    const day = DAYS[row.day_of_week]
    if (!day) continue
    let opens: string
    let closes: string
    if (row.is_open === false) {
      if (!includeClosed) continue
      opens = CLOSED_TIME
      closes = CLOSED_TIME
    } else if (row.is_open && row.open_time && row.close_time) {
      opens = row.open_time.slice(0, 5)
      closes = row.close_time.slice(0, 5)
    } else {
      continue
    }
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

/** Horizon of dated exceptions published in the schema. */
export const SPECIAL_HOURS_HORIZON_DAYS = 60

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/

function ymdToUtc(date: string): number | null {
  const m = YMD.exec(date)
  if (!m) return null
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const d = new Date(t)
  // Rejects 2026-02-31 and the like.
  return d.toISOString().slice(0, 10) === date ? t : null
}

/** Adds days to a YYYY-MM-DD date (calendar arithmetic, no timezone involved). */
export function addDaysToYmd(date: string, days: number): string {
  const t = ymdToUtc(date)
  if (t === null) throw new Error(`Invalid date: ${date}`)
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10)
}

/**
 * Dated exceptions (gecko_special_hours, which also carries the "Complet ce soir" closures as a
 * lunch-only or closed day) as OpeningHoursSpecification with validFrom/validThrough, for the
 * dates from `today` (included) to `today + horizonDays` (included), sorted by date.
 * Pure: the caller supplies `today` (YYYY-MM-DD, Krabi). Invalid or incomplete rows are skipped.
 */
export function mapSpecialHours(
  rows: SpecialHoursRow[],
  today: string,
  horizonDays: number = SPECIAL_HOURS_HORIZON_DAYS
): OpeningHoursSpec[] {
  if (ymdToUtc(today) === null) return []
  const last = addDaysToYmd(today, horizonDays)
  const out: OpeningHoursSpec[] = []
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date))
  for (const row of sorted) {
    const t = ymdToUtc(row.date)
    if (t === null || row.date < today || row.date > last) continue
    let opens: string
    let closes: string
    if (row.is_open === false) {
      opens = CLOSED_TIME
      closes = CLOSED_TIME
    } else if (row.is_open && row.open_time && row.close_time) {
      opens = row.open_time.slice(0, 5)
      closes = row.close_time.slice(0, 5)
    } else {
      continue
    }
    out.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [DAYS[new Date(t).getUTCDay()]],
      opens,
      closes,
      validFrom: row.date,
      validThrough: row.date,
    })
  }
  return out
}

export function buildRestaurantJsonLd(args: {
  locale: SeoLocale
  description: string
  hoursRows: OpeningHoursRow[]
  /** Dated exceptions (gecko_special_hours) and Krabi today, to publish the next 60 days. */
  specialRows?: SpecialHoursRow[]
  today?: string
  sameAs?: readonly string[]
  aggregateRating?: ReturnType<typeof aggregateRatingFor>
}): Record<string, unknown> {
  const {
    locale,
    description,
    hoursRows,
    specialRows = [],
    today,
    sameAs = SAME_AS,
    aggregateRating = aggregateRatingFor(),
  } = args
  const hours = [
    ...mapOpeningHours(hoursRows),
    ...(today ? mapSpecialHours(specialRows, today) : []),
  ]

  // aggregateRating (phase 5 D-14): from social-proof.ts, the same constants as the visible badge. hasMenu = URL of the localized /menu
  // page (phase 3, D-10); the deprecated `menu` property stays absent.
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${SITE_URL}/#restaurant`,
    name: 'Gecko Cabane Restaurant',
    alternateName: 'Gecko Cabane',
    url: isPublished('', locale) ? localeUrl(locale) : localeUrl('en'),
    hasMenu: isPublished('/menu', locale) ? localeUrl(locale, '/menu') : localeUrl('en', '/menu'),
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
    ...(aggregateRating ? { aggregateRating } : {}),
    ...(hours.length > 0 ? { openingHoursSpecification: hours } : {}),
    ...(sameAs.length > 0 ? { sameAs: [...sameAs] } : {}),
  }
}

/** JSON.stringify with '<' escaped so content can never close the script tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
