---
phase: 01-r-servation-s-re-et-sans-friction
plan: 06
subsystem: api
tags: [reservations, supabase-rpc, advisory-lock, next-after, sec-01, sec-03, sec-05]
requires: ["01-01", "01-03", "01-04", "01-05"]
provides:
  - supabase/migrations/008_reservation_booking.sql (locale, gecko_marketing_consents, gecko_create_reservation)
  - POST /api/reservations without OTP (201 { data: { id, status } })
  - admin-only GET/PUT/DELETE on /api/reservations
affects: [01-07, 01-08, 01-09, 01-10]
tech-stack:
  added: []
  patterns: [security-definer RPC with advisory lock, after() for post-response work, typed ApiResponse<T> with code]
key-files:
  created:
    - supabase/migrations/008_reservation_booking.sql
    - tests/reservations-post.test.ts
    - tests/reservations-admin.test.ts
    - tests/no-public-secrets.test.ts
  modified:
    - src/app/api/reservations/route.ts
    - src/types/database.ts
    - tests/admin-routes-guarded.test.ts
decisions:
  - "Admin page only sends id+status or id+admin_notes to PUT, so the whitelist (status, admin_notes) needed no extension"
  - "RPC id type is integer (per 01-03), consent FK is integer"
metrics:
  completed: 2026-10-16
requirements-completed: [RESA-01, RESA-02, SEC-01, SEC-03, SEC-05]
---

# Phase 1 Plan 06: Reservation booking API Summary

OTP-free POST /api/reservations validated by zod + checkSlot, booked through an advisory-locked capacity RPC that also records marketing consent, with admin-only GET/PUT/DELETE and server-only webhook env names.

## Commits
- 6ccbaa2: RED tests (18 failing assertions on the old route)
- aa0995e: migration 008, POST pipeline, types
- b9de1a6: admin guards, PUT whitelist, RESA_* env rename

## What was built
- Migration 008 (file only, NOT applied anywhere): `locale` column + check, `gecko_marketing_consents` (RLS, admin SELECT only), `gecko_create_reservation` (security definer, `pg_advisory_xact_lock` per date, capacity from max_covers / table_block_duration_minutes, consent in same transaction, execute revoked from public/anon/authenticated and granted to service_role).
- POST: invalid_body -> schema -> hours/settings load -> checkSlot -> RPC -> after() (webhook with 5s timeout, localized pending + staff emails) -> `{ data: { id, status: 'pending' } }`. Stale `phone_verification_token` is ignored. All OTP code removed from the route.
- GET: requireAdmin, `?phone=` branch deleted. PUT: requireAdmin, only `status` (enum) and `admin_notes`, locale-aware status email. DELETE: requireAdmin. All responses typed with `ApiResponse<T>` (now has `code?`).
- `NEXT_PUBLIC_RESA_*` gone from src/; local `.env.local` keys renamed (file is gitignored, values never printed).

## Deviations from Plan
- [Rule 1 - Bug in test fixture] The plan's GB number `07700 900123` is in the Ofcom drama range and libphonenumber rejects it as invalid, so the happy path returned 400. Fixture changed to `07911 123456` (+447911123456). Fixed in aa0995e.
- Task 2 and 3 edits were applied sequentially to route.ts; Task 2 left the old GET/PUT/DELETE in place until Task 3.

## Owner / deploy actions still required (not done here, per plan)
- Apply migration 008 to production BEFORE deploying this code (plans 01-09/01-10).
- Rename the webhook env vars in Vercel (RESA_HOOK_URL, RESA_VALIDATION_HOOK_URL) and rotate the URLs (01-10).
- No `git push`, no DB write performed.

## Deferred Issues
- `npm run lint` reports 7 pre-existing errors in untouched files (src/app/[locale]/page.tsx, admin pages, global-error.tsx, not-found.tsx, MenuDisplay.tsx). Logged in deferred-items.md.
- The 007 note about the public `gecko_table_assignments` SELECT policy remains open.
- Concurrency of the RPC is only statically tested; proof on a scratch DB is in 01-09.

## Verification
- `npx vitest run`: 14 files, 122 tests pass. `npx tsc --noEmit -p .`: clean.
- Greps: no `NEXT_PUBLIC_RESA` in src, no `NextResponse.json(` untyped call in the route, `requireAdmin()` x3.

## Known Stubs
None.

## Threat Flags
None beyond the plan's threat model.

## Self-Check: PASSED
