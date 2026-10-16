---
phase: 01-r-servation-s-re-et-sans-friction
plan: 05
subsystem: email
tags: [resend, i18n, xss, email-templates]
requires: []
provides:
  - "escapeHtml / stripLineBreaks helpers (src/utils/html.ts)"
  - "Bilingual fr/en customer emails with EmailLocale param (default 'fr')"
affects: [01-06]
tech-stack:
  added: []
  patterns: ["COPY dictionary per locale in resend.ts", "escapeHtml on every interpolation"]
key-files:
  created: [src/utils/html.ts, tests/resend-escape.test.ts, tests/resend-locale.test.ts]
  modified: [src/utils/resend.ts]
key-decisions:
  - "Staff notification stays French and shows 'Langue du client'"
  - "French strings kept identical; WhatsApp change/cancel line added to the pending email in both languages"
requirements-completed: [RESA-01, RESA-03]
duration: 15min
completed: 2026-10-16
---

# Phase 1 Plan 05: Bilingual and escaped emails Summary

Customer emails (pending, confirmed, cancelled) now render in French or English via an optional `locale` argument defaulting to `'fr'`, and every customer-supplied value is HTML-escaped with CR/LF stripped from subjects.

## Tasks

1. escapeHtml helper applied to all interpolations: test a41b1c4, feat 1743473
2. Bilingual templates: test a296e17, feat 136fec2

## Verification

- Full `vitest run`: 10 files, 100 tests pass
- `tsc --noEmit` passes; existing callers compile unchanged
- eslint clean on the files touched

## Deviations from Plan

- The French pending email gained a WhatsApp change/cancel line (the plan calls for it in English; added for both languages for parity). Other French strings unchanged.
- `ReservationDetails` is now exported (previously internal).

## Deferred Issues

`npm run lint` reports 7 errors in unrelated files (e.g. `fetchMenu` hoisting in a menu component). Pre-existing, out of scope.

## Threat Flags

None.

## Self-Check: PASSED
