# Phase 3: Carte HTML et pages d'atterrissage cles - Pattern Map

**Mapped:** 2026-10-17
**Files analyzed:** 24 (12 new, 12 modified)
**Analogs found:** 22 / 24

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/utils/menu.ts` (new) | service/utility | CRUD read, cached | `src/utils/opening-hours.ts` | exact |
| `src/components/MenuSections.tsx` (new) | component (server) | transform/render | `src/components/MenuDisplay.tsx` (markup, pictos) | role-match (client to server) |
| `src/components/MenuAnchorNav.tsx` (new) | component (server) | render | `MenuDisplay.tsx` tab bar (lines 94-111) | partial |
| `src/app/[locale]/menu/page.tsx` (new) | route/page | request-response (SSR) | `src/app/[locale]/privacy/page.tsx` | exact |
| `src/app/[locale]/french-restaurant-krabi/page.tsx` (new) | route/page | request-response (SSR) | `privacy/page.tsx` + `[locale]/page.tsx` | role-match |
| small shared header for /menu and landing (new, e.g. `src/components/SimpleHeader.tsx`) | component | render | inline nav in `[locale]/page.tsx` lines 42-80 | partial |
| `supabase/migrations/013_menu_gluten_free.sql` (new) | migration | batch/DDL | `012_drop_phone_verifications.sql`, baseline 007 | role-match |
| `src/utils/seo.ts` (mod) | utility | transform | itself | exact |
| `src/app/sitemap.ts` (mod) | route | transform | itself | exact |
| `src/components/RestaurantJsonLd.tsx` (mod, none needed if `buildRestaurantJsonLd` only changes) | component | render | itself | exact |
| `src/components/LanguageSwitcher.tsx` (mod: `availableLocales` prop) | component (client) | event-driven | itself | exact |
| `src/app/[locale]/page.tsx` (mod: teaser, reviews, directions) | page | request-response | itself | exact |
| `src/components/MenuDisplay.tsx` (delete or leave unused) | component | n/a | n/a | n/a |
| `src/app/api/menu/items/route.ts` (mod: `is_gluten_free`, revalidate) | controller | CRUD | itself | exact |
| `src/app/api/menu/{pages,categories,reorder}/route.ts` (mod: revalidate) | controller | CRUD | `src/app/api/hours/route.ts` | exact |
| `src/app/admin/menu/[pageId]/page.tsx` (mod: checkbox) | admin page (client) | CRUD | itself | exact |
| `src/types/database.ts` (mod) | model/types | n/a | itself | exact |
| `src/app/api/mcp/route.ts` (optional select) | controller | request-response | itself | exact |
| `messages/fr.json`, `messages/en.json` (mod) | config | n/a | `menuSection`, `privacy`, `meta` namespaces | exact |
| `tests/menu-format.test.ts`, `menu-assemble.test.ts`, `menu-wiring.test.ts` (new) | test | n/a | `tests/seo-jsonld-wiring.test.ts` | exact |
| `tests/seo-jsonld.test.ts`, `seo-jsonld-wiring.test.ts`, `seo-sitemap-robots.test.ts`, `seo-metadata.test.ts`, `seo-pages.test.ts`, `migrations.test.ts` (update) | test | n/a | themselves | exact |
| chef export CSV (deliverable, one-off script) | utility | batch | none | none |
| Belgian wines/beers data seed | data | batch | none | none |

## Pattern Assignments

### `src/utils/menu.ts` (service, cached anon read)

**Analog:** `src/utils/opening-hours.ts` (whole file, 30 lines)

```typescript
import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import type { OpeningHoursRow } from '@/utils/seo'

export const OPENING_HOURS_TAG = 'opening-hours'

export const getOpeningHours = unstable_cache(
  async (): Promise<OpeningHoursRow[]> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { data, error } = await supabase
      .from('gecko_opening_hours')
      .select('day_of_week, is_open, open_time, close_time')
      .order('day_of_week', { ascending: true })
    if (error) throw error
    return (data ?? []) as OpeningHoursRow[]
  },
  ['gecko-opening-hours'],
  { tags: [OPENING_HOURS_TAG], revalidate: 3600 },
)
```

Copy as `MENU_TAG = 'menu'`, key `['gecko-menu']`, `revalidate: 3600`. Three queries (pages `is_active`, categories, items `is_available`, each ordered by `display_order`). Assembly logic: copy from `MenuDisplay.tsx` lines 53-62 (`pages.map(... categories.filter(c => c.menu_page_id === page.id).map(... items.filter(i => i.category_id === category.id)))`), then drop empty categories and empty pages. Export the pure `assembleMenu(pages, cats, items)` and a `formatPrice(price)` helper (strip `.00`, append ` ฿`) so they are unit-testable in node vitest. Keep the existing test constraints: no `utils/supabase/server`, no `SERVICE_ROLE`, no `createAdminClient`, contains `persistSession: false` and `revalidate: 3600`. Types from `@/types/database` (`MenuPage`, `MenuCategory`, `MenuItem`).

---

### `src/components/MenuSections.tsx` (server component, render)

**Analog:** `src/components/MenuDisplay.tsx`

Reuse pictos and typography. Do NOT copy `'use client'`, `useState`, tabs, or the hover-only description.

**Imports/pictos** (lines 4-5, 114-121, 156-177):
```typescript
import { Leaf, Flame } from 'lucide-react'
...
<Leaf size={16} strokeWidth={1.75} className="text-gc-celadon" aria-hidden="true" />
<Flame size={16} strokeWidth={1.75} className="text-gc-copper" aria-hidden="true" />
```
For server use `getTranslations({ locale, namespace: 'menuPage' })` (pattern from privacy page, below), not `useTranslations`. Add `<span className="sr-only">` text beside each icon (UI-SPEC). Gluten-free: check `ls node_modules/lucide-react/dist/esm/icons | grep wheat` before using `WheatOff`; fallback bordered "GF" badge.

**Category/item markup to adapt** (lines 131-143, 146-203):
```tsx
<h3 className="font-cinzel font-normal text-[20px] text-gc-text-dark tracking-wide mb-2">{category.name}</h3>
{category.description && (<p className="font-cormorant italic text-[16px] text-gc-text-mid ...">...)}
<div className="w-10 h-px bg-gc-gold mx-auto mt-4" />
...
<h4 className="...">{item.name}</h4>
{item.allergens && <p className="font-raleway text-[11px] tracking-[0.05em] ...">{item.allergens}</p>}
{item.price && <span>{item.price} ฿</span>}
{item.price_label && <span className="block ...">{item.price_label}</span>}
```
Required changes vs analog: line 180 `opacity-0 group-hover:opacity-100` must be removed (always visible); raw `{item.price}` replaced by `formatPrice`; allergens prefixed by translated label, color `text-gc-text-mid` (UI-SPEC), 12px; wrap items in `<ul>/<li>`; each page `<section id={page.slug} className="scroll-mt-28">` with `<h2>`; one `<h1>` only on the page. Legend shows gluten-free entry only if at least one item has `is_gluten_free`. Test guard: no accented French literals or banned phrases ("La Carte", "Horaires", "Accueil") in source (`tests/i18n-hardcoded.test.ts`); all text via `t()` or DB.

---

### `src/components/MenuAnchorNav.tsx` (server, sticky anchors)

**Analog:** tab bar in `MenuDisplay.tsx` lines 94-111 (styling only):
```tsx
className="font-cinzel text-[13px] tracking-[0.15em] uppercase px-8 py-3 transition-all border-r border-gc-aged last:border-r-0"
```
Replace `<button onClick>` with `<a href={`#${page.slug}`}>`; labels `page.name` (DB). `<nav aria-label={t('anchorNavLabel')}>` with `sticky top-0`, `overflow-x-auto`, `h-12`. No JS.

---

### `src/app/[locale]/menu/page.tsx` (page, SSR)

**Analog:** `src/app/[locale]/privacy/page.tsx`

**Imports / props / locale narrowing / metadata** (lines 1-8, 29-39):
```typescript
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { buildPageMetadata, LOCALES, type SeoLocale } from '@/utils/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const locale: SeoLocale = (LOCALES as readonly string[]).includes(raw) ? (raw as SeoLocale) : 'fr'
  const t = await getTranslations({ locale, namespace: 'privacy' })
  return buildPageMetadata({
    locale,
    path: '/privacy',
    title: t('metaTitle'),
    description: t('metaDescription'),
  })
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'privacy' })
```
Use `path: '/menu'`, keys in the `meta` namespace per D-10 (home uses `getTranslations({ locale, namespace: 'meta' })` and `t('homeTitle')`; add `menuTitle`/`menuDescription`). Note: the page layout uses `bg-gc-void` + `<main>`; /menu needs ivory body with jungle header per UI-SPEC. Data: `const menu = await getMenu()` (error falls to `error.tsx`; empty -> empty state copy). Optionally mount `RestaurantJsonLd` is not needed (the existing wiring test says it is rendered by home only; the "only JSON-LD emitter" test would also fail if a second component emitted `application/ld+json`, so update that test if a Menu JSON-LD is added).

---

### `src/app/[locale]/french-restaurant-krabi/page.tsx` (page, SSR, EN-only)

**Analog:** `privacy/page.tsx` (structure, metadata) plus `[locale]/page.tsx` (images, CTA anchors, `RestaurantJsonLd`).

Add per RESEARCH Pattern 4:
```typescript
import { notFound } from 'next/navigation'
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (locale !== 'en') return {}
  const t = await getTranslations({ locale: 'en', namespace: 'meta' })
  return buildPageMetadata({ locale: 'en', path: '/french-restaurant-krabi', locales: ['en'],
    title: t('frenchRestaurantTitle'), description: t('frenchRestaurantDescription') })
}
export default async function Page({ params }: Props) {
  const { locale } = await params
  if (locale !== 'en') notFound()
```
JSON-LD: `<RestaurantJsonLd locale="en" />` is optional (the "only emitter" test already allows the component, only the file list matters). Hours summary: use `getOpeningHours()` from `@/utils/opening-hours`. Images: `next/image` with the existing files in `public/`. Check how `[locale]/page.tsx` imports/uses `Image` for the exact props before writing. CTA via `Link` from `@/i18n/navigation` to `/` with hash, or plain `href="/en#reservation"`.

---

### `supabase/migrations/013_menu_gluten_free.sql` (migration)

**Analog:** `supabase/migrations/012_drop_phone_verifications.sql` (header comment style: file name, apply-order note, rationale) and baseline 007 (idempotent `if not exists`; slug unique constraint `gecko_menu_pages_slug_key`, lines 252-253). Naming: `^\d{3}_[a-z0-9_]+\.sql$`, strictly consecutive from 007; next free is **013** (CONTEXT said 009, which is wrong).

```sql
-- 012 header style
-- 012_drop_phone_verifications.sql
-- Apply ONLY after ... - phase 1 plan 01-11; D-02.
drop table if exists public.gecko_phone_verifications;
```
Use the SQL block from RESEARCH "Migration 013" (add column if not exists `is_gluten_free boolean not null default false`; insert inactive page `vins-bieres-belges` guarded by `where not exists`). No `UPDATE` on items. Apply to live DB before deploying code that writes the column.

---

### `src/utils/seo.ts` (mod)

Existing code to change:
- Line 22: `export const PUBLISHED_PATHS = ['', '/privacy'] as const` -> add `'/menu'`; add a `PUBLISHED_PAGES` array with per-path `locales` (RESEARCH Pattern 3).
- Lines 37-74 `buildPageMetadata`: add optional `locales?: readonly SeoLocale[]` (default `['fr','en']`). For `['en']`, build `languages` with `en` + `'x-default': localeUrl('en', path)` and omit `alternateLocale` (currently `alternateLocale: [OG_LOCALE[other]]` and `fr/en/x-default(fr)` hardcoded at lines 53-57, 66).
- Lines 142-144 comment and return object of `buildRestaurantJsonLd`: add `hasMenu: localeUrl(locale, '/menu'),` and update the comment ("hasMenu/menu reintroduced in phase 3 ..."). Keep `aggregateRating` and `menu` absent.

### `src/app/sitemap.ts` (mod)

Current (whole file, lines 6-19) uses `LOCALES.flatMap(locale => PUBLISHED_PATHS.map(path => ({ url, alternates: { languages: { fr, en, 'x-default': localeUrl('fr', path) } } })))`. Change to iterate `PUBLISHED_PAGES`, emitting one entry per listed locale and only listed locales plus `x-default` (fr if present, else en) in `languages`. Keep: no `lastModified`, `changeFrequency`, `priority`.

### `src/components/LanguageSwitcher.tsx` (mod)

Line 8 `export default function LanguageSwitcher()` and lines 18-40 map over `locales`. Add `availableLocales?: readonly string[]` prop; when it has a single entry, return `null` (landing page passes `['en']`, UI-SPEC). Client component; keep `'use client'`.

### `src/app/[locale]/page.tsx` (mod)

- Line 6 remove `import MenuDisplay from '@/components/MenuDisplay'`; line 358 `<MenuDisplay />` replaced by a server teaser (4 Ardoise items from `getMenu()` + `<Link href="/menu">`). Keep `<section id="menu">` and the eyebrow/title/`GcDivider`/description block (lines 341-357).
- Line 58 `{ href: '#menu', key: 'common.menu' }` -> retarget to `/menu` (this file uses plain `<a>` for hash links; use `Link` from `@/i18n/navigation` for the route). `src/app/[locale]/not-found.tsx:44` also links `/#menu`; leave or retarget.
- Home already does `const t = await getTranslations()` (line 28): new strings are `t('menuSection.seeFullMenu')` etc.
- Add reviews line and Google Maps button using `SAME_AS[0]` from `@/utils/seo`.

### `src/app/api/menu/items/route.ts` (mod)

Copy the existing field handling exactly, adding `is_gluten_free`:
- POST destructure (lines 44-55) add `is_gluten_free`; insert (line 82-84) add `is_gluten_free: is_gluten_free ?? false`.
- PUT destructure (109-121) add; (line 138-139) `if (is_gluten_free !== undefined) updateData.is_gluten_free = is_gluten_free`.
- Add a boolean type check (`typeof is_gluten_free !== 'boolean'` -> `{ error: ... }, { status: 400 }`).
- Auth/error pattern already in place: `const auth = await requireAdmin(); if (!auth.ok) return auth.response`; `Sentry.captureException(error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })`.

### Menu mutation routes: revalidation

**Analog:** `src/app/api/hours/route.ts` lines 59-62:
```typescript
    // Schema hours follow the admin within one request cycle (D-05)
    revalidateTag(OPENING_HOURS_TAG, 'max')

    return NextResponse.json({ success: true })
```
with `import { revalidateTag } from 'next/cache'` (line 5). Apply `revalidateTag(MENU_TAG, 'max')` after each successful write, before the success return, in POST/PUT/DELETE of `pages`, `categories`, `items` and POST of `reorder`. Note the hours test requires the call to appear exactly once per file; for menu routes use a source scan that asserts the call is present (3 handlers per file means multiple occurrences; do not copy the "exactly once" assertion).

### `src/app/admin/menu/[pageId]/page.tsx` (mod, admin French fixed)

Mirror every `is_spicy` occurrence: initial state line 39, PUT/POST body line 188, reset line 278, `startEdit` line 324, checkbox lines 633-640, list indicator line 702.
```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" checked={itemForm.is_spicy}
    onChange={(e) => setItemForm(p => ({ ...p, is_spicy: e.target.checked }))} />
  <span>🌶️ Épicé</span>
</label>
```
New label text: "Sans gluten (confirmé par la cheffe)". In `startEdit` use `item.is_gluten_free ?? false`.

### `src/types/database.ts` (mod)

Add `is_gluten_free: boolean` after `is_spicy` in `MenuItem` (line 100) and `MenuItemFormData` (line 129). `MenuCategory.items?: MenuItem[]` already exists (line 87).

### `messages/fr.json` / `messages/en.json`

Existing `menuSection` keys (en.json lines 55-64): `title, description, vegetarian, spicy, noItems, preparing, menuPreparing, eyebrow`. Add `seeFullMenu`, `glutenFree`, plus new namespaces `menuPage` and `frenchRestaurant` and `meta.menuTitle/menuDescription/frenchRestaurantTitle/frenchRestaurantDescription` in BOTH files. EN: no French accents (except `velouté`, `Gecko Cabane`), `tests/seo-pages.test.ts` asserts `en.meta` has none. Copy values from the UI-SPEC copywriting table.

### Tests

**Analog:** `tests/seo-jsonld-wiring.test.ts` (source-scan helpers, lines 4-18):
```typescript
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
```
Cache assertions (lines 20-33): copy for `utils/menu.ts` (`MENU_TAG = 'menu'`, `revalidate: 3600`, `persistSession: false`, no service role).

Existing tests that WILL fail and must be updated in the same plan:
- `tests/seo-jsonld-wiring.test.ts:98-102` (`never emits aggregateRating or hasMenu`; `expect(src).not.toMatch(/hasMenu\s*:/)`) -> drop `hasMenu` check, keep `aggregateRating`. (RESEARCH only mentioned `seo-jsonld.test.ts:103`; this second location is also present.)
- `tests/seo-jsonld.test.ts:103` (`for (const k of ['aggregateRating', 'hasMenu', 'menu', 'amenityFeature'])`) -> remove `hasMenu`, add positive `hasMenu` URL assertion.
- `tests/seo-sitemap-robots.test.ts:13-31` (exactly 4 URLs; every entry has fr/en/x-default(fr) alternates) -> 7 URLs, per-page alternates; EN-only entry has `en` + `x-default`(en).
- `tests/seo-metadata.test.ts:34` (`PUBLISHED_PATHS` equals `['', '/privacy']`) and the `describe.each` at line 43 (runs over `PUBLISHED_PATHS`) -> add `/menu`; add `locales:['en']` unit test.
- `tests/seo-pages.test.ts` (metadata wiring scan, EN meta accent check) -> add menu and landing.
- `tests/migrations.test.ts` -> add 013 assertions.
- `tests/i18n.test.ts` / `i18n-hardcoded.test.ts` apply automatically to new components.

## Shared Patterns

### Localized server page metadata
**Source:** `src/app/[locale]/privacy/page.tsx` lines 29-39 (shown above).
**Apply to:** `/menu` page, landing page.

### Cached anon public read + tag invalidation
**Source:** `src/utils/opening-hours.ts` and `src/app/api/hours/route.ts:59-62`.
**Apply to:** `utils/menu.ts`, all menu mutation routes.

### Admin route guard and error shape
**Source:** `src/app/api/menu/items/route.ts` lines 37-55, 90-98:
```typescript
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth
...
    if (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
```
**Apply to:** items/pages/categories/reorder edits (already present; keep).

### JSON-LD serialization
**Source:** `src/utils/seo.ts:177-179` `serializeJsonLd` (escapes `<`); `src/components/RestaurantJsonLd.tsx` (Server Component pattern, Sentry capture on failure).
**Apply to:** any Menu JSON-LD block (optional; `tests/seo-jsonld-wiring.test.ts:63-70` lists the single allowed emitter, update it if adding one).

### i18n
**Source:** `getTranslations({ locale, namespace })` (privacy/page.tsx), `Link` from `@/i18n/navigation`. All visible text via keys in both JSON files; `// i18n-ignore: reason` only for non-visible values; never literals "La Carte", "Accueil", "Horaires" in source.

### Tailwind v4 tokens
**Source:** `MenuDisplay.tsx` classes (`bg-gc-parchment`, `text-gc-text-dark`, `text-gc-text-mid`, `border-gc-aged`, `text-gc-celadon`, `text-gc-copper`, `font-cinzel`, `font-cormorant`, `font-raleway`). Use `bg-(--var)` syntax, never `bg-[var(--x)]`. Style: 2 spaces, single quotes, no semicolons.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| Chef gluten export sheet (CSV of 162 items) | utility | batch | No export scripts in repo; one-off local script or admin GET, never commit service-role key |
| Belgian wines/beers rows | data | batch | Owner-supplied content (D-01); insert via admin UI or owner-approved SQL |
| Shared small header component | component | render | Only an inline fixed 72px nav exists in `[locale]/page.tsx`; build new at 64px per UI-SPEC |

## Metadata

**Analog search scope:** `src/utils`, `src/components`, `src/app/[locale]`, `src/app/api/{menu,hours,mcp}`, `src/app/admin/menu`, `src/app/sitemap.ts`, `src/types`, `supabase/migrations`, `tests`, `messages`
**Files scanned:** about 25 (read in full or targeted ranges)
**Pattern extraction date:** 2026-10-17
