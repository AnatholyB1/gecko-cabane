---
phase: 01-r-servation-s-re-et-sans-friction
plan: 01
subsystem: auth
tags: [security, supabase, api, vitest, sentry]
requires: []
provides:
  - "requireAdmin() shared guard (401 anonymous / 403 non gecko admin)"
  - "vitest '@' alias for handler tests"
affects: [01-06, 01-08]
tech-stack:
  added: []
  patterns: ["const auth = await requireAdmin(); if (!auth.ok) return auth.response; const { supabase } = auth", "source-scan test over route files"]
key-files:
  created: [src/utils/auth.ts, tests/require-admin.test.ts, tests/admin-routes-guarded.test.ts]
  modified: [vitest.config.ts, "14 route.ts files under src/app/api (announcement, hours, special-hours, settings, menu/*, tables/*)"]
key-decisions:
  - "Guard messages in English (Unauthorized/Forbidden); isGeckoAdmin failure is fail-closed (403)"
  - "Raw Supabase error.message replaced by generic 'Internal server error' + Sentry.captureException, also in public GET handlers"
requirements-completed: [SEC-03]
duration: 10min
completed: 2026-10-16
---

# Phase 1 Plan 01: requireAdmin guard Summary

Shared `requireAdmin()` (getUser -> 401, gecko_is_admin -> 403) applied to every mutating admin API route, with GET /api/tables/assignments made admin-only and a source-scan test that blocks regressions at build time.

## Tasks

1. Vitest `@` alias + `requireAdmin()` with 3 unit tests (RED then GREEN) - commit bd44bc8
2. Guarded 14 route files (26 `requireAdmin()` calls total), scan test, generic error responses - commit 55a5dc0

## Deviations from Plan

None in scope. Notes:
- The plan counted 14 route files; all were handled (menu/upload was converted manually since its guard used a different shape and French message 'Non autorise', now unified to the shared 401/403 messages).
- Generic error replacement also touched public GET handlers (required by the "no raw error.message" acceptance criterion). `settings` PUT now returns a French generic message per key instead of the Supabase message.
- Removed now-unused `createClient` imports in 4 route files.

## Verification

- `npx vitest run`: 4 files, 39 tests pass
- `npx tsc --noEmit`: clean
- `npm run lint`: no problems in files touched (pre-existing errors in unrelated components, out of scope)
- No public caller of `/api/tables/assignments` found before guarding GET.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED
