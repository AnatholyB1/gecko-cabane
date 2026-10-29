---
phase: 06-plan-de-pages-seo-allemand-su-dois-et-pr-sence-externe
plan: 06
subsystem: seo-landing-pages
tags: [seo, landing, i18n, where-to-eat]
requires: [06-01, 06-05]
provides:
  - "/where-to-eat-krabi-town (EN) and /ou-manger-krabi-town (FR) published"
affects: [sitemap, RelatedGuides on romantic-dinner and french-restaurant pages]
tech-stack:
  added: []
  patterns: [thin route wrapper + LANDING config + message namespace]
key-files:
  created:
    - src/app/[locale]/where-to-eat-krabi-town/page.tsx
  modified:
    - tests/seo-landing-pages.test.ts
    - src/components/seo/pages.config.ts
    - src/utils/seo.ts
    - messages/en.json
    - messages/fr.json
decisions:
  - "PAGE-04 'adresses' read as places/markets/neighbourhoods (D-11): no competitor named, no ranking."
  - "Market days and hours phrased as 'usually / check locally' (T-06-20)."
metrics:
  tasks: 2
  completed: 2026-10-17
---

# Phase 6 Plan 06: Where to eat in Krabi Town Summary

Honest EN/FR neighbourhood guide (night market, Walking Street, riverfront) published through the shared SeoLandingPage template, with Gecko presented for dinner and a booking CTA.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. D-11 gate tests (RED) | 15927d0 | 4 new tests failed as expected |
| 2. Page, copy, publication | 20b17da | All 502 tests green, tsc clean, lint 0 errors |

## What was built
- Route wrapper copied from the romantic dinner page (single `notFound()`).
- `LANDING['/where-to-eat-krabi-town']`: intro, areas (3 cards), when, dinner (massaman image, reservation link).
- EN and FR `whereToEat` namespaces written separately (FR not a literal translation) plus `meta.whereToEatTitle/Description`.
- Added to `PUBLISHED_PAGES` (fr, en). The registry already listed it as related for the romantic and French restaurant pages, so those pages now show it in "A decouvrir".

## Deviations from Plan
None - plan executed as written. The tests also assert `relatedFor('/romantic-dinner-krabi','en')` contains the new page, which passes since publication.

## Known Stubs
None.

## Verification
- `npm test`: 43 files, 502 tests passed. `npx tsc --noEmit`: clean. `npm run lint`: 0 errors (8 pre-existing warnings in unrelated files).
- Nothing published or sent to third parties.

## Self-Check: PASSED
