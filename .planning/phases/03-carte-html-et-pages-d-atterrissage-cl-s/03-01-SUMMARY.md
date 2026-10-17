---
phase: 03-carte-html-et-pages-d-atterrissage-cl-s
plan: 01
subsystem: menu
tags: [menu, seo, server-components, i18n, supabase-cache]
requires: []
provides:
  - "getMenu cached anon read tagged 'menu' (src/utils/menu.ts)"
  - "/fr/menu and /en/menu server-rendered pages"
  - "SiteHeader and SiteFooter shared components"
affects: [03-02, 03-03, 03-04, 03-05]
tech-stack:
  added: []
  patterns: ["unstable_cache with anon supabase-js client", "source-scan wiring tests"]
key-files:
  created:
    - src/utils/menu.ts
    - src/components/MenuSections.tsx
    - src/components/MenuAnchorNav.tsx
    - src/components/SiteHeader.tsx
    - src/components/SiteFooter.tsx
    - src/app/[locale]/menu/page.tsx
    - tests/menu-utils.test.ts
    - tests/menu-wiring.test.ts
  modified:
    - src/types/database.ts
    - messages/fr.json
    - messages/en.json
key-decisions:
  - "MenuPageWithContent/MenuCategoryWithItems use Omit on the optional children fields so items/categories are non-optional"
  - "Gluten-free picto and legend entry only when is_gluten_free === true (undefined treated as false)"
requirements-completed: [MENU-01]
duration: 20min
completed: 2026-10-17
---

# Phase 3 Plan 01: Server-rendered /menu page Summary

Static, crawlable `/fr/menu` and `/en/menu` with all dishes in the initial HTML, read through a cached anon Supabase client tagged `menu`, sticky anchor navigation, baht prices, accessible pictos and always-visible descriptions and allergens.

## Tasks

| Task | Commits |
|------|---------|
| 1. Menu data module (TDD) | 5d8de9f (RED), 4acdce6 (GREEN) |
| 2. Menu page, components, i18n (TDD) | 7a44b61 (RED), cbc2bfd (GREEN) |

## Verification

Full vitest suite passes (28 files, 259 tests), `tsc --noEmit` clean, `npm run lint` 0 errors (7 pre-existing warnings).

## Deviations from Plan

**[Rule 1 - Bug] Optional children typing.** `MenuCategory & { items: MenuItem[] }` kept `items` possibly undefined (tsc TS18048). Switched to `Omit<..., 'items'> & {...}` (same for pages/categories). Fixed in cbc2bfd.

**[Rule 3] Anchor nav placement.** MenuAnchorNav is rendered as a direct child of the tall content container so `position: sticky` works.

Footer privacy link reuses the existing `privacy.title` key rather than adding a new key.

## Known Stubs

None. `SiteHeader` accepts `availableLocales` but does not forward it yet by design (03-05).

## Threat Flags

None. DB text is rendered as React children only; no `dangerouslySetInnerHTML`; anon key only.

## Self-Check: PASSED
