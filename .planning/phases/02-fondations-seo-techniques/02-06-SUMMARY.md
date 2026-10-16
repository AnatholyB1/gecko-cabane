---
phase: 02-fondations-seo-techniques
plan: 06
subsystem: seo
tags: [json-ld, schema-org, unstable_cache, opengraph, next-intl]
requires: [02-01, 02-05]
provides:
  - Restaurant JSON-LD Server Component on the home page (fr/en)
  - Cached anon read of gecko_opening_hours with admin invalidation
  - Per-locale OG image
  - SAME_AS limited to already-published URLs, 02-LAUNCH.md
affects: [02-07, 02-08]
key-files:
  created:
    - src/utils/opening-hours.ts
    - src/components/RestaurantJsonLd.tsx
    - tests/seo-jsonld-wiring.test.ts
    - .planning/phases/02-fondations-seo-techniques/02-LAUNCH.md
  modified:
    - src/app/api/hours/route.ts
    - src/app/[locale]/page.tsx
    - src/app/[locale]/opengraph-image.tsx (moved from src/app/opengraph-image.tsx)
    - src/utils/seo.ts
    - tests/seo-jsonld.test.ts
key-decisions:
  - "SAME_AS = TripAdvisor .be + Facebook only (both already hrefs in page.tsx); Instagram, tripadvisor.com, Google Maps place URL are candidates awaiting owner (02-07)"
  - "Hours cache read uses supabase-js anon client, never cookies-bound or service-role client"
requirements-completed: [SEO-02, SEO-03, SEO-04]
duration: 25min
completed: 2026-10-17
---

# Phase 2 Plan 06: Restaurant JSON-LD Summary

**Home pages /fr and /en render one localized Restaurant JSON-LD whose openingHoursSpecification comes from gecko_opening_hours (anon read, 1 h cache, tag `opening-hours`, invalidated by PUT /api/hours), with a per-locale OG image and sameAs restricted to the two profile URLs the site already publishes.**

## Task Commits
1. RED: 94505b1 `test(02-06)` wiring test
2. Task 1: cf1b17d `feat(02-06)` opening-hours cache + revalidateTag
3. Task 2: 012086c `feat(02-06)` RestaurantJsonLd, page wiring, OG image per locale
4. Task 3: 9d982fc `feat(02-06)` SAME_AS; 6370fd8 `docs(02-06)` 02-LAUNCH.md

## sameAs (D-09)
Included: TripAdvisor fr.tripadvisor.be (HTTP 403 bot-block, already published) and Facebook (200, title names Gecko Cabane). Candidates recorded only in 02-LAUNCH.md as "awaiting owner (02-07)": Instagram @geckocabane (200, owner link to restaurant unconfirmed), tripadvisor.com form (403), Google Maps place URL (none found). None is in code.

## Verification
- `vitest run`: 26 files, 238 tests pass. `npm run lint`: 0 errors (7 warnings, pre-existing img warnings). `npm run build`: compiled successfully (.next removed first).
- NOT verified: rendered HTML/JSON-LD on a running site, Rich Results test, visual rendering of the OG image (both locales), actual cache invalidation against the live DB. Deferred to 02-07. No push, no external action (only read-only HTTP checks).

## Deviations from Plan
**1. [Rule 1 - Test] tests/seo-jsonld.test.ts asserted the default schema has no `sameAs`**, which encoded the empty SAME_AS. Removed `sameAs` from that list; added a test that an empty list omits `sameAs`. Added a wiring test that SAME_AS is a subset of page.tsx hrefs.
**2.** Comment in opening-hours.ts reworded because the plan's own wiring test forbids the literal `utils/supabase/server` in that file.

## Known Stubs
None.

## Threat Flags
None beyond the plan's threat model.

## Self-Check: PASSED
Created files exist; commits 94505b1, cf1b17d, 012086c, 9d982fc, 6370fd8 exist.
