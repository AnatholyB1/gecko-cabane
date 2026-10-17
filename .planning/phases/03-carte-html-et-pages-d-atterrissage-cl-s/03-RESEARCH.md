# Phase 3: Carte HTML et pages d'atterrissage clés - Research

**Researched:** 2026-10-17
**Domain:** Next.js 16 App Router Server Components + Supabase anon read, schema.org Menu JSON-LD, hreflang for an EN-only page
**Confidence:** HIGH (codebase facts verified by reading; schema.org verified against schema.org)

## Summary

The phase is mostly composition on top of patterns that already exist in the repo: a cached anon-client read (`src/utils/opening-hours.ts`), `buildPageMetadata`, a Server Component JSON-LD (`RestaurantJsonLd`), and a localized page model (`privacy/page.tsx`). No new package is needed.

Five facts in CONTEXT.md are wrong or incomplete and change the plan:

1. **Migration number.** CONTEXT says "migration 009", but `009_rate_limits.sql` through `012_drop_phone_verifications.sql` already exist. The new file must be **013**. `tests/migrations.test.ts` enforces a strictly consecutive 3-digit sequence from 007.
2. **Existing tests will fail and must be updated in the same plan as the code.** The build runs `vitest run` first.
   - `tests/seo-jsonld.test.ts:103` asserts `hasMenu` is ABSENT from the Restaurant JSON-LD.
   - `tests/seo-sitemap-robots.test.ts` asserts exactly 4 URLs and that every entry has fr+en+x-default alternates.
   - `tests/seo-metadata.test.ts` asserts `PUBLISHED_PATHS` equals `['', '/privacy']`, and its `describe.each` runs over `PUBLISHED_PATHS`.
   - `tests/seo-pages.test.ts` has a metadata wiring scan.
3. **LanguageSwitcher links to a non-existent page.** It blindly links `/fr/french-restaurant-krabi` from the EN page, which would 404 and break D-14.
4. **No shared header.** The nav is inline in `src/app/[locale]/page.tsx` with `#anchors` only. `/menu` and the landing page need their own minimal nav or a small shared component.
5. **Cache invalidation.** Hours already use a `revalidateTag` pattern. The menu needs the same, otherwise admin edits would take up to the TTL to appear on `/menu`.

**Primary recommendation:** Build `getMenu()` as an `unstable_cache` anon read tagged `'menu'` (mirror `opening-hours.ts`). Render it in a Server Component `MenuSections` on `/[locale]/menu`. Call `revalidateTag('menu','max')` from the four admin menu mutation routes. Add `is_gluten_free` in migration **013**. Extend `buildPageMetadata` with an optional `locales` argument for the EN-only landing page. Seed the Belgian page as **inactive** until the owner supplies the list.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Le contenu réel (noms, producteurs/brasseries, formats, prix) **est fourni par le propriétaire** (une photo de la carte des vins suffit). Rien n'est inventé ni rédigé « plausible ». La section ne part pas en production avant réception de la liste.
- **D-02:** Nouvelle **page de menu `Vins & bières belges`** (5e entrée de `gecko_menu_pages`, slug dédié) avec ses catégories (vins rouges / blancs / rosés, bières belges…). Gérable depuis l'admin existant ; PAGE-06 (phase 6) pourra la réutiliser. L'actuelle catégorie « Bières » (Chang, Leo, Singha, Heineken) et « Champagne & crémant (verre) » restent où elles sont.
- **État constaté en base (2026-10-17) :** 4 pages (Ardoise, La Carte, Boissons, Cocktails), 27 catégories ; aucune bière belge ni aucun vin (seulement Champagne 650 ฿ et Crémant/Vouvray 350 ฿ au verre).
- **D-03:** Nouvelle colonne **`is_gluten_free boolean not null default false`** sur `gecko_menu_items` (migration 009, idempotente comme la baseline 007/008), case à cocher dans le formulaire admin d'article, picto et légende « sans gluten », types `MenuItem` / `MenuItemFormData` mis à jour dans `src/types/database.ts`. (NOTE researcher: file number must be 013, see Summary.)
- **D-04:** **Sécurité allergies : aucun plat n'est marqué sans gluten par défaut.** Claude prépare une feuille d'export des 162 articles ; la **cheffe Jariya** marque les plats ; le flag n'est posé qu'après sa confirmation. Les plats non confirmés restent non marqués.
- **D-05:** Les allergènes restent affichés en **texte HTML** (champ `allergens` existant), visibles sans survol. La description, elle, n'apparaît aujourd'hui qu'au survol (`opacity-0 group-hover`) : à corriger pour `/menu`.
- **D-06:** `/menu` est **rendu côté serveur** (Server Component, lecture Supabase anon) : tous les plats sont dans le HTML initial. **Une seule longue page avec sections ancrées** (Ardoise, La Carte, Boissons, Cocktails, Vins & bières belges) et une navigation d'ancres collante. Pas d'onglets cachés.
- **D-07:** Prix en bahts en texte (`{price} ฿`), `price_label` conservé ; descriptions visibles sans survol pour être lisibles par Google et sur mobile.
- **D-08:** Langue : **UI en next-intl (fr/en), noms de plats et descriptions en français** tels que stockés (conforme à D-12 de la phase 2). Pas de colonnes `name_en` / `description_en` dans cette phase. Titres de sections/catégories : ceux de la base (français).
- **D-09:** Sur l'accueil, la section carte devient un **teaser avec lien vers `/menu`** (mise en avant de l'Ardoise, bouton « Voir la carte complète »). `/menu` est la page canonique de la carte, pas de contenu dupliqué sur l'accueil. `MenuDisplay` (client) n'est plus monté sur l'accueil.
- **D-10:** `hasMenu` (URL `/menu` de la locale) est ajouté au JSON-LD Restaurant ; `/menu` est ajouté au sitemap (`PUBLISHED_PATHS`) avec `alternates.languages` fr/en ; metadata via `buildPageMetadata` et namespace `meta`.
- **D-11:** **Versions légères, la phase 5 les améliore.** Avis : note Google 4,7 / 1 062 avis en texte simple avec lien vers la fiche, **sans `aggregateRating`** ni citations inventées. Histoire : section « À propos » existante. Accès : adresse, horaires et lien Google Maps. Le title EN est déjà posé en phase 2 : à vérifier, pas à refaire.
- **D-12:** Angle : **cuisine française authentique par un couple franco-thaï** à Krabi Town. Contenu : intro, plats signatures (bourguignon, velouté, poulet crème côté français ; massaman côté thaï), vins et bières belges (lien vers la section de `/menu`), histoire du couple, situation Maharat Road, **CTA de réservation** vers `#reservation`. Pas d'angle « dîner romantique » (réservé à PAGE-03).
- **D-13:** Photos : **uniquement l'existant** : `food-bourguignon.jpg`, `food-massaman.jpg`, `food-poulet-creme.jpg`, `food-veloute.jpg`, `chef-jariya.jpg`, `exterior-entrance.jpg` / `exterior-sign.jpg`. Alt descriptifs via next-intl.
- **D-14:** La page est publiée **en EN** ; son équivalent FR relève de PAGE-08 (phase 6). Tant que la version FR n'existe pas, la page n'est ni dans le sitemap ni en hreflang pour `fr` ; sitemap en `en` seulement, canonical auto-référent, `x-default` vers l'EN.

### Claude's Discretion
Structure des composants (`MenuSections` serveur, légende de pictos), style de la navigation d'ancres, ordre des sections de la page landing, textes de meta (title/description) de `/menu` et de la page french-restaurant, noms des clés i18n, numérotation du fichier de migration, forme exacte du JSON-LD `hasMenu` (sans affirmation non vérifiable), liens de navigation vers `/menu` et la page landing (header/footer).

### Deferred Ideas (OUT OF SCOPE)
- Colonnes `name_en` / `description_en` : phase 6.
- Mention « espèces, cartes, PromptPay » et frais carte : phase 5 (MENU-03).
- Preuve sociale complète, « Qui sommes-nous » complet, « Comment venir » avec carte intégrée : phase 5 (CONV-01/02/03).
- `aggregateRating` : phase 5, seulement avec de vrais avis affichés.
- Version FR de french-restaurant-krabi, romantic-dinner, wine-belgian-beer : phase 6.
- Nouvelles photos de plats.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MENU-01 | `/menu` en HTML : plats, prix en bahts, pictos végétarien / sans gluten / épicé, allergènes | Cached anon `getMenu()` + server `MenuSections`; migration 013; admin form + API whitelist; price formatting; legend |
| MENU-02 | Section vins et bières belges | New inactive-until-filled menu page (slug `vins-bieres-belges`); owner-data blocker; anchor nav skips empty pages |
| PAGE-01 | Accueil enrichi, title EN | Title already in `meta.homeTitle` and tested; add light reviews/access blocks; teaser replaces `MenuDisplay` |
| PAGE-02 | `/en/french-restaurant-krabi` | New route, EN-only metadata variant, sitemap en-only, 404 on `/fr/...`, LanguageSwitcher fix |
| SEO-03 (carry-over) | `hasMenu` in Restaurant schema | `hasMenu` accepts URL/Menu/Text (schema.org); URL string recommended for home; full Menu on `/menu` optional |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Next.js 16 App Router, TypeScript strict, Tailwind v4 (`bg-(--var)` syntax, `gc-*` tokens), Supabase, next-intl. No migration away.
- Every visible string in `src/app/[locale]/` and `src/components/` goes through next-intl; keys must exist in BOTH `messages/fr.json` and `messages/en.json` (parity and non-empty are tested). Admin stays fixed French.
- `tests/i18n-hardcoded.test.ts` scans `src/components/**` and `src/app/[locale]/**` for accented French characters outside comments and for banned phrases ("La Carte", "Horaires", "Notre Histoire", "Accueil", etc.). Use `// i18n-ignore: reason` only for non-visible values. The EN namespaces `about, cuisine, menuSection, gallery, hoursSection, contactSection, hero, common, footer` must contain no French accents (except `velouté`, `Gecko Cabane`).
- `npm run build` = `vitest run && next build`: tests gate deploys.
- Never expose service role client-side; validate API input; return `{ error }` without stack traces.
- Code style: 2-space, single quotes, no semicolons, trailing commas.
- Anything published or sent to a third party needs owner approval. No unverifiable claims in schema (no `aggregateRating`, no invented review quotes).
- GSD workflow enforcement: edits only through GSD execution.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Menu HTML (all dishes in initial HTML) | Frontend Server (SSR) | Database | D-06; crawlers must see content without JS |
| Menu data read | Database (RLS public read) | Frontend Server (cached fetch) | Anon key + `Public read` policies exist on all three menu tables |
| Menu cache invalidation | API / Backend | Frontend Server | Admin mutation routes call `revalidateTag` |
| `is_gluten_free` column | Database | API (whitelist) | Migration 013 plus POST/PUT field handling |
| Gluten flag authoring | Admin (client page) | API | Checkbox in `admin/menu/[pageId]/page.tsx` |
| Metadata / hreflang / sitemap | Frontend Server | none | `buildPageMetadata`, `sitemap.ts` |
| JSON-LD `hasMenu` | Frontend Server | none | Server Component script tag |
| EN-only page gating (`/fr/...` -> 404) | Frontend Server | Middleware | `notFound()` in page; middleware has no per-page knowledge |
| Anchor nav, sticky | Browser (CSS only) | none | `position: sticky`, no JS required |

## Standard Stack

No new dependencies. Everything below is already installed (verified in CLAUDE.md stack section and source).

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router, `unstable_cache`, `revalidateTag`, `generateMetadata` | Existing; hours cache already uses it [VERIFIED: node_modules/next/package.json] |
| next-intl | 4.8.3 | `getTranslations({locale, namespace})`, `Link` from `@/i18n/navigation` | Existing [VERIFIED: node_modules/next-intl/package.json] |
| @supabase/supabase-js | ^2.98.0 | Anon `createClient` inside cache scope | Same pattern as `src/utils/opening-hours.ts` [VERIFIED: codebase] |
| lucide-react | installed | `Leaf`, `Flame` already used; add `WheatOff` (or `Wheat`) for gluten-free | Already used by `MenuDisplay` [ASSUMED: `WheatOff` icon name exists in the installed lucide version; check `node_modules/lucide-react` before use] |
| vitest | ^4.1.0 | Tests | Existing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `unstable_cache` + tag | `export const revalidate = 3600` on the page | Simpler, but admin edits would lag up to 1 h and the hours route already established the tag pattern. Use the tag. |
| Cookie-bound `createClient()` from `utils/supabase/server` | Anon client | The cookie client reads `cookies()` and makes the route dynamic and cannot be used inside `unstable_cache`. Use anon. |

**Installation:** none.

## Package Legitimacy Audit

No external packages are installed in this phase. Not applicable. (If `WheatOff` is missing from the installed lucide-react, fall back to an inline SVG or text badge "GF"; do NOT bump the package.)

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
Googlebot / visitor
        |
        v
  middleware (Supabase session, next-intl locale routing, /admin guard)
        |
        +--> /[locale]/menu ------------------+
        |        generateMetadata -> buildPageMetadata (fr+en alternates)
        |        <MenuJsonLd?> (optional full Menu)           
        |        <MenuSections> (Server Component)
        |              |
        |              v
        |        getMenu() unstable_cache(tag 'menu', 3600s)
        |              |  anon supabase-js client
        |              v
        |        Supabase RLS public read: gecko_menu_pages / categories / items
        |
        +--> /[locale] (home) --> RestaurantJsonLd (adds hasMenu = localeUrl(locale,'/menu'))
        |        menu teaser (Ardoise highlight via getMenu(), link to /menu)
        |
        +--> /en/french-restaurant-krabi
                 locale !== 'en' -> notFound()
                 buildPageMetadata({locales:['en']}) -> canonical en, hreflang en + x-default(en)
                 CTA -> /en#reservation

Admin (client page) --> /api/menu/{pages,categories,items,reorder} (requireAdmin)
        |--> write DB --> revalidateTag('menu','max') --> next /menu request refetches

sitemap.ts: per-path locale list: '', '/privacy', '/menu' (fr+en); '/french-restaurant-krabi' (en only)
```

### Recommended Project Structure
```
src/
├── app/[locale]/menu/page.tsx                    # new, Server Component
├── app/[locale]/french-restaurant-krabi/page.tsx # new, EN only
├── components/MenuSections.tsx                   # new, server: sections + items + legend
├── components/MenuAnchorNav.tsx                  # new (server, plain <a href="#slug">), sticky
├── components/MenuDisplay.tsx                    # delete (or keep unused; D-09 unmounts it)
├── utils/menu.ts                                 # getMenu() cached read + MENU_TAG + types
├── utils/seo.ts                                  # + per-path locales, hasMenu
supabase/migrations/013_menu_gluten_free.sql      # new
tests/menu-*.test.ts                              # new
```

### Pattern 1: Cached anon menu read (mirror `opening-hours.ts`)
**What:** Three queries (pages, categories, items) assembled in memory, cached under tag `menu`.
**When:** Used by `/menu`, home teaser, and optionally JSON-LD.
**Example:**
```typescript
// src/utils/menu.ts  (pattern source: src/utils/opening-hours.ts in this repo)
import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import type { MenuPage, MenuCategory, MenuItem } from '@/types/database'

export const MENU_TAG = 'menu'
export type MenuPageWithContent = MenuPage & {
  categories: (MenuCategory & { items: MenuItem[] })[]
}

export const getMenu = unstable_cache(
  async (): Promise<MenuPageWithContent[]> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const [pages, cats, items] = await Promise.all([
      supabase.from('gecko_menu_pages').select('*').eq('is_active', true).order('display_order'),
      supabase.from('gecko_menu_categories').select('*').order('display_order'),
      supabase.from('gecko_menu_items').select('*').eq('is_available', true).order('display_order'),
    ])
    if (pages.error) throw pages.error
    if (cats.error) throw cats.error
    if (items.error) throw items.error
    // assemble; drop categories with no items and pages with no categories-with-items
    // (empty pages must not appear in the anchor nav)
    return /* ... */ []
  },
  ['gecko-menu'],
  { tags: [MENU_TAG], revalidate: 3600 },
)
```
Note: select explicit columns rather than `*` if desired; `created_at/updated_at` need not ship. Fetching all items with `.in('category_id', ids)` as `MenuDisplay` does is unnecessary; with 162 items a single `select` is fine and below the PostgREST default 1000-row cap [ASSUMED: default max rows 1000 on this Supabase project].

### Pattern 2: Invalidate on admin writes (mirror `api/hours/route.ts`)
After the successful write in POST/PUT/DELETE of `api/menu/pages`, `categories`, `items` and in `reorder`, call `revalidateTag(MENU_TAG, 'max')` (two-argument form used in this repo; verified by the existing test pattern `revalidateTag(OPENING_HOURS_TAG, 'max')`). Add a source-scan test like `seo-jsonld-wiring.test.ts` asserting each of the four route files contains the call.

### Pattern 3: Per-page locale list in SEO helpers (EN-only page)
`buildPageMetadata` currently hardcodes fr+en+x-default(fr). Add an optional `locales` argument (default `['fr','en']`). For `['en']`: `languages = { en: localeUrl('en', path), 'x-default': localeUrl('en', path) }`, canonical = self, and `openGraph.alternateLocale` omitted (an `fr_FR` alternate would point to a missing page). Keep defaults so existing `describe.each` tests keep passing for current paths.

```typescript
// src/utils/seo.ts (sketch)
export const PUBLISHED_PAGES = [
  { path: '', locales: ['fr', 'en'] },
  { path: '/privacy', locales: ['fr', 'en'] },
  { path: '/menu', locales: ['fr', 'en'] },
  { path: '/french-restaurant-krabi', locales: ['en'] },
] as const
// keep PUBLISHED_PATHS for the bilingual subset only so existing tests/consumers stay valid
export const PUBLISHED_PATHS = ['', '/privacy', '/menu'] as const
```
`sitemap.ts` then iterates `PUBLISHED_PAGES`, emitting one entry per listed locale, and `alternates.languages` containing only those locales plus `x-default` (fr when fr is present, else en). Update `seo-sitemap-robots.test.ts` (expected URL list = 6 bilingual + 1 EN-only = 7; alternates assertion becomes per-page) and `seo-metadata.test.ts` (`PUBLISHED_PATHS` equals `['', '/privacy', '/menu']`).

### Pattern 4: EN-only route
```typescript
// src/app/[locale]/french-restaurant-krabi/page.tsx
import { notFound } from 'next/navigation'
export async function generateMetadata({ params }) {
  const { locale } = await params
  if (locale !== 'en') return {}          // page 404s for fr; no metadata needed
  ...buildPageMetadata({ locale: 'en', path: '/french-restaurant-krabi', locales: ['en'], ... })
}
export default async function Page({ params }) {
  const { locale } = await params
  if (locale !== 'en') notFound()
  ...
}
```
`generateStaticParams` in the locale layout returns both locales, so `/fr/french-restaurant-krabi` would otherwise render. Either `notFound()` (recommended, simplest) or add `export function generateStaticParams() { return [{ locale: 'en' }] }` plus `dynamicParams = false` on the page. The `notFound()` check is enough and testable by source scan.

**LanguageSwitcher:** on this page the FR link must not point to the non-existent page. Recommended: accept an optional `availableLocales` prop (default all); when the current path is the EN-only one, render the FR link to `/fr` (home) or hide it. Simplest low-risk option: in the landing page, pass `availableLocales={['en']}` to hide the switcher, and add a test. [ASSUMED: owner prefers hiding to linking home; confirm if desired.]

### Pattern 5: JSON-LD `hasMenu`
schema.org `hasMenu` is valid on FoodEstablishment and expects `Menu`, `Text`, or `URL` [CITED: https://schema.org/hasMenu]. `MenuItem.offers` and `MenuItem.suitableForDiet` (Diet or RestrictedDiet) exist [CITED: https://schema.org/MenuItem]; `VegetarianDiet` and `GlutenFreeDiet` are RestrictedDiet members [CITED: https://schema.org/RestrictedDiet].

Recommended minimal, safe form (decision for planner):
- Restaurant JSON-LD (home): `hasMenu: localeUrl(locale, '/menu')` (URL string). Uses the locale-specific URL as D-10 says. No claim beyond "a menu exists at this URL".
- Optional richer Menu on `/menu` only: `{ '@type': 'Menu', '@id': ..., url, inLanguage: 'fr', hasMenuSection: [{ '@type':'MenuSection', name, hasMenuItem:[{ '@type':'MenuItem', name, description, offers:{ '@type':'Offer', price, priceCurrency:'THB' }, suitableForDiet: ['https://schema.org/VegetarianDiet', ...] }] }] }`.
  - Include `suitableForDiet` GlutenFree ONLY for items with the flag (chef-confirmed, D-04). Never infer.
  - Omit `offers` when `price` is null (items with only `price_label`).
  - Add `inLanguage: 'fr'` since names/descriptions are French on both locales (D-08).
  - Payload size: 162 items is roughly 40-60 KB of inline JSON; acceptable but it duplicates HTML. If kept, build it from the same `getMenu()` result, use `serializeJsonLd` (escapes `<`). Google does not generate a rich result for Menu; the value is entity clarity. Given the deadline, **the URL-string `hasMenu` satisfies SEO-03; the full Menu block is optional and should be a late, low-priority task.** [ASSUMED: Google shows no Menu rich result; not verified in this session.]
- Must update `tests/seo-jsonld.test.ts:103` (remove `hasMenu` from the forbidden list, keep `aggregateRating`, `menu`, `amenityFeature`) and add a positive assertion.
- `buildRestaurantJsonLd` already takes `locale`, so adding `hasMenu: localeUrl(locale, '/menu')` is a one-line change. The comment above it ("hasMenu/menu reintroduced in phase 3") should be updated.

### Pattern 6: Menu item rendering requirements (MENU-01 / D-05 / D-07)
- Render description and allergens always, never under `opacity-0 group-hover`.
- Price: `Number(item.price).toLocaleString('en-US')` style formatting without trailing `.00` (column is `numeric(10,2)`; PostgREST may return `650` or `650.00`) then ` ฿`. Keep `price_label` beneath. The existing `MenuDisplay` prints `{item.price}` raw: do not copy that.
- Pictos: Lucide icons with `aria-label` and a visible legend (veg / gluten-free / spicy). Keep text equivalents for screen readers and for "selectable text" criterion (legend text is HTML text). Optionally add visually-hidden text next to each icon (`<span className="sr-only">`) so extraction yields "Végétarien" in the DOM text for crawlers.
- Section headings: each `gecko_menu_pages` row becomes `<section id={page.slug}>` with `<h2>`; categories `<h3>`; items `<h4>` or `<li>` of a `<ul>`. Use ONE `<h1>` (translated page title) on `/menu`.
- Sticky anchor nav: plain `<a href="#slug">` in a `<nav aria-label>`; `position: sticky; top: 0` (or below any fixed header); add `scroll-margin-top` on sections to avoid sticky overlap. No client JS needed.
- Page/category/item names come from DB in French; page descriptions too (D-08). The `i18n-hardcoded` test scans source, not DB, so DB French is fine.
- Empty states: do not render empty pages/categories and skip them in the nav (the Belgian page is inactive until populated).

### Anti-Patterns to Avoid
- **Using the cookie-bound `createClient()` for the public menu read.** Makes route dynamic and breaks inside `unstable_cache`.
- **Keeping `MenuDisplay` mounted on the home page** (duplicate content, hidden descriptions; D-09 says remove).
- **Marking dishes gluten-free by default or by keyword guess.** Allergy safety (D-04). Migration default is `false`; no backfill UPDATE in the migration.
- **hreflang `fr` on the landing page** or sitemap entries for `/fr/french-restaurant-krabi`.
- **Hardcoding French/English UI strings in `[locale]` files or components** (test will fail).
- **Inventing Belgian wine/beer content** to make the section look populated (D-01).
- **`aggregateRating` or review quotes** in schema/home (D-11).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cache + invalidation | Custom in-memory cache | `unstable_cache` + `revalidateTag` | Existing pattern, serverless-safe |
| hreflang / canonical / OG | Per-page ad hoc `alternates` | Extended `buildPageMetadata` | Shallow metadata merge makes ad hoc objects error-prone |
| JSON-LD serialization | `JSON.stringify` in a script tag | `serializeJsonLd` | Escapes `<` (XSS via DB text such as dish descriptions) |
| Locale-aware links | `<a href="/en/...">` | `Link` from `@/i18n/navigation` | Locale prefix `always` |
| Idempotent migration | Plain `ALTER TABLE ADD COLUMN` | `add column if not exists` | Baseline convention; re-runnable |
| Sticky nav behaviour | JS scroll-spy | CSS sticky + anchors | No client bundle, works without JS for crawlers |

**Key insight:** every component this phase needs already has a precedent in the repo; the risk is in the surrounding test guards and in the owner-dependent data, not in new technology.

## Runtime State Inventory

Not a rename/refactor/migration phase in the sense of string renaming. One additive DB migration; relevant live-state notes:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Production Supabase has 162 items / 27 categories / 4 pages (CONTEXT). New column defaults all to `false`. | Migration 013 applied to the live DB by the owner/Supabase CLI; **code deploy must follow the migration** (select `*` and writes of `is_gluten_free` fail if column is absent). No data migration. |
| Live service config | Supabase project shared with another app; MCP route `api/mcp/route.ts` selects explicit menu columns (no `is_gluten_free`). | Optional: add `is_gluten_free` to the MCP tool select (not required). |
| OS-registered state | None | None |
| Secrets/env vars | `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` already used by the hours cache | None |
| Build artifacts | None | None |

## Common Pitfalls

### Pitfall 1: Migration number collision
**What goes wrong:** Creating `009_*.sql` as CONTEXT says.
**Why:** 009-012 exist (rate limits, revoke grants, consents, drop phone verifications).
**Avoid:** Name it `013_menu_gluten_free.sql`; `migrations.test.ts` requires consecutive numbers from 007 and `^\d{3}_[a-z0-9_]+\.sql$` names.
**Warning signs:** `uses a strictly increasing 3-digit sequence` test fails.

### Pitfall 2: Code deployed before the column exists
**What goes wrong:** Admin POST/PUT including `is_gluten_free` returns 500 (unknown column) in production.
**Avoid:** Plan an explicit owner/ops checkpoint: apply 013 to Supabase BEFORE merging/deploying the code that writes the column. Reads using `select('*')` are safe either way but the UI would show `undefined` flag (treat as false).

### Pitfall 3: Existing tests asserting the old state
See Summary item 2. Update in the same commit as the code: `seo-jsonld.test.ts` (hasMenu absent), `seo-sitemap-robots.test.ts` (4 URLs, fr/en/x-default alternates), `seo-metadata.test.ts` (PUBLISHED_PATHS), `seo-pages.test.ts` (add menu and landing wiring). Also `mcp-route-tables.test.ts` if the MCP select is touched.

### Pitfall 4: i18n-hardcoded guard
The new components contain visible text only via `t()`. Accented literals in JSX (e.g. "Vins & bières belges" as a literal, `alt="..."`) fail the scan. Anchor labels come from DB `page.name`, not literals. Keys for EN must have no French accents (`menuSection` and the landing namespace if added to the EN-accent test list; the test covers fixed namespaces only, but keep new EN text accent-free anyway). A `Belgian` or `béarnaise` word in EN text would be flagged only inside the listed namespaces; dish names are the allowed exception only for `velouté` / `Gecko Cabane`. If the landing page needs `bourguignon` etc., those are accent-free. For `velouté` reuse the allowed word.

### Pitfall 5: Banned phrase "La Carte"
`BANNED_PHRASES` includes "La Carte" and "Accueil" in source. Never write them as literals in components/pages (DB values are fine; messages JSON is not scanned).

### Pitfall 6: Stale home teaser
The Ardoise teaser reads `getMenu()`. If the "Ardoise" page is identified by name, a rename in admin breaks it. Identify by `slug` (verify the actual slug in the DB; CONTEXT does not give it) or by first active page by `display_order`. [ASSUMED: slug of Ardoise page unknown; confirm in DB.]

### Pitfall 7: Sticky nav under fixed header / hash scroll
Use `scroll-mt-*` on sections. The home page has a fixed 72px nav; `/menu` should have its own simple header (logo link home, language switcher, reserve CTA) rather than reusing the inline nav.

### Pitfall 8: LanguageSwitcher and EN-only page
See Pattern 4. Also `LanguageSwitcher` uses `usePathname` from `next/navigation` and rewrites the path; on `/en/french-restaurant-krabi` it would emit `/fr/french-restaurant-krabi`.

### Pitfall 9: Allergy-safety wording
Legend "sans gluten" is a safety claim. Add a short disclaimer line (translated) such as "ask your server about allergies; dishes are prepared in a kitchen that handles gluten" only if the owner confirms the wording. [ASSUMED: owner will want a disclaimer; wording needs owner/chef approval as it is a legal-ish statement.] Do not display the gluten-free picto for any item until the chef confirms (flag false by default).

### Pitfall 10: Sitemap/Google indexing of the Belgian section
Because MENU-02 requires the section to exist, and the page stays inactive until content arrives, success criterion 2 cannot be verified without the owner's list. Surface this as a hard blocker/checkpoint in the plan (data task: owner provides photo; Claude structures into rows; insert via admin or SQL seed with owner approval).

## Code Examples

### Migration 013 (idempotent)
```sql
-- 013_menu_gluten_free.sql
-- Phase 3 (MENU-01, D-03/D-04): chef-confirmed gluten-free flag. Default false: no dish is
-- marked until chef Jariya confirms (allergy safety). No backfill on purpose.
alter table public.gecko_menu_items
  add column if not exists is_gluten_free boolean not null default false;

-- Belgian wines & beers menu page (D-02). Inactive until the owner supplies the real list (D-01).
insert into public.gecko_menu_pages (name, slug, description, is_active, display_order)
select 'Vins & bières belges', 'vins-bieres-belges', null, false,
       coalesce((select max(display_order) from public.gecko_menu_pages), 0) + 1
where not exists (select 1 from public.gecko_menu_pages where slug = 'vins-bieres-belges');
```
Notes: `id` has a sequence default from the baseline (lines ~191-201) so the insert needs no id [VERIFIED: baseline]. `gecko_menu_pages.slug` has a unique constraint, so `where not exists` or `on conflict (slug) do nothing` is idempotent. RLS: admin can manage via existing policy; the migration runs as owner/role bypassing RLS. Because a new page is `is_active=false`, the admin needs a way to activate it: verify the admin pages list exposes an active toggle (the form data has `is_active`). Do not use a `using (true)` policy (migration test guard applies to PII tables only, but no new policy is needed anyway). Add a test in `migrations.test.ts`: 013 contains `add column if not exists is_gluten_free boolean not null default false`, contains no `update public.gecko_menu_items`, and the table is gecko_-prefixed.

### API whitelist (items route)
Add `is_gluten_free` to destructuring in POST and PUT, `is_gluten_free: is_gluten_free ?? false` in insert, and `if (is_gluten_free !== undefined) updateData.is_gluten_free = is_gluten_free` in PUT. Optionally validate `typeof === 'boolean'` (the CLAUDE.md rule asks for validation of inputs; existing code does not, so add a minimal boolean check for the new field).

### Admin form
`src/app/admin/menu/[pageId]/page.tsx`: add `is_gluten_free: false` in the initial `itemForm` state (line ~36-41), in the reset (~275-280), in `startEdit` (~321-326: `item.is_gluten_free ?? false`), in the PUT/POST body (~185-190), add a checkbox next to Végétarien/Épicé (~626-640) with label "Sans gluten (confirmé par la cheffe)", and an indicator in the item list (~701-702). Admin text stays French. Update `MenuItemFormData` and `MenuItem` in `src/types/database.ts`.

### Chef export sheet (D-04)
Generate a CSV (id, page, category, name, description, allergens, `sans_gluten_oui_non` blank) from an admin-authenticated read or a one-off script using the service role from a local machine (never committed, never client-side). Place it under `.planning/phases/03-*/` as a deliverable for the owner; contains no secrets. After the chef returns it, apply flags by a reviewed SQL `update ... where id in (...)` via owner-approved run (the live DB write is an external action: needs owner approval).

### Teaser on home
Replace `<MenuDisplay />` in the `#menu` section (page.tsx ~line 358) with a server-rendered teaser: first N items of the Ardoise category list from `getMenu()` (names + prices, text only), plus `<Link href="/menu">` button with translated label (`menuSection.seeFullMenu` key to add in both files). Keep `id="menu"` anchor so the existing `#menu` nav link still works, or retarget the nav link to `/menu`. Home page is currently a mostly-static server component, so adding `getMenu()` is fine.

### Landing page SEO content (D-12)
H1 should contain the target phrase naturally (e.g. "French restaurant in Krabi Town"). Meta title/description in the `meta` namespace keys `frenchRestaurantTitle` / `frenchRestaurantDescription` (EN accent-free; `seo-pages.test.ts` already asserts `en.meta` values have no accents; add length/phrase assertions: title contains "French restaurant" and "Krabi"). Keep the description 120-165 chars like home. Use `next/image` with existing files; alt via t(). Links: CTA to `/en#reservation` through `Link`, link to `/en/menu#vins-bieres-belges` (anchor id = slug), link to `/en/menu`. Per D-12 the Belgian section link should only render once the page is active; otherwise link to `/en/menu` only (avoid dead anchors). [ASSUMED: simplest is to link to `/menu` and add the `#slug` fragment once the owner data lands.]

Because the page is EN-only and FR-less, the page JSON-LD can be omitted; at most reuse `RestaurantJsonLd locale="en"` (fine, no new claims). Do not add Review/AggregateRating.

### Home enrichments (PAGE-01, D-11)
- Reviews: text block "Google 4.7 · 1,062 reviews" with link to the Google Maps place URL already in `SAME_AS` (`https://www.google.com/maps/place/?q=place_id:ChIJozpAo2GUUTARABLcICH3H7I`). Put numbers in i18n values with ICU placeholders or plain text; no schema. Existing `social` section links to the old `tripadvisor.be` URL (OPS-04 is phase 6; leave).
- Story: existing `#about` section; verify heading/CTA only.
- Access: existing `#contact` and `#hours` sections hold address/hours; add a visible Google Maps link ("Get directions", `https://www.google.com/maps/dir/?api=1&destination=...` or the place URL). Directions URL format [ASSUMED]; reusing the existing place URL is safer.
- Title check: `meta.homeTitle` EN is asserted in `seo-pages.test.ts` already; PAGE-01 verification = that test + view-source of `/en`.

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `menu` property | `hasMenu` supersedes `menu` [CITED: schema.org/hasMenu] | Use `hasMenu`; the existing test forbids `menu` — keep it forbidden |
| Client-fetched menu in `useEffect` | Server-rendered cached read | Crawlers see content; no loading spinner |
| `revalidateTag(tag)` | `revalidateTag(tag, 'max')` (as already used in this repo) | Follow the repo's call signature [VERIFIED: tests/seo-jsonld-wiring.test.ts] |

**Deprecated/outdated:** `MenuDisplay.tsx` (client tabs, hover-only descriptions) is superseded; remove or leave unused. If removed, check no other import (`grep MenuDisplay`).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | lucide-react has a `WheatOff` icon in the installed version | Standard Stack | Build break; check `node_modules/lucide-react` or use inline SVG / "GF" text badge |
| A2 | PostgREST max rows is 1000 so 162 items are fetched fully | Pattern 1 | Truncated menu; counts verified by Supabase count if in doubt |
| A3 | Google shows no rich result for Menu/MenuItem | Pattern 5 | Low; only affects whether to invest in full Menu block |
| A4 | Owner prefers hiding the language switcher (or linking FR home) on the EN-only page | Pattern 4 | UX choice; confirm |
| A5 | A gluten allergy disclaimer wording is wanted and needs owner/chef approval | Pitfall 9 | Legal/safety; confirm before shipping the picto |
| A6 | Slug of the Ardoise page is unknown; identify by display_order or confirm in DB | Pitfall 6 | Teaser could show the wrong page |
| A7 | Google Maps directions URL format | Home enrichments | Broken link; prefer existing place URL |
| A8 | Admin UI already exposes an `is_active` toggle for menu pages so the owner can activate the Belgian page | Migration notes | If not, activation needs SQL |

## Open Questions (RESOLVED)

1. **Belgian wine and beer list (blocking MENU-02). RESOLVED: plans 03-07/03-08 handle owner content; page stays inactive until then.**
   - Known: owner provides a photo (D-01); nothing in DB.
   - Unclear: delivery date vs 1 Nov deadline.
   - Recommendation: schedule the data-entry task last; build everything else with the page inactive; verification of criterion 2 is `human_needed` until content exists.
2. **Chef gluten-free confirmation timing. RESOLVED: legend entry only if at least one item flagged (plan 03-01).** Same dependency pattern; the code ships with all flags false, the legend and picto still render only where flagged. Decide whether the gluten-free legend shows when zero items are flagged (recommend: show legend only if at least one item is flagged, or show it with a note "being confirmed"; avoid implying coverage).
3. **Landing page FR counterpart: RESOLVED: LanguageSwitcher hidden on EN-only page (plan 03-05).** none now (D-14); confirm LanguageSwitcher handling (A4).
4. **Full Menu JSON-LD on `/menu`: RESOLVED: URL-only hasMenu (plan 03-02).** include now or defer (recommendation: URL-only `hasMenu` for P1; full block optional).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build/test | yes | v26.4.0 [VERIFIED: runtime output] | none needed |
| npm / vitest | tests | yes (repo deps) | ^4.1.0 | none needed |
| Supabase project (prod) | apply migration 013, data seed | yes (shared project) | n/a | Supabase CLI/dashboard; requires owner approval for live changes |
| Owner-supplied Belgian list / chef gluten sheet | MENU-02 / D-04 | not yet | n/a | Ship inactive/false defaults |

**Missing dependencies with no fallback:** Belgian wine/beer content for MENU-02 acceptance.
**Missing dependencies with fallback:** chef gluten confirmation (all flags stay false).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 (node env) |
| Config file | `vitest.config.ts` (`tests/**/*.test.ts`) |
| Quick run command | `npx vitest run tests/<file>.test.ts` |
| Full suite command | `npm test` (`vitest run`); `npm run build` also runs it |

Tests run in node env with no DOM: component behaviour is verified by source scan (like `seo-jsonld-wiring.test.ts`) or by pure-function tests. Keep new logic in pure functions (`utils/menu.ts` assemble/format helpers, `utils/seo.ts`) to make it unit-testable.

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MENU-01 | Price formatter outputs `650 ฿` (no `.00`), null price omitted | unit | `npx vitest run tests/menu-format.test.ts` | Wave 0 |
| MENU-01 | `assembleMenu` drops inactive/empty pages and unavailable items | unit | `npx vitest run tests/menu-assemble.test.ts` | Wave 0 |
| MENU-01 | `MenuSections` has no `opacity-0`/`group-hover`, no `'use client'`, uses getTranslations/sr-only text | source scan | `npx vitest run tests/menu-wiring.test.ts` | Wave 0 |
| MENU-01 | Migration 013 adds `is_gluten_free boolean not null default false` idempotently, no UPDATE on items | static SQL | `npx vitest run tests/migrations.test.ts` | extend |
| MENU-01 | Items route POST/PUT whitelist `is_gluten_free`; types updated | source scan | `npx vitest run tests/menu-wiring.test.ts` | Wave 0 |
| MENU-01 | Admin mutation routes call `revalidateTag(MENU_TAG, 'max')` | source scan | `npx vitest run tests/menu-wiring.test.ts` | Wave 0 |
| MENU-02 | Migration seeds `vins-bieres-belges` page inactive, idempotent | static SQL | `npx vitest run tests/migrations.test.ts` | extend |
| MENU-02 | Production data: page active with at least one category and item | manual (post-deploy) | view-source `/fr/menu` contains the section id | manual-only: depends on owner data |
| PAGE-01 | EN home title equals required string | unit | `npx vitest run tests/seo-pages.test.ts` | exists |
| PAGE-01 | Home no longer imports `MenuDisplay`; teaser links to `/menu` | source scan | `npx vitest run tests/menu-wiring.test.ts` | Wave 0 |
| PAGE-02 | `buildPageMetadata({locales:['en']})` -> only `en` + `x-default`(en), no `fr`/`fr_FR` alternate | unit | `npx vitest run tests/seo-metadata.test.ts` | extend |
| PAGE-02 | Sitemap has 7 URLs; landing is en-only with en+x-default alternates | unit | `npx vitest run tests/seo-sitemap-robots.test.ts` | update |
| PAGE-02 | Landing page 404s for non-en, has CTA to reservation, meta keys in `meta` namespace | source scan | `npx vitest run tests/seo-pages.test.ts` | extend |
| SEO-03 | Restaurant JSON-LD includes `hasMenu` = `https://geckocabanerestaurant.com/{locale}/menu`; still no `aggregateRating`, `menu`, `amenityFeature` | unit | `npx vitest run tests/seo-jsonld.test.ts` | update |
| i18n | fr/en parity, no empty values, no accented literals | unit | `npx vitest run tests/i18n.test.ts tests/i18n-hardcoded.test.ts` | exists |

### Sampling Rate
- **Per task commit:** `npx vitest run <touched test files>`
- **Per wave merge:** `npm test`, `npm run lint`
- **Phase gate:** `npm run build` green (runs vitest then next build), then manual checks below before `/gsd:verify-work`

### Manual verification (post-deploy)
- View-source `/fr/menu` and `/en/menu`: dish names, prices, allergens present in HTML (curl without JS).
- Rich Results Test / Schema validator on `/fr` and `/en` for `hasMenu`.
- `curl -I /fr/french-restaurant-krabi` returns 404; `/en/french-restaurant-krabi` returns 200 with a single canonical, `hreflang` only `en` and `x-default`.
- sitemap.xml lists the 7 URLs.
- Owner/chef confirmations for Belgian data and gluten flags.

### Wave 0 Gaps
- [ ] `tests/menu-format.test.ts`, `tests/menu-assemble.test.ts`, `tests/menu-wiring.test.ts` — new
- [ ] Update `tests/seo-jsonld.test.ts`, `tests/seo-sitemap-robots.test.ts`, `tests/seo-metadata.test.ts`, `tests/seo-pages.test.ts`, `tests/migrations.test.ts`
- [ ] Framework install: none needed

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (no new auth) | existing admin gate |
| V3 Session Management | no | existing |
| V4 Access Control | yes | `requireAdmin()` on all menu mutation routes (already present); new column inherits RLS; public read policies already `using (true)` for menu tables (non-PII) |
| V5 Input Validation | yes | Validate `is_gluten_free` is boolean in POST/PUT; DB text is rendered via React (auto-escaped) |
| V6 Cryptography | no | none |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stored XSS via dish name/description in JSON-LD script | Tampering | `serializeJsonLd` escapes `<`; never `dangerouslySetInnerHTML` raw menu text elsewhere |
| Mass assignment on items PUT | Tampering | Explicit field whitelist (existing pattern) |
| Service-role key leakage when producing the chef export | Info disclosure | Run locally, never commit key; or export through the authenticated admin GET |
| Allergy misinformation (flag wrongly true) | Safety/Repudiation | Default false, chef-confirmed only, no keyword inference, no backfill |
| Public menu read exposes unavailable/inactive content | Info disclosure | Filter `is_active` pages and `is_available` items (RLS is `using (true)`, so filtering is application-side; not sensitive) |

## Sources

### Primary (HIGH confidence)
- Codebase read in this session: `src/utils/seo.ts`, `src/utils/opening-hours.ts`, `src/components/MenuDisplay.tsx`, `src/components/RestaurantJsonLd.tsx`, `src/app/sitemap.ts`, `src/app/api/menu/items/route.ts`, `src/app/admin/menu/[pageId]/page.tsx`, `src/app/[locale]/{layout,page}.tsx`, `src/components/LanguageSwitcher.tsx`, `src/types/database.ts`, `supabase/migrations/*`, `tests/{i18n,i18n-hardcoded,migrations,seo-*}.test.ts`
- https://schema.org/hasMenu — expected types Menu, Text, URL; used on FoodEstablishment; supersedes `menu`
- https://schema.org/MenuItem — `offers`, `suitableForDiet`
- https://schema.org/RestrictedDiet — includes `GlutenFreeDiet`, `VegetarianDiet`

### Secondary (MEDIUM confidence)
- Next.js 16.1.6 and next-intl 4.8.3 versions from installed `package.json`; `revalidateTag(tag,'max')` signature taken from existing repo usage rather than re-read from Next docs this session.

### Tertiary (LOW confidence)
- Assumptions A1-A8 above.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps, all patterns already in repo
- Architecture: HIGH — mirrors existing hours cache and metadata helper
- Pitfalls: HIGH — test conflicts and migration numbering verified by reading files
- Schema details: MEDIUM-HIGH — verified on schema.org; Google behaviour not verified

**Research date:** 2026-10-17
**Valid until:** 2026-11-17 (stable stack; the deadline is 2026-11-01)
