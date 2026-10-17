---
phase: 03-carte-html-et-pages-d-atterrissage-cl-s
plan: 05
subsystem: landing
tags: [landing, seo, hreflang, sitemap, i18n, en-only]
requires: [03-01, 03-02, 03-04]
provides:
  - "/en/french-restaurant-krabi EN-only landing page (404 for other locales)"
  - "PUBLISHED_PAGES, pageLanguages, buildPageMetadata locales option in src/utils/seo.ts"
  - "LanguageSwitcher availableLocales (hidden with fewer than 2)"
affects: [03-06]
tech-stack:
  added: []
  patterns: ["per-page locales driving sitemap and hreflang", "source-scan wiring tests"]
key-files:
  created:
    - src/app/[locale]/french-restaurant-krabi/page.tsx
    - tests/landing-page.test.ts
  modified:
    - src/utils/seo.ts
    - src/app/sitemap.ts
    - src/components/LanguageSwitcher.tsx
    - src/components/SiteHeader.tsx
    - src/app/[locale]/page.tsx
    - messages/fr.json
    - messages/en.json
    - tests/seo-metadata.test.ts
    - tests/seo-sitemap-robots.test.ts
    - tests/seo-pages.test.ts
key-decisions:
  - "pageLanguages helper shared by buildPageMetadata and sitemap so hreflang rules live in one place"
  - "PUBLISHED_PATHS kept as the literal bilingual subset, asserted equal to the bilingual PUBLISHED_PAGES entries"
  - "Belgian link uses /menu#vins-bieres-belges only when that menu page is active and populated, else /menu"
requirements-completed: [PAGE-02]
duration: 25min
completed: 2026-10-17
---

# Phase 3 Plan 05: EN landing page for "french restaurant krabi" Summary

An EN-only landing page at /en/french-restaurant-krabi with the D-12 content, the D-13 photos and booking CTAs to /en#reservation, backed by per-page locale support so canonical, hreflang (en + x-default) and the sitemap never reference a non-existent FR page.

## Tasks

| Task | Commits |
|------|---------|
| 1. EN-only support in buildPageMetadata and sitemap (TDD) | 6a58424 (RED), 9f02d1d (GREEN) |
| 2. Landing page, hidden switcher, EN copy (TDD) | 8042d92 (RED), 3ec0412 (GREEN) |
| 3. Home link and metadata wiring test | b8b8e8a |

## Verification

Full vitest suite passes (31 files, 304 tests), `tsc --noEmit` clean, `npm run lint` 0 errors (7 pre-existing warnings). Sitemap lists 7 URLs; no `/fr/french-restaurant-krabi` anywhere.

## Deviations from Plan

The `about.frenchRestaurantLink` message key (planned for Task 3) was added to both message files in the Task 2 commit, together with the other message additions. No behavior change.

## Known Stubs

None. FR `frenchRestaurant` strings exist for key parity only and are never rendered until PAGE-08 (phase 6).

## Threat Flags

None. T-03-16 mitigated by tests; no rating or romantic copy; directions link uses `rel="noopener noreferrer"`. The copy still needs owner approval at the 03-06 checkpoint (T-03-17).

## Self-Check: PASSED
