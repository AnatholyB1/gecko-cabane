---
phase: 06-plan-de-pages-seo-allemand-su-dois-et-pr-sence-externe
plan: 02
subsystem: reservations-api
tags: [i18n, reservations, zod, phone]
requires: []
provides:
  - de/sv accepted by /api/reservations with real locale stored
  - phone default DE for de, SE for sv
  - de/sv customers get English emails until DE/SV copy exists
affects: [reservation form on /de and /sv routes]
key-files:
  modified:
    - src/utils/reservation-schema.ts
    - src/utils/validation.ts
    - src/types/database.ts
    - src/app/api/reservations/route.ts
    - tests/reservation-schema.test.ts
    - tests/api-validation.test.ts
decisions:
  - Locale whitelist stays closed (fr/en/de/sv); other values rejected
  - 429 message is French only for fr, English otherwise
metrics:
  completed: 2026-10-17
  tasks: 2
---

# Phase 6 Plan 02: de/sv reservations Summary

Reservation API now accepts `de` and `sv` locales, defaults phone country to DE/SE, stores the real locale, and routes email copy through `emailLocaleFor` (English for non-fr).

## Commits
- ed77908 test(06-02): failing tests (RED)
- feat(06-02) commit: implementation (GREEN), see git log

## Deviations from Plan

**[Rule 1 - Bug] Obsolete assertion in tests/api-validation.test.ts** asserted `phoneCountryForLocale('de') === 'TH'`, contradicting the new contract. Changed to use `'es'` for the TH fallback.

Note: the status-update email site previously mapped missing/unknown locale to French; `emailLocaleFor(data.locale ?? 'fr')` preserves French for fr/missing and gives English for en/de/sv.

## Verification
`npx vitest run`: 39 files, 413 tests pass. `npx tsc --noEmit`: exit 0.

## Self-Check: PASSED
