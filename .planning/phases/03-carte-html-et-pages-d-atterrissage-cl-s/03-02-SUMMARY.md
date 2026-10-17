---
phase: 03-carte-html-et-pages-d-atterrissage-cl-s
plan: 02
subsystem: seo
tags: [seo, json-ld, sitemap, hreflang, menu]
requires: [03-01]
provides:
  - "hasMenu URL in the Restaurant JSON-LD (fr/en)"
  - "/menu in PUBLISHED_PATHS, sitemap.xml and metadata helpers"
affects: [03-05]
key-files:
  modified:
    - src/utils/seo.ts
    - tests/seo-jsonld.test.ts
    - tests/seo-jsonld-wiring.test.ts
    - tests/seo-metadata.test.ts
    - tests/seo-sitemap-robots.test.ts
    - tests/seo-pages.test.ts
key-decisions:
  - "hasMenu is a plain URL string; no Menu object, no deprecated menu property, no aggregateRating"
requirements-completed: [MENU-01]
duration: 10min
completed: 2026-10-17
---

# Phase 3 Plan 02: Menu discoverability Summary

The Restaurant JSON-LD now carries `hasMenu` pointing at the localized `/menu` page, and `/fr/menu` and `/en/menu` are published in the sitemap with fr/en/x-default alternates (completes SEO-03).

## Tasks

| Task | Commits |
|------|---------|
| 1. hasMenu in JSON-LD (TDD) | RED test(03-02), GREEN feat(03-02) |
| 2. Publish /menu in PUBLISHED_PATHS (TDD) | RED test(03-02), GREEN feat(03-02) |

## Verification

Full vitest suite passes (28 files, 272 tests). `npm run lint`: 0 errors (7 pre-existing warnings).

## Deviations from Plan

None - plan executed as written. `src/app/sitemap.ts` unchanged, as planned.

## Known Stubs

None.

## Threat Flags

None. hasMenu and sitemap URLs are built only via `localeUrl` on the canonical domain.

## Self-Check: PASSED
