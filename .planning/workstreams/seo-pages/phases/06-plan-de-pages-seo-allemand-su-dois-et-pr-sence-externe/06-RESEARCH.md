# Phase 6: Plan de pages SEO, allemand/suédois et présence externe - Research

**Researched:** 2026-10-17
**Domain:** next-intl v4 multi-locale routing with translated pathnames (Next 16 App Router), per-page/per-locale SEO publication gating, shared landing-page component, off-site local-SEO deliverables
**Confidence:** HIGH on the code/stack findings (read from the repo and from the installed next-intl 4.8.3 source), MEDIUM on Google/TripAdvisor procedures, LOW on third-party editorial contact routes (deliberately unverified)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** **Slugs traduits par langue** : le mot-clé figure dans l'URL de chaque langue (ex. `/fr/restaurant-francais-krabi`, `/en/french-restaurant-krabi`, `/de/franzoesisches-restaurant-krabi`). Mapping de pathnames next-intl (`src/i18n/`) + table de slugs par page et par langue dans `src/utils/seo.ts` (source unique pour canonical, hreflang, sitemap, liens internes).
- **D-02:** **Les slugs EN déjà publiés ne changent pas** (`/en/french-restaurant-krabi` est indexé). Seuls FR et DE reçoivent des slugs traduits : aucune redirection 301 à poser. Les nouveaux slugs EN suivent les URL de REQUIREMENTS (`romantic-dinner-krabi`, `where-to-eat-krabi-town`, `getting-here-from-ao-nang`, `wine-belgian-beer-krabi`).
- **D-03:** **Gabarit commun, texte par langue** : un composant de page partagé (hero, sections, CTA vers `#reservation`, bloc de liens croisés) alimenté par des clés next-intl **rédigées pour chaque langue, pas traduites mot à mot** (PAGE-08). Cohérent avec `/en/french-restaurant-krabi`.
- **D-04:** **Navigation (PAGE-07)** : le header garde Carte / Réserver ; un sous-menu « Guides » liste les pages SEO ; chaque page se termine par un bloc « À découvrir » de 2-3 liens contextuels + CTA de réservation. Le footer reprend les liens. Pas de 7 liens dans le header (mobile).
- **D-05:** **`de` et `sv` deviennent des locales actives dès cette phase** (config next-intl, middleware, `seo.ts`), mais la publication est pilotée **par page et par langue** : `PUBLISHED_PAGES` ne liste une page en `de`/`sv` qu'après validation écrite de la relecture. Une page DE non listée reste accessible mais en **`noindex`**, sans hreflang ni entrée de sitemap (D-13/D-14 de la phase 2 respectés). Le sélecteur de langue n'affiche que les langues publiées.
- **D-06:** **Relecture DE par un relecteur humain fourni par le propriétaire** : Claude produit un document de relecture structuré (texte DE en regard du FR), reporte les corrections, puis le propriétaire donne une validation écrite avant publication. Aucune page DE n'est publiée sans cette validation (contrainte PROJECT.md).
- **D-07:** **Périmètre : DE complet, SV en socle.** DE : accueil, french-restaurant, romantic-dinner, where-to-eat, `/menu` et pages d'avis (`/de/review`, alias `/bewertung`). SV : locale prête (fichier de messages, routage) et textes rédigés après DE, publiés après leur propre relecture ; hreflang `sv` ajouté à la publication.
- **D-08:** **Noms et descriptions de plats : restent en français** sur `/menu` en DE (et EN), comme une carte de restaurant français ; seuls l'interface, les titres de sections et les légendes sont traduits. Pas de colonnes `name_de` / `description_de`, pas de migration. `name_en` / `description_en` (report de la phase 3) restent écartés.
- **D-09:** Le repli `de` → `en` de la page `/review` et des emails (D-10 / D-08 de la phase 4) est levé pour `de` à la publication DE ; `sv` continue de retomber sur `en` jusqu'à sa propre publication. Les textes DE du QR (insert et chevalet) sont relus par le même relecteur.
- **D-10:** **getting-here-from-ao-nang** : les prix, durées et horaires viennent **du propriétaire** (ce que les clients paient réellement), recoupés avec 1-2 sources publiques par Claude. Tout chiffre sans source est présenté comme approximatif ou omis. Aucun tarif inventé.
- **D-11:** **where-to-eat-krabi-town** : guide honnête centré sur **lieux, marchés et quartiers** (night market, Walking Street, front de rivière), types de cuisine et moments pour y aller ; Gecko présenté pour le dîner. **Aucun concurrent nommé**, aucun classement ni avis négatif inventé.
- **D-12:** **romantic-dinner** : **photos existantes uniquement** (façade, plats, cheffe) ; **ambiance sans offre chiffrée** : pas de « menu dégustation pour deux » défini, donc pas de formule ni de prix sur la page. Elle décrit l'ambiance, la carte et la réservation « occasion » (champ déjà présent). Une formule pourra être ajoutée plus tard si le propriétaire la crée.
- **D-13:** **wine-belgian-beer** : présentation, choix belge et **accords mets-vins rédigés** ; la liste (prix, formats) **reste sur `/menu#vins-bieres-belges`** et la page y renvoie, sans dupliquer la carte.
- **D-14:** **Format des livrables** : dossier **`docs/ph6/`** dans le repo (Markdown, et PDF pour le dossier concierge imprimable), comme `docs/print/` en phase 4. Contenu : posts Google, modèles de réponse aux avis, liste de blogs avec messages, dossier concierge, tableau NAP.
- **D-15:** **Posts Google (OPS-02)** : **4 semaines d'avance, FR + EN** (plat de la semaine, soirée, offre basse saison), validés par le propriétaire, publiés par lui ou après son accord explicite.
- **D-16:** **Modèles de réponse aux avis (OPS-03)** : réponses sous 48 h incluant « French restaurant in Krabi Town », en FR/EN/DE, sans contrepartie ni demande d'avis incitée.
- **D-17:** **TripAdvisor (OPS-04) et NAP (OPS-05) via Chrome piloté** (extension claude-in-chrome), **comme GBP en phase 4 (D-19)** : textes prêts à coller d'abord, validation du propriétaire avant chaque clic. Le lien du site TripAdvisor passe de `tripadvisor.be` à `.com`. Audit NAP en tableau (site, Google, TripAdvisor, Facebook, Trip.com, Wanderlog), écarts signalés puis corrigés avec accord.
- **D-18:** **Blogs/guides (OPS-06) et concierge (OPS-07) : préparés, rien n'est envoyé.** Messages FR/EN/DE par cible (Petit Futé, Travelfish, Faszination Südostasien, Marco Polo) et dossier hôtels (carte de recommandation, commission) prêts ; **le propriétaire déclenche chaque envoi** et aucune commission chiffrée n'est proposée sans son accord. Pas de brouillons Gmail.

### Claude's Discretion
Noms exacts des slugs FR/DE (recherche de mots-clés), structure du composant de page partagé, clés i18n et namespace `meta` par page, style du sous-menu « Guides » et du bloc « À découvrir », forme du document de relecture DE, ordre de livraison avant le 1er novembre (pages EN et FR d'abord, DE/SV selon la relecture), données structurées par page (BreadcrumbList, FAQ si contenu réel), tests (parité des clés fr/en/de, absence de hreflang vers page non publiée, slugs/sitemap).

### Deferred Ideas (OUT OF SCOPE)
- Traduction des plats (`name_en`/`name_de`, `description_*`) : écartée ; à rouvrir si les analytics montrent un besoin.
- Formule « menu dégustation pour deux » sur romantic-dinner : seulement si le propriétaire la définit.
- Guide local avec établissements nommés : écarté pour cette phase.
- Brouillons Gmail pour blogs/concierge : écartés ; envois déclenchés par le propriétaire.
- Données structurées avancées par page (FAQ, BreadcrumbList) : à la discrétion du planificateur si contenu réel.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAGE-03 | `/en/romantic-dinner-krabi` | Shared `SeoLandingPage`, slug table, D-12 overrides the "menu dégustation pour deux" wording of REQUIREMENTS (see Open Questions) |
| PAGE-04 | `/en/where-to-eat-krabi-town` | Same component; D-11 (no named competitors) overrides "adresses" |
| PAGE-05 | `/en/getting-here-from-ao-nang` | Same component; facts from owner (D-10); EN-only, `notFound()` in other locales |
| PAGE-06 | `/en/wine-belgian-beer-krabi` | Same component; links to `/menu#vins-bieres-belges`; Thai alcohol-advertising risk flagged (Pitfall 9) |
| PAGE-07 | Title/meta/H1/CTA/nav/cross-links per page | Registry `PAGES` in seo.ts (title+description keys, RELATED map), `GuidesMenu`, `RelatedGuides` block, footer links |
| PAGE-08 | PAGE-01..04 and `/menu` in FR | Translated FR slugs, FR message namespaces, FR added to `PUBLISHED_PAGES` |
| I18N-01 | `/de` for PAGE-01..04, `/menu`, review pages, human-reviewed | `de` locale + merge-over-EN fallback, publication gate (PUBLISHED_PAGES + signed review file test), review docs |
| I18N-02 | `/sv` afterwards, hreflang | Same mechanism; SV slugs proposed; hreflang added only on publish |
| OPS-02..OPS-07 | Off-site deliverables | `docs/ph6/` structure and checklists below; nothing sent externally |
</phase_requirements>

## Summary

The repo already has the hard parts of a publication-gated SEO setup: `PUBLISHED_PAGES` drives hreflang, sitemap and metadata per page and per locale; `seo.ts` is a pure module testable under Vitest; the middleware is already composable (Supabase session, review aliases, next-intl). The phase is mostly (a) widening `LOCALES` to four, (b) replacing the "path is identical in every locale" assumption of `localeUrl`/`pageLanguages` with a slug table, (c) factoring the French-restaurant page into a shared component, and (d) a mechanical publication gate for de/sv. All of this stays inside the existing patterns; **no new npm package is needed**.

Three findings change the plan versus what CONTEXT assumes. First, the cleanest way to get translated slugs is to configure `pathnames` **only on the middleware** and keep `createNavigation` untyped, building hrefs from the single slug table in `seo.ts` (verified against the installed next-intl 4.8.3 source: with `pathnames` on `createNavigation`, every `Link href` string such as `"/#reservation"` becomes a TypeScript error and string hrefs with hashes bypass localisation). Second, `reservation-schema.ts` has `locale: z.enum(['fr','en'])`, `phoneCountryForLocale` and `EmailLocale` only know fr/en, so a form submitted from `/de` would be rejected with a 400 unless these are extended (the DB check constraint already allows de/sv). Third, the `LanguageSwitcher` strips `^/(fr|en)` from `usePathname()` of `next/navigation`; with translated slugs it must be rewritten to map the current slug to the per-locale slug and to list only locales where the current page is published.

Thai alcohol-advertising law (Alcoholic Beverage Control Act B.E. 2551, s.32) and Google's posts policy (alcohol is a regulated category) make the wine/Belgian-beer page and the Google posts a compliance risk that CONTEXT does not mention; the owner must decide before PAGE-06 and the weekly posts go live (Open Question 1).

**Primary recommendation:** Build one registry `PAGES` in `src/utils/seo.ts` (key = EN slug = Next folder name = next-intl internal path, plus `slugs`, `contentLocales`, `namespace`, `related`), derive `pathnames`, sitemap, hreflang, switcher, nav and cross-links from it, gate de/sv publication with `PUBLISHED_PAGES` plus a test that requires a signed review file, and ship in the order: infra and tests, EN pages, FR pages, nav/cross-links/TripAdvisor URL, DE (after review), SV, with `docs/ph6/` written in parallel.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Locale and translated-slug routing (rewrite/redirect) | Frontend Server (middleware) | — | next-intl middleware `pathnames` rewrites `/fr/restaurant-francais-krabi` to the internal `/fr/french-restaurant-krabi` |
| Slug table, canonical, hreflang, sitemap, publication state | Frontend Server (pure module `seo.ts`) | — | Single source of truth, no I/O, testable in Vitest node env |
| Noindex of unpublished locale pages | Frontend Server (`generateMetadata`) | — | Meta robots emitted server-side per request |
| Page rendering (shared landing component, JSON-LD) | Frontend Server (Server Components) | — | Matches existing pages; no client JS needed except menu toggle |
| Language switcher filtered to published locales | Browser/Client (needs current pathname) | Frontend Server (computes the allowed list) | Switcher needs `usePathname`; data (published locales) is a pure import |
| "Guides" submenu | Browser/Client (disclosure state) | Frontend Server (item list) | Open/close and Escape need JS; list computed server-side |
| Message fallback for partial de/sv files | Frontend Server (`request.ts`) | — | Deep-merge over `en` at request time |
| Reservation locale, phone country, email copy | API/Backend (zod schema, resend) | Browser (form sends `useLocale()`) | Backend validation must accept de/sv |
| Off-site deliverables (NAP, posts, templates, dossier) | Documentation (`docs/ph6/`) | Owner-driven Chrome actions | No code tier; nothing sent without owner approval |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-intl | 4.8.3 (installed; `package.json` `^4.8.3`) | Locale routing, `pathnames`, messages | Already in use; `defineRouting`, `pathnames` and middleware rewrite verified in `node_modules/next-intl/dist/esm/development/middleware/middleware.js` [VERIFIED: node_modules source] |
| next | 16.1.6 | App Router, `generateMetadata`, `robots` metadata | Existing [VERIFIED: package.json] |
| vitest | ^4.1.0 | Tests; `vitest.config.ts` DOES define the `@` alias (contrary to the brief) | Existing [VERIFIED: vitest.config.ts] |

### Supporting
None to add. Do not add a slug/transliteration library: DE slugs are written by hand in ASCII (`oe`, `ue`, `ss`).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `pathnames` on middleware only + untyped navigation | `pathnames` also on `createNavigation` (typed `Link`) | Typed `Link` forces `{pathname, hash}` object hrefs in ~10 files and breaks string hrefs like `"/#reservation"`; string hrefs with a hash skip localisation (see `compileLocalizedPathname`: `r[e]` lookup on the full string). Not worth it with a slug table already in `seo.ts` |
| `<details>` for the Guides menu | Client disclosure button | `<details>` needs no JS but cannot close on outside click/Escape; client button gives proper `aria-expanded` and Escape. Use the client button |

**Installation:** none.

**Version verification:** `next-intl` 4.8.3 read from `node_modules/next-intl/package.json` [VERIFIED: local install]. No new packages, so the slopcheck gate does not apply.

## Package Legitimacy Audit

No external package is installed by this phase. Packages removed: none. Packages flagged: none.

## Architecture Patterns

### System Architecture Diagram

```
Request  /fr/restaurant-francais-krabi
   |
   v
middleware.ts
   |-- /monitoring, REVIEW_ALIASES (/review,/avis,/bewertung) --> pass-through (unchanged)
   |-- Supabase session refresh + admin gate (unchanged)
   |-- admin/api/auth --> pass-through
   +-- intlMiddleware(routing)  routing = {locales fr,en,de,sv; localePrefix always;
        |                                   localeDetection false; alternateLinks false;
        |                                   pathnames from PAGES}
        |-- external slug of this locale  --> rewrite to /fr/french-restaurant-krabi (internal)
        |-- slug of ANOTHER locale / internal name --> 307 redirect to this locale's slug
        +-- unknown --> pass-through (404 via [locale]/not-found)
   |
   v
src/app/[locale]/french-restaurant-krabi/page.tsx   (folder = PAGES key = EN slug)
   |-- locale in contentLocales? no --> notFound()
   |-- generateMetadata --> resolvePageSeo(pageKey, locale)   [pure, seo.ts]
   |        published(locale)?  yes --> canonical + hreflang (published locales only) + OG
   |                            no  --> robots noindex, NO alternates/hreflang
   +-- <SeoLandingPage pageKey locale/>   (Server Component)
            |-- messages: namespace per page (de/sv deep-merged over en in request.ts)
            |-- hero / sections / CTA  -> href to home #reservation
            |-- RelatedGuides: PAGES[key].related filtered to published-in-locale
            +-- SiteHeader(GuidesMenu, LanguageSwitcher published locales) + SiteFooter

sitemap.ts : PUBLISHED_PAGES x locales --> localeUrl(locale, key) (slug per locale) + alternates
docs/ph6/  : owner-driven, nothing leaves the repo automatically
```

### Recommended Project Structure
```
src/
├── i18n/
│   ├── config.ts         # locales = ['fr','en','de','sv']  (keep as the type source)
│   ├── routing.ts        # NEW: defineRouting({... pathnames: buildPathnames() }) used by middleware only
│   ├── navigation.ts     # createNavigation({locales, defaultLocale, localePrefix}) UNCHANGED (no pathnames)
│   └── request.ts        # deep-merge de/sv over en
├── utils/
│   ├── seo.ts            # PAGES registry, slugFor, localeUrl, pageLanguages, isPublished, publishedLocales,
│   │                     # resolvePageSeo, TRIPADVISOR_URL
│   └── seo-nav.ts?       # optional pure helpers: guidesFor(locale), relatedFor(key, locale)
├── components/
│   ├── seo/SeoLandingPage.tsx   # shared template
│   ├── seo/RelatedGuides.tsx    # "À découvrir" block (server)
│   ├── GuidesMenu.tsx           # 'use client' disclosure
│   ├── LanguageSwitcher.tsx     # rewritten (slug-aware, published-only)
│   ├── SiteHeader.tsx / SiteFooter.tsx   # add Guides + footer links
└── app/[locale]/
    ├── french-restaurant-krabi/page.tsx   # thin wrappers: metadata + <SeoLandingPage pageKey=.../>
    ├── romantic-dinner-krabi/page.tsx
    ├── where-to-eat-krabi-town/page.tsx
    ├── getting-here-from-ao-nang/page.tsx
    └── wine-belgian-beer-krabi/page.tsx
messages/{fr,en,de,sv}.json
docs/ph6/
├── README.md              # index, status table, "nothing sent" rule
├── nap-audit.md
├── google-posts-fr-en.md  # 4 weeks
├── review-replies.md      # FR/EN/DE
├── outreach-targets.md    # blogs/guides + messages FR/EN/DE
├── concierge-dossier.md (+ .pdf)
└── review/de/<page>.md, review/sv/<page>.md   # side-by-side review docs with signature box
```

### Pattern 1: Page registry as the single source (D-01)
**What:** One typed array in `seo.ts`; the folder name under `src/app/[locale]/` equals `key`, which equals the EN slug, which is also the next-intl internal pathname. EN needs no `pathnames` entry (internal name is used when a locale has no entry), so published EN URLs cannot change (D-02).
**When to use:** every consumer (middleware pathnames, canonical, hreflang, sitemap, switcher, nav, cross-links, tests).
**Example:**
```typescript
// src/utils/seo.ts  (pure, no runtime imports)
export const LOCALES = ['fr', 'en', 'de', 'sv'] as const
export type SeoLocale = (typeof LOCALES)[number]
export const OG_LOCALE = { fr: 'fr_FR', en: 'en_US', de: 'de_DE', sv: 'sv_SE' } as const

export type PageDef = {
  key: string                                   // '' = home, '/menu', '/french-restaurant-krabi' ...
  slugs: Partial<Record<SeoLocale, string>>     // only locales that differ from key
  contentLocales: readonly SeoLocale[]          // locales for which message text exists (else notFound)
}
export const PAGES: readonly PageDef[] = [
  { key: '', slugs: {}, contentLocales: ['fr','en','de','sv'] },
  { key: '/privacy', slugs: {}, contentLocales: ['fr','en'] },
  { key: '/menu', slugs: {}, contentLocales: ['fr','en','de','sv'] },
  { key: '/french-restaurant-krabi',
    slugs: { fr: '/restaurant-francais-krabi', de: '/franzoesisches-restaurant-krabi', sv: '/franskt-restaurang-krabi' },
    contentLocales: ['fr','en','de','sv'] },
  { key: '/romantic-dinner-krabi',
    slugs: { fr: '/diner-romantique-krabi', de: '/romantisches-abendessen-krabi', sv: '/romantisk-middag-krabi' },
    contentLocales: ['fr','en','de','sv'] },
  { key: '/where-to-eat-krabi-town',
    slugs: { fr: '/ou-manger-krabi-town', de: '/wo-essen-krabi-town', sv: '/var-ata-krabi-town' },
    contentLocales: ['fr','en','de','sv'] },
  { key: '/getting-here-from-ao-nang', slugs: {}, contentLocales: ['en'] },   // EN-only (D-07)
  { key: '/wine-belgian-beer-krabi', slugs: {}, contentLocales: ['en'] },     // EN-only (D-07)
]

export function slugFor(key: string, locale: SeoLocale): string {
  return PAGES.find((p) => p.key === key)?.slugs[locale] ?? key
}
export function localeUrl(locale: SeoLocale, key = ''): string {
  return `${SITE_URL}/${locale}${slugFor(key, locale)}`
}
```
`PUBLISHED_PAGES` keeps its shape (`{ path: key, locales }`) so `sitemap.ts` and existing tests need minimal change; `path` is the registry key.

### Pattern 2: next-intl `pathnames` on the middleware only
**What:** Build `pathnames` from the registry; use it in `defineRouting`; pass the resulting `routing` to `createIntlMiddleware`. Leave `createNavigation` as is (no `pathnames`) and build hrefs with `slugFor`.
**Why:** Verified middleware behaviour (installed source, `middleware/middleware.js` lines 86-125 and `middleware/utils.js` `getInternalTemplate`): a request for the localized slug is rewritten to the internal path; a request for another locale's slug or the internal name is redirected (NextResponse.redirect, i.e. 307) to the current locale's slug; paths not in `pathnames` pass through untouched. So `/fr/french-restaurant-krabi` redirects to `/fr/restaurant-francais-krabi` automatically, and the FR page was never indexed under the old URL so no SEO loss.
**Example:**
```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing'
import { locales, defaultLocale } from './config'
import { PAGES } from '@/utils/seo'

const pathnames = Object.fromEntries(
  PAGES.filter((p) => p.key && Object.keys(p.slugs).length > 0).map((p) => [p.key, { ...p.slugs }])
)
export const routing = defineRouting({
  locales, defaultLocale,
  localePrefix: 'always',
  localeDetection: false,
  alternateLinks: false, // HTML hreflang from seo.ts is the only signal (keep existing comment)
  pathnames,
})
// middleware.ts: const intlMiddleware = createIntlMiddleware(routing)
// Source: https://next-intl.dev/docs/routing/configuration#pathnames
```
`pathnames` type is `Record<string, Partial<Record<Locale, string>> | string>` [VERIFIED: `routing/types.d.ts`], so a partial locale map is valid and a missing locale falls back to the key. `tests/middleware-matcher.test.ts` reads the middleware as text and checks options; update it to look for `routing`/`alternateLinks: false` wherever the options now live.

### Pattern 3: Publication gate and noindex resolver (pure, testable)
**What:** One pure function decides what a page may emit for a locale.
```typescript
export function isPublished(key: string, locale: SeoLocale): boolean {
  return PUBLISHED_PAGES.some((p) => p.path === key && p.locales.includes(locale))
}
export function publishedLocales(key: string): readonly SeoLocale[] {
  return PUBLISHED_PAGES.find((p) => p.path === key)?.locales ?? []
}
/** What a page emits for this locale. Unpublished = noindex, no canonical/hreflang. */
export function resolvePageSeo(key: string, locale: SeoLocale) {
  const locales = publishedLocales(key)
  if (!locales.includes(locale)) return { index: false as const }
  return { index: true as const, canonical: localeUrl(locale, key), languages: pageLanguages(key, locales) }
}
```
Per-page `generateMetadata`: if `!resolvePageSeo(...).index` return `{ title, description, robots: { index: false, follow: true } }` (no `alternates`, no OG url); otherwise `buildPageMetadata(...)` with `locales: publishedLocales(key)`. `buildPageMetadata` must pass `locales` to `pageLanguages` (it already does) and `pageLanguages` must use `localeUrl(l, key)` (slug-aware). Keep `follow: true` on noindex pages so link equity flows; keep `x-default` behaviour (fr if published else first published locale; already implemented).
Hreflang rules (Google): each page must list itself and every alternate, and alternates must link back; deriving from the same `publishedLocales(key)` on every member of the set guarantees reciprocity. Use bare `de`/`sv` codes (consistent with existing `fr`/`en`).

### Pattern 4: Fallback messages for partial de/sv
Without a fallback, next-intl returns the key path (`frenchRestaurant.h1`) as visible text in production and logs an error. Deep-merge over `en`:
```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server'
import { locales, type Locale } from './config'

type Msgs = { [k: string]: string | Msgs }
function deepMerge(base: Msgs, over: Msgs): Msgs {
  const out: Msgs = { ...base }
  for (const [k, v] of Object.entries(over)) {
    const b = out[k]
    out[k] = typeof v === 'object' && v !== null && typeof b === 'object' && b !== null ? deepMerge(b, v) : v
  }
  return out
}
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !locales.includes(locale as Locale)) locale = 'fr'
  const own = (await import(`../../messages/${locale}.json`)).default as Msgs
  const messages = locale === 'de' || locale === 'sv'
    ? deepMerge((await import('../../messages/en.json')).default as Msgs, own)
    : own
  return { locale, messages }
})
```
`getTranslations({ locale, namespace })` (used by every page) goes through the same request config, so pages, `generateMetadata`, JSON-LD and the layout all get the merged messages. Create `messages/de.json` and `messages/sv.json` (even `{}`) before the first deploy: the dynamic `import()` fails otherwise. The `[locale]/layout.tsx` check `locales.includes(locale as 'fr' | 'en')` must be widened (use `Locale`). Pages here do not call `setRequestLocale` and read per-request locale via the middleware header; no `generateStaticParams` change is needed beyond `locales.map` (now four) and there is no need to introduce `setRequestLocale` (pages already pass `locale` explicitly to `getTranslations`; adding it would not help because `getMessages()` in the layout is request-bound). Keep this as is.

### Pattern 5: Slug-aware, published-only LanguageSwitcher
The current component strips `^/(fr|en)` from `next/navigation`'s `usePathname()` and re-links with `Link locale`. With slugs this produces `/de/restaurant-francais-krabi` (FR slug under DE), which the middleware would redirect, costing a hop and, worse, listing unpublished locales.
Rewrite: `usePathname()` from `next/navigation` -> strip the locale prefix -> reverse-lookup the page key by the current locale's slug (`PAGES.find(p => slugFor(p.key, locale) === rest)`), then render only `publishedLocales(key)` (plus the current locale), each `href = '/' + loc + slugFor(key, loc)` as a plain `<a>`/`Link` with `locale` prop omitted (the href already has the prefix; use `next/link` or an `<a hrefLang>`). If `< 2` locales are published, return `null` (existing behaviour, replaces the `availableLocales` prop; keep the prop as optional override or delete it and update `SiteHeader`, home page and the landing page that passes `availableLocales={['en']}`). The locale cookie sync that next-intl `Link` performs is irrelevant (`localeDetection: false`).
Edge case: on an **unpublished** page (e.g. `/de/menu` before publication) show the switcher with the locales published for that page; the current DE locale is not clickable-to-itself but must still render as `aria-current`. Home (`''`) has `usePathname()` equal to `/de`: key `''`.

### Pattern 6: Shared landing template (D-03)
Factor `french-restaurant-krabi/page.tsx` (7 sections: hero, intro, dishes, wines, story, find us, closing CTA) into `SeoLandingPage` driven by a small per-page config; message namespace per page; **slot keys, not arrays**, so the flat-key parity test keeps working:
```typescript
// src/components/seo/pages.config.ts
export const LANDING = {
  '/romantic-dinner-krabi': {
    namespace: 'romanticDinner',
    heroImage: '/exterior-entrance.jpg',                    // existing photos only (D-12)
    sections: [{ id: 'ambiance', paras: 2 }, { id: 'table', paras: 2, image: '/food-bourguignon.jpg' },
               { id: 'occasion', paras: 1 }],
    related: ['/french-restaurant-krabi', '/wine-belgian-beer-krabi', '/where-to-eat-krabi-town'],
  },
  // ...
} as const
// messages: romanticDinner.eyebrow, h1, subtitle, ctaBook, ctaMenu, heroAlt,
//           sections.ambiance.title, sections.ambiance.p1, .p2, ..., closingTitle
```
Keep `meta.<pageKey>Title` / `meta.<pageKey>Description` in the shared `meta` namespace (D-10 phase 2 pattern: `meta.frenchRestaurantTitle` exists). Keep the existing `frenchRestaurant` namespace and its test (`tests/landing-page.test.ts` reads that page source) unless you deliberately migrate: migrating the French page into the shared component is optional; do it last and update `landing-page.test.ts` (it asserts `notFound()` count, `locale !== 'en'`, `availableLocales={['en']}`, which will legitimately change when FR/DE/SV are added). Reuse tokens already used (`BTN_GOLD`, `H2`, `PROSE`, `TEXT_LINK`), `GcDivider`, `RestaurantJsonLd` (home and french-restaurant only; for the other pages add a `BreadcrumbList` Server Component, 2 levels, real names only).
Page rule: `if (!contentLocales.includes(locale)) notFound()`; `generateMetadata` returns `{}` in that case (existing pattern). The two EN-only pages stay 404 in fr/de/sv. Every internal link to a page the locale does not publish must be hidden (RelatedGuides filters on `isPublished(key, locale)`; nav filters likewise).

### Pattern 7: Header "Guides" submenu and "À découvrir" block (D-04)
`SiteHeader` today shows only logo, switcher and the Book button (no nav links, nothing on mobile). The **home page does not use `SiteHeader`**: it has its own fixed `<nav>` (hand-built, `role="menubar"` with `menuitem`, which is an ARIA misuse for a site nav). Add the Guides entry in both: a client `GuidesMenu` (button `aria-expanded`, `aria-controls`, Escape closes, list of `Link`/`<a>` to published pages for the current locale, minimum 44px targets, same tokens). On mobile place it in the same row as the Book button only if width allows; otherwise render it as a stacked section in the footer plus the "À découvrir" block (D-04 allows this: footer repeats links). Computing `guidesFor(locale)` in the Server Component and passing `{label, href}[]` as props keeps `seo.ts` out of the client bundle.
Cross-links: `RELATED` map in the page config, 2-3 entries, filtered by `isPublished(key, locale)`, titles from `meta.<key>Title` is too long for link text, so add a short `nav.<key>` label key (all four languages) used by both Guides and the footer. Reservation CTA via `href="/{locale}#reservation"` string (home hash link, see Pitfall 3).

### Anti-Patterns to Avoid
- **Typed `pathnames` on `createNavigation`:** forces object hrefs everywhere and breaks `"/#reservation"` strings; slug table makes it redundant.
- **Hand-written `/${locale}/...` strings in components:** always `slugFor`/`localeUrl`; a test greps for literal slugs.
- **`alternates` in the locale layout:** existing test forbids it; keep.
- **Listing `de` in `PUBLISHED_PAGES` "ahead of time":** never; hreflang to a noindex page is an invalid cluster.
- **Using the `.be` TripAdvisor URL or the 5 decorative stars:** see Pitfall 8.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Translated URL rewrite/redirect | Custom middleware regex tables | next-intl `pathnames` in `defineRouting` | Handles rewrite, cross-locale redirect and unknown paths (verified in installed source) |
| hreflang/canonical/sitemap alternates | Per-page literals | `pageLanguages`/`localeUrl`/`PUBLISHED_PAGES` | Already one source of truth; extend, don't fork |
| Message fallback | try/catch per `t()` | One `deepMerge` over `en` in `request.ts` | Prevents key-path leaking into production HTML |
| Slug transliteration | A library | Hand-written ASCII slugs in the registry | Only 3 pages x 3 locales; avoids a dependency and umlaut/encoding issues |
| Publication gate | A manual checklist | `PUBLISHED_PAGES` + a Vitest test requiring a signed review file | Mechanical, fails the build (`npm run build` runs vitest) |
| Review PDF for concierge | New PDF toolchain | Reuse the approach of `scripts/generate-review-print.mjs` (existing PDF generation in repo) | Already offline and tested; check its deps before choosing |

**Key insight:** every risk in this phase is a consistency risk (slug vs hreflang vs sitemap vs nav vs switcher). One registry plus tests that iterate over it removes that class of bug.

## Runtime State Inventory

Not a rename phase, but two items behave like state:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `gecko_reservations.locale` check allows fr/en/de/sv already (migration 008); `gecko_marketing_consents.locale` is free text | None for DB; fix backend zod/email types (code edit) |
| Live service config | Google Business Profile, TripAdvisor, Facebook, Trip.com, Wanderlog hold the site URL / NAP; GBP "website" URL | Audit and correct via OPS-04/05 with owner approval (data change, not code) |
| OS-registered state | None - verified: no scheduler or service references the site paths | None |
| Secrets/env vars | None - no new env var; sitemap/robots are code | None |
| Build artifacts | Print PDFs `docs/print/*` carry `geckocabanerestaurant.com/review?src=qr`; unchanged (alias paths are not changing) | DE text of QR supports to be reviewed by the same reviewer (D-09) |

Also: **previously indexed URLs**: `/fr/french-restaurant-krabi` was never published (existing sitemap test asserts it is never listed), so the new 307 to the FR slug costs nothing. The new FR slugs have no history.

## Common Pitfalls

### Pitfall 1: Reservation form rejects de/sv visitors
**What goes wrong:** `ReservationForm` posts `locale: useLocale()`; `reservation-schema.ts` has `z.enum(['fr','en'])`, so `/de` and `/sv` submissions return 400; `phoneCountryForLocale('de')` falls to `'TH'`; `EmailLocale` is `'fr'|'en'`.
**How to avoid:** extend the enum to `['fr','en','de','sv']`; `phoneCountryForLocale`: `de -> 'DE'`, `sv -> 'SE'` [VERIFIED: validation.ts shows only fr/en mapped]; email copy: map `de`/`sv` to `en` copy until D-09 DE email copy is delivered (store the real `de`/`sv` in the DB, use `emailLocale = locale === 'fr' ? 'fr' : 'en'` for copy). Update `tests/reservation-schema.test.ts`, `resend-locale.test.ts`.
**Warning signs:** a 400 from `/api/reservations` on `/de`. Add a test: schema accepts `de` and `sv`.

### Pitfall 2: LanguageSwitcher and hard-coded `(fr|en)` regexes
`LanguageSwitcher` (regex), `[locale]/layout.tsx` (`'fr' | 'en'` cast, `alternateLocale: [OG_LOCALE[other]]` with a single `other`), `review-links.ts` (`ReviewPageLocale = 'fr'|'en'`), `sitemap` test regex `(fr|en)`. Grep the repo for `fr|en`, `'fr' | 'en'`, `LOCALES`/`locales` after widening. In the layout, drop `alternateLocale` (per-page metadata owns it) or compute from published locales; Next metadata merging is shallow.

### Pitfall 3: Typed hrefs and hash links (only if you choose typed pathnames)
With `pathnames` on `createNavigation`, `<Link href="/#reservation">` fails type-check and the build (`next build` type-checks). String hrefs not equal to a key are passed through unlocalized (`compileLocalizedPathname` looks up `pathnames[hrefString]`). Hence the recommendation to keep navigation untyped. Existing hash/string hrefs: `/#reservation` (french page, menu page, SiteHeader), `/menu#vins-bieres-belges` via variable `belgianHref`, `/#menu` (not-found), `/` (many). All keep working unchanged.

### Pitfall 4: hardcoded-French guard vs DE/SV/FR content
`tests/i18n-hardcoded.test.ts` fails on accented characters in `.tsx/.ts` under `src/components` and `src/app/[locale]`. Keep every DE/SV/FR string in `messages/*.json` and every slug ASCII (`franzoesisches`, `diner`, `ou`). `ä ö ü` are in the regex; `å` is not (SV is not guarded, but keep literals out anyway). The BANNED_PHRASES list contains 'Horaires', 'Accueil', 'La Carte': do not put those literals in a component (use keys), including in `docs`-like constants under `src/components`.

### Pitfall 5: Unpublished page is reachable but must stay out of every signal
Check all emitters: metadata robots, canonical/hreflang, `sitemap.ts`, JSON-LD `url`/`hasMenu` (`RestaurantJsonLd` uses `localeUrl(locale)` and `localeUrl(locale,'/menu')`: on `/de` before `/de/menu` is published it would reference an unpublished URL: use `isPublished('/menu', locale) ? localeUrl : localeUrl('en','/menu')` or omit `hasMenu`), OG `url`, the switcher, nav/Guides, cross-links, footer links, and `x-default` (never an unpublished locale). Add one test that, for every (page, locale) with `index: true`, all hreflang targets are published and reciprocal.

### Pitfall 6: Review alias and DE review page
Aliases `/review`, `/avis`, `/bewertung` live outside `[locale]` and are excluded from next-intl in `middleware.ts`; unchanged. `mapLanguage` in `review-links.ts` maps `de`/`sv` to `en` (D-10 phase 4) and `tests/review-links.test.ts` asserts it. Lifting for `de` (D-09) means: `ReviewPageLocale` += `'de'`, `mapLanguage('de') = 'de'` **only when DE review text is published**; gate behind a constant (e.g. `REVIEW_LOCALES = ['fr','en']`, add `'de'` at publication) so the test change ships with the publication commit. The review page itself is `noindex` and not in `PUBLISHED_PAGES`; its "publication" is the constant plus the signed review file.

### Pitfall 7: Next/`generateStaticParams` and build time
`generateStaticParams` returns four locales; pages call `getOpeningHours()`/`getMenu()` (DB) and the layout calls request-bound `getMessages()`, so they render dynamically; no build-time DB access is introduced. Do not add `export const dynamic = 'force-static'`.

### Pitfall 8: TripAdvisor link and unverifiable star graphic
The home page link at `src/app/[locale]/page.tsx:548` is `https://fr.tripadvisor.be/...` (OPS-04). Replace with a `TRIPADVISOR_URL` exported from `seo.ts` (derived from the existing `SAME_AS` `.com` entry, same pattern as `GOOGLE_PLACE_URL`) and extend `tests/seo-no-legacy-domain.test.ts` to ban `tripadvisor.be`. The same card renders five static gold stars with no data behind them, which conflicts with PROJECT.md ("aucune affirmation non vérifiable"); social-proof content is phase 5's scope, so **flag to the planner/owner** rather than silently changing it (Open Question 4).

### Pitfall 9: Alcohol: Thai law and Google policy
PAGE-06 and weekly Google posts promote wine and Belgian beer. Thai Alcoholic Beverage Control Act B.E. 2551 s.32 prohibits advertising or displaying an alcohol brand name/symbol/trademark in a way that shows properties or persuades to drink; press reports penalties up to one year jail and/or 500,000 THB [CITED: ilct.co.th/?p=13507, en.wikipedia.org/wiki/Alcohol_advertising_in_Thailand, bangkokpost.com/thailand/general/1931376; MEDIUM, unverified against the current statute text; amendments were being discussed in 2022]. Google Business Profile posts policy lists alcohol among regulated industries: "you can post about a regulated business, but not about the regulated products themselves" [CITED: support.google.com/business/answer/7390603]. CLAUDE.md lists the Excise Act B.E. 2560 as applicable law. **Recommendation:** write PAGE-06 as a restaurant-pairing guide with generic style descriptions (abbey ale, pale ale, red/white), no brand logos/photos of labelled bottles, no promotional ("drink") calls to action, keep named lists and prices on the existing `/menu#vins-bieres-belges`; keep alcohol out of Google posts; ask the owner to confirm with their licensing adviser before publication.

### Pitfall 10: Requirement text vs decisions
PAGE-03 says "menu dégustation pour deux"; D-12 forbids it (no defined offer). PAGE-04 says "adresses"; D-11 forbids named competitors. Decisions win (CONTEXT is newer and locked); the plan-checker/verifier must treat PAGE-03/04 as satisfied by the D-11/D-12 reading, otherwise it will flag false gaps.

### Pitfall 11: Slug length and keyword stuffing
Keep slugs 3-6 words, lowercase, hyphens, no stop-word chains; the page `title` ≤ ~60 chars and description 120-165 chars (existing test uses 120-165 for home). Do not repeat `krabi` more than once in H1.

## Code Examples

### Sitemap (slug-aware, unchanged shape)
```typescript
// src/app/sitemap.ts  - body unchanged; correctness comes from localeUrl/pageLanguages being slug-aware
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLISHED_PAGES.flatMap((page) =>
    page.locales.map((locale) => ({
      url: localeUrl(locale, page.path),
      alternates: { languages: pageLanguages(page.path, page.locales) },
    }))
  )
}
```
Note `pageLanguages` default argument `locales = LOCALES` must NOT default to all four now (it would emit unpublished de/sv): make `locales` required or default to `[]`-guarded; the current default is a latent bug once LOCALES grows.

### Per-page metadata with noindex gate
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (LOCALES as readonly string[]).includes(raw) ? (raw as SeoLocale) : 'fr'
  if (!contentLocales.includes(locale)) return {}
  const t = await getTranslations({ locale, namespace: 'meta' })
  const seo = resolvePageSeo(KEY, locale)
  if (!seo.index) {
    return { title: { absolute: t('romanticDinnerTitle') }, description: t('romanticDinnerDescription'),
             robots: { index: false, follow: true } }
  }
  return buildPageMetadata({ locale, path: KEY, locales: publishedLocales(KEY),
    title: t('romanticDinnerTitle'), description: t('romanticDinnerDescription'), absoluteTitle: true })
}
```

### Keyword-driven slug proposal (no search volumes asserted)
Rationale = the query a traveller types in that language, transliterated to ASCII, using the term already used in the EN URL as the anchor. Not verified with a keyword tool (no volume data available in this session); the owner can sanity-check with Google autocomplete in each language. [ASSUMED]

| Page (key = EN slug) | FR | DE | SV (socle) | Rationale |
|---|---|---|---|---|
| `french-restaurant-krabi` (fixed) | `restaurant-francais-krabi` (D-01 example) | `franzoesisches-restaurant-krabi` (D-01 example) | `franskt-restaurang-krabi` | "restaurant français Krabi" / "französisches Restaurant Krabi" are the literal category queries |
| `romantic-dinner-krabi` | `diner-romantique-krabi` | `romantisches-abendessen-krabi` | `romantisk-middag-krabi` | "dîner romantique" / "romantisches Abendessen" are the idiomatic phrases (not "romantisches Dinner") |
| `where-to-eat-krabi-town` | `ou-manger-krabi-town` | `wo-essen-krabi-town` | `var-ata-krabi-town` | Question-form queries; `krabi-town` kept to match the town-level intent |
| `getting-here-from-ao-nang` | EN only | EN only | EN only | D-07 |
| `wine-belgian-beer-krabi` | EN only | EN only | EN only | D-07 |

`/menu`, `/privacy` stay identical in all locales (already published in FR/EN; "menu" is understood in DE/SV and avoids a 301). If the owner prefers `speisekarte`, it would require a redirect plan: not recommended.

### Updated `PUBLISHED_PAGES` (publication state, edited by hand at each publication)
```typescript
export const PUBLISHED_PAGES = [
  { path: '', locales: ['fr', 'en'] },
  { path: '/privacy', locales: ['fr', 'en'] },
  { path: '/menu', locales: ['fr', 'en'] },
  { path: '/french-restaurant-krabi', locales: ['fr', 'en'] },        // FR added in this phase
  { path: '/romantic-dinner-krabi', locales: ['fr', 'en'] },
  { path: '/where-to-eat-krabi-town', locales: ['fr', 'en'] },
  { path: '/getting-here-from-ao-nang', locales: ['en'] },
  { path: '/wine-belgian-beer-krabi', locales: ['en'] },
  // 'de' appended per page, only with docs/ph6/review/de/<page>.md signed
] as const
```
Warning: an FR page must be listed **only when its FR content ships** (do not forecast); the EN page for a not-yet-merged plan must not be listed early either.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-intl `Link` typed with `pathnames` everywhere | Optional: `pathnames` on middleware/routing only, untyped navigation with own slug table | next-intl v4 supports both | Less churn here; documented as valid ("Without `pathnames`, you pass a final string") [CITED: next-intl.dev/docs/routing/navigation] |
| `Link` header hreflang from next-intl | `alternateLinks: false` + Metadata API / sitemap | already in repo | Required: some pages exist in a subset of locales [CITED: next-intl.dev/docs/routing/configuration] |
| FAQ rich results for local businesses | Google restricted FAQ rich results to authoritative government/health sites (2023) | 2023 | Do not add FAQ JSON-LD for SEO value [ASSUMED] |

**Deprecated/outdated:** the `menu` property of Restaurant JSON-LD stays absent (existing decision); `middleware.ts` file convention is still `middleware.ts` in this repo on Next 16.1.6 (works; do not rename in this phase).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | FR/DE/SV slugs and their keyword rationale (no volume data) | Code Examples | Weaker targeting; cheap to change before publication, costly (301) after |
| A2 | Google restricted FAQ rich results in 2023 | State of the Art | Only affects optional structured data |
| A3 | Google post text limit 1,500 chars, 58-char title for event/offer, 150-300 chars recommended (Google's own page states no limits; third-party sources) | Out-of-code | Posts could be truncated/rejected; write short (under 300) |
| A4 | Thai ABCA s.32 reading applies to menu/page copy naming beer brands | Pitfall 9 | Legal exposure for the owner; needs advisor confirmation |
| A5 | claude-in-chrome extension is available in the owner's session for TripAdvisor/NAP | Environment Availability | Fallback: owner pastes ready texts manually |
| A6 | Blog/guide contact routes other than Faszination Südostasien (Petit Futé, Travelfish, Marco Polo) | Out-of-code | Messages sent to wrong channel; owner must verify each route |
| A7 | 307 redirect (not 308) for cross-locale slug mismatch | Pattern 2 | Source shows `NextResponse.redirect` default (307); harmless either way |
| A8 | `setRequestLocale` not needed because pages are dynamic | Pattern 4 | If the owner later enables static rendering for these pages, add it |

## Open Questions

1. **Alcohol compliance for PAGE-06 and Google posts**
   - What we know: Thai ABCA s.32 and Google's regulated-products rule (Pitfall 9).
   - What's unclear: whether naming Belgian beer styles/brands with prices on a web page counts as advertising for this restaurant; current statute text.
   - Recommendation: planner adds a `checkpoint:human-verify` before publishing PAGE-06; draft with generic style descriptions; exclude alcohol from posts.

2. **DE email copy scope (D-09)**
   - Lifting `de` fallback for emails implies a `COPY.de` block in `src/utils/resend.ts` (customer pending/confirmed, review-invitation and reminder emails) plus human review. Sizeable and not in REQUIREMENTS.
   - Recommendation: schedule as the last DE task, gated on the same reviewer; if the deadline slips, ship DE pages with emails still falling back to EN and record it.

3. **Who reviews DE, and when?** Owner supplies the reviewer (D-06); unknown turnaround. Plan DE/SV as independent waves so the 1 Nov deadline for EN/FR pages never depends on them.

4. **Static five-star block in the home TripAdvisor card**: unverifiable rating-like graphic; phase 5 owns social proof. Recommend asking the owner whether to remove it now (one-line change) or leave it to phase 5.

5. **Facts for getting-here-from-ao-nang (D-10)**: prices/durations/times must come from the owner; plan a task that is blocked until the owner supplies them and ship the page with "approximate" wording or omit numbers meanwhile.

6. **Spec file `Specs site Gecko Cabane – SEO et conversion.md`** referenced by CONTEXT was not found in the repo root (`ls` shows no such file); the planner should ask the owner where it is if page content needs it.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node/npm + Vitest | build gate, tests | yes (existing project builds with `vitest run && next build`) | repo-pinned | — |
| next-intl 4.8.3 | routing | yes | 4.8.3 | — |
| claude-in-chrome extension | OPS-04/05 (TripAdvisor/NAP edits) | not verifiable from this session [ASSUMED] | — | Owner pastes the prepared texts manually; same checklists |
| Owner-supplied DE reviewer | I18N-01/02 | unknown | — | Pages stay noindex, unlisted |
| Owner-supplied ground-transport facts | PAGE-05 | pending | — | Approximate wording or omit figures |
| Existing photos in `public/` | PAGE-03/04 | yes (`food-*.jpg`, `chef-jariya.jpg`, `exterior-*.jpg`, `hero-bg.jpg`) | — | — |

**Missing dependencies with no fallback:** none blocking code work.
**Missing dependencies with fallback:** reviewer, transport facts, browser extension (above).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0, node environment |
| Config file | `vitest.config.ts` (includes `tests/**/*.test.ts`; **has** the `@` -> `./src` alias, so tests may import `@/utils/seo`; existing tests use relative paths, both work) |
| Quick run command | `npx vitest run tests/seo-pages.test.ts tests/seo-sitemap-robots.test.ts tests/i18n.test.ts` |
| Full suite command | `npm test` (= `vitest run`; also runs in `npm run build`) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAGE-03..06 | Each page has registry entry, folder `src/app/[locale]/<key>/page.tsx`, one `<h1>` via shared component, title/description keys exist in `meta` for each content locale, desc 120-165 chars | unit/source-scan | `npx vitest run tests/seo-landing-pages.test.ts` | Wave 0 (new) |
| PAGE-07 | Every page links to `#reservation`, Guides lists exactly the published pages, `RELATED` targets exist and are published in that locale | unit | same file | Wave 0 |
| PAGE-08 | FR title/description/namespace keys exist; FR slug for the 4 pages; FR in `PUBLISHED_PAGES` only with content | unit | `tests/seo-slugs.test.ts` | Wave 0 |
| D-01/D-02 | `localeUrl` for EN of published pages is byte-identical to the old URLs (`/en/french-restaurant-krabi`); FR/DE slugs ASCII, lowercase, hyphen only, unique per locale; `buildPathnames()` has no EN entries | unit | `tests/seo-slugs.test.ts` | Wave 0 |
| I18N-01/02 gate | For each (page, de/sv) in `PUBLISHED_PAGES`: namespace complete in that locale vs `en`, and `docs/ph6/review/<loc>/<page>.md` exists with a checked sign-off line and date | unit | `tests/i18n-publication-gate.test.ts` | Wave 0 |
| Noindex | `resolvePageSeo(key, locale).index === false` for every unpublished (page, locale) combination; true iff listed | unit | `tests/seo-slugs.test.ts` | Wave 0 |
| Hreflang | For every published (page, locale): hreflang targets are all published, include self, reciprocal, `x-default` is a published locale; never contains an unpublished locale | unit | `tests/seo-sitemap-robots.test.ts` (update) | exists, update |
| Sitemap | Entries equal the expansion of `PUBLISHED_PAGES` via slug table; no `/de`/`/sv` until listed; update the hard-coded "exactly 7 URLs" and the regex `(fr|en)` | unit | `tests/seo-sitemap-robots.test.ts` | exists, update |
| i18n parity | fr<->en strict (existing); de/sv keys subset of en keys (no orphans); `language.de`/`language.sv` present in fr/en | unit | `tests/i18n.test.ts` (extend) | exists, extend |
| No hardcoded French | unchanged guard still passes with new components | unit | `tests/i18n-hardcoded.test.ts` | exists |
| Middleware routing | `routing.ts` options (`localePrefix: 'always'`, `localeDetection: false`, `alternateLinks: false`), alias set unchanged, matcher still excludes sitemap/robots | source-scan | `tests/middleware-matcher.test.ts` (update to read `routing.ts`) | exists, update |
| Routing behaviour | `defineRouting` import is pure: assert `routing.pathnames['/french-restaurant-krabi'].fr === '/restaurant-francais-krabi'` | unit | `tests/seo-slugs.test.ts` | Wave 0 |
| Switcher | Pure helper `switcherTargets(pathname, locale)` returns only published locales with correct slugs (extract the logic into a pure function in seo.ts to test it) | unit | `tests/seo-slugs.test.ts` | Wave 0 |
| Reservation de/sv | Schema accepts `de`/`sv`; `phoneCountryForLocale('de') === 'DE'` | unit | `tests/reservation-schema.test.ts` | exists, extend |
| TripAdvisor URL | No `tripadvisor.be` in `src`; home link uses `TRIPADVISOR_URL` | source-scan | `tests/seo-no-legacy-domain.test.ts` | exists, extend |
| OPS-02..07 | `docs/ph6/*.md` exist, contain required sections, canonical NAP block matches `seo.ts` JSON-LD values (phone `+66819585945`, address string), each outreach file states "Statut : non envoyé" | doc-scan | `tests/ph6-docs.test.ts` | Wave 0 |
| Message-source tests that break by design | `tests/landing-page.test.ts` (asserts EN-only, `availableLocales={['en']}`, `notFound()` count), `tests/seo-pages.test.ts` (`locales: ['en']`), `tests/review-links.test.ts` (de->en), `tests/seo-sitemap-robots.test.ts` ("exactly 7", "never lists FR landing", `/de|/sv` negative) | — | update in the same task that changes the behavior | exists |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/seo-slugs.test.ts tests/seo-sitemap-robots.test.ts tests/i18n.test.ts`
- **Per wave merge:** `npm test` then `npm run lint`
- **Phase gate:** `npm run build` green (it runs vitest then `next build`, which type-checks) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/seo-slugs.test.ts` - slug table, pathnames derivation, noindex resolver, switcher helper, hreflang reciprocity
- [ ] `tests/seo-landing-pages.test.ts` - page folders, shared component wiring, meta keys, cross-link targets
- [ ] `tests/i18n-publication-gate.test.ts` - de/sv completeness and signed review files
- [ ] `tests/ph6-docs.test.ts` - doc structure and NAP canonical block
- [ ] Extend `tests/i18n.test.ts` (de/sv subset rule, language keys), `tests/seo-sitemap-robots.test.ts`, `tests/middleware-matcher.test.ts`
- [ ] Create `messages/de.json`, `messages/sv.json` (even empty objects) so `request.ts` imports succeed
- [ ] Framework install: none

**Manual-only (justified):** visual check of Guides menu on 360px width; DE/SV linguistic review (human by constraint); GBP/TripAdvisor edits (external, owner-approved). Optional smoke after deploy: `curl -sI https://geckocabanerestaurant.com/fr/french-restaurant-krabi` expects 307 to the FR slug; `curl -s .../de/menu | grep -i "noindex"` before publication.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (admin untouched) | existing Supabase + middleware gate; keep the `/admin` branch above the intl middleware |
| V3 Session Management | no | existing cookie stamping via `withCookies` (unchanged) |
| V4 Access Control | no | admin guard unchanged |
| V5 Input Validation | yes | zod `reservation-schema` locale enum extended to `de`/`sv` (whitelist, not free text); review alias param whitelist unchanged |
| V6 Cryptography | no | none |
| V10/V14 Config & content | yes | no secrets in `docs/ph6`; no personal reviewer data committed |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Open redirect via locale/slug handling | Tampering | next-intl middleware builds redirects from its own table; `buildReviewRedirectPath` already whitelists locales (extend whitelist only, never accept raw input) |
| Information leak of unpublished content | Information disclosure | Noindex only hides from search, not from users; do not put unreviewed/confidential content in DE pages beyond the intended copy; keep drafts in `docs/ph6/review` (not served) |
| XSS via JSON-LD | Tampering | keep `serializeJsonLd` (escapes `<`) for any new JSON-LD (BreadcrumbList) |
| Unintended outbound contact (GDPR/PDPA, spam) | Repudiation | Outreach and concierge material are documents only; each carries "Statut : non envoyé"; no emails sent from code |
| Misleading claims (ratings/reviews) | Spoofing/legal | No `aggregateRating`, no invented rankings (D-11); flag the static stars (Pitfall 8) |

## Out-of-code Deliverables (`docs/ph6/`): structure and checklists

Nothing is sent externally. Every file starts with a header: `Statut : brouillon / validé par le propriétaire (date) / envoyé par le propriétaire (date)`.

**1. `nap-audit.md` (OPS-05)**
- Canonical block (from the code, one source): Name display `Gecko Cabane Restaurant` (JSON-LD `name`; site also uses `Gecko Cabane` as brand/alternateName: decide per surface and record the accepted variants); address `1/36-37 Soi Ruamjit, Maharat Road, Krabi Town 81000, Thailand` (site message `frenchRestaurant.address` and JSON-LD); phone `+66 81 958 5945` (display) / `+66819585945` (tel/JSON-LD); website `https://geckocabanerestaurant.com`; hours from the DB (do not hard-code: Tuesday closed, 12:00-22:00 per project context; verify against admin); contact email `geckocabanerestaurant@gmail.com` (privacy copy).
- Surface table, one row per surface x field: columns `Surface | URL | Name found | Address found | Phone found | Website link | Hours | Match? | Action | Owner OK | Done (date)`. Surfaces: site (hero/contact section, footer, `/privacy`, JSON-LD, OG image `opengraph-image.tsx`), Google Business Profile, TripAdvisor, Facebook, Trip.com, Wanderlog (+ Instagram bio as a bonus row). Rules: compare normalised phone digits, not formatting; flag `tripadvisor.be`, `http://`, old domains, and the `www` vs non-`www` form of the site URL.
- Method: read-only pass first (owner logged in, Chrome driven, screenshot per surface), table filled, discrepancies listed, then correction pass with owner approval before each click (D-17, phase 4 D-19).

**2. TripAdvisor update (OPS-04)** - checklist: Management Center > Manage Listing: description, contact details, map location verified, hours per day, up to five cuisine categories, photos (owner-chosen from `public/` originals), website link set to the `.com` page. Changes may take up to five business days to appear [CITED: tripadvisor.com restaurant owner guidance via search results; MEDIUM]. Ready-to-paste texts in EN and FR (keep description brief, mention "French restaurant in Krabi Town", no rating claims). Code side: home page link to `.com` (Pitfall 8).

**3. `google-posts-fr-en.md` (OPS-02)** - 4 weeks x (1 post) in FR + EN = 8 texts, rotating: plat de la semaine, soirée, offre basse saison. Fields per post: type (Update / Offer / Event), title (events/offers need a title and dates/times; Google shows an event without times as 24 h) [CITED: support.google.com/business/answer/7390603], body, photo filename (existing assets), CTA button (Reserve/Book -> `https://geckocabanerestaurant.com/fr#reservation` or `/en#reservation`), publish date, status. Limits to respect: write bodies under ~300 characters and event/offer titles under 58 (third-party figures, 1,500 max body) [MEDIUM/LOW: third-party]; Google's own page lists no numeric limits. Policy checks from Google's page: no phone numbers in the body unless verified on the profile (posts may be rejected) [CITED], no misspellings/low-value text, links only to the site, posts archive after 6 months, "regulated products" (alcohol) not the subject of posts [CITED]. The "offre basse saison" must be a real offer defined by the owner (no invented price/discount): leave `[A COMPLÉTER PAR LE PROPRIÉTAIRE]` placeholders.

**4. `review-replies.md` (OPS-03)** - templates FR/EN/DE x {5 stars, 3-4 stars, 1-2 stars, no text, complaint about wait, complaint about price, allergy/dietary mention}: each includes the phrase "French restaurant in Krabi Town" once (natural, not stuffed), thanks by first name placeholder `{prénom}`, no incentive/reward, no request to change or add a review, no personal data of the reservation, owner/chef signature, SLA note "répondre sous 48 h". DE templates go through the same human reviewer (note the review file path).

**5. `outreach-targets.md` (OPS-06)** - table `Target | Language | Contact route | Verified? | What to ask (listing/mention/update) | Message file | Status`. Findings:
 - Faszination Südostasien: Impressum lists an editorial e-mail and states it does not give general travel advice and welcomes correction hints; no collaboration policy on that page; "Werbung & PR" and "Partner" pages exist and must be read by the owner before contact [CITED: faszination-suedostasien.de/kontakt/; MEDIUM]. Do not paste the personal address into repo docs without the owner's OK (put "see Impressum").
 - Travelfish: contact page returned 403 to automated fetch; route unverified [LOW].
 - Petit Futé: no editorial-contact page found; check petitfute.com professional/"référencement" routes [LOW].
 - Marco Polo: not researched; verify the right editorial vs advertising route [LOW].
 - Rule: each message states plainly that the restaurant is the sender, asks for a factual listing/update (not paid coverage unless the owner wants advertising), FR/EN/DE variants, no commission or incentive language, one page of facts attached (name, NAP, hours, chef, link). Mark each route `A VÉRIFIER` until the owner confirms. No Gmail drafts (D-18).

**6. `concierge-dossier.md` + PDF (OPS-07)** - sections: one-page presentation (FR/EN), recommendation card (A6 print layout: name, 3-line pitch, address, phone/WhatsApp, QR to reservation with a tracking-neutral URL, map), how a concierge books for a guest (WhatsApp/phone/online form), group and special-occasion handling, partnership terms page **with the commission left as `[à définir par le propriétaire]`** (D-18), hotel target list split Krabi Town / Ao Nang as a checklist with `contact route / name / status` columns left empty for the owner (no scraped personal contacts), follow-up cadence. PDF: reuse the offline approach of `scripts/generate-review-print.mjs`; inspect its dependencies first (do not add a package without the legitimacy gate).

**7. DE/SV review documents** (`docs/ph6/review/de/<page>.md`): header (page key, URL, status), a two-column table FR | DE per message key (or per section), a "Corrections du relecteur" column, a final block `- [ ] Validé par écrit par : ____  Date : ____  Canal de la validation : ____`. The publication test requires `- [x]`. Reviewer remarks are applied to `messages/de.json` by Claude in a separate commit.

## Sources

### Primary (HIGH confidence)
- Repository source read this session: `src/i18n/*`, `src/middleware.ts`, `src/utils/seo.ts`, `src/app/sitemap.ts`, `src/components/{LanguageSwitcher,SiteHeader,SiteFooter,RestaurantJsonLd}.tsx`, `src/app/[locale]/{layout,page}.tsx`, `french-restaurant-krabi/page.tsx`, `menu/page.tsx`, `review/page.tsx`, `src/utils/{review-links,review-alias,validation,resend}.ts`, `src/utils/reservation-schema.ts`, `tests/*`, `vitest.config.ts`, `next.config.ts`, `messages/en.json`, `supabase/migrations/008_reservation_booking.sql`
- Installed next-intl 4.8.3 source (`node_modules/next-intl/dist/esm/development/middleware/{middleware,utils}.js`, `esm/production/navigation/shared/utils.js`, `dist/types/routing/{config,types}.d.ts`) - rewrite/redirect behaviour, `pathnames` typing, string-href passthrough
- https://next-intl.dev/docs/routing/configuration and https://next-intl.dev/docs/routing/navigation - `pathnames`, `alternateLinks`, `localePrefix`, typed `Link`, `usePathname` semantics
- https://support.google.com/business/answer/7390603 - post types, expiry, phone numbers, regulated products policy

### Secondary (MEDIUM confidence)
- https://www.faszination-suedostasien.de/kontakt/ - editorial contact and policy statements
- https://www.ilct.co.th/?p=13507, https://en.wikipedia.org/wiki/Alcohol_advertising_in_Thailand, https://www.bangkokpost.com/thailand/general/1931376/online-cases-spur-debate-over-alcohol-law - Thai alcohol advertising rule and enforcement reports
- TripAdvisor Management Center guidance via search results (tripadvisor.com/ForRestaurants pages, garestaurants.org)

### Tertiary (LOW confidence)
- Third-party Google post size/length figures (zernio, socialk.it, recurpost, postfa.st)
- Petit Futé, Travelfish, Marco Polo contact routes: not verified (Travelfish returned 403; others not found)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new packages; versions read from the install
- Architecture: HIGH - next-intl behaviour verified in installed source; repo structure read directly
- Pitfalls: HIGH for code pitfalls (read in repo), MEDIUM for alcohol/Google policy
- Slugs and keyword rationale: MEDIUM-LOW - judgement, no keyword-tool data
- Off-site procedures: MEDIUM (Google/TripAdvisor), LOW (blog routes)

**Research date:** 2026-10-17
**Valid until:** 2026-11-16 for code findings (stable); Google/TripAdvisor UI details may change sooner
