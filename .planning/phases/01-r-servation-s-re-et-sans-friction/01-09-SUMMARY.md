---
phase: 01-r-servation-s-re-et-sans-friction
plan: 09
subsystem: database
tags: [supabase, postgres, migrations, rls, rate-limit]
requires: ["01-03", "01-06", "01-07", "01-08"]
provides:
  - "Migrations 008 and 009 applied on production, recorded in migration history"
  - "Evidence log 01-DB-ROLLOUT.md"
affects: ["01-10", "01-11"]
tech-stack:
  added: []
  patterns: ["psql single-transaction apply + supabase migration repair on shared project"]
key-files:
  created: [".planning/phases/01-r-servation-s-re-et-sans-friction/01-DB-ROLLOUT.md"]
  modified: []
key-decisions:
  - "Applied 008/009 with psql + migration repair because db push is blocked by 26 foreign versions"
metrics:
  completed: 2026-10-16
---

# Phase 1 Plan 09: DB rollout Summary

Migrations 007-009 proven on a blank scratch DB (apply, idempotency, schema diff, rate-limit atomicity, capacity concurrency, consent, anon privileges), then 008 and 009 applied to production via psql in single transactions and recorded with `migration repair`.

## Tasks
1. Scratch apply and schema diff: done (earlier commits).
2. Atomicity, concurrency, privileges on scratch: done (earlier commits).
3. Production push: done on 2026-10-16 via the alternative mechanism below, after owner approval.

## Deviations from Plan

**1. [Rule 3 - Blocking] psql + repair instead of `supabase db push`**
- **Found during:** Task 3 dry-run
- **Issue:** The production project is shared with another app and has 26 foreign migration versions; `db push --dry-run` failed with `LegacyDbPushMissingLocalError` and suggested reverting them, which is outside the approval.
- **Fix:** Owner-approved alternative: `psql -v ON_ERROR_STOP=1 -1 -f` for exactly 008 then 009 (both exit 0), then `supabase migration repair --status applied 008 009`. Pre-checks: files unchanged since 7959b55, additive only. Foreign versions untouched; 007 only marked applied (earlier).
- **Verification (read-only):** locale column default 'fr'; RLS on the 3 tables; both functions exist; anon/authenticated cannot execute them; rate-limit check in rolled-back transaction gave true,true,false with 0 rows left; reservations count 8, no data written; history has 007/008/009 plus 26 foreign (29).

## Issues / Follow-ups
- anon (and authenticated) hold Supabase default table grants on gecko_marketing_consents and gecko_rate_limits (incl. TRUNCATE; anon on gecko_reservations: TRUNCATE/REFERENCES/TRIGGER). RLS blocks row access and PostgREST does not expose TRUNCATE, but the privilege is unnecessary. Recommended follow-up migration to revoke (check admin consents policy needs SELECT for authenticated). Not applied.
- Scratch credentials leaked into an earlier session transcript (scratch only); delete the `phase1-scratch` branch.

## Self-Check: PASSED
01-DB-ROLLOUT.md exists with the production section; no credentials in committed files.
