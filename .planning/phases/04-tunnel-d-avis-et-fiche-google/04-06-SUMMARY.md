---
phase: 04-tunnel-d-avis-et-fiche-google
plan: 06
subsystem: reviews
tags: [reviews, tracking, admin, service-role]

requires:
  - phase: 04-01
    provides: review alias handler, review page
  - phase: 04-04
    provides: krabiToday/addDays, review_* columns on Reservation
provides:
  - lookupReviewLocale / markReviewClicked (server-only, service role)
  - rid-based locale resolution in the alias, first-click marking on /review
  - getReviewBadges / showNoShowDeadline and admin badge row + deadline hint
affects: [04-07 activation]

key-files:
  created:
    - src/utils/review-tracking.ts
    - src/utils/review-badges.ts
    - tests/review-click-wiring.test.ts
    - tests/review-badges.test.ts
  modified:
    - src/utils/review-alias.ts
    - src/app/[locale]/review/page.tsx
    - src/app/admin/reservations/page.tsx

key-decisions:
  - "No 'server-only' dependency added; header note plus wiring test forbid 'use client' imports"
  - "Planned-invitation badge says aujourd'hui for a service dated yesterday (accuracy fix over UI-SPEC)"
  - "Single getReviewBadges call per card; empty row hidden with empty:hidden"

requirements-completed: [REV-01, REV-02, REV-03]

duration: 12min
completed: 2026-10-17
---

# Phase 4 Plan 06: Review click tracking and admin badges Summary

**The email link now resolves the guest's language from the rid token and records the first click (stopping the J+5 reminder), while the admin list shows invitation, reminder, click status and the no-show deadline hint.**

## Commits
- test(04-06) failing click wiring tests
- feat(04-06) rid locale + click marking
- test(04-06) failing badge tests
- feat(04-06) admin badges and deadline hint

## Deviations from Plan
- Planned badge label for a service dated yesterday reads "Invitation prévue aujourd'hui 11h (Krabi)" (specified in the plan itself).
- Otherwise none.

## Verification
- Full suite: 38 files, 403 tests pass; tsc clean; lint 0 errors (7 pre-existing warnings)
- Migration 014 not applied, nothing deployed (owner-gated in 04-07).

## Known Stubs
None.

## Self-Check: PASSED
