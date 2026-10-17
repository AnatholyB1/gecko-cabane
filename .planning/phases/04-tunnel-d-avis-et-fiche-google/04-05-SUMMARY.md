---
phase: 04-tunnel-d-avis-et-fiche-google
plan: 05
subsystem: email
tags: [reviews, cron, vercel, resend, idempotency]

requires:
  - phase: 04-04
    provides: selectReviewInvitations, reviewInvitationEmail, migration 014 (not applied)
provides:
  - GET /api/cron/review-invitations (Bearer CRON_SECRET, idempotent claim/release, counts only, ?dry=1)
  - vercel.json daily cron 0 4 * * * (11:00 Krabi)
affects: [04-07 activation (CRON_SECRET, migration, deploy)]

key-files:
  created:
    - src/app/api/cron/review-invitations/route.ts
    - vercel.json
    - tests/review-wiring.test.ts

key-decisions:
  - "Claim row via conditional update before Resend send; release on failure so J+3 catch-up retries"
  - "Resend idempotencyKey per reservation and kind as second line of defence"

requirements-completed: [REV-02, REV-03]

duration: 10min
completed: 2026-10-17
---

# Phase 4 Plan 05: Review invitation cron Summary

**Bearer-protected daily Vercel Cron sending J+1 invites and a single J+5 reminder, claiming each reservation atomically before the Resend call and releasing the claim on failure.**

## Commits
- e934c7e test(04-05): failing wiring tests
- ae23808 feat(04-05): cron route and vercel.json

## Deviations from Plan
None. (The test's PII regex was adjusted during GREEN to handle the generic `NextResponse.json<...>` call form and ES2017 target.)

## Verification
- Full vitest suite: 36 files, 390 tests pass; tsc clean; lint 0 errors (7 pre-existing warnings)
- Not deployed; CRON_SECRET not created; cron not triggered. Production activation is owner-gated in plan 04-07.

## Known Stubs
None.

## Self-Check: PASSED
