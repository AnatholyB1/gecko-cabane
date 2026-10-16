---
phase: 01-r-servation-s-re-et-sans-friction
plan: 03
subsystem: database
tags: [supabase, postgres, rls, migrations, sec-04]
requires: []
provides:
  - supabase/migrations/007_gecko_baseline.sql (idempotent baseline of real gecko_* schema)
  - supabase/legacy/ (archived 001-006)
  - tests/migrations.test.ts
affects: [01-06, 01-08, 01-09]
tech-stack:
  added: []
  patterns: [idempotent migrations, static SQL tests]
key-files:
  created:
    - supabase/migrations/007_gecko_baseline.sql
    - supabase/legacy/README.md
    - tests/migrations.test.ts
  modified:
    - CLAUDE.md
    - src/types/database.ts
    - .gitignore
decisions:
  - "Task 1 resolved as 'approve' by owner in session (read-only schema dump only)"
metrics:
  completed: 2026-10-16
requirements-completed: [SEC-04]
---

# Phase 1 Plan 03: Gecko baseline migration Summary

Idempotent 007 baseline transcribed from a read-only production schema dump, legacy unprefixed migrations 001-006 archived, migrations test and docs/types aligned.

## Task 1 (checkpoint:decision)
Owner replied `approve` (2026-10-16). Scope: read-only schema/catalog queries and the gecko_restaurant_settings key/value list. Done: pg_dump --schema-only and 4 catalog SELECTs. No write, no db push, no customer rows. Outputs stayed in the session scratchpad, not committed; connection string never printed.

## Commits
- 541058c: baseline 007, legacy archive, migrations test, .gitignore
- d0c3771: GeckoAdmin type, test regex fix
- 47e8e9a: CLAUDE.md data model (tracked path is claude.md)

## Schema facts for plans 01-06 / 01-08 / 01-09
- `gecko_reservations.id`: `integer` with sequence default (serial-style), NOT bigint/identity. Dumped from Postgres 17.6.
- No `locale` column on gecko_reservations (plan 01-06 must add it).
- Existing CHECKs: `party_size > 0 and <= 50`; `status in (pending, confirmed, cancelled, completed, no_show)`. `customer_email` is nullable, `customer_phone` varchar(30) not null.
- Triggers: `gecko_reservations_updated_at`, plus updated_at triggers on settings, table_configurations, tables.
- gecko_restaurant_settings rows: `max_covers=40`, `table_block_duration_minutes=120`; `last_reservation_time` absent.
- Functions: `gecko_is_admin()` (SQL, stable, security definer, search_path public), `gecko_update_reservation_timestamp()`, `gecko_update_updated_at_column()`.
- Storage bucket `gecko-menu-images` is public; policies: public select, admin insert, admin delete (no update policy).
- gecko_admins columns: id uuid (FK auth.users, cascade), email, created_at.
- Not present in production: gecko_marketing_consents, gecko_rate_limits (later plans create them).

## Findings (no action taken, flagged)
- gecko_reservations has NO public policy (admin-only). No PII leak via RLS, so the STOP rule of step 4 was not triggered.
- `gecko_table_assignments` has a public `SELECT USING (true)` policy: exposes reservation_id and blocked_until to anon (no name/phone/email). Reproduced verbatim in 007; recommend tightening in a later migration (008/009), owner's call.
- Public read on gecko_restaurant_settings exposes all keys to anon; keep in mind when adding new settings.

## Deviations from Plan
- [Rule 1 - Bug] Test regex used the `s` flag, which failed `tsc` (target ES2017); removed (`[^;]` already spans newlines). Fixed in d0c3771.
- The baseline was written directly as SQL (hand-cleaned from the dump) rather than generated; verified against the dump table by table.
- Acceptance note: CLAUDE.md "Stack" section line for migrations was also updated; it refers to "baseline 007" without the file name so `grep -c 007_gecko_baseline CLAUDE.md` == 1.

## Verification
- `npx vitest run`: 11 files, 106 tests pass. `npx tsc --noEmit -p .`: clean.
- 14 `enable row level security` statements, 0 `create table public.` without `if not exists`.
- Blank-DB application of 007 is proven in plan 01-09 (not done here).

## Known Stubs
None.

## Self-Check: PASSED
Files exist (007, legacy/README.md, tests/migrations.test.ts); commits 541058c, d0c3771 and 47e8e9a present.
