---
phase: 05-conversion-et-mesure
plan: 01
subsystem: analytics
tags: [plausible, utm, sessionStorage, next-rewrites, middleware]
requires: []
provides:
  - Inert Plausible Cloud proxy under /gcm (script + events), active only with a valid pa- id
  - EVENTS constants and safe track() helper
  - UTM/ref capture in sessionStorage (gc_attr) sent with the reservation POST
  - "Reservation Sent" event fired on successful booking
affects: [05-02, 05-04]
tech-stack:
  added: []
  patterns: [env-keyed inert rewrites, null-rendering client capture component, source-scan wiring tests]
key-files:
  created:
    - src/utils/analytics.ts
    - src/utils/attribution.ts
    - src/components/PlausibleScript.tsx
    - src/components/AttributionCapture.tsx
    - tests/analytics.test.ts
    - tests/attribution.test.ts
    - tests/analytics-wiring.test.ts
  modified:
    - next.config.ts
    - src/middleware.ts
    - src/app/[locale]/layout.tsx
    - src/components/ReservationForm.tsx
    - tests/middleware-matcher.test.ts
key-decisions:
  - "attribution spread first in the POST body so it cannot override form fields; no client-side source field"
requirements-completed: [KPI-01, RESA-06]
duration: 10min
completed: 2026-10-17
---

# Phase 5 Plan 01: Plausible and attribution capture Summary

**Cookieless Plausible behind a first-party /gcm proxy that stays inert without the owner's pa- id, plus UTM/ref session capture and a "Reservation Sent" event.**

## Accomplishments
- analytics.ts: EVENTS, PLAUSIBLE_ID_RE, getPlausibleScriptId(), never-throwing track().
- attribution.ts: parse/capture/read with 3 known keys, 100-char bound, last touch.
- next.config rewrites() returns [] unless the id matches /^pa-[A-Za-z0-9_-]+$/ (T-05-01); middleware matcher excludes gcm (T-05-05).
- ReservationForm sends attribution and tracks only inside `if (response.ok)`.

## Task Commits
1. Task 1 (RED tests): 28e45f8
2. Task 2 (helpers, components, config): 2f5ae54
3. Task 3 (form wiring): 90e5325

## Deviations from Plan
None. `npm run build` was not run; the full vitest suite (442 tests), tsc and lint (warnings only, pre-existing) pass.

## Owner actions pending
Set NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID (pa-...) in Vercel and redeploy; create goals "Reservation Sent", "WhatsApp Click", "LINE Click" and custom props locale, src in Plausible.

## Self-Check: PASSED
