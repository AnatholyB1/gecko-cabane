---
phase: 02-fondations-seo-techniques
plan: 02
subsystem: i18n
tags: [next-intl, intl-displaynames, vitest, seo]

requires: []
provides:
  - Components and locale error/404 pages free of hard-coded French text
  - Source-scan guard test (tests/i18n-hardcoded.test.ts)
affects: [02-04 (page.tsx migration, remove EXCLUDED_UNTIL_02_04)]

tech-stack:
  added: []
  patterns:
    - "i18n-ignore marker comment for intentional non-translated French literals"
    - "Country names via Intl.DisplayNames([locale], { type: 'region' })"

key-files:
  created: [tests/i18n-hardcoded.test.ts]
  modified:
    - src/components/MenuDisplay.tsx
    - src/components/ReservationForm.tsx
    - src/components/AnnouncementBanner.tsx
    - src/app/[locale]/error.tsx
    - src/app/[locale]/not-found.tsx
    - messages/fr.json
    - messages/en.json

key-decisions:
  - "Stored occasion enum values stay French and are marked i18n-ignore (T-02-04)"
  - "Announcement dates formatted en-GB on /en, fr-FR otherwise"

requirements-completed: [SEO-04]

duration: 10min
completed: 2026-10-16
---

# Phase 2 Plan 02: Hard-coded French migration Summary

**Menu, announcement banner, reservation form and error/404 pages now render from next-intl, with Intl.DisplayNames country names and a vitest source scan that blocks accented French literals from coming back.**

## Accomplishments
- MenuDisplay: legend, dietary aria-labels/svg titles and "preparing" messages via `menuSection` (new key `menuPreparing`).
- AnnouncementBanner: new `announcement` namespace (from/to/close), locale-aware date format.
- error.tsx / not-found.tsx: `signature` keys (EN says "Thailand").
- ReservationForm: bilingual country `name` fields removed, replaced by `Intl.DisplayNames`; placeholders translated; accented stored occasion values marked `i18n-ignore`.
- Guard test scans `src/components/**` and `src/app/[locale]/**` (page.tsx excluded via `EXCLUDED_UNTIL_02_04`).

## Task Commits
1. Task 1 RED: e360a35 (test), GREEN part 1: d424eb1 (feat)
2. Task 2: c283846 (feat)

## Verification
- `vitest run`: 21 files, 197 tests pass (including i18n parity and reservation-form contract).
- eslint on src/components and src/app/[locale]: 0 errors (3 pre-existing img warnings in page.tsx).
- NOT verified: visual rendering on /en and mobile, and Intl.DisplayNames hydration behaviour in a real browser (no browser check performed).

## Deviations from Plan
None in behaviour. Minor: the placeholder message keys for ReservationForm were added in the Task 1 commit together with the other message additions (single JSON edit), then used in Task 2.

## Known Stubs
None.

## Self-Check: PASSED
Files and commits e360a35, d424eb1, c283846 exist.
