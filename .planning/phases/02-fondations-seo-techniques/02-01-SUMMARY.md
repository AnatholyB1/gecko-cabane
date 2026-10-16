---
phase: 02-fondations-seo-techniques
plan: 01
subsystem: seo
tags: [seo, json-ld, hreflang, metadata, tdd]
requires: []
provides:
  - "src/utils/seo.ts: SITE_URL, LOCALES, OG_LOCALE, PUBLISHED_PATHS, localeUrl, buildPageMetadata, GEO, SAME_AS, mapOpeningHours, buildRestaurantJsonLd, serializeJsonLd"
affects: [02-03, 02-05, 02-06]
tech-stack:
  added: []
  patterns: ["pure SEO module with type-only Next import", "single SITE_URL source of truth"]
key-files:
  created: [src/utils/seo.ts, tests/seo-metadata.test.ts, tests/seo-jsonld.test.ts]
  modified: []
key-decisions:
  - "SAME_AS starts empty (D-09); no aggregateRating (D-07); no hasMenu/menu (D-08, SEO-03 stays partial until phase 3)"
metrics:
  duration: "~10 min"
  completed: 2026-10-16
---

# Phase 2 Plan 01: Pure SEO helper module Summary

Pure `src/utils/seo.ts` deriving canonical, hreflang (fr/en/x-default), OpenGraph/Twitter and Restaurant JSON-LD from one `SITE_URL`, with an injection-safe serializer and full unit tests.

## Commits
- 648d3a2 test(02-01): failing tests for localeUrl/buildPageMetadata (RED)
- 6437ef6 feat(02-01): localeUrl and buildPageMetadata (GREEN)
- 2f26c68 test(02-01): failing tests for JSON-LD helpers (RED)
- 90d8f82 feat(02-01): JSON-LD builder, hours mapper, serializer (GREEN)

## Deviations from Plan

**1. [Rule 1 - Bug] Escape sequence lost when writing serializer**
- A shell heredoc collapsed `'\\u003c'` to `'<'` (a literal `<`); caught by the round-trip test, fixed before the GREEN commit.
- Also reworded a comment so `grep -c aggregateRating` returns 0 as required.

## Verification
Full suite: 20 files, 195 tests pass. No push, no external action.

## Known Stubs
`SAME_AS` is intentionally empty until plan 02-06.

## Self-Check: PASSED
