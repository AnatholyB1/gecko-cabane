# Phase 6: Plan de pages SEO, allemand/suédois et présence externe - Pattern Map

**Mapped:** 2026-10-17
**Files analyzed:** 36 (new/modified)
**Analogs found:** 33 / 36 (3 with no codebase analog: GuidesMenu disclosure, deepMerge fallback, review-sign-off docs)

Note: line numbers refer to the files as read on 2026-10-17. Paths use `src/app/[locale]/` literally.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/utils/seo.ts` (modify: LOCALES, OG_LOCALE, PAGES registry, slugFor, localeUrl, pageLanguages, isPublished, publishedLocales, resolvePageSeo, TRIPADVISOR_URL, switcherTargets) | utility | transform (pure) | itself (`src/utils/seo.ts` lines 14-45) | exact (extend) |
| `src/i18n/config.ts` (modify: add `de`, `sv`) | config | n/a | itself (3 lines) | exact |
| `src/i18n/routing.ts` (new) | config | request-response | `src/middleware.ts` lines 6-13 (inline intl options) | role-match |
| `src/i18n/navigation.ts` (unchanged, verify) | config | n/a | itself | exact |
| `src/i18n/request.ts` (modify: deep-merge de/sv over en) | config | transform | itself (lines 4-17) + RESEARCH Pattern 4 | exact (extend) |
| `src/middleware.ts` (modify: use `routing`) | middleware | request-response | itself lines 1-13, 114-117 | exact |
| `src/app/sitemap.ts` (body unchanged) | route | transform | itself | exact |
| `src/app/[locale]/layout.tsx` (modify: widen `'fr' \| 'en'` cast line 36, drop `alternateLocale`) | component | request-response | itself | exact |
| `src/components/seo/SeoLandingPage.tsx` (new) | component (Server) | request-response | `src/app/[locale]/french-restaurant-krabi/page.tsx` | exact (factor out) |
| `src/components/seo/styles.ts` (new: BTN_GOLD, BTN_IVORY, H2, PROSE, TEXT_LINK) | utility | n/a | french-restaurant page lines 42-49 | exact (move) |
| `src/components/seo/pages.config.ts` (new) | config | n/a | french-restaurant page `DISHES` const lines 16-21 | role-match |
| `src/components/seo/RelatedGuides.tsx` (new, "A decouvrir") | component (Server) | request-response | french-restaurant page section 3 (card grid, lines 121-148) | role-match |
| `src/components/seo/BreadcrumbJsonLd.tsx` (new, optional) | component (Server) | transform | `src/components/RestaurantJsonLd.tsx` | exact |
| `src/app/[locale]/french-restaurant-krabi/page.tsx` (modify: thin wrapper, FR/DE/SV) | page | request-response | itself | exact |
| `src/app/[locale]/romantic-dinner-krabi/page.tsx` (new) | page | request-response | french-restaurant page (`generateMetadata` lines 28-40, default export 51-56) | exact |
| `src/app/[locale]/where-to-eat-krabi-town/page.tsx` (new) | page | request-response | same | exact |
| `src/app/[locale]/getting-here-from-ao-nang/page.tsx` (new, EN-only) | page | request-response | same (its `locale !== 'en'` guard is the EN-only template) | exact |
| `src/app/[locale]/wine-belgian-beer-krabi/page.tsx` (new, EN-only) | page | request-response | same | exact |
| `src/app/[locale]/menu/page.tsx` (modify: FR/DE/SV metadata + gate) | page | request-response | itself (not re-read; follow french-restaurant `generateMetadata`) | exact |
| `src/app/[locale]/review/page.tsx` + `src/utils/review-links.ts` (modify: `REVIEW_LOCALES` gate) | page/utility | request-response | itself | exact |
| `src/components/LanguageSwitcher.tsx` (rewrite) | component (client) | request-response | itself (lines 1-50) | exact (rewrite) |
| `src/components/GuidesMenu.tsx` (new) | component (client) | event-driven | none; use UI-SPEC section B | no analog |
| `src/components/SiteHeader.tsx` (modify: add GuidesMenu + Menu link) | component (Server) | request-response | itself | exact |
| `src/components/SiteFooter.tsx` (modify: Guides column) | component (Server) | request-response | itself | exact |
| `src/app/[locale]/page.tsx` (modify: Guides in own nav, TripAdvisor URL line ~548) | page | request-response | itself | exact |
| `src/utils/reservation-schema.ts` (modify line 38 enum) | utility | transform/validation | itself | exact |
| `src/utils/validation.ts` (modify `phoneCountryForLocale` lines 32-36) | utility | transform | itself | exact |
| `src/utils/resend.ts` (modify EmailLocale mapping) | utility | transform | itself (not re-read) | exact |
| `messages/fr.json`, `en.json` (modify), `de.json`, `sv.json` (new) | config (i18n) | n/a | `messages/en.json` namespaces `frenchRestaurant`, `meta` | exact |
| `tests/seo-slugs.test.ts` (new) | test | unit | `tests/seo-sitemap-robots.test.ts` | role-match |
| `tests/seo-landing-pages.test.ts` (new) | test | source-scan | `tests/landing-page.test.ts` / `tests/middleware-matcher.test.ts` | role-match |
| `tests/i18n-publication-gate.test.ts` (new) | test | file-I/O | `tests/i18n.test.ts` (flattenKeys, readFileSync) | role-match |
| `tests/ph6-docs.test.ts` (new) | test | file-I/O | `tests/review-print.test.ts` | role-match |
| Updates: `tests/seo-sitemap-robots.test.ts`, `middleware-matcher.test.ts`, `i18n.test.ts`, `landing-page.test.ts`, `seo-pages.test.ts`, `review-links.test.ts`, `seo-no-legacy-domain.test.ts`, `reservation-schema.test.ts`, `resend-locale.test.ts` | test | unit | themselves | exact |
| `docs/ph6/*.md`, `docs/ph6/review/{de,sv}/*.md`, `concierge-dossier.pdf` (new) | docs | n/a | `docs/print/README.md`, `scripts/generate-review-print.mjs` | role-match |

## Pattern Assignments

### `src/utils/seo.ts` (utility, pure transform)

**Analog:** itself. Pure module, type-only import (`import type { Metadata } from 'next'`, line 8) so Vitest node can load it. Do NOT add runtime imports.

**Current shape to extend** (lines 14-45):
```typescript
export const SITE_URL = 'https://geckocabanerestaurant.com'
export const LOCALES = ['fr', 'en'] as const
export type SeoLocale = (typeof LOCALES)[number]
export const OG_LOCALE = { fr: 'fr_FR', en: 'en_US' } as const

export const PUBLISHED_PAGES: readonly { path: string; locales: readonly SeoLocale[] }[] = [
  { path: '', locales: ['fr', 'en'] },
  { path: '/privacy', locales: ['fr', 'en'] },
  { path: '/menu', locales: ['fr', 'en'] },
  { path: '/french-restaurant-krabi', locales: ['en'] },
]

export function pageLanguages(path: string, locales: readonly SeoLocale[] = LOCALES): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const l of locales) languages[l] = localeUrl(l, path)
  languages['x-default'] = localeUrl(locales.includes('fr') ? 'fr' : locales[0], path)
  return languages
}
export function localeUrl(locale: SeoLocale, path = ''): string {
  return `${SITE_URL}/${locale}${path}`
}
```
Changes: widen `LOCALES` and `OG_LOCALE` (`de_DE`, `sv_SE`); add `PAGES` registry + `slugFor` (RESEARCH Pattern 1); `localeUrl` becomes `${SITE_URL}/${locale}${slugFor(path, locale)}`; the `pageLanguages` default `locales = LOCALES` becomes a latent bug once LOCALES has 4 entries, so make the argument required. Keep `PUBLISHED_PAGES` shape `{ path, locales }` with `path` = registry key. Add `isPublished`, `publishedLocales`, `resolvePageSeo` (RESEARCH Pattern 3), `switcherTargets(pathname, locale)` (pure, for Pattern 5 test), `TRIPADVISOR_URL`.

**TripAdvisor URL pattern to copy** (same file, lines 100-106 `SAME_AS`, and `GOOGLE_PLACE_URL` in french page line 14):
```typescript
const GOOGLE_PLACE_URL = SAME_AS.find((u) => u.includes('google.com/maps'))
// -> export const TRIPADVISOR_URL = SAME_AS.find((u) => u.includes('tripadvisor.com'))!
```

**buildPageMetadata** (lines 56-90): already takes `locales` and builds `alternates` via `pageLanguages(path, locales)`; `openGraph.alternateLocale` is derived from `others`. Reuse unchanged; unpublished locales must use the noindex branch in each page instead.

**Also fix:** `buildRestaurantJsonLd` lines 181-182 `url: localeUrl(locale)`, `hasMenu: localeUrl(locale, '/menu')` reference `/de/menu` before publication (RESEARCH Pitfall 5): use `isPublished('/menu', locale) ? localeUrl(locale,'/menu') : localeUrl('en','/menu')` or omit.

---

### `src/i18n/routing.ts` (new, config) and `src/middleware.ts` (modify)

**Analog:** `src/middleware.ts` lines 1-13:
```typescript
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from '@/i18n/config'

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localeDetection: false,
  // No Link hreflang header: HTML hreflang (x-default -> /fr) is the only signal
  alternateLinks: false,
  localePrefix: 'always',
})
```
Move these options into `routing.ts` via `defineRouting({... pathnames })` (RESEARCH Pattern 2) and call `createIntlMiddleware(routing)`. Keep the comment about `alternateLinks: false`. Keep everything else in `middleware.ts` untouched: `/monitoring` bypass (line 21), `REVIEW_ALIASES` set (line 15, already includes `/bewertung`), auth guard (79-112), `withCookies(intlMiddleware(request))` (line 117), and the `config.matcher` (120-134).

`tests/middleware-matcher.test.ts` reads `src/middleware.ts` as text (lines 11-12: `readFileSync(join(root, 'src/middleware.ts'))`); extend it to also read `src/i18n/routing.ts` for the `localePrefix: 'always'` / `localeDetection: false` / `alternateLinks: false` assertions. Matcher regex extraction (lines 14-20) stays valid.

`src/i18n/navigation.ts` stays untyped (no `pathnames`):
```typescript
export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales, defaultLocale, localePrefix: 'always'
})
```
Hrefs to localized pages are built from `slugFor` (e.g. `<Link href={slugFor('/menu', locale)}>`), hash hrefs `/#reservation` keep working.

---

### `src/i18n/request.ts` (modify, config)

**Analog:** itself (current content):
```typescript
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !locales.includes(locale as Locale)) { locale = 'fr' }
  return { locale, messages: (await import(`../../messages/${locale}.json`)).default }
})
```
Copy the `deepMerge` block from RESEARCH Pattern 4 (no codebase analog): merge `messages/en.json` under `de`/`sv`. Create `messages/de.json` and `messages/sv.json` (at minimum `{}`) before any deploy, else the dynamic import fails.

---

### `src/components/seo/SeoLandingPage.tsx` (component, Server, request-response)

**Analog:** `src/app/[locale]/french-restaurant-krabi/page.tsx` (read in full). Factor out its 7-section markup.

**Imports pattern** (lines 1-12):
```typescript
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getOpeningHours } from '@/utils/opening-hours'
import { getMenu } from '@/utils/menu'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import RestaurantJsonLd from '@/components/RestaurantJsonLd'
import GcDivider from '@/components/ui/GcDivider'
```

**Style constants** (lines 42-49): move verbatim to `src/components/seo/styles.ts` (`BTN_GOLD`, `BTN_IVORY`, `H2`, `PROSE`, `TEXT_LINK`).

**Core structure** (lines 64-75, 76-109 hero, 111-119 section, 220-230 closing CTA):
```tsx
<div className="min-h-screen bg-gc-ivory font-cormorant">
  <RestaurantJsonLd locale="en" />
  <a href="#main-content" className="sr-only focus:not-sr-only ...">{tc('skipToContent')}</a>
  <SiteHeader locale="en" availableLocales={['en']} />
  <main id="main-content">
    <section className="bg-gc-jungle py-16 px-6"> ... <h1 className="font-cinzel font-normal text-[32px] leading-[1.2] text-gc-ivory mt-2">{t('h1')}</h1>
       <GcDivider className="my-4" /> ...
       <Link href="/#reservation" className={BTN_GOLD}>{t('ctaBook')}</Link>
       <Link href="/menu" className={BTN_IVORY}>{t('ctaMenu')}</Link>
    ...
```
Replace hard-coded `'en'` by the `locale` prop; drop the `availableLocales` prop (switcher computes itself). Section alternation `bg-gc-ivory` / `bg-gc-parchment`, `py-16 px-6`, `max-w-5xl mx-auto`.

**Data fetch pattern** (lines 55-62, errors deliberately not caught):
```typescript
const t = await getTranslations({ locale, namespace: 'frenchRestaurant' })
const tc = await getTranslations({ locale, namespace: 'common' })
// Not caught on purpose: errors fall to error.tsx so an error page is never cached as content.
const [hoursRows, menu] = await Promise.all([getOpeningHours(), getMenu()])
const belgianHref = menu.some((p) => p.slug === 'vins-bieres-belges') ? '/menu#vins-bieres-belges' : '/menu'
```
Re-use for the wine/beer page link (UI-SPEC: render the anchor link only while that menu page is populated).

**Section list pattern**: use slot keys (`sections.ambiance.title`, `.p1`, `.p2`), not arrays, so the flat-key parity test keeps working (RESEARCH Pattern 6). `{t(`${key}.name`)}` template-key usage already exists at lines 132, 139, 141.

**Guard** (line 53): `if (locale !== 'en') notFound()` becomes `if (!contentLocales.includes(locale)) notFound()`.

---

### `src/app/[locale]/<new-page>/page.tsx` x4 (thin wrapper pages)

**Analog:** french-restaurant page.

**Metadata pattern to copy** (lines 23-40), then extend with the noindex gate from RESEARCH "Per-page metadata with noindex gate":
```typescript
type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (locale !== 'en') return {}
  const t = await getTranslations({ locale: 'en', namespace: 'meta' })
  return buildPageMetadata({
    locale: 'en',
    path: '/french-restaurant-krabi',
    locales: ['en'],
    title: t('frenchRestaurantTitle'),
    description: t('frenchRestaurantDescription'),
    absoluteTitle: true,
  })
}
```
New version: `locales: publishedLocales(KEY)`; if `!resolvePageSeo(KEY, locale).index` return `{ title: { absolute }, description, robots: { index: false, follow: true } }` with no `alternates`. `meta` keys follow `meta.<camelKey>Title` / `Description` (existing `frenchRestaurantTitle`).

EN-only pages (getting-here, wine-belgian-beer): `contentLocales: ['en']` so every other locale returns `{}` and `notFound()` (identical to current french page behaviour).

---

### `src/components/LanguageSwitcher.tsx` (rewrite, client)

**Analog:** itself. Keep: `'use client'`, `useLocale`, `useTranslations('language')`, `usePathname` from `next/navigation`, inline styles for the `|` separators and active colour, `aria-label={t('switchTo', { language: t(loc) })}`, `aria-current={locale === loc ? 'true' : undefined}`.

**Part to replace** (lines 14-19):
```typescript
if (availableLocales && availableLocales.length < 2) return null
const pathWithoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/'
...
<Link href={pathWithoutLocale} locale={loc} ...>
```
New logic (RESEARCH Pattern 5): strip prefix with `locales` alternation, reverse-lookup key by `slugFor(p.key, locale) === rest`, render `publishedLocales(key)` plus current locale, `href = '/' + loc + slugFor(key, loc)`, add `hreflang`/`lang`; return `null` when `< 2`. Put the computation in `switcherTargets()` in `seo.ts` (pure, testable). Callers passing `availableLocales`: `SiteHeader.tsx` (prop lines 5-6, 11, 26) and the french page (line 73); remove the prop everywhere.

---

### `src/components/GuidesMenu.tsx` (new, client, event-driven) - NO ANALOG

Use UI-SPEC section B (button + `aria-expanded` + `aria-controls="guides-menu"`, Escape/outside-click close, `ChevronDown` from lucide-react, full-width sheet on mobile). Receive `{label, href, current}[]` as props from the Server Component (`guidesFor(locale)`), keep `seo.ts` out of the client bundle. For visual tokens reuse the `SiteHeader` classes: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gc-gold`, `min-h-11`, `font-cinzel`. Return `null` when the item list is empty. All strings via props/`useTranslations` (guard in `tests/i18n-hardcoded.test.ts`, banned accented literals in `.tsx`).

---

### `src/components/SiteHeader.tsx` (modify)

**Analog:** itself (read in full). Insert `<GuidesMenu items={...} />` inside the right-hand group before `LanguageSwitcher`:
```tsx
<div className="flex items-center gap-4 sm:gap-6">
  <LanguageSwitcher availableLocales={availableLocales} />
  <Link href="/#reservation" className="inline-flex items-center min-h-11 font-cinzel text-[12px] ...">
    <span className="hidden min-[480px]:inline">{t('bookTable')}</span>
    <span className="min-[480px]:hidden">{t('reserveShort')}</span>
  </Link>
</div>
```
`common.bookTable` / `common.reserveShort` keys already exist; reuse. Server data pattern: `const t = await getTranslations({ locale, namespace: 'common' })`.

### `src/components/SiteFooter.tsx` (modify)

**Analog:** itself. Add a Guides column using the same `Link` + `getTranslations({ locale, namespace: 'footer' })` pattern and `text-gc-ivory/60 underline hover:text-gc-gold` link classes (lines 20-24). Links filtered by `isPublished`.

### `src/app/[locale]/page.tsx` (modify)

Replace the literal `href="https://fr.tripadvisor.be/Restaurant_Review-g297927-d2413872-..."` (around line 548) by `TRIPADVISOR_URL` from `seo.ts` (same style as `GOOGLE_PLACE_URL` used at ~line 537). Extend `tests/seo-no-legacy-domain.test.ts` to ban `tripadvisor.be`. Home has its own fixed `<nav>` (not `SiteHeader`): add `GuidesMenu` there too. The static 5-star SVG block next to it is an unverifiable claim (Open Question 4): flag, do not change without owner decision.

---

### `src/utils/reservation-schema.ts`, `src/utils/validation.ts`, `src/utils/resend.ts` (modify)

**reservation-schema.ts line 38:** `locale: z.enum(['fr', 'en']).default('fr'),` becomes `z.enum(['fr', 'en', 'de', 'sv'])`.
**validation.ts lines 32-36:**
```typescript
export function phoneCountryForLocale(locale: string): CountryCode {
  if (locale === 'fr') return 'FR'
  if (locale === 'en') return 'GB'
  return 'TH'
}
```
Add `de -> 'DE'`, `sv -> 'SE'`. Emails: map de/sv copy to `en` (`locale === 'fr' ? 'fr' : 'en'`) while the DB stores the real locale (migration 008 already allows fr/en/de/sv). Update `tests/reservation-schema.test.ts`, `tests/resend-locale.test.ts`.

---

### `src/components/seo/BreadcrumbJsonLd.tsx` (optional)

**Analog:** `src/components/RestaurantJsonLd.tsx`: Server Component, `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />`. Always use `serializeJsonLd` (escapes `<`). Real names only, no rating.

---

### Tests (new)

**Analog for unit tests on pure seo.ts:** `tests/seo-sitemap-robots.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import sitemap from '../src/app/sitemap'
import { localeUrl, SITE_URL, PUBLISHED_PAGES } from '../src/utils/seo'
describe('sitemap', () => {
  const entries = sitemap()
  it('lists exactly the 7 published URLs', () => { ... .sort() ... toEqual(expected) })
```
Needs updating by design: "exactly 7", hard-coded regex `(fr|en)`, `if (page.locales.length === 2)` branches, "never lists the FR landing URL" (FR landing now published), and the negative `/de|/sv` assertion (lines 17-60). Rewrite them as iterations over `PUBLISHED_PAGES` expanded through `localeUrl`/`pageLanguages` plus a reciprocity check.

**Analog for source-scan tests:** `tests/middleware-matcher.test.ts` lines 9-12: `readFileSync(join(root, 'src/...'), 'utf8')`. Use for `seo-landing-pages.test.ts` (page folders exist, one `<h1>` via component, `#reservation` link).

**Analog for message tests:** `tests/i18n.test.ts` lines 20-36: `flattenKeys`, `findEmptyValues`, `readFileSync(join(process.cwd(), 'messages'))`. Extend: fr<->en strict; `de`/`sv` keys subset of `en` keys; `language.de`/`language.sv` keys in fr and en. Publication-gate test: for each (page, de|sv) in `PUBLISHED_PAGES`, namespace complete and `docs/ph6/review/<loc>/<page>.md` contains `- [x]`.

---

### `docs/ph6/*` (docs)

**Analog:** `docs/print/README.md` (French, table of files, "Régénérer" section) and `scripts/generate-review-print.mjs` (offline PDF generation, inspect its deps before reuse). Every doc begins with `Statut : brouillon / validé par le propriétaire (date) / envoyé par le propriétaire (date)`; outreach docs state "Statut : non envoyé". Canonical NAP block must equal `seo.ts` values: phone `+66819585945`, `streetAddress: '1/36-37 Soi Ruamjit, Maharat Road'`, `Krabi Town`, `81000`. Review docs structure: RESEARCH section 7 (FR | DE table, final `- [ ] Validé par écrit par : ____  Date : ____  Canal : ____`).

## Shared Patterns

### Publication gate (hreflang, sitemap, noindex, switcher, nav, cross-links)
**Source:** `src/utils/seo.ts` `PUBLISHED_PAGES` (lines 25-30) + `pageLanguages`
**Apply to:** every page `generateMetadata`, `sitemap.ts`, `LanguageSwitcher`, `GuidesMenu` items, `RelatedGuides`, `SiteFooter`, `RestaurantJsonLd`. Never list a page/locale early; derive everything from `publishedLocales(key)` so reciprocity holds by construction.

### Per-page metadata (full object, no layout alternates)
**Source:** `buildPageMetadata` in `src/utils/seo.ts` lines 56-90, comment lines 51-55: "Next metadata merging is shallow: every page must return the full object and layouts must not set `alternates`."
**Apply to:** all page `generateMetadata`. Note `src/app/[locale]/layout.tsx` currently casts `locale as 'fr' | 'en'` (line 36) and builds `alternateLocale` from one `other` locale: widen to `Locale`, drop `alternateLocale`.

### i18n discipline
**Source:** `tests/i18n-hardcoded.test.ts` (accented chars and banned phrases such as 'Horaires', 'Accueil', 'La Carte' forbidden in `.tsx/.ts` under `src/components` and `src/app/[locale]`), `tests/i18n.test.ts`.
**Apply to:** all new components. Slugs ASCII only (`franzoesisches`, `diner`, `ou`). Strings in `messages/{fr,en,de,sv}.json`; page copy authored per language.

### Server Component data/error handling
**Source:** french page lines 56-58 (do not catch DB errors; error.tsx handles) and `RestaurantJsonLd.tsx` (try/catch + `Sentry.captureException` only for non-critical hours).
**Apply to:** `SeoLandingPage` (uncaught), JSON-LD components (caught + Sentry).

### Tailwind v4 tokens
**Source:** french page lines 42-49: `bg-gc-ivory`, `bg-gc-parchment`, `bg-gc-jungle`, `text-gc-gold`, `border-gc-aged`, `min-h-11`; never `bg-[var(--x)]`. Fonts `font-cinzel`, `font-cormorant`, `font-raleway`.

### Middleware composition
**Source:** `src/middleware.ts` lines 15-30 and 114-117: early pass-throughs for aliases/monitoring, Supabase session first, intl last, cookies stamped via `withCookies`. Keep the `/admin` branch above the intl call.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/GuidesMenu.tsx` | component (client) | event-driven | No disclosure/dropdown component exists; follow UI-SPEC section B and RESEARCH Pattern 7 |
| `deepMerge` fallback in `src/i18n/request.ts` | utility | transform | No message-fallback precedent; copy RESEARCH Pattern 4 |
| `docs/ph6/review/*` sign-off docs and `tests/i18n-publication-gate.test.ts` | docs/test | file-I/O | No review/sign-off workflow exists; follow RESEARCH section 7 |
| `src/i18n/routing.ts` `pathnames` | config | request-response | No pathnames precedent; options come from `src/middleware.ts` lines 6-13, `pathnames` from RESEARCH Pattern 2 |

## Metadata

**Analog search scope:** `src/utils`, `src/i18n`, `src/components`, `src/app/[locale]`, `src/middleware.ts`, `tests`, `docs/print`, `scripts`
**Files read this session:** `seo.ts`, french page, `middleware.ts`, `config/navigation/request.ts`, `LanguageSwitcher`, `SiteHeader`, `SiteFooter`, `RestaurantJsonLd`, `sitemap.ts`, parts of 3 tests and `docs/print/README.md`, `reservation-schema.ts` and `validation.ts` (grep), home page lines 535-560
**Not re-read (planner should open before editing):** `src/app/[locale]/menu/page.tsx`, `review/page.tsx`, `src/utils/review-links.ts`, `src/utils/resend.ts`, `scripts/generate-review-print.mjs`, `messages/*.json`
**Pattern extraction date:** 2026-10-17
