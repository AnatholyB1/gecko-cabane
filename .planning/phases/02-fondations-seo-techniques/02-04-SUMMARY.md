---
phase: 02-fondations-seo-techniques
plan: 04
subsystem: i18n
tags: [next-intl, seo, vitest]
requires: [02-02]
provides:
  - Home page (page.tsx) with every visible string through next-intl
  - Full-scope i18n guard (no exclusion) with BANNED_PHRASES
affects: [02-07]
key-files:
  modified:
    - src/app/[locale]/page.tsx
    - messages/fr.json
    - messages/en.json
    - tests/i18n-hardcoded.test.ts
key-decisions:
  - "Gallery dish-name captions stay French, marked i18n-ignore (D-12)"
  - "Footer hours set to 12h-22h / 12pm-10pm to match DB/schema (D-05)"
requirements-completed: [SEO-04]
duration: 10min
completed: 2026-10-16
---

# Phase 2 Plan 04: Home page i18n migration Summary

**All hard-coded French literals of the home page now go through next-intl (new `gallery` namespace plus eyebrow/alt/aria keys), the footer hours text is corrected, and the guard test scans the whole locale tree with a banned-phrase list.**

## Accomplishments
- page.tsx: eyebrows (Our Story, Our Cuisine, The Menu, Our Creations, Opening Hours, Reservation, Find Us), aria-label, hero location, chef role and photo alt, gallery title/alts/tagline, sign alt via `t()`; markup and classes unchanged. Brand names TripAdvisor/Facebook kept.
- Dish-name captions kept as-is with `// i18n-ignore: dish name`.
- tests/i18n-hardcoded.test.ts: `EXCLUDED_UNTIL_02_04` removed; added `BANNED_PHRASES`, footer-hours assertions and an English-accent check on the home namespaces.

## Task Commits
1. Task 1 (RED): d0de390 test(02-04)
2. Task 2 (GREEN): 83625f8 feat(02-04)

## Footer hours (important)
- Footer hours 12h-22h / 12pm-10pm: **PENDING OWNER CONFIRMATION** - confirmed or corrected in plan 02-07 Task 2 (RESEARCH Q2).
- This copy (`footer.openHours` in messages/fr.json and en.json) is static: if the admin later changes the opening hours in the database, it must be updated by hand.

## Verification
- `vitest run`: 23 files, 221 tests pass. eslint on page.tsx: 0 errors (3 pre-existing img warnings).
- NOT verified: visual rendering of /en and /fr (desktop and mobile), no browser check performed.
- `tsc --noEmit` reports one pre-existing error in tests/seo-sitemap-robots.test.ts (from plan 02-03, out of scope, not touched).

## Deviations from Plan
None - plan executed as written. No push, no external action.

## Known Stubs
None.

## Self-Check: PASSED
Commits d0de390 and 83625f8 exist; modified files present.
