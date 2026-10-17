# Phase 3 — Launch log

## Approval request

Prepared 2026-10-17. Nothing below has been applied to production yet.

### 1. Migration 013 (production database)
- Adds column `is_gluten_free` (boolean, default false) to `gecko_menu_items`. No dish is marked gluten-free.
- Adds one empty, inactive menu page "Vins & bières belges" (slug `vins-bieres-belges`).
- Additive only; nothing deleted; the live site keeps working. Applied BEFORE the code deploy.

### 2. English landing page copy (`/en/french-restaurant-krabi`)
Source: `messages/en.json` namespace `frenchRestaurant`, `meta.frenchRestaurant*`. Claims to confirm as true:
- Run by "Chef Jariya and her French husband"; "40 seats"; "closed on Tuesdays"; phone +66 81 958 5945.
- Address: 1/36-37 Soi Ruamjit, Maharat Road, Krabi Town 81000.
- Dish descriptions (bourguignon "braised in red wine with carrots and onions", velouté "finished with cream", chicken in cream sauce, massaman "mild and fragrant").
- "We pour French wines and a selection of Belgian beers" (not live on /menu until the real list is entered).

### 3. Home rating line
- EN "Google rating 4.7 / 5 · 1,062 reviews" / FR "Note Google 4,7 / 5 · 1 062 avis". Plain text, no schema `aggregateRating`.

### 4. Allergy line on /menu
- EN "Allergies: please ask our team for advice." / FR "Allergies : demandez conseil à notre équipe."

### 5. Deploy
- `git push origin master` → Vercel production, after `npm run build` passes.

## Owner approval

Recorded 2026-10-17 (owner replies in session):
- Migration 013 on production: approved
- Landing page copy and claims (section 2): approved as written
- Home rating line and allergy line: approved (no corrections)
- Production deploy: approved ("i approve next wave")

## Production DB push

Run 2026-10-17. Connection string read into a shell variable only (never printed or written).

- `supabase migration list`: remote 007..012 applied, 013 local only (pending); plus 26 foreign versions from the shared Supabase project.
- `supabase db push --dry-run`: fails with `LegacyDbPushMissingLocalError` (26 foreign remote versions absent locally; the CLI proposes reverting them). Same blocker as plans 01-09/01-10/01-11; reverting another app's history is outside the approval, so `db push` was not used. The only pending local migration is 013.
- Applied with the phase-1 method: `psql -v ON_ERROR_STOP=1 -1 -f supabase/migrations/013_menu_gluten_free.sql` (ALTER TABLE, INSERT 0 1), then `supabase migration repair --status applied 013`. Foreign versions untouched.
- Read-only verification (psql):
  - `is_gluten_free` on `public.gecko_menu_items`: is_nullable NO, default false.
  - rows with `is_gluten_free` true: 0 of 162 items.
  - `gecko_menu_pages` slug `vins-bieres-belges`: is_active false, display_order 4.
- Chef sheet `03-CHEF-GLUTEN-SHEET.csv`: 162 data rows (equals item count), header `id,page,category,name,description,allergens,is_available,sans_gluten_oui_non`, last column empty; `grep -ciE "postgres://|service_role|password"` = 0.

## Deploy & live probes

- Gate before push: `npm run build` (vitest then next build) exit 0; `npm run lint` exit 0 (0 errors, 7 pre-existing warnings).
- `git push origin master` (507c04a..da1888d) after the DB push. GitHub commit status for da1888d: success (Vercel). No Google Fonts failure, no retrigger needed. The new landing URL went from 404 to 200 on the 3rd poll (about 1 min).
- Probes (curl -s, raw HTML, https://geckocabanerestaurant.com):
  - `/fr/menu` 200, `/en/menu` 200; each contains "Bœuf bourguignon" (chef sheet id 1), 360 occurrences of "฿", `id="top"` present.
  - `opacity-0` occurs once per menu page, at the WhatsApp button tooltip, located after `</main>` (shared layout); none inside the menu content.
  - `id="vins-bieres-belges"` absent from `/fr/menu` (inactive page not rendered).
  - `/fr` JSON-LD `"hasMenu":"https://geckocabanerestaurant.com/fr/menu"`; `/en` JSON-LD `"hasMenu":"https://geckocabanerestaurant.com/en/menu"`.
  - `/en` title: `Gecko Cabane – French-Thai Restaurant in Krabi Town` (exact).
  - `/en/french-restaurant-krabi` 200; 1 canonical; alternates: hreflang en and x-default only.
  - `/fr/french-restaurant-krabi` 404.
  - `/sitemap.xml`: 7 `<loc>` (fr, en, fr/privacy, en/privacy, fr/menu, en/menu, en/french-restaurant-krabi); no `/fr/french-restaurant-krabi`.
- All probes pass.
