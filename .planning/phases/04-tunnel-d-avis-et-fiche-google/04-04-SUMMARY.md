---
phase: 04-tunnel-d-avis-et-fiche-google
plan: 04
subsystem: email
tags: [reviews, resend, migration, tdd, krabi-timezone]

requires:
  - phase: 04-01
    provides: review entry point and /review route
provides:
  - Migration 014 (review_token + review_* tracking columns), not applied
  - Pure selection logic (krabiToday, addDays, selectReviewInvitations, emailLocaleFor, buildEmailReviewUrl)
  - reviewInvitationEmail FR/EN invite and reminder template
affects: [04-05 cron, 04-06 admin badges, 04-07 migration apply]

tech-stack:
  patterns:
    - "Pure eligibility functions isolated from IO; cron stays thin"
    - "baseTemplate optional footerNote, output unchanged when absent"

key-files:
  created:
    - supabase/migrations/014_review_invitations.sql
    - src/utils/review-invitations.ts
    - tests/review-invitations.test.ts
    - tests/resend-review.test.ts
  modified:
    - src/utils/resend.ts
    - src/types/database.ts
    - tests/migrations.test.ts

key-decisions:
  - "rid is an opaque review_token uuid, not the enumerable integer id"
  - "No backfill of *_sent_at; first-run exposure bounded by the D-07 window"
  - "Honored = status confirmed or completed (computed), no status migration"

requirements-completed: [REV-02, REV-03]

duration: 15min
completed: 2026-10-17
---

# Phase 4 Plan 04: Review invitation core Summary

**Migration 014 plus unit-tested pure selection (Krabi UTC+7 windows J+1..J+3 invite, J+5..J+7 single reminder) and a FR/EN transactional invitation email with one escaped link.**

## Commits
- c405f7e test: failing migration/selection tests
- de5e5b8 feat: migration 014, types, review-invitations.ts
- 8e537ac test: failing email tests
- 2ab49dc feat: reviewInvitationEmail and baseTemplate footerNote

## Deviations from Plan
None. Migration 014 was NOT applied to any database (plan 04-07, owner-gated).

## Verification
- Full vitest suite: 35 files, 382 tests pass
- tsc --noEmit clean; lint 0 errors (7 pre-existing warnings)

## Known Stubs
None.

## Self-Check: PASSED
