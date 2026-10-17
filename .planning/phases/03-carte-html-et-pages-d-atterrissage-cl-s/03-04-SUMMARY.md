---
phase: 03-carte-html-et-pages-d-atterrissage-cl-s
plan: 04
subsystem: home
tags: [home, menu-teaser, seo, i18n, server-components]
requires: [03-01]
provides:
  - "MenuTeaser server component (Ardoise items + link to /menu)"
  - "ARDOISE_SLUG, pickTeaserItems in src/utils/menu.ts"
  - "Home Google rating line and directions link"
affects: [03-05, 03-06]
tech-stack:
  added: []
  patterns: ["server-rendered teaser over cached getMenu", "URL derived from SAME_AS"]
key-files:
  created:
    - src/components/MenuTeaser.tsx
    - tests/home-page.test.ts
  modified:
    - src/utils/menu.ts
    - src/app/[locale]/page.tsx
    - messages/fr.json
    - messages/en.json
  deleted:
    - src/components/MenuDisplay.tsx
key-decisions:
  - "Ardoise page found by slug 'ardoise', falling back to the first page (RESEARCH A6, slug unverified)"
  - "Reviews line placed in the existing social band; directions button under the address in #contact"
requirements-completed: [PAGE-01, MENU-01]
duration: 15min
completed: 2026-10-17
---

# Phase 3 Plan 04: Home menu teaser and Google blocks Summary

The home #menu section is now a server-rendered teaser of up to 4 Ardoise items with a "Voir la carte complète" button to /menu, MenuDisplay is deleted, and the home shows a plain-text Google rating line plus a Google Maps directions link.

## Tasks

| Task | Commits |
|------|---------|
| 1. Home menu teaser (TDD) | 4682049 (RED), 6c14481 (GREEN) |
| 2. Rating line and directions link (TDD) | 49089a3 (RED), 0dbf08b (GREEN) |

## Verification

Full vitest suite passes (30 files, 288 tests), `tsc --noEmit` clean, `npm run lint` 0 errors (7 pre-existing warnings). EN `meta.homeTitle` unchanged and covered by the existing seo-pages test.

## Deviations from Plan

None - plan executed as written.

## Known Stubs

None. The 4,7 / 1 062 figures are owner-sourced (D-11) and are to be re-confirmed at the 03-06 checkpoint (T-03-13).

## Threat Flags

None. No aggregateRating; outbound links use rel="noopener noreferrer"; DB text rendered as React children only.

## Self-Check: PASSED
