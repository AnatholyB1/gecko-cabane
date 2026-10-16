# Phase 2: Fondations SEO techniques - Research

**Researched:** 2026-10-16
**Domain:** Technical SEO on Next.js 16.1.6 App Router + next-intl 4.8.x (metadata, hreflang, JSON-LD, sitemap/robots, Vercel domain/DNS, GSC/Bing)
**Confidence:** HIGH on Next/next-intl/Vercel mechanics (docs + live probes), MEDIUM on GSC/Bing tooling (MCP tool signatures not inspectable from this session)

## Summary

The phase is mostly wiring, but live probing of production (2026-10-16) found four defects that the CONTEXT decisions do not mention and that the plan MUST include. (1) `/sitemap.xml`, `/robots.txt` and `/opengraph-image` are currently caught by the next-intl middleware and 307-redirected to `/fr/...`; `/fr/opengraph-image` returns 404, so the current `og:image` (also on the wrong domain) is broken. The `middleware.ts` matcher must exclude these paths. (2) `www.geckocabanerestaurant.com` is NOT a project domain: Vercel's automatic fallback answers with a 307 (temporary) to the apex; D-02 requires an explicit 301, which means adding `www` to the project with `redirect` + `redirectStatusCode: 301`. (3) The next-intl middleware emits a `Link:` hreflang header whose `x-default` points to `/` (a redirect) while the HTML will say `/fr`; with `alternateLinks: false` the conflict disappears. The root `/` answers 307 (not 308) with a `NEXT_LOCALE` cookie; a `next.config.ts` `redirects()` entry (`permanent: true`, evaluated before middleware) gives the 308 asked by D-02. (4) Pages are already fully dynamic (`Cache-Control: private, no-store`; root layout uses `getLocale()`), so there is no static/ISR property to protect; the opening-hours query should still use a cookie-free anon client wrapped in `unstable_cache` (tag + 1 h revalidate).

Hard-coded French inventory: about 45 literals in 7 files under `src/app/[locale]/` and `src/components/` (details below), roughly 35 to 40 new message keys per language plus country names (29) that can be produced by `Intl.DisplayNames` with zero keys. A source-scan test with an `i18n-ignore` marker for legitimate French (dish names, stored enum values) is the recommended guard. All `gecko-cabane.com` references in code are in 2 files (6 lines); docs under `.planning/` mention it only as history/requirements.

Domain/DNS: `geckocabanerestaurant.com` is registered at Vercel with Vercel nameservers, so the GSC TXT record can be added with `vercel dns add geckocabanerestaurant.com '@' TXT 'google-site-verification=...'` (CLI 59.24.0 is installed and authenticated). The token itself can only be obtained from the Search Console UI (Add property > Domain), which is the one owner-touching step; Bing is best done through "Import from Google Search Console" which needs the owner's Google + Microsoft sign-in.

**Primary recommendation:** Build a single pure helper module `src/utils/seo.ts` (SITE_URL constant, `buildPageMetadata`, `buildRestaurantJsonLd`, `mapOpeningHours`) used by `generateMetadata`, JSON-LD, sitemap and robots, fix the middleware matcher and `alternateLinks`/root redirect first, and cover everything with vitest source/pure-function tests.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Domaine et redirections (SEO-01)**
- **D-01:** `https://geckocabanerestaurant.com` est le seul domaine canonique. **`gecko-cabane.com` n'appartient pas à l'utilisateur** (absent de son compte Vercel, « n'existe pas / pas à moi ») : aucune redirection 301 n'est possible. SEO-01 est donc réinterprété : **supprimer toute référence à `gecko-cabane.com`** dans le code (metadataBase, canonical, openGraph.url, JSON-LD url/image/menu, placeholder `admin@gecko-cabane.com` du formulaire de login, docs).
- **D-02:** `www.geckocabanerestaurant.com` → apex en **301** (configuration du domaine Vercel). La racine `/` → `/fr` en **308** via le middleware next-intl existant (langue par défaut, pas de détection Accept-Language). `x-default` pointe vers `/fr`.
- **D-03:** Canonical **auto-référent** par page et par langue : `https://geckocabanerestaurant.com/{locale}/…` (jamais `/` générique comme aujourd'hui).

**Schema Restaurant (SEO-02, SEO-03)**
- **D-04:** Le JSON-LD est rendu par un **Server Component** (par langue), plus dans le layout racine statique. `description` dans la langue de la page.
- **D-05:** `openingHoursSpecification` **généré depuis `gecko_opening_hours`** (aujourd'hui faux : 11h-23h tous les jours sauf mardi ; réel 12h-22h, fermé le mardi, modifiable par l'admin). Pas de `gecko_special_hours` dans le schema.
- **D-06:** `geo` = **lat 8.0615, lon 98.9157** (valeurs de REQUIREMENTS SEO-02, remplacent 8.0863 / 98.9063 actuels). `url` et `image` sur le domaine principal.
- **D-07:** **`aggregateRating` retiré** (4.8 / 150 est inventé ; règle du projet : seulement avec de vrais avis affichés, phase 5). `priceRange: ฿฿` (remplace `$$`), `acceptsReservations: true`, `paymentAccepted`, `currenciesAccepted: THB`.
- **D-08:** **`hasMenu` / `menu` retirés en phase 2** (la page `/menu` n'existe qu'en phase 3, ne pas lier une 404) ; la phase 3 les réintroduit (SEO-03 sera complété à ce moment — à noter dans le plan et dans la traçabilité).
- **D-09:** `sameAs` (Google Maps, TripAdvisor, Facebook, Instagram) : **Claude cherche les URLs officielles et les soumet à l'utilisateur pour validation** ; aucune URL n'est mise en ligne sans accord. Seuls les profils vérifiés entrent dans le schema.

**Metadata par langue et /en (SEO-04)**
- **D-10:** `generateMetadata` dans `[locale]/layout.tsx` et chaque page, textes dans un namespace **`meta`** de `messages/fr.json` / `en.json` (parité testée). Le layout racine ne garde que les valeurs communes (icons, robots, metadataBase, formatDetection).
- **D-11:** Titles accueil : EN **« Gecko Cabane – French-Thai Restaurant in Krabi Town »** (imposé PAGE-01) ; FR **« Gecko Cabane – Restaurant franco-thaï à Krabi Town »**. Meta description ~150 caractères par langue (cheffe Jariya, 40 couverts, Maharat Road, réservation en ligne). `og:locale` `fr_FR` / `en_US` avec `og:locale:alternate` pour l'autre langue ; twitter card dans la langue ; `<html lang>` = locale.
- **D-12:** **Portée « /en 100 % anglais » = tous les textes visibles en dur** de `src/app/[locale]/` et `src/components/` migrés vers next-intl (titres « Notre Histoire », « Notre Cuisine », « La Carte », « Nos Créations », alt d'images, aria-label), hors noms de plats. Un **test** garantit qu'aucun texte français accentué en dur ne subsiste dans ces dossiers. Titres EN : Our Story / Our Cuisine / The Menu / Our Creations.
- **D-13:** hreflang : `fr`, `en` et `x-default` (→ `/fr`) sur chaque page ; **pas de `de`** tant que `/de` n'est pas publié (jamais vers une page inexistante).

**Sitemap, robots, Search Console (SEO-05, SEO-06, SEO-07)**
- **D-14:** `src/app/sitemap.ts` liste **uniquement les pages publiées** : `/fr`, `/en`, `/fr/privacy`, `/en/privacy`, chacune avec `alternates.languages` (fr, en). `src/app/robots.ts` : `allow /`, `disallow /admin /api /auth /monitoring`, ligne `Sitemap: https://geckocabanerestaurant.com/sitemap.xml`. Les pages futures s'ajoutent à leur phase (pas d'URL prévisionnelle).
- **D-15:** **Propriété de domaine Google Search Console** vérifiée par **enregistrement TXT DNS posé via Vercel DNS** (action approuvée par l'utilisateur : « j'approuve tes actions »), sitemap soumis avec l'outil GSC connecté (`mcp__gsc__*`). **Bing Webmaster** : import du site depuis GSC ; l'étape de validation dans l'interface Bing relève de l'utilisateur si une connexion est requise.

### Claude's Discretion
- og:image par langue (`opengraph-image.tsx` existant), manifest `lang`, `noindex` des pages d'erreur/admin, structure des helpers SEO (`src/utils/seo.ts`), tests (parité meta, absence de `gecko-cabane.com`, sitemap, schema valide sans `aggregateRating`), choix des textes de meta description.

### Deferred Ideas (OUT OF SCOPE)
- `hasMenu`/`menu` du schema — phase 3 (page `/menu`).
- `aggregateRating` — phase 5 (avis réels affichés).
- Hreflang `de`/`sv` et pages DE/SV — phase 6.
- Redirection 301 de `gecko-cabane.com` — impossible (domaine non contrôlé) ; à rouvrir si l'utilisateur en acquiert la propriété.
- Fermetures exceptionnelles (`gecko_special_hours`) dans le schema, BreadcrumbList.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEO-01 | Canonical auto-référent `https://geckocabanerestaurant.com/{locale}/…` ; (301 gecko-cabane.com reinterpreted per D-01 = remove all references) | `buildPageMetadata` helper with absolute URLs; full reference list of `gecko-cabane.com` (6 code lines); www 301 procedure; root 308 via `next.config.ts` |
| SEO-02 | Schema `geo` (8.0615, 98.9157), `url`/`image` on main domain; Rich Results Test without error | `buildRestaurantJsonLd`; note Google asks for >= 5 decimals of precision (Open Question 1); validation via validator.schema.org + RRT after deploy |
| SEO-03 | Schema has `hasMenu` (deferred to phase 3 per D-08), `acceptsReservations`, `sameAs`, `paymentAccepted`, `currenciesAccepted`, `priceRange` | Property list + sameAs candidates found in `page.tsx`; traceability note: SEO-03 stays "partial" until phase 3 |
| SEO-04 | `/en` 100 % English (title, description, `og:locale`, schema description, headings) | `meta` namespace + hard-coded string inventory (~45 literals) + source-scan test |
| SEO-05 | hreflang fr/en/x-default on each page | `alternates.languages` via helper; disable next-intl `Link:` header duplicate (`alternateLinks: false`) |
| SEO-06 | `sitemap.xml` lists all pages, `robots.txt` declares it | `sitemap.ts`/`robots.ts` code; middleware matcher fix (currently 307s to `/fr/sitemap.xml`) |
| SEO-07 | Domain verified in GSC and Bing, sitemap submitted | `vercel dns add ... TXT`, GSC MCP flow, Bing import; owner actions listed |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Next.js 16 App Router, TS strict, Tailwind v4, Supabase, next-intl: no migration. Do not change the stack.
- Every visible string in `src/app/[locale]/` goes through `useTranslations()`/`getTranslations()`; keys in BOTH `messages/fr.json` and `messages/en.json` (enforced by `tests/i18n.test.ts`). Admin (`src/app/admin/`) is fixed French, no i18n.
- Server code uses `createClient` (cookie-bound) from `src/utils/supabase/server.ts`; service-role key never client-side; `createAdminClient` only with a justifying comment. (For JSON-LD hours a cookie-free anon client is used, see Pattern 3.)
- Components with hooks/events start with `'use client'`; prefer Server Components for data fetches.
- API routes: validate input, `{ error: string }` responses, no stack traces.
- Code style: 2-space indent, single quotes, no semicolons (except existing layout.tsx which uses semicolons and double quotes; new code follows the no-semicolon convention), no trailing whitespace on blank lines.
- Tests: `tests/<kebab-topic>.test.ts`, vitest node env, `npm run build` runs `vitest run` first (a failing test blocks deploy).
- Tailwind v4 syntax rules (not relevant to this phase unless touching classes).
- Project rule (PROJECT.md): nothing unverifiable in the schema; anything published/sent to a third party (sameAs URLs, GSC/Bing submission, DNS change) needs owner agreement. DNS TXT + sitemap submission were pre-approved in D-15; `sameAs` URLs were NOT (D-09).
- GSD workflow: file edits happen through a GSD command (execute-phase).
- Commands are run through `rtk` in this environment (user global instruction).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Per-locale `<title>`, description, canonical, hreflang, OG/Twitter | Frontend Server (SSR, `generateMetadata`) | — | Must be in initial HTML for bots; params is a Promise, translations via `getTranslations({locale, namespace})` |
| JSON-LD Restaurant | Frontend Server (Server Component) | Database (opening hours read) | Rendered into HTML; hours come from `gecko_opening_hours` |
| Opening hours read for schema | Database / Storage (RLS public read) | Frontend Server (cached fetch) | Anon client, no cookies, `unstable_cache` tag `opening-hours` |
| Cache invalidation on admin hours edit | API / Backend (`PUT /api/hours`) | — | Route handler calls `revalidateTag('opening-hours','max')` after successful update |
| sitemap.xml / robots.txt | Frontend Server (file-convention route handlers) | CDN (cached output) | Pure functions; must bypass middleware |
| `/` -> `/fr` 308, www -> apex 301 | CDN / Edge (Vercel domain redirect, `next.config.ts` redirects) | Middleware (next-intl for other cases) | Redirects evaluated before middleware; domain redirect is Vercel project config |
| Locale routing / matcher exclusions | Middleware (`src/middleware.ts`) | — | Matcher must exclude metadata files |
| Hard-coded string migration | Frontend Server + Browser (client components via `useTranslations`) | — | Messages already supplied by `NextIntlClientProvider` in `[locale]/layout.tsx` |
| GSC/Bing verification + sitemap submission | External (Google/Bing, Vercel DNS) | Owner | DNS TXT via Vercel DNS CLI; token + Bing sign-in need the owner |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 (installed) | Metadata API (`generateMetadata`, `sitemap.ts`, `robots.ts`), `unstable_cache`, `revalidateTag` | Already in project [VERIFIED: package.json] |
| next-intl | ^4.8.3 (installed) | `getTranslations({locale, namespace})`, middleware, `alternateLinks` option | Already in project [VERIFIED: package.json] |
| @supabase/supabase-js | ^2.98.0 (installed) | Cookie-free anon client for public hours read | Already in project |
| vitest | ^4.1.0 (installed) | Source-scan and pure-function tests | Already in project |

### Supporting
None. No new npm package is needed. (`schema-dts` types for JSON-LD is optional and NOT recommended: a local `type JsonLd = Record<string, unknown>` is sufficient and avoids a dependency.)

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `unstable_cache` | `'use cache'` + Cache Components | Would require enabling `cacheComponents` globally, a much larger change with React Compiler/dynamic pages; docs say `unstable_cache` is replaced by `use cache` in 16 but it still works [CITED: nextjs.org/docs/app/api-reference/functions/unstable_cache]. Keep `unstable_cache`. |
| next-intl `getPathname` in sitemap | Plain string concat `${SITE_URL}/${locale}${path}` | `localePrefix: 'always'` and no `pathnames` config, so concat is exact and testable without importing next-intl in vitest |
| `middleware.ts` | `proxy.ts` | `middleware` is deprecated/renamed in 16 but still works [CITED: nextjs.org/docs/app/api-reference/file-conventions/proxy]. Do NOT rename in this phase (out of scope, risk to the admin guard). |

**Installation:** none.

**Version verification:** versions read from `package.json` / `node_modules` (next 16.1.6, next-intl ^4.8.3). No registry lookups needed since nothing is added.

## Package Legitimacy Audit

No external packages are installed by this phase. slopcheck not run (nothing to check).

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| (none) | — | — | — | — | — | — |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
Browser / Googlebot / Bingbot
        |
        v
 [Vercel edge]
   |-- www.geckocabanerestaurant.com --301--> geckocabanerestaurant.com   (project domain redirect, D-02)
   |-- next.config redirects: "/" --308--> "/fr"                          (runs BEFORE middleware)
   v
 [src/middleware.ts]  matcher EXCLUDES: _next/static, _next/image, favicon, manifest.webmanifest,
   |                    sitemap.xml, robots.txt, opengraph-image, monitoring, image extensions
   |-- /admin, /api, /auth  -> Supabase session/guard (unchanged)
   |-- /fr..., /en...       -> next-intl (alternateLinks:false, localeDetection:false)
   v
 [Next route handlers]                         [Next pages]
   sitemap.ts  (SITE_URL, 4 URLs + alternates)   [locale]/layout.tsx  generateMetadata (defaults only)
   robots.ts   (rules + Sitemap line)            [locale]/page.tsx    generateMetadata (full) + <RestaurantJsonLd/>
   [locale]/opengraph-image.tsx                  [locale]/privacy/page.tsx generateMetadata (full)
        ^                                              |
        |                                              v
   src/utils/seo.ts  (SITE_URL, localeUrl(), buildPageMetadata(), buildRestaurantJsonLd(), mapOpeningHours())
                                                       |
                                                       v
                          getOpeningHours() = unstable_cache(anon supabase-js -> gecko_opening_hours, tag 'opening-hours', 3600s)
                                                       ^
                          PUT /api/hours --revalidateTag('opening-hours','max')-- (admin edit)

 One-shot ops (not runtime): vercel dns add TXT -> GSC domain property -> mcp__gsc__submit_sitemap ; Bing "Import from GSC" (owner)
```

### Recommended Project Structure
```
src/
├── utils/seo.ts                   # SITE_URL, localeUrl, buildPageMetadata, buildRestaurantJsonLd, mapOpeningHours (pure, no next imports at runtime)
├── utils/opening-hours.ts         # getOpeningHours(): unstable_cache + anon client (server only)
├── components/RestaurantJsonLd.tsx# async Server Component: fetch hours + t -> <script type="application/ld+json">
├── app/sitemap.ts
├── app/robots.ts
├── app/[locale]/opengraph-image.tsx   # moved from src/app/opengraph-image.tsx (locale-aware tagline)
├── app/admin/layout.tsx           # NEW server layout: metadata robots noindex (admin pages are 'use client')
└── app/layout.tsx                 # slimmed: fonts, icons, robots, metadataBase, formatDetection; no JSON-LD, no alternates/openGraph
tests/
├── seo-no-legacy-domain.test.ts
├── seo-metadata.test.ts
├── seo-jsonld.test.ts
├── seo-sitemap-robots.test.ts
├── middleware-matcher.test.ts
└── i18n-hardcoded.test.ts
```

### Pattern 1: Metadata helper + per-page generateMetadata (metadata merging is SHALLOW)
**What:** `openGraph`, `alternates`, `twitter` set by a page REPLACE (not merge with) those set by the layout [CITED: nextjs.org/docs/app/api-reference/functions/generate-metadata#merging]. So each page must return the complete object; the layout must NOT define `alternates` at all (otherwise a page that forgets to set it inherits the home canonical).
**When to use:** home page and privacy page now; future pages (menu, review) in later phases.
**Example:**
```ts
// src/utils/seo.ts  (pure, no runtime next import)
import type { Metadata } from 'next'

export const SITE_URL = 'https://geckocabanerestaurant.com'
export const OG_LOCALE = { fr: 'fr_FR', en: 'en_US' } as const
type L = 'fr' | 'en'
const LOCALES: readonly L[] = ['fr', 'en']

/** Absolute URL for a locale + path ('' for home, '/privacy' for privacy). */
export function localeUrl(locale: L, path = ''): string {
  return `${SITE_URL}/${locale}${path}`
}

export function buildPageMetadata(args: {
  locale: L
  path?: string
  title: string
  description: string
  absoluteTitle?: boolean
}): Metadata {
  const { locale, path = '', title, description, absoluteTitle } = args
  const other = LOCALES.find((l) => l !== locale)!
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: localeUrl(locale, path),
      languages: {
        fr: localeUrl('fr', path),
        en: localeUrl('en', path),
        'x-default': localeUrl('fr', path),
      },
    },
    openGraph: {
      title, description, type: 'website', siteName: 'Gecko Cabane',
      url: localeUrl(locale, path),
      locale: OG_LOCALE[locale],
      alternateLocale: [OG_LOCALE[other]],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}
```
```ts
// src/app/[locale]/page.tsx
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return buildPageMetadata({ locale: locale as 'fr' | 'en', title: t('homeTitle'), description: t('homeDescription'), absoluteTitle: true })
}
```
`alternateLocale` is a supported OpenGraph field [VERIFIED: node_modules/next/dist/lib/metadata/types/opengraph-types.d.ts line 14] and `Languages` accepts the `x-default` key [VERIFIED: alternative-urls-types.d.ts]. Absolute URLs are used so `metadataBase` (kept in root layout as `new URL(SITE_URL)`) only matters for relative leftovers such as icons.
Notes: use `title.absolute` for the home title (root `title.template` `'%s | Gecko Cabane Restaurant'` would otherwise be appended and break the imposed PAGE-01 EN title). Privacy keeps its `metaTitle` and may use the template, or `absolute` for consistency.

### Pattern 2: Locale layout holds only defaults
`[locale]/layout.tsx` `generateMetadata` returns `{ title: { default: t('homeTitle'), template: '%s | Gecko Cabane' }, description, openGraph: { siteName, locale, alternateLocale } }` and NO `alternates`. Root `layout.tsx` keeps only: `metadataBase`, `icons`, `formatDetection`, `robots` (with googleBot), `authors/creator/publisher`, `category`. Remove `keywords` (ignored by Google; French-only) or move to meta; remove `title`/`description`/`openGraph`/`twitter`/`alternates`. D-10 satisfied.

### Pattern 3: JSON-LD as Server Component with cached anon hours read
```ts
// src/utils/opening-hours.ts  (server only)
import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

export const OPENING_HOURS_TAG = 'opening-hours'

export const getOpeningHours = unstable_cache(
  async () => {
    // Cookie-free anon client: RLS "Public read gecko_opening_hours" allows select (migration 007).
    // NOT createClient() from utils/supabase/server (reads cookies(), unsupported inside a cache scope).
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const { data, error } = await supabase
      .from('gecko_opening_hours')
      .select('day_of_week, is_open, open_time, close_time')
      .order('day_of_week')
    if (error) throw error   // do not cache failures; caller falls back (omit openingHoursSpecification)
    return data
  },
  ['gecko-opening-hours'],
  { tags: [OPENING_HOURS_TAG], revalidate: 3600 }
)
```
Cookies/headers inside a cache scope are unsupported [CITED: nextjs.org/docs/app/api-reference/functions/unstable_cache]. Admin edit: in `PUT /api/hours` after a successful loop call `revalidateTag(OPENING_HOURS_TAG, 'max')`; the single-argument form is deprecated in Next 16 [CITED: nextjs.org/docs/app/api-reference/functions/revalidateTag]. If the fetch fails, the component must still render the schema WITHOUT `openingHoursSpecification` (never a wrong hardcoded one) and report to Sentry (`Sentry.captureException`) as the other routes do.

Render the component in `[locale]/page.tsx` (home only; Restaurant schema belongs on the entity's home page, not on privacy). Serialize safely:
```tsx
const json = JSON.stringify(jsonLd).replace(/</g, '\\u003c')
return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
```

### Pattern 4: opening hours -> OpeningHoursSpecification
DB: `day_of_week` 0 = Sunday ... 6 = Saturday, `is_open`, `open_time`/`close_time` (`HH:MM[:SS]`, nullable) [VERIFIED: src/types/database.ts, migration 007]. Google format: `dayOfWeek`, `opens`/`closes` as hh:mm(:ss); multiple ranges = separate objects; "closed all day" can be expressed as 00:00-00:00, closing after midnight in one object [CITED: developers.google.com/search/docs/appearance/structured-data/local-business].
```ts
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] as const
export function mapOpeningHours(rows: { day_of_week: number; is_open: boolean | null; open_time: string | null; close_time: string | null }[]) {
  const groups = new Map<string, string[]>()           // "12:00|22:00" -> ['Monday', ...]
  for (const r of rows) {
    if (!r.is_open || !r.open_time || !r.close_time) continue   // closed day: omit (Tuesday)
    const key = `${r.open_time.slice(0, 5)}|${r.close_time.slice(0, 5)}`
    groups.set(key, [...(groups.get(key) ?? []), DAYS[r.day_of_week]])
  }
  return [...groups].map(([k, days]) => {
    const [opens, closes] = k.split('|')
    return { '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens, closes }
  })
}
```
Omitting closed days is the standard way to say "not open that day" (decision: omit; the 00:00-00:00 form is valid but redundant) [ASSUMED]. Keep rows sorted by `day_of_week` so output is deterministic (tests). Sunday-first ordering in the array is fine for schema.org.

### Pattern 5: Restaurant JSON-LD content
Required by Google: `name`, `address`. Recommended: `geo` (>= 5 decimals), `openingHoursSpecification`, `priceRange`, `servesCuisine`, `telephone`, `url`, `menu` (deferred), `aggregateRating` only with real on-page reviews [CITED: developers.google.com/search/docs/appearance/structured-data/local-business].
Target object (EN/FR differ only in `description` and `amenityFeature.name`):
```ts
{
  '@context': 'https://schema.org', '@type': 'Restaurant',
  '@id': `${SITE_URL}/#restaurant`,
  name: 'Gecko Cabane', url: localeUrl(locale),
  image: [`${SITE_URL}/exterior-sign.jpg`, `${SITE_URL}/chef-jariya.jpg`, /* + food-*.jpg */],
  description: t('schemaDescription'),
  telephone: '+66819585945',
  address: { '@type': 'PostalAddress', streetAddress: '1/36-37 Soi Ruamjit, Maharat Road', addressLocality: 'Krabi Town', postalCode: '81000', addressCountry: 'TH' },
  geo: { '@type': 'GeoCoordinates', latitude: 8.0615, longitude: 98.9157 },
  openingHoursSpecification: mapOpeningHours(rows),
  servesCuisine: ['French', 'Thai', 'Fusion'],
  priceRange: '฿฿', acceptsReservations: true,
  paymentAccepted: 'Cash, Credit Card', currenciesAccepted: 'THB',
  // sameAs: only owner-validated URLs (D-09)
}
```
Rules: NO `aggregateRating`, NO `hasMenu`/`menu`. `name` currently "Gecko Cabane Restaurant" in JSON-LD; recommend the brand `Gecko Cabane` (matches H1 and titles) [ASSUMED, planner may keep the current name]. `amenityFeature`: existing list is French-only and includes unverifiable items ("Bar complet", "Chaises hautes"); only keep amenities that the site already publishes in the `services` messages (`freeWifi`, `cardsAccepted`, `tableService`, `streetParking`, `vegetarian`, `glutenFree`, `highChairs`, `fullBar`) and localize their names via `getTranslations('services')`; or drop `amenityFeature` entirely (safest, and not required). Recommendation: drop it unless the owner confirms; Google does not use it for Restaurant rich results. Markup must match visible content: the visible footer text "Ouvert de 11h à 23h / Open from 11am to 11pm" (`footer.openHours` in both message files, rendered in `page.tsx:702`) contradicts the real 12:00-22:00 hours, so the plan must fix or remove that string (see Pitfall 7).
Image: Google wants crawlable images, multiple ratios, >= 50K px [CITED: local-business doc, restaurant carousel section]; use real photos from `public/` (all referenced in `page.tsx`) rather than the generated OG image; `exterior-sign.jpg` is 4:5, so also include a landscape one (`hero-bg.jpg`) [ASSUMED file suitability, planner to check].

### Pattern 6: sitemap.ts and robots.ts
```ts
// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { localeUrl } from '@/utils/seo'
const PAGES = ['', '/privacy'] as const
export default function sitemap(): MetadataRoute.Sitemap {
  return (['fr', 'en'] as const).flatMap((locale) =>
    PAGES.map((path) => ({
      url: localeUrl(locale, path),
      lastModified: BUILD_DATE,                // constant per deploy, not new Date() on every call if cached; see Pitfall
      alternates: { languages: { fr: localeUrl('fr', path), en: localeUrl('en', path) } },
    })))
}
```
`alternates.languages` generates `xhtml:link` entries [CITED: nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap]. Sitemap hreflang should list all alternates including self; `x-default` is optional in sitemaps (include `'x-default': fr url` for parity with HTML; Next accepts the `Languages` type) [ASSUMED for sitemap acceptance, harmless]. `sitemap.ts` is a cached route handler by default [CITED: same page]. Omit `changeFrequency`/`priority` (ignored by Google). For `lastModified`, either omit it or use a module-level constant; do not fabricate dates.
```ts
// src/app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/auth', '/monitoring'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
```
Output format `User-Agent: *`, `Allow: /`, `Disallow: ...`, `Sitemap: ...` [CITED: nextjs.org/docs/app/api-reference/file-conventions/metadata/robots]. `/_next/` need not be disallowed (Google must fetch CSS/JS). Disallow in robots does not de-index: also add `robots: { index: false, follow: false }` to a new `src/app/admin/layout.tsx` (server component wrapper; admin pages are client pages and cannot export metadata) and to `error.tsx`/`not-found.tsx` where applicable (not-found already returns 404).

### Pattern 7: middleware fixes
1. Matcher: add exclusions `sitemap\\.xml|robots\\.txt|opengraph-image` (and keep `manifest\\.webmanifest`). If the OG image moves to `[locale]/opengraph-image.tsx` its URL is `/fr/opengraph-image`, which already carries a locale prefix and passes through next-intl untouched, so the `opengraph-image` exclusion is then optional but harmless (keep it for safety). Proven bug today: `curl -I https://geckocabanerestaurant.com/sitemap.xml` -> 307 `/fr/sitemap.xml`; `/opengraph-image` -> 307 `/fr/opengraph-image` -> 404 [VERIFIED: live curl 2026-10-16].
2. `createIntlMiddleware({ ..., localeDetection: false, alternateLinks: false })`. `localeDetection: false` implements "pas de détection Accept-Language" (D-02) [CITED: next-intl routing config; option present in installed types]. `alternateLinks: false` removes the `Link: <...>; rel="alternate"` header whose `x-default` points at `/` [VERIFIED: live response header + node_modules getAlternateLinksHeaderValue.js], avoiding conflict with the HTML `x-default` -> `/fr`.
3. Root redirect to 308: next-intl issues 307 (`/` -> `/fr`, live-verified, plus a `NEXT_LOCALE` cookie). `next.config.ts` redirects run before middleware [CITED: nextjs.org proxy "Execution order"], so add:
```ts
async redirects() { return [{ source: '/', destination: '/fr', permanent: true }] }   // 308
```
Caveat: permanent redirects are cached by browsers; acceptable per D-02. Do not apply to `/en`.
4. Add a unit test that evaluates the matcher regex (see Validation Architecture).

### Pattern 8: Locale-aware OG image
Move `src/app/opengraph-image.tsx` to `src/app/[locale]/opengraph-image.tsx`; `export default async function Image({ params }: { params: Promise<{ locale: string }> })`; tagline map `{ fr: 'Restaurant Franco-Thaï', en: 'French-Thai Restaurant' }` in the file (edge runtime, do not import next-intl). `alt` export is static (keep English-neutral "Gecko Cabane Restaurant, Krabi"). File-based image has higher priority than metadata `openGraph.images` and is added automatically [CITED: generate-metadata "Good to know"], so `buildPageMetadata` omits images. The `twitter:image` is also generated from `twitter-image`/opengraph file if present [ASSUMED]; verify rendered HTML after build.

### Anti-Patterns to Avoid
- **Setting `alternates`/`canonical` in the locale layout:** child pages inherit it (wrong canonical on privacy). Only pages set it.
- **Relative canonical/hreflang:** works with metadataBase but D-03 and tests are simpler and safer with absolute URLs from `SITE_URL`.
- **Hardcoding hours in JSON-LD** or using `createClient()` from `utils/supabase/server.ts` inside `unstable_cache` (cookies not allowed).
- **`revalidateTag('x')` single-arg:** deprecated in 16, use `revalidateTag(tag, 'max')`.
- **Linking `hasMenu`/`menu` to `/menu` before phase 3**, or any `de`/`sv` hreflang.
- **`dangerouslySetInnerHTML` JSON without escaping `<`.**

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| sitemap XML / robots txt | String-concatenated XML in a route handler | `app/sitemap.ts`, `app/robots.ts` (MetadataRoute) | Correct escaping, `xhtml:link` alternates, caching handled |
| hreflang / canonical tags | Manual `<link>` in layouts | `metadata.alternates` | Dedup/merging handled by Next |
| Locale routing | Custom redirect logic | next-intl middleware | Already in place; just adjust options |
| Country names in 2 languages | Hard-coded "Allemagne / Germany" table | `new Intl.DisplayNames(locale, { type: 'region' })` | Zero message keys, always correct per locale |
| Cache with invalidation | Module-level variables / manual TTL | `unstable_cache` + `revalidateTag` | Survives across serverless instances |
| DNS TXT / domain redirect | Manual dashboard clicking where scriptable | `vercel dns add`, Vercel project-domain API/MCP | Reproducible, loggable |
| JSON-LD types | New dependency | Plain typed object + unit test | Only one schema in the project |

**Key insight:** every SEO signal in this phase can be generated from one constant (`SITE_URL`) and one locale list, so tests can assert the whole surface (canonical, hreflang, sitemap, schema) from pure functions and grep.

## Runtime State Inventory

> This is not a rename/refactor migration phase, but the `gecko-cabane.com` removal and the move of `opengraph-image.tsx` touch deployed state, so the five categories are answered explicitly.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None. `gecko-cabane.com` does not appear in Supabase tables per the code reviewed; the privacy/footers already use `geckocabanerestaurant@gmail.com` (phase 1 fix 10a0e21). Not exhaustively queried in the DB (no `SELECT` run). | Code edit only. Optional: owner/plan task `grep` messages for `gecko-cabane.com` (none found). |
| Live service config | Vercel project `gecko-cabane-restaurant`: domains = `geckocabanerestaurant.com` (no redirect) and `gecko-cabane-restaurant.vercel.app` (serves content, redirect null) [VERIFIED: Vercel API]. `www` NOT attached. Sentry project slug `gecko-cabane` (no `.com`, untouched). | Add `www` domain with 301 redirect. Decide on vercel.app host (Open Question 3). |
| OS-registered state | None — verified: no scheduled tasks reference the domain in this repo. | None |
| Secrets/env vars | None reference `gecko-cabane.com` (env var names unchanged). `RESEND_FROM_EMAIL` uses the correct domain per CONTEXT. | None |
| Build artifacts | Stale `.next/` locally only; Vercel rebuilds. Cached OG image path `/opengraph-image` changes to `/{locale}/opengraph-image`; social platforms (Facebook/WhatsApp) cache old OG scrapes. | Optionally re-scrape via sharing debugger after deploy (owner action, low priority). |

## Common Pitfalls

### Pitfall 1: Middleware swallows metadata routes
**What goes wrong:** `/sitemap.xml`, `/robots.txt`, `/opengraph-image` 307 to `/fr/...` (404 for og image, redirect for the others). GSC reports "sitemap could not be read" / redirect.
**Why:** matcher only excludes static extensions, `manifest.webmanifest`, `monitoring`.
**How to avoid:** add exclusions; test matcher; post-deploy `curl -I` check (status 200, `content-type`).
**Warning signs:** `Location: /fr/sitemap.xml`.

### Pitfall 2: Shallow metadata merge
Page-level `openGraph` wipes layout `openGraph.siteName/locale`. The helper must include all openGraph fields every time. Test: for each page, resolved metadata has `openGraph.locale` and `alternates.canonical`.

### Pitfall 3: Title template double-suffix
Home title with root template -> "Gecko Cabane – French-Thai Restaurant in Krabi Town | Gecko Cabane Restaurant". Use `title.absolute` on home.

### Pitfall 4: Conflicting x-default (HTTP header vs HTML)
Fix via `alternateLinks: false` (see Pattern 7). Also next-intl builds header URLs from the request host (www vs apex), another reason to turn it off.

### Pitfall 5: Hours caching vs admin edits
Without `revalidateTag` in `PUT /api/hours`, schema hours lag up to 1 h. Add the tag call (only after success). Also `PUT` must not call `revalidateTag` inside the cached function (unsupported).

### Pitfall 6: Schema/visible-content mismatch
Google requires markup to reflect visible content. Footer says 11:00-23:00 (`messages/*.json footer.openHours`), `HoursDisplay` shows DB hours, `about.kitchenClose` says 22:00. Fix `footer.openHours` (FR+EN) to match the real 12:00-22:00 or derive it from the same DB data; owner to confirm real hours (D-05 states 12h-22h, closed Tuesday).

### Pitfall 7: Google geo precision
Google asks for >= 5 decimal places [CITED: local-business doc]; D-06's 8.0615 / 98.9157 have 4. Not a validation error in practice (precision guideline) but see Open Question 1.

### Pitfall 8: Rich Results Test scope
Google's Rich Results Test mainly reports eligible rich-result types; plain `Restaurant` may be detected under local business/"Merchant" items or only as "no items detected" [ASSUMED]. Validate also with validator.schema.org (accepts pasted code before deploy). Record both outcomes in the verification doc.

### Pitfall 9: Source-scan test false positives
See i18n test section. Without an escape marker the test fails on dish names, DB-stored occasion values, comments, and on `messages` imports.

### Pitfall 10: `vercel api` path under Git Bash on Windows
MSYS rewrites `/v9/...` into a Windows path. Prefix with `MSYS_NO_PATHCONV=1` [VERIFIED: reproduced in this session].

### Pitfall 11: Permanent root redirect caching
`permanent: true` on `/` is cached by browsers/CDNs. Fine because root will never change language, but do not later reuse `/` for a language picker without remembering this.

## Code Examples

### Middleware matcher (target)
```ts
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|sitemap\\.xml|robots\\.txt|opengraph-image|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```
Source for negative-lookahead pattern: [CITED: nextjs.org/docs/app/api-reference/file-conventions/proxy#negative-matching].

### next.config.ts addition
```ts
const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [{ source: '/', destination: '/fr', permanent: true }]
  },
}
```

### Vercel domain + DNS operations (executed during the phase, not by app code)
```bash
# 1. www -> apex 301. Add the domain to the project (DNS wildcard '*' ALIAS already resolves; domain uses Vercel NS so it verifies automatically)
vercel domains add www.geckocabanerestaurant.com gecko-cabane-restaurant
# 2. Set the redirect (PATCH /v9/projects/{id}/domains/{domain}; body redirect + redirectStatusCode in {301,302,307,308})
MSYS_NO_PATHCONV=1 vercel api "/v9/projects/prj_h3Iz5JTpoyxi0xs1az4YfMFEk29v/domains/www.geckocabanerestaurant.com?teamId=team_kJW8oncQ0LSN47Cmq52Mm3Sj" -X PATCH --input body.json   # flags: check `vercel api --help`; fallback: Vercel MCP domain tools or dashboard Settings > Domains > Edit www > Redirect to apex (permanent)
#    body.json: {"redirect":"geckocabanerestaurant.com","redirectStatusCode":301}
# 3. Verify
curl -sI https://www.geckocabanerestaurant.com/fr   # expect 301 + Location: https://geckocabanerestaurant.com/fr (path preserved: check)
# 4. GSC TXT (token from Search Console UI: Add property > Domain)
vercel dns add geckocabanerestaurant.com '@' TXT 'google-site-verification=<TOKEN>'
vercel dns ls geckocabanerestaurant.com | grep google-site-verification
```
PATCH body schema and status code enum [CITED: vercel.com/docs/rest-api/projects/update-a-project-domain]; `vercel dns add [domain] [subdomain] TXT [value]` [CITED: vercel.com/docs/cli/dns]; the `vercel api` flag names (`-X`, `--input`) are [ASSUMED], check `vercel api --help` first. Current DNS (live, `vercel dns ls`): only Resend DKIM/SPF/MX records, `admin` CNAME, wildcard ALIAS; NO apex TXT yet, so no conflict. Keep the TXT record after verification (removal loses ownership) [CITED: support.google.com/webmasters/answer/9008080].

### Search Console flow (D-15)
1. Deploy phase code (sitemap must return 200 first).
2. Owner (or Claude with owner present): Search Console > Add property > **Domain** `geckocabanerestaurant.com` > copy the `google-site-verification=...` TXT value. The token is not obtainable through the three listed MCP tools [ASSUMED: tools are `list_sites`, `list_sitemaps`, `submit_sitemap`, `search_analytics_query` per CONTEXT/prompt; their exact parameter names could not be inspected in this session].
3. Claude: `vercel dns add ...` (approved in D-15), wait for propagation (Vercel DNS is authoritative; typically minutes, Google may take up to days to re-check [CITED: support.google.com/webmasters/answer/9008080]), owner clicks Verify.
4. `mcp__gsc__list_sites` should now show `sc-domain:geckocabanerestaurant.com`; then `mcp__gsc__submit_sitemap` with site `sc-domain:geckocabanerestaurant.com` and feed `https://geckocabanerestaurant.com/sitemap.xml`; `list_sitemaps` to confirm. A Domain property covers www and all protocols, so no URL-prefix property is needed.
5. Bing: Bing Webmaster Tools > "Import from Google Search Console" (owner signs in with both accounts; imports verified site and sitemaps) [ASSUMED from Bing documentation recall, not re-fetched]. Fallback: Bing site verification by CNAME/DNS record (`vercel dns add`) or `public/BingSiteAuth.xml` (needs a token from the Bing UI), then submit the sitemap URL in Bing.

### Test: matcher
```ts
// tests/middleware-matcher.test.ts
import { config } from '../src/middleware'
const re = new RegExp('^' + config.matcher[0] + '$')
it.each(['/sitemap.xml', '/robots.txt', '/opengraph-image', '/manifest.webmanifest', '/monitoring'])('%s bypasses middleware', (p) => expect(re.test(p)).toBe(false))
it.each(['/', '/fr', '/en', '/fr/privacy', '/admin', '/api/hours'])('%s runs middleware', (p) => expect(re.test(p)).toBe(true))
```
If importing `src/middleware.ts` pulls `next/server` problems in vitest, fall back to reading the file text and extracting the matcher string with a regex.

## Hard-coded French inventory (D-12, SEO-04)

Detected with an accent scan plus manual review (`src/app/[locale]/**`, `src/components/**`). Counts are approximate; accent scan alone misses unaccented French (marked **U**).

| File | Lines | Literals | Action |
|------|-------|----------|--------|
| `src/app/[locale]/page.tsx` (756 lines) | 33 **U** | `aria-label="Gecko Cabane - Accueil"` | key `common.homeAriaLabel` |
| | 120 | `Krabi Town · Thaïlande` | key `hero.location` |
| | 167 **U** | `Notre Histoire` | key `about.eyebrow` ("Our Story") |
| | 205 | alt `Chef Jariya — Gecko Cabane, Krabi` (accent-free in text but French em-dash style; translate) | `about.chefPhotoAlt` |
| | 217 **U** | `Chef de cuisine` | `about.chefRole` |
| | 238 **U** | `Notre Cuisine` | `cuisine.eyebrow` ("Our Cuisine") |
| | 327 **U** | `La Carte` | `menuSection.eyebrow` ("The Menu") |
| | 350 | `Nos Créations` | `gallery.eyebrow` ("Our Creations") |
| | 356 **U** | `La Table du Chef Jariya` | `gallery.title` ("Chef Jariya's Table") |
| | 365-367 | 4 gallery `alt` descriptions (FR) | `gallery.alt1..4`; the 4 `caption` strings are dish names: keep (marker) |
| | 400 | `Cuisine Franco-Thaï gastronomique · Chef Jariya · Krabi, Thaïlande` | `gallery.tagline` |
| | 462 **U** | `Horaires` | `hoursSection.eyebrow` |
| | 543 | `Réservation` | `reservationForm.eyebrow` |
| | 566 **U** | `Nous trouver` | `contactSection.eyebrow` ("Find us") |
| | 583 | alt `Enseigne du restaurant ... de nuit, Krabi` | `contactSection.signAlt` |
| | 497, 519 | `TripAdvisor`, `Facebook` brand names | keep (brands) |
| | 702 | `t('footer.openHours')` wrong hours | fix message values (Pitfall 6) |
| `src/components/MenuDisplay.tsx` | 114, 117 | legend `Végétarien`, `Épicé` | existing keys `menuSection.vegetarian/spicy` (client: `useTranslations`) |
| | 160, 162, 171, 173 | aria-label/`<title>` Végétarien/Épicé | same keys |
| | 206 | `Ce menu est en cours de préparation` | existing key `menuSection.preparing` |
| | 214 | `La carte est en cours de préparation` | new key `menuSection.menuPreparing` |
| `src/components/ReservationForm.tsx` | 22-50 | `COUNTRIES[].name` bilingual strings ("Thaïlande / Thailand", 29 lines) | replace with `Intl.DisplayNames(locale, {type:'region'})`; keep dial code/flag |
| | 106, 108, 251 | occasion VALUES (`'Anniversaire'`, `'Dîner romantique'`, ... stored/sent to API and email) | keep values, mark `// i18n-ignore: stored enum value`; labels already via `t()` |
| | 315, 386 | placeholders `Jean Dupont`, `jean@example.com` | `reservationForm.namePlaceholder`, `emailPlaceholder` |
| `src/components/AnnouncementBanner.tsx` | 84, 86 **U** | `Du ... au ...` + `toLocaleDateString('fr-FR')` | keys with ICU `{start}`/`{end}` and `useLocale()` |
| | 93 **U** | `aria-label="Fermer l'annonce"` | `common.closeAnnouncement` |
| `src/app/[locale]/error.tsx` | 71 | `🦎 Gecko Cabane — Krabi, Thaïlande` | key |
| `src/app/[locale]/not-found.tsx` | 52 | same | key |
| `src/components/HoursDisplay.tsx`, `LanguageSwitcher.tsx`, `WhatsAppButton.tsx`, `GcDivider.tsx`, `[locale]/privacy/page.tsx`, `[locale]/layout.tsx` | — | clean (accent scan 0; already i18n) | none |

Outside D-12 scope but visible French: root `src/app/not-found.tsx` (lines 24, 31, 35), `src/app/global-error.tsx` (38, 46, 65): rendered outside `[locale]`, no provider available; leave, document as known limitation (they are error/404 pages, noindex). `src/app/layout.tsx` French metadata is replaced by this phase. `src/app/manifest.ts` description/lang `fr` — leave (manifest has one global language) or switch description to neutral; discretion.

Sizing: about 35 to 40 new keys per language for `page.tsx` + components + `meta` namespace (title/description/og/twitter/schemaDescription, ~8 keys), no keys for countries. Plan-sized as one wave of 2 plans (page.tsx; components) plus the test.

### Test approach (source scan)
```ts
// tests/i18n-hardcoded.test.ts
// Scan src/app/[locale]/** and src/components/**: strip block/line comments, then flag any line containing
// [àâäçéèêëîïôöùûüœÀÂÉÈÊËÎÏÔÙÛÜÇŒ] unless the line (or previous line) contains `i18n-ignore`.
// Plus an explicit phrase list for UNACCENTED French that must never appear as literals:
const BANNED = ['Notre Histoire', 'Notre Cuisine', 'La Carte', 'Nos Créations', 'Nous trouver', 'Horaires', 'Chef de cuisine', 'Accueil', "Fermer l'annonce"]
```
False positives to handle with `// i18n-ignore: <reason>`: dish-name captions in the gallery, occasion enum values, the `GECKO CABANE` brand, comments (stripped), and the accented characters inside `import` paths (none). Do NOT scan `messages/*.json` (they legitimately contain French). Also add `meta` namespace parity (already enforced by `tests/i18n.test.ts` through flattened keys) and an assertion that `en.json` meta values contain no French accented characters (`/[àâçéèêëîïôùûü]/i` on `en.json` `meta.*`).

## `gecko-cabane.com` references (D-01)

| File:line | Content | Action |
|-----------|---------|--------|
| `src/app/layout.tsx:69` | `metadataBase: new URL("https://gecko-cabane.com")` | `new URL(SITE_URL)` |
| `src/app/layout.tsx:80` | `openGraph.url` | removed (per-page helper) |
| `src/app/layout.tsx:109` | JSON-LD `image` | replaced |
| `src/app/layout.tsx:111` | JSON-LD `url` | replaced |
| `src/app/layout.tsx:136` | JSON-LD `menu` | removed (D-08) |
| `src/app/admin/login/page.tsx:57` | `placeholder="admin@gecko-cabane.com"` | `admin@geckocabanerestaurant.com` or neutral `email@example.com` (login is French fixed, no i18n) |
| `.planning/PROJECT.md:53,75`, `REQUIREMENTS.md:22`, `ROADMAP.md:78` | requirement/decision text mentioning the 301 | update wording to reflect D-01 (docs); do not break traceability: mark SEO-01 reinterpretation |
| `.planning/phases/01-*/01-02-PLAN.md`, `01-10-PLAN.md`, `01-11-SUMMARY.md`, `02-CONTEXT.md`, `02-DISCUSSION-LOG.md` | historical records | leave as history |
| `docs/`, `README.md` | no match [VERIFIED: grep] | none |
| Messages / other src | no match [VERIFIED: grep] | none |

The "no legacy domain" test should scan `src/**`, `messages/**`, `public/**` (text files), `README.md`, `tests/**` (exclude itself) for `/gecko-cabane\.com/` and NOT scan `.planning/`. Mind the regex: Sentry slug `gecko-cabane` and Vercel project `gecko-cabane-restaurant` contain no `.com` suffix and must not match; `gecko-cabane.com` literal only.

## sameAs candidates (D-09: need owner validation)

Found in the repo (links the site already publishes, so likely the official profiles), to be submitted to the owner, none to go live without agreement:
- TripAdvisor: `https://fr.tripadvisor.be/Restaurant_Review-g297927-d2413872-Reviews-Gecko_Cabane_Restaurant_krabi-Krabi_Town_Krabi_Province.html` (`page.tsx:492`) [VERIFIED: codebase]. Recommend the canonical `www.tripadvisor.com` form of the same listing (same `g297927-d2413872` ids) [ASSUMED].
- Facebook: `https://www.facebook.com/GeckoCabaneRestaurant/` (`page.tsx:514`) [VERIFIED: codebase].
- Google Maps: the site links a search-query URL (`maps.google.com/?q=...`, `page.tsx:658`), which is NOT a place URL. A real `https://www.google.com/maps/place/...` / `https://maps.app.goo.gl/...` or `https://g.page/...` URL must come from the owner's Google Business Profile.
- Instagram: no link found anywhere in `src/` or `messages/`. Search web for the official handle and ask the owner; if none exists, omit.
Search the web for confirmation before submission (WebSearch/WebFetch), but treat results as LOW confidence until the owner validates.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` (middleware deprecated, still works) | Next 16.0 | Do not migrate in this phase |
| `unstable_cache` | `'use cache'` + Cache Components | Next 16 | Keep `unstable_cache`; Cache Components out of scope |
| `revalidateTag(tag)` | `revalidateTag(tag, 'max')` | Next 16 | Use two-arg form |
| `sitemap(id)` sync id | `id` is a Promise (only for `generateSitemaps`) | 16.0 | N/A (single sitemap) |
| Keywords meta, priority/changefreq | Ignored by Google | long ago | Don't invest; drop `keywords` |

**Deprecated/outdated:** `metadata.viewport/themeColor` (use `viewport` export; none used here). Streaming metadata (15.2+): metadata may be appended to `<body>` for JS-capable bots and stays in `<head>` for HTML-limited bots [CITED: generate-metadata Streaming metadata]. Googlebot reads it fine; optional hardening with `htmlLimitedBots: /.*/` is not needed.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Omitting closed days (Tuesday) from `openingHoursSpecification` is equivalent to marking them closed | Pattern 4 | Low; alternative 00:00-00:00 entry is Google-documented |
| A2 | Brand `name` in JSON-LD should be "Gecko Cabane" rather than "Gecko Cabane Restaurant" | Pattern 5 | Low; cosmetic/entity-matching |
| A3 | `public/hero-bg.jpg` etc. are suitable crawlable schema images (landscape ratio) | Pattern 5 | Low; owner/planner checks file |
| A4 | `x-default` accepted inside sitemap `alternates.languages` | Pattern 6 | Low; remove it if Next/Google complains |
| A5 | `twitter:image` auto-derived from the file-based opengraph image | Pattern 8 | Low; verify rendered HTML |
| A6 | Rich Results Test may show no detected item for plain Restaurant; use validator.schema.org too | Pitfall 8 | Medium for the "Rich Results Test sans erreur" success criterion wording |
| A7 | `vercel api` accepts `-X PATCH --input file` | Domain commands | Low; fallback dashboard/MCP |
| A8 | GSC MCP tools are list/submit/search only and cannot mint the verification token; `submit_sitemap` params use `sc-domain:` site URL and full feed URL | GSC flow | Medium; planner should plan a `checkpoint:human-action` for token retrieval |
| A9 | Bing "Import from Google Search Console" imports sitemaps and needs owner sign-in on both services | GSC flow | Medium; fallback DNS/XML verification given |
| A10 | Canonical TripAdvisor `.com` URL for the same listing ids is equivalent to the `.be` URL | sameAs | Low; owner validates |
| A11 | `footer.openHours` "11h-23h" is wrong and the real hours are 12:00-22:00 (from D-05) | Pitfall 6 | Medium: owner must confirm before the visible text is changed |

## Open Questions (RESOLVED)

1. **Geo precision (D-06 vs Google guideline)**
   - Known: D-06 locks 8.0615 / 98.9157 (4 decimals); Google says "precision must be at least 5 decimal places".
   - Unclear: whether Rich Results validation warns; exact pin of the restaurant.
   - Recommendation: keep D-06 values in code (locked), but ask the owner to read 5-6 decimals from the Google Business Profile pin; change the constant if different. Test asserts the constants so the change is one line.
   - RESOLVED: keep D-06 values (8.0615 / 98.9157) in code; owner confirms the pin in the 02-07 owner checkpoint -> plan 02-07
2. **Footer visible hours text**
   - Known: `footer.openHours` says 11h-23h (both languages); real hours 12h-22h per D-05.
   - Recommendation: planner includes a task to correct the message (or generate from DB in the footer) after owner confirms.
   - RESOLVED: set footer text to 12h-22h in plan 02-04 (pending owner confirmation, recorded in 02-04 SUMMARY); owner confirms in the 02-07 checkpoint -> plans 02-04, 02-07
3. **`gecko-cabane-restaurant.vercel.app` duplicate host**
   - Known: serves the same content (redirect null); absolute canonicals mitigate duplication.
   - Recommendation: optional PATCH to redirect it (301) to the apex; check owner does not rely on it for previews (previews use per-deployment URLs). Low priority; ask owner.
   - RESOLVED: leave the vercel.app host as is (absolute canonicals mitigate); listed under known limitations in 02-LAUNCH.md -> plan 02-06 / 02-07
4. **`www` redirect code: 301 vs 308**
   - D-02 says 301; API supports both. Use 301 as decided.
   - RESOLVED: www -> apex 301, root `/` -> `/fr` 308 per D-02 -> plan 02-07 (Task 1 configures www 301 and probes both codes)
5. **GSC property pre-existing?**
   - Unknown whether `sc-domain:geckocabanerestaurant.com` already exists in the owner's GSC; `mcp__gsc__list_sites` first. If present and verified, skip TXT.
   - RESOLVED: pre-check with `mcp__gsc__list_sites` in 02-07 Task 1 / 02-08 before any TXT record -> plans 02-07, 02-08
6. **Manifest `lang`/`description`** stay French or neutral: discretion; recommend leave as is.
   - RESOLVED: leave the manifest as is (no plan change) -> no plan

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build/tests | ✓ | v26.4.0 (local; project types `@types/node` ^20) | — |
| npm / vitest | tests | ✓ | vitest ^4.1.0 installed | — |
| Vercel CLI | www domain, DNS TXT | ✓ | 59.24.0, authenticated (team `anatholyb1s-projects`) | Dashboard / Vercel MCP |
| `geckocabanerestaurant.com` on Vercel DNS | TXT record | ✓ | NS = ns1/ns2.vercel-dns.com; registrar Vercel | — |
| curl | post-deploy probes | ✓ | — | — |
| GSC MCP (`mcp__gsc__*`) | sitemap submission | ? not inspectable from the research sandbox | — | Search Console UI by owner |
| Google Search Console access / Bing Webmaster account | SEO-07 | owner-dependent | — | Owner performs verification click / Bing import |
| Rich Results Test / validator.schema.org | SEO-02 validation | external web tools (public URL needed for RRT) | — | validator.schema.org code snippet pre-deploy |

**Missing dependencies with no fallback:** none blocking code work; SEO-07 requires owner presence for the GSC token and the Bing sign-in.
**Missing dependencies with fallback:** GSC MCP unverified (fallback UI).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.1.0 |
| Config file | `vitest.config.ts` (node env, `include: ['tests/**/*.test.ts']`, alias `@` -> `./src`) |
| Quick run command | `npx vitest run tests/seo-metadata.test.ts` (per file) |
| Full suite command | `npm test` (`vitest run`); also gates `npm run build` |

Notes: the alias `@` exists, so tests may import `@/utils/seo`. `src/utils/seo.ts` must use `import type` for `next` types only (no runtime Next imports) so it loads in the node environment. Server-only modules (`unstable_cache`, `next/cache`) stay out of `seo.ts`; test `mapOpeningHours`/`buildRestaurantJsonLd` as pure functions that take rows and a messages object. Existing helper pattern: read files with `fs`/`path` as in `tests/i18n.test.ts`.

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEO-01 | no `gecko-cabane.com` in src/messages/public/tests; `localeUrl` absolute & self-referential; `buildPageMetadata` canonical = `${SITE_URL}/${locale}${path}` | unit + scan | `npx vitest run tests/seo-no-legacy-domain.test.ts tests/seo-metadata.test.ts` | ❌ Wave 0 |
| SEO-02 | JSON-LD has geo 8.0615/98.9157, url/image start with SITE_URL, no `gecko-cabane.com` | unit | `npx vitest run tests/seo-jsonld.test.ts` | ❌ Wave 0 |
| SEO-03 | JSON-LD has `acceptsReservations: true`, `priceRange '฿฿'`, `paymentAccepted`, `currenciesAccepted 'THB'`, and NO `aggregateRating`, NO `hasMenu`/`menu`; `sameAs` absent or only from the validated list | unit | same | ❌ Wave 0 |
| SEO-03/05 hours | `mapOpeningHours` for DB fixture (Tue closed, others 12:00-22:00) -> one spec, 6 days, no Tuesday; empty/failed input -> `[]` | unit | same | ❌ Wave 0 |
| SEO-04 | `en.json` `meta.*` contain no French accents; home title EN equals "Gecko Cabane – French-Thai Restaurant in Krabi Town" and FR title equals spec; description length 120-165; no accented French literals in `[locale]`/components; banned phrases absent | unit + scan | `npx vitest run tests/i18n-hardcoded.test.ts tests/seo-metadata.test.ts tests/i18n.test.ts` | ❌ Wave 0 (i18n.test.ts exists) |
| SEO-05 | `buildPageMetadata` languages = exactly `fr`,`en`,`x-default` (no `de`/`sv`), x-default = fr URL; each `page.tsx` under `src/app/[locale]` exports `generateMetadata` (source scan) | unit + scan | `npx vitest run tests/seo-metadata.test.ts` | ❌ Wave 0 |
| SEO-06 | `sitemap()` returns exactly the 4 URLs each with fr/en alternates, all absolute on SITE_URL; `robots()` has allow `/`, 4 disallows, sitemap line | unit | `npx vitest run tests/seo-sitemap-robots.test.ts` | ❌ Wave 0 |
| SEO-06 | middleware matcher excludes sitemap.xml, robots.txt, opengraph-image, manifest.webmanifest, monitoring; includes `/`, `/fr`, `/en`, `/fr/privacy`, `/admin` | unit | `npx vitest run tests/middleware-matcher.test.ts` | ❌ Wave 0 |
| SEO-01/05 (infra) | middleware options: `localeDetection:false`, `alternateLinks:false`; `next.config.ts` has `/` -> `/fr` permanent | scan | `npx vitest run tests/middleware-matcher.test.ts` | ❌ Wave 0 |
| SEO-01 (www 301) | `curl -sI https://www.geckocabanerestaurant.com` -> 301 to apex | manual/post-deploy | `curl -sI https://www.geckocabanerestaurant.com/fr` | manual |
| SEO-06 (live) | `/sitemap.xml` and `/robots.txt` 200 with right content-type, `/fr/opengraph-image` 200 | manual/post-deploy | `curl -s -o /dev/null -w "%{http_code}" https://geckocabanerestaurant.com/sitemap.xml` | manual |
| SEO-02 (live) | Rich Results Test + validator.schema.org on `/fr` and `/en`, result recorded | manual-only (external tool, public URL) | — | manual |
| SEO-07 | GSC domain property verified, sitemap listed; Bing site imported | manual-only (owner + external) | `mcp__gsc__list_sites`, `mcp__gsc__list_sitemaps` | manual |

### Sampling Rate
- **Per task commit:** the affected test file(s) via `npx vitest run <file>`
- **Per wave merge:** `npm test`
- **Phase gate:** `npm test` + `npm run lint` + `npm run build` green; post-deploy curl checks and external validations recorded before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/seo-no-legacy-domain.test.ts` - covers SEO-01
- [ ] `tests/seo-metadata.test.ts` - covers SEO-01/04/05
- [ ] `tests/seo-jsonld.test.ts` - covers SEO-02/03 (+ hours mapping)
- [ ] `tests/seo-sitemap-robots.test.ts` - covers SEO-06
- [ ] `tests/middleware-matcher.test.ts` - covers SEO-06 and infra options
- [ ] `tests/i18n-hardcoded.test.ts` - covers SEO-04 / D-12
- [ ] `src/utils/seo.ts` (pure helper) must exist before the tests can import it
- Framework install: none (vitest present)

## Security Domain

> `security_enforcement` is not set to false in `.planning/config.json`, so included.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (admin login untouched; only a placeholder string changes) | existing Supabase auth |
| V3 Session Management | no | existing |
| V4 Access Control | yes (admin pages noindex; `/api` disallowed is not access control) | middleware admin guard + RLS unchanged; do not rely on robots.txt for secrecy |
| V5 Input Validation | limited (no new user input; JSON-LD built from DB + constants) | escape `<` in serialized JSON-LD; no raw HTML from DB |
| V6 Cryptography | no | n/a |
| V14 Configuration | yes | env vars unchanged; anon key used read-only for public data |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Script injection via JSON-LD string (DB or message content containing `</script>`) | Tampering / XSS | `JSON.stringify(...).replace(/</g, '\\u003c')` (hours are numeric/time strings, but apply anyway) |
| Information disclosure of admin URLs through sitemap | Information disclosure | sitemap lists only 4 public URLs; admin/api/auth disallowed + admin `noindex` metadata |
| Service-role key use for a public read | Elevation of privilege | use anon key client (RLS public read), never `createAdminClient` for hours |
| DNS TXT mistake overwriting records | Tampering | use `vercel dns add` (append), run `vercel dns ls` before/after; never `dns import`/`rm` |
| Misdirected redirect (open redirect) | Tampering | redirect target fixed to the apex in project config |
| Publishing unverified third-party profile URLs in schema | Spoofing / reputational | owner validation gate for `sameAs` (D-09) |

## Sources

### Primary (HIGH confidence)
- Next.js docs (fetched 2026-10-16): generateMetadata (merging, alternates, openGraph, streaming), sitemap.xml, robots.txt, proxy (execution order, negative matcher, middleware->proxy rename), unstable_cache, revalidateTag
- next-intl docs: actions/metadata/route-handlers page (getTranslations with locale, getPathname sitemap example; note default `link` header)
- Installed code: `node_modules/next/dist/lib/metadata/types/*.d.ts` (alternateLocale, x-default), `node_modules/next-intl/dist/**/getAlternateLinksHeaderValue.js` and `routing/config.d.ts` (`alternateLinks`, `localeDetection`)
- Google Search Central: LocalBusiness structured data (required/recommended props, openingHoursSpecification, geo precision)
- Vercel docs: `vercel dns` CLI, add-a-domain, deploying-and-redirecting, REST "Update a project domain" (redirectStatusCode enum)
- Live probes 2026-10-16: `curl -I` on apex/www/sitemap/robots/opengraph-image/fr/en, `vercel domains ls`, `vercel dns ls`, Vercel API project domains
- Repository files: middleware, layouts, pages, components, messages, tests, migration 007

### Secondary (MEDIUM confidence)
- Google Search Console help (domain property verification, TXT, wait times)

### Tertiary (LOW confidence)
- Bing Webmaster import behaviour; GSC MCP tool parameter names; Rich Results Test coverage for plain Restaurant (all flagged [ASSUMED])

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new packages, versions read from the repo
- Architecture: HIGH - based on Next 16 docs and installed type definitions; shallow-merge rule documented
- Pitfalls: HIGH for middleware/redirect/OG findings (reproduced live), MEDIUM for Rich Results Test and geo precision
- Domain/DNS procedure: HIGH for Vercel steps (CLI + API docs, live state read), MEDIUM for GSC MCP and Bing steps

**Research date:** 2026-10-16
**Valid until:** 2026-11-15 (Next/Vercel docs move quickly; recheck sitemap/robots/proxy pages if upgrading Next beyond 16.1.x)
