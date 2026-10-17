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

## Owner live checks

Recorded 2026-10-17: owner replied "live ok" after the live review of /en/menu, /en, /en/french-restaurant-krabi (checked via Chrome by Claude, then by the owner).
- Change requested during review: gluten-free is on request, so no per-dish flag. A menu-wide line was added to the allergy note (commit 08c497d, deployed). The chef gluten sheet (03-CHEF-GLUTEN-SHEET.csv) is no longer needed; `is_gluten_free` stays false everywhere.

## Content transcription (to approve)

Transcribed from the owner's photos (2026-10-17). Beer prices as on the sheet; wines have no bottle price on the sheet (shown with the note "Prix des vins : demandez à notre équipe."). The Wi-Fi code on the beer sheet is NOT published. Owner choices applied: Westmalle Brune 380, "Kasteel Rouge", non-Belgian beers in a separate category, no gluten-free flags (on request).

### Bières belges

| Name | Description | Price | Label |
|---|---|---|---|
| Duvel Blonde | 8,5° | 250 |  |
| Duvel Tripel Hop Cashmere | 9,5° | 280 |  |
| La Chouffe Blonde | 8° | 250 |  |
| Kasteel Rouge | 8° | 260 |  |
| Vedett IPA | 5,5° | 250 |  |
| St. Bernardus ABT 12 | 10° | 280 |  |
| St. Bernardus Tripel | 8° | 250 |  |
| St. Bernardus Wit | 5,5° | 250 |  |
| Bush Ambrée | 12° | 320 |  |
| Leffe Blonde / Brune | 6,6° / 6,5° | 200 |  |
| Hoegaarden Wit | 4,9° | 200 |  |

### Bières trappistes belges

| Name | Description | Price | Label |
|---|---|---|---|
| Chimay Gold (Blonde) | 4,8° | 250 |  |
| Chimay Rouge (Brune) | 7° | 280 |  |
| Chimay Bleue (Brune) | 9° | 300 |  |
| Rochefort Tripel | 11,3° | 300 |  |
| Westmalle Tripel | 9,5° | 300 |  |
| Westmalle Brune | 7° | 380 |  |
| Orval | 6,2° | 300 |  |

### Bières artisanales

| Name | Description | Price | Label |
|---|---|---|---|
| London Black Cab Stout | 4,5° | 280 |  |
| Muay Thai IPA | 5,5° | 190 |  |
| Muay Thai Pilsner | 4° | 190 |  |
| Muay Thai Wit | 5° | 190 |  |

### Vin de la maison

| Name | Description | Price | Label |
|---|---|---|---|
| Le verre (110 ml) |  | 190 |  |
| La carafe (1/2 litre) |  | 650 |  |

### Droit de bouchon

| Name | Description | Price | Label |
|---|---|---|---|
| Vin tranquille |  | 500 | par bouteille |
| Mousseux / boisson alcoolisée |  | 800 | par bouteille |

### Vins rouges français — note: Prix des vins : demandez à notre équipe.

| Name | Description | Price | Label |
|---|---|---|---|
| Les Barnabés – Olga Raffault | Chinon AOP, Vallée de la Loire |  |  |
| Domaine de Chézatte | Sancerre AOP, Vallée de la Loire |  |  |
| Domaine Stainmaier | Givry 1er Cru AOC, Bourgogne |  |  |
| Patriarche | Gevrey-Chambertin AOC, Bourgogne |  |  |
| Tremor | Juliénas AOP, Beaujolais |  |  |
| Château de la Chaize | Morgon, Beaujolais |  |  |
| Pfaff Tradition – Pinot noir vieilles vignes | Alsace AOC |  |  |
| Petite Ruche | Crozes-Hermitage AOP, Vallée du Rhône nord |  |  |
| Monier de la Sizeranne | Hermitage AOP, Vallée du Rhône nord |  |  |
| Domaine François Merlin | Côte-Rôtie AOP, Vallée du Rhône nord |  |  |
| La Fiole du Pape | Châteauneuf-du-Pape AOP, Vallée du Rhône |  |  |
| Père Anselme – Brotte | Châteauneuf-du-Pape AOP, Vallée du Rhône |  |  |
| La Bernardine | Châteauneuf-du-Pape AOP, Vallée du Rhône |  |  |
| Patriarche Endless Summer Pinot Noir | Pays d'Oc |  |  |
| Marius – Grenache Shiraz | Pays d'Oc |  |  |
| Plénitude – Plaimont | Madiran AOP |  |  |
| Château Eugénie – cuvée réserve | Cahors AOP |  |  |
| Gaspard – Grenache Mourvèdre Syrah | Terrasse du Larzac AOP |  |  |
| Mouton Cadet | Bordeaux AOP |  |  |
| Château Saint-Germain | Bordeaux Supérieur AOP |  |  |
| Château Haut-Landon | Bordeaux Supérieur AOP |  |  |
| Château Domeyne | Saint-Estèphe, Médoc AOC, Bordeaux |  |  |
| Château Bibian – Cru Bourgeois Supérieur | Listrac-Médoc AOC, Bordeaux |  |  |
| Château La Rose Picot | Médoc AOC, Bordeaux |  |  |
| L'Esprit de Bacchus | Médoc AOC, Bordeaux |  |  |
| Château Malbec | Entre-deux-Mers, Bordeaux AOC |  |  |
| Château Franc Couplet | Entre-deux-Mers, Bordeaux AOC |  |  |
| Château Cantelaudette | Graves de Vayres, Entre-deux-Mers, Bordeaux AOC |  |  |
| Château Treytins | Lalande de Pomerol, Bordeaux AOC |  |  |
| Château La Croix du Casse | Pomerol, Bordeaux |  |  |
| La Fugue de Nénin | Pomerol, Bordeaux |  |  |
| La Tour de Capet | Saint-Émilion Grand Cru AOC |  |  |
| Château du Barry | Saint-Émilion Grand Cru AOC |  |  |
| Château Montaiguillon | Montagne Saint-Émilion |  |  |
| Château Paret | Côtes de Bordeaux Castillon AOC |  |  |
| Château Petit Picoron | Côtes de Bordeaux Castillon AOC |  |  |

### Vins blancs français — note: Prix des vins : demandez à notre équipe.

| Name | Description | Price | Label |
|---|---|---|---|
| Queue de Morue | Muscadet sur Lie AOC, Vallée de la Loire |  |  |
| Domaine de Fiervaux – Chenin Blanc | Saumur AOC, Vallée de la Loire |  |  |
| Les Chantebines – Jean Pabiot | Pouilly-Fumé AOC, Vallée de la Loire |  |  |
| Antoine de la Farge | Menetou-Salon AOC, Vallée de la Loire |  |  |
| Saint-Bris | Auxerrois |  |  |
| Château de Maligny | Petit Chablis AOC |  |  |
| Louis Robin | Chablis AOC |  |  |
| Château de Maligny – Montmains | Chablis 1er Cru |  |  |
| Blason de Bourgogne | Saint-Véran, Bourgogne |  |  |
| Pfaff Tradition – Pinot gris | Alsace AOC |  |  |
| Pfaff Tradition – Riesling | Alsace AOC |  |  |
| Pfaff Tradition – Gewurztraminer | Alsace AOC |  |  |
| Invitare | Condrieu AOP, Vallée du Rhône nord |  |  |
| Domaine François Merlin | Condrieu AOP, Vallée du Rhône nord |  |  |
| La Fiole – Viognier | Pays d'Oc IGP |  |  |
| Marius – Viognier | Pays d'Oc IGP |  |  |

### Vins rosés français — note: Prix des vins : demandez à notre équipe.

| Name | Description | Price | Label |
|---|---|---|---|
| Château des Ferrages – Roumery | Côtes de Provence AOP |  |  |
| Château des Ferrages – Mon Plaisir | Sainte-Victoire |  |  |
| Côtes de Provence AOC |  |  |  |
| Marius | Pays d'Oc IGP |  |  |

### Bulles — note: Prix des vins : demandez à notre équipe.

| Name | Description | Price | Label |
|---|---|---|---|
| Louis Perdrier – Brut Excellence |  |  |  |
| Champagne Paul Dangin – Carte d'Or Brut |  |  |  |

### Uncertain lines (glare / handwriting) — please check
- "Tremor" (Juliénas): name partly hidden by glare.
- Rosés: the "Mon Plaisir" line read as "Sainte-Victoire"; a line "Côtes de Provence AOC" has no producer visible.
- Château Malbec / Franc Couplet / Cantelaudette: appellations read from a small print.
- "Domaine de Fiervaux", "Les Chantebines", "Invitare": spelling taken from the sheet.
- Kasteel Rouge is "Kastell Rouge" on the handwritten sheet; the bottle says Kasteel.

### Gluten-free
None: gluten-free is on request (menu-wide line already live). No flags in the SQL.

## Owner content received

2026-10-17: owner sent 6 photos in chat (wine shelves, Belgian beer bottles, handwritten "Belgium Beer" sheet, printed "Les français" wine list). Belgian list: yes. Gluten sheet: not needed (gluten-free is on request).

## Content approval

2026-10-17: owner replied "Approved as written" for the full transcription (9 categories, 84 items), including Westmalle Brune 380, "Kasteel Rouge", non-Belgian beers in a separate category, wines without prices and the note "Prix des vins : demandez à notre équipe.". Open questions list: none. Gluten-free: none (on request).

## Content applied

Run 2026-10-17. Connection string read into a shell variable only (never printed or written). Applied with `psql -v ON_ERROR_STOP=1 -f 03-CONTENT.sql` (file wraps its own BEGIN/COMMIT; no `supabase db push`).

- Run 1: BEGIN, 93 x `INSERT 0 1` (9 categories + 84 items), COMMIT.
- Run 2 (idempotency): BEGIN, 93 x `INSERT 0 0`, COMMIT (no-op).
- Read-only counts after run 1 and after run 2 (identical):
  - categories under `vins-bieres-belges`: 9 (approved: 9)
  - items under `vins-bieres-belges`: 84 (approved: 84)
  - `is_gluten_free` true: 0 (approved: 0, gluten-free on request)
  - page `vins-bieres-belges` `is_active`: false (stays inactive until owner activation)
  - total `gecko_menu_items`: 246 (162 existing + 84 new)
