---
phase: 05-conversion-et-mesure
plan: 06
subsystem: reservations-admin
tags: [manual-reservation, source, admin, rls]
requires: [05-02]
provides:
  - validateManualReservation and MANUAL_SOURCES (site excluded)
  - POST /api/reservations/manual (admin-only, insert under RLS)
  - "Ajouter une réservation" form on /admin/reservations
affects: [05-11]
key-files:
  created:
    - src/utils/manual-reservation.ts
    - src/app/api/reservations/manual/route.ts
    - src/app/admin/reservations/ManualReservationForm.tsx
    - tests/manual-reservation.test.ts
  modified:
    - src/app/admin/reservations/page.tsx
    - tests/admin-routes-guarded.test.ts
key-decisions:
  - "Manual entries are admin overrides: no capacity check, no customer email, no rate limit"
  - "Past dates accepted so walk-ins can be entered after the fact"
requirements-completed: [RESA-06]
duration: 10min
completed: 2026-10-17
---

# Phase 5 Plan 06: Manual admin reservations Summary

**The owner can record WhatsApp, phone and walk-in reservations with a required source, via an admin-only route that inserts under RLS with a field-by-field allowlist.**

## Accomplishments
- Pure validator with French messages; 'site' source rejected; phone optional only for 'sans_reservation'; email optional.
- Route: requireAdmin(), 400 invalid_body/invalid_fields, 201 `{ data: { id } }`, generic 500 (details only in Sentry); status 'confirmed' and confirmed_at set server-side; listed in GUARDED_ROUTE_FILES.
- Admin form toggled from the page header; refreshes the list on success.

## Task Commits
1. RED tests: d5a5c24
2. Validator and route: a95c1b9
3. Admin form: f4b4a3f

## Notes
- A confirmed manual reservation with an email becomes eligible for the phase 4 J+1 review invitation cron, as any confirmed booking (intended).
- No overbooking protection on manual entries (T-05-30, accepted).
- Requires migration 015 applied (source column, sequence grant); not applied here (owner action, covered by 05-11).

## Verification
Full vitest 542/542, tsc clean, lint 0 errors (8 pre-existing warnings), `npm run build` succeeds.

## Deviations from Plan
None.

## Self-Check: PASSED
