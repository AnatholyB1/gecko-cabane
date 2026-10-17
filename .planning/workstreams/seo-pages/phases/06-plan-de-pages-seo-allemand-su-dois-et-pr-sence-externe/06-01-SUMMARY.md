---
phase: 06-plan-de-pages-seo-allemand-su-dois-et-pr-sence-externe
plan: 01
subsystem: seo
tags: [next-intl, pathnames, hreflang, sitemap, i18n]
requires: []
provides:
  - PAGES slug registry and slug-aware localeUrl/localePath/slugFor in src/utils/seo.ts
  - resolvePageSeo noindex gate and localizedPageMetadata helper
  - next-intl routing with pathnames (middleware only)
  - FR landing page at /fr/restaurant-francais-krabi
affects: [06-05, 06-06, 06-07, 06-08, 06-09, 06-12]
tech-stack:
  added: []
  patterns: [single slug registry, middleware-only pathnames, noindex gate for unpublished pairs]
key-files:
  created: [src/i18n/routing.ts, src/utils/page-metadata.ts, tests/seo-slugs.test.ts]
  modified: [src/utils/seo.ts, src/middleware.ts, "src/app/[locale]/page.tsx", "src/app/[locale]/menu/page.tsx", "src/app/[locale]/privacy/page.tsx", "src/app/[locale]/french-restaurant-krabi/page.tsx", messages/fr.json, tests/seo-sitemap-robots.test.ts, tests/seo-metadata.test.ts, tests/seo-pages.test.ts, tests/landing-page.test.ts, tests/middleware-matcher.test.ts, tests/menu-wiring.test.ts]
decisions:
  - "EN slug = registry key (indexed EN URLs unchanged); FR slug via PAGES.slugs"
  - "navigation.ts left without pathnames; only the middleware rewrites"
  - "localizedPageMetadata takes an optional namespace (default meta) because privacy keeps its title in the privacy namespace"
metrics:
  tasks: 3
  completed: 2026-10-17
---

# Phase 6 Plan 01: Slug registry and FR landing page Summary

A single PAGES registry now drives slugs, canonical, hreflang, sitemap and next-intl pathnames, and the French restaurant landing page is published at `/fr/restaurant-francais-krabi` with copy written for French readers.

## Commits
- d3ceb81 test(06-01): failing tests (RED)
- 5018f08 feat(06-01): registry, routing pathnames, noindex helper
- 73a25ba feat(06-01): FR landing publication

## Verification
- npm test: 40 files, 433 tests pass; npx tsc --noEmit clean; npm run lint 0 errors (8 pre-existing warnings).
- Dev-server redirect smoke (curl) not run.

## Deviations from Plan

**1. [Rule 3 - Blocking] Optional `namespace` argument on localizedPageMetadata**
- Privacy title/description live in the `privacy` namespace, not `meta`; added an optional `namespace` (default `meta`).

**2. [Rule 3 - Blocking] tests/menu-wiring.test.ts updated**
- It asserted `buildPageMetadata(` / `path: '/menu'` on the menu page; changed to the new helper.

**3. Commit grouping**
- The PUBLISHED_PAGES flip to fr+en and the home page link landed in the Task 2 / Task 3 commits respectively; the landing page edits were needed for the Task 2 test run to be green.

## Deferred
- Opening-hours day names on the FR landing come from the English `mapOpeningHours` day names (pre-existing); translating them is not in this plan.
- The landing language switcher is not slug-aware yet (plan 08); the middleware redirects cross-locale slugs meanwhile.

## Known Stubs
None.

## Self-Check: PASSED
