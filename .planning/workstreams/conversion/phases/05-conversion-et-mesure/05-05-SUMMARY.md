---
phase: 05-conversion-et-mesure
plan: 05
subsystem: reviews
tags: [review-counters, supabase-migration, redirect, rpc]
requires: [05-02]
provides:
  - Migration 016 (gecko_review_clicks, gecko_review_click_hit RPC, gecko_review_monthly_totals)
  - normalizeReviewSource, REVIEW_STAT_SOURCES, REVIEW_HIT_KINDS ('site' added to REVIEW_SOURCES)
  - recordReviewHit (server only, swallows errors)
  - /api/review/go counted 302 redirect with fixed target map
affects: [05-09, 05-11]
tech-stack:
  added: []
  patterns: [security-definer counter RPC for service_role only, after() non-blocking count, fixed redirect map]
key-files:
  created:
    - supabase/migrations/016_review_stats.sql
    - src/utils/review-stats.ts
    - src/app/api/review/go/route.ts
    - tests/review-stats.test.ts
  modified:
    - src/utils/review-links.ts
    - src/app/[locale]/review/page.tsx
    - tests/review-links.test.ts
    - tests/review-page-wiring.test.ts
    - tests/review-click-wiring.test.ts
    - tests/migrations.test.ts
key-decisions:
  - "A valid rid always counts as source 'email'; other sources come from the allowlist, else 'unknown'"
  - "Google/TripAdvisor buttons now point at /api/review/go; the destination is never read from the request"
requirements-completed: [REV-06]
duration: 15min
completed: 2026-10-17
---

# Phase 5 Plan 05: Review counters Summary

**Every /review visit and Google/TripAdvisor click is counted per source (email, qr, wa, site, unknown) with no personal data, via a service-role-only RPC and a no-open-redirect counted route.**

## Accomplishments
- Migration 016 creates the bounded counter table (PK month x source x kind, check constraints, admin-only select RLS) and the manual monthly totals table for 05-09 (not applied; owner action).
- /review counts visits with `after()`; DB failures never break the page or the redirect.
- /api/review/go returns 400 for any target other than google/tripadvisor, 302 with `Cache-Control: no-store` otherwise.
- The Google-before-TripAdvisor wiring test was deliberately rewritten to check the new hrefs.

## Task Commits
1. RED tests: 0b75768
2. Migration, links, stats helper, route: 7416bc6
3. Page wiring: f9f7ba6

## Verification
Full vitest 529/529, tsc clean, lint 0 errors (8 pre-existing warnings), `npm run build` succeeds.

## Deviations from Plan
None.

## Owner actions pending
Apply migration 016 to production before deploying (listed by 05-11).

## Self-Check: PASSED
