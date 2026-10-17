---
phase: 03-carte-html-et-pages-d-atterrissage-cl-s
plan: 03
subsystem: menu
tags: [menu, admin, migration, cache-revalidation, gluten-free]
requires: [03-01]
provides:
  - "Migration 013 (file only): is_gluten_free column + inactive vins-bieres-belges page"
  - "Admin 'Sans gluten (confirmé par la cheffe)' checkbox saved via /api/menu/items"
  - "revalidateTag(MENU_TAG, 'max') on every menu admin write"
affects: [03-06]
key-files:
  created:
    - supabase/migrations/013_menu_gluten_free.sql
    - tests/menu-admin-wiring.test.ts
  modified:
    - tests/migrations.test.ts
    - src/types/database.ts
    - src/app/api/menu/items/route.ts
    - src/app/api/menu/pages/route.ts
    - src/app/api/menu/categories/route.ts
    - src/app/api/menu/reorder/route.ts
    - src/app/admin/menu/[pageId]/page.tsx
key-decisions:
  - "No backfill: is_gluten_free defaults false, set only by admin after chef confirmation"
  - "Belgian page seeded inactive and empty; no wine/beer rows invented"
requirements-completed: [MENU-01, MENU-02]
duration: 15min
completed: 2026-10-17
---

# Phase 3 Plan 03: Gluten-free flag, Belgian page seed, menu cache invalidation Summary

Migration 013 (written, NOT applied) adds `is_gluten_free` and an inactive empty "Vins & bières belges" page; the admin can flag chef-confirmed dishes and every menu write now invalidates the `/menu` cache tag.

## Tasks

| Task | Commits |
|------|---------|
| 1. Migration 013 + types (TDD) | b407f2b (RED), 982d1be (GREEN) |
| 2. Admin checkbox, API validation, revalidateTag (TDD) | 369b57e (RED), e52c407 (GREEN) |

## Verification

Full vitest suite: 29 files, 279 tests pass. `tsc --noEmit` clean. `npm run lint`: 0 errors (7 pre-existing warnings).

## Deviations from Plan

None - plan executed as written. No `git push`, no `supabase db push`; migration 013 must be applied in 03-06 before deploying.

## Deferred Issues

Pre-existing, out of scope: `src/app/api/menu/reorder/route.ts` uses table names `menu_pages` / `menu_categories` / `menu_items` (no `gecko_` prefix), and `pages` GET selects `menu_categories(...)` / `menu_items(...)` relations; these look wrong against the baseline schema and should be checked separately.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED
