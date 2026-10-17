---
phase: 03-carte-html-et-pages-d-atterrissage-cl-s
verified: 2026-10-17T13:00:00Z
status: passed
score: 4/4 roadmap criteria verified (2 with documented owner-decision interpretations)
overrides_applied: 2
overrides:
  - must_have: "/menu shows sans gluten pictos per dish"
    reason: "Owner decision 2026-10-17: gluten-free is on request. No per-dish flag; satisfied by menu-wide line 'Gluten-free dishes are available on request.' in the allergy note. D-04 (chef sheet) is moot. Picto code path (WheatOff, is_gluten_free) exists and stays dormant (0 of 162 flagged)."
    accepted_by: "owner (session reply)"
    accepted_at: "2026-10-17"
  - must_have: "/menu shows allergens per dish as HTML text"
    reason: "Rendering is wired (item.allergens printed with 'Allergens:' prefix) but the allergens column is empty for all 162 existing items; menu-wide allergy line approved by owner. Per-dish allergen data is content entry via admin, not a code gap."
    accepted_by: "owner (approved allergy line)"
    accepted_at: "2026-10-17"
gaps: []
---

# Phase 3: Carte HTML et pages d'atterrissage cles - Verification

**Goal:** Google peut lire la carte et les pages ciblant "french restaurant krabi" menent a la reservation.
**Mode:** mvp. **Re-verification:** No. Verified against code and live production (curl, read-only). `npx vitest run`: 31 files, 304 tests pass.

## Per-criterion results

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `/menu` shows dishes, baht prices, vegetarian / gluten-free / spicy pictos and allergens as selectable HTML text | VERIFIED (with overrides) | Server component `src/app/[locale]/menu/page.tsx` -> `getMenu()` (`src/utils/menu.ts`, anon cached read, `formatPrice` gives "N ฿") -> `MenuSections.tsx`. Prod `/fr/menu` and `/en/menu`: HTTP 200, raw HTML contains "Boeuf bourguignon", 412 "฿", vegetarian and spicy pictos with labels (14 Vegetarian, 39 Spicy hits on EN), one canonical, correct title. Gluten-free: menu-wide line "Gluten-free dishes are available on request." live (fr: "Plats sans gluten sur demande."), per owner decision; per-dish picto code exists but unused (`is_gluten_free` false for 162/162, `hasGlutenFree` hides the legend). Allergens: allergy line live; per-dish `item.allergens` rendering wired but data empty (chef sheet CSV has an empty allergens column for all rows). |
| 2 | Menu includes a Belgian wines and beers section | VERIFIED | Prod `/fr/menu` and `/en/menu` contain `id="vins-bieres-belges"`, nav anchor, Duvel Blonde, Westmalle Brune (380 ฿), Orval, Chateau du Barry, Muay Thai IPA, "Droit de bouchon". LAUNCH log: 9 categories / 84 items inserted via idempotent `03-CONTENT.sql`, page activated by owner in admin. |
| 3 | EN home has title "Gecko Cabane - French-Thai Restaurant in Krabi Town" and shows reviews, story, access | VERIFIED | Prod `/en` title is exactly `Gecko Cabane – French-Thai Restaurant in Krabi Town`. HTML contains "1,062 reviews" rating line, "Our Story", "Find Us", Soi Ruamjit address, directions link to Google Maps place, link `/en/menu`, JSON-LD `hasMenu` = `https://geckocabanerestaurant.com/en/menu`. |
| 4 | `/en/french-restaurant-krabi` exists with signature dishes, cellar, French-Thai couple, photos and a booking link | VERIFIED | Page file present (404 for non-EN by design, D-14). Prod: 200, title "French Restaurant in Krabi Town - Gecko Cabane", H1 "French restaurant in Krabi Town", 4 dish images (bourguignon, veloute, poulet creme, massaman), exterior and chef photos, "French husband" story, wines/Belgian beers section linking `/en/menu#vins-bieres-belges`, booking CTAs `href="/en#reservation"` (hero and closing), link to `/en/menu`. |

## SEO wiring
- `/sitemap.xml` (prod) lists fr/en home, privacy, `/fr/menu`, `/en/menu`, `/en/french-restaurant-krabi`; no `/fr/french-restaurant-krabi` (matches hreflang rule, no dangling alternates). Landing page canonical count 1, hreflang en + x-default only.
- `/fr/french-restaurant-krabi` returns 404 as intended (FR is deferred to PAGE-08 in phase 6).

## Requirements
| ID | Status |
|----|--------|
| MENU-01 | SATISFIED (gluten-free by menu-wide line, per owner decision) |
| MENU-02 | SATISFIED |
| PAGE-01 | SATISFIED |
| PAGE-02 | SATISFIED |

No orphaned phase-3 requirements in REQUIREMENTS.md.

## Out-of-scope admin fixes (7d7d42c, b75d8e1)
Both are legitimate bug fixes found while activating the Belgian page: admin menu list/reorder queried unprefixed relations (PGRST200, admin list showed "Aucune page de menu"); tables assignments/configurations used unprefixed embeds. Commit diffs touch only `src/app/api/menu/{categories,pages,reorder}/route.ts` and `src/app/api/tables/{assignments,configurations}/route.ts` (aliases keep response shape). They are required for owner activation of criterion 2 and are consistent with the `gecko_` prefix rule. Tests pass afterwards. No regression seen.

## Anti-patterns
No TBD/FIXME/XXX in the phase's menu utils, components or pages. Production DB migration 013 was applied via psql (foreign Supabase history blocked `db push`), recorded in 03-LAUNCH.md.

## Warnings (non-blocking)
1. Per-dish allergens are empty in the database (all 162 items) and the 84 new items; only the menu-wide "ask our team" line is shown. Consider filling the field via admin later.
2. Stale artifacts: `03-CHEF-GLUTEN-SHEET.csv` and CONTEXT D-04 are moot; the `is_gluten_free` column/picto is dormant infrastructure.
3. Unverified in this pass: visual rendering (owner already confirmed "live ok" on /en/menu, /en, /en/french-restaurant-krabi), and Google actually indexing the pages (outside code verification).

## Verdict
Status: **passed**. All four success criteria are met in code and production, criterion 1's gluten-free and allergen aspects via documented owner decisions.

_Verifier: Claude (gsd-verifier)_
