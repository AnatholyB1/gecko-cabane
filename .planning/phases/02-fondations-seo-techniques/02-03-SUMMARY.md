---
phase: 02-fondations-seo-techniques
plan: 03
subsystem: seo
tags: [seo, sitemap, robots, middleware, redirect, tdd]
requires: ["02-01"]
provides:
  - "src/app/sitemap.ts and src/app/robots.ts metadata routes"
  - "middleware matcher bypass for sitemap.xml, robots.txt, opengraph-image"
  - "308 redirect / -> /fr in next.config.ts"
affects: [02-07]
key-files:
  created: [src/app/sitemap.ts, src/app/robots.ts, tests/seo-sitemap-robots.test.ts, tests/middleware-matcher.test.ts]
  modified: [src/middleware.ts, next.config.ts]
key-decisions:
  - "localeDetection false and alternateLinks false: HTML hreflang is the only hreflang signal"
metrics:
  duration: "~8 min"
  completed: 2026-10-16
---

# Phase 2 Plan 03: Sitemap, robots and clean root redirect Summary

sitemap.ts (4 published URLs with fr/en/x-default alternates, no fabricated dates) and robots.ts, plus a middleware matcher that no longer 307-redirects metadata routes, next-intl detection/Link headers disabled, and a permanent `/` -> `/fr` redirect in next.config.

## Commits
- 7c903e1 test(02-03): failing sitemap/robots tests (RED)
- 505f5c0 feat(02-03): sitemap.ts and robots.ts (GREEN)
- b2728e1 test(02-03): failing middleware matcher/redirect tests (RED)
- 0fdc1f4 fix(02-03): matcher exclusions, localeDetection/alternateLinks false, 308 root redirect (GREEN)

## Deviations from Plan
None. Note: the acceptance grep for the escaped matcher string returned 0 in this shell (backslash handling); the matcher content was confirmed with a plain grep and by the matcher regex test.

## Verification
Full suite: 23 files, 218 tests pass. eslint clean on touched files. Live checks (200 on /sitemap.xml, 308 on /) deferred to plan 02-07. No push, no external action.

## Self-Check: PASSED
