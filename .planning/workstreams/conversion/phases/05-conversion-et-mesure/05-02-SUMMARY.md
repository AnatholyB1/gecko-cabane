---
phase: 05-conversion-et-mesure
plan: 02
subsystem: reservations
tags: [source, utm, supabase-migration, admin]
requires: []
provides:
  - Migration 015 (source with check, utm_source, utm_medium, ref, sequence grant)
  - reservation-source util (RESERVATION_SOURCES, isReservationSource, SOURCE_LABELS, sanitizeUtm, formatOrigin)
  - Unforgeable 'site' source on public POST, sanitized UTM stored after the RPC
  - PUT source whitelist and admin source selector with origin line
affects: [05-06, 05-11]
tech-stack:
  added: []
  patterns: [best-effort follow-up update after RPC, schema strips unknown keys]
key-files:
  created:
    - supabase/migrations/015_reservation_source.sql
    - src/utils/reservation-source.ts
    - tests/reservation-source.test.ts
  modified:
    - src/types/database.ts
    - src/utils/reservation-schema.ts
    - src/app/api/reservations/route.ts
    - src/app/admin/reservations/page.tsx
    - tests/migrations.test.ts
    - tests/reservations-post.test.ts
    - tests/reservations-admin.test.ts
key-decisions:
  - "source is absent from the zod schema and never read in POST; the DB default 'site' makes it unforgeable"
requirements-completed: [RESA-06]
duration: 12min
completed: 2026-10-17
---

# Phase 5 Plan 02: Reservation source and UTM Summary

**Every reservation now carries a source (public = 'site', unforgeable), sanitized UTM origin is stored, and the admin can see and reclassify the source.**

## Accomplishments
- Migration 015 adds idempotent columns with check constraints (not applied; owner action).
- POST stores sanitized utm_source/utm_medium/ref via a best-effort update; failures go to Sentry and never fail the booking.
- PUT accepts `source` only from the 4-value whitelist (400 otherwise).
- Admin: source select, "Origine" line and gray source chip per reservation.

## Task Commits
1. RED tests: 3c6da5b
2. Migration, types, util, schema, route: c141a8e
3. Admin UI: 43be910

## Verification
Full vitest suite 458/458, tsc clean, lint 0 errors (pre-existing warnings), `npm run build` succeeds.

## Deviations from Plan
None.

## Owner actions pending
Apply migration 015 to production before deploying (listed by 05-11).

## Self-Check: PASSED
