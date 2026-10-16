---
phase: 01-r-servation-s-re-et-sans-friction
plan: 10
subsystem: infra
tags: [vercel, deploy, supabase, grants, env, launch]
requires: ["01-02", "01-07", "01-08", "01-09"]
provides:
  - "Phase 1 code live on https://geckocabanerestaurant.com (commit 364a261)"
  - "Migration 010 (revoke unneeded default grants) applied on production"
  - "Vercel production env: RESA_HOOK_URL, RESA_VALIDATION_HOOK_URL, RATE_LIMIT_SECRET, NEXT_PUBLIC_WHATSAPP_NUMBER; NEXT_PUBLIC_RESA_* removed"
  - "last_reservation_time = 21:30 in production settings"
  - "01-LAUNCH.md (approvals, env log, smoke results, pending human check)"
affects: ["01-11"]
key-files:
  created:
    - supabase/migrations/010_revoke_default_grants.sql
    - .planning/phases/01-r-servation-s-re-et-sans-friction/01-LAUNCH.md
key-decisions:
  - "Blanket owner approval recorded as such, not as item-by-item review"
  - "Webhook URLs kept; rotation recommended and left to the owner"
  - "Kept DML for authenticated on reservations/consents (admin UI depends on it)"
metrics:
  completed: 2026-10-16
---

# Phase 1 Plan 10: Launch Summary

Phase 1 is deployed to production with server-only webhook secrets, an anti-abuse secret, 21:30 last booking time and tightened table grants; production smoke tests pass. **Task 3 (human phone check) was reported OK by the owner after this plan ("1 ok; 2 ok"); this is owner-reported, NOT verified by Claude.**

## Tasks

1. Owner decision (checkpoint): resolved by a blanket owner approval in-session; each item recorded in 01-LAUNCH.md "Owner approvals". Privacy text legal review still advisable; WhatsApp number assumed active, owner to confirm; webhook rotation recommended.
2. Apply, env, deploy, smoke tests: done. Vitest 148/148, eslint clean on phase files, build ok, pushed to master, Vercel deployment READY, smoke tests a-f pass (details in 01-LAUNCH.md).
3. Human check on a phone (under 60 s, foreign number, real email, admin confirm, WhatsApp): OWNER-REPORTED OK (2026-10-16, phone check incl. foreign number, emails, admin confirm, plus the WhatsApp button). Not verified by Claude; no measured time was supplied. Steps in 01-LAUNCH.md "Human verification". SEC-05 and SEC-01 are verified by smoke tests; RESA-02/03/04 end-to-end remain subject to Task 3.

## Commits
- 364a261 feat(01-10): add 010 migration revoking unneeded default grants

## Deviations from Plan

**1. [Rule 2 - Missing critical] Migration 010 (grants), approved prerequisite**
- anon/authenticated held TRUNCATE/REFERENCES/TRIGGER (and everything on gecko_rate_limits). Revoked, applied via psql + `migration repair` (db push blocked by 26 foreign versions). No scratch DB available (deleted); acceptable because the migration is a pure revoke.
- Left: anon DML on gecko_marketing_consents (RLS blocks it); follow-up suggested.

**2. [Rule 3 - Blocking] Stale `.next/dev` types broke `next build`**
- Gitignored generated dir from the dev server referenced the deleted `api/verify/check` route. Removed `.next/dev`, rebuild passed. No source change.

**3. Smoke test b adjusted.** `{}` returns 400 `too_fast` (fill-time check precedes schema validation). Added a validation-path check (`invalid_fields`), invalid body, and honeypot (201 fake, no DB write). No real reservation submitted.

## Issues / Follow-ups
- Superseded by plan 01-11: the n8n webhooks were removed entirely (no rotation needed); owner should delete/disable the old n8n URLs. Legal review of the privacy text is still advisable.
- Vercel log check covered only the CLI window (no error logs); Sentry not inspected.
- `.planning/config.json` has a pre-existing uncommitted local change, left untouched.
- Global `npm run lint` 7 pre-existing errors: fixed in plan 01-11 (exit 0).

## Self-Check: PASSED
010 migration and 01-LAUNCH.md exist; commit 364a261 on origin/master; deployment READY on that commit; no URLs or secrets in LAUNCH.md (grep 0).
