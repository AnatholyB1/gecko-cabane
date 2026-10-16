---
phase: 01-r-servation-s-re-et-sans-friction
plan: 04
subsystem: reservation-rules
tags: [tdd, validation, zod, libphonenumber, timezone]
requires: []
provides:
  - "reservation-rules.ts: Krabi-time slot, hours and last-bookable rules"
  - "reservation-schema.ts: zod request schema, error codes, consent version"
  - "validation.ts: libphonenumber phone helpers, isEmailValid, party cap 40"
affects: [01-06, 01-07, 01-08]
tech-stack:
  added: ["zod ^4.3.6 (declared; was transitive)"]
  patterns: ["pure rule functions shared by API and form", "stable error codes"]
key-files:
  created:
    - src/utils/reservation-rules.ts
    - src/utils/reservation-schema.ts
    - tests/reservation-rules.test.ts
    - tests/reservation-schema.test.ts
    - tests/deps.test.ts
  modified:
    - src/utils/validation.ts
    - tests/api-validation.test.ts
    - package.json
    - package-lock.json
decisions:
  - "zod pinned via lockfile at the vetted 4.3.6 (npm default would have bumped to 4.6.7)"
  - "isOtpCode kept in validation.ts until plan 01-07"
metrics:
  tasks: 2
  files: 9
  completed: 2026-10-16
---

# Phase 1 Plan 04: Reservation rules, phone and zod schema Summary

Tested pure functions for Krabi-time slot rules (Tuesday/special hours/last bookable time/same-day lead), international E.164 phone parsing via libphonenumber-js, mandatory email, party cap 40, and a zod request schema with stable error codes; zod is now a declared dependency.

## Commits
- a7f71a3 test(01-04): RED tests for Krabi-time rules
- 8749729 feat(01-04): reservation-rules.ts GREEN
- 1333ebc test(01-04): RED tests for phone, email, schema, deps
- 8013ee6 feat(01-04): validation rewrite, schema, zod declared

## Verification
- `npx vitest run`: 8 files, 87 tests passed
- `npx tsc --noEmit -p .`: clean
- `npx eslint src/utils tests`: clean (7 pre-existing lint errors in unrelated menu/admin files, out of scope)

## Deviations from Plan

**1. [Rule 1 - Bug] Plan's GB example number is not a valid number**
- **Issue:** `07700 900123` is in Ofcom's reserved drama range; libphonenumber `isValid()` returns false, so the specified expectation (`+447700900123`) cannot hold.
- **Fix:** tests use the valid `07911 123456` -> `+447911123456`. Behavior is unchanged.
- **Files:** tests/api-validation.test.ts, tests/reservation-schema.test.ts

**2. [Rule 1 - Bug] Old normalizePhone/isE164Phone test fixtures were not real numbers**
- `+4412345678`, `+15551234567`, `+1 (415) 555-1234`, and Thai landline `0531234567` are invalid or now parse differently under libphonenumber; fixtures replaced with valid ones (e.g. `+14155552671`) and an invalid-input case added.

**3. [Rule 3] zod version**
- `npm install zod@^4.3.6` bumped the lockfile to 4.6.7; reverted and installed `zod@4.3.6`, then set the range to `^4.3.6` so the lockfile keeps the vetted version. `git diff package.json` shows only the zod line.

## Known Stubs
None.

## Threat Flags
None. Mitigations T-01-15 to T-01-18 implemented (type/range/regex limits, server re-parse of phone, boolean-only consent, max lengths).

## Self-Check: PASSED
Files and commits 8749729, 1333ebc, 8013ee6 verified present.
