---
phase: 06-plan-de-pages-seo-allemand-su-dois-et-pr-sence-externe
plan: 03
subsystem: off-site presence docs
tags: [google-posts, tripadvisor, nap, review-replies, docs]
requires: []
provides:
  - docs/ph6 owner folder (README index, NAP audit, TripAdvisor update, Google posts, review replies)
  - tests/ph6-docs.test.ts doc-scan gate
affects: [06-10 (NAP/TripAdvisor execution with owner), 06-08 (TripAdvisor link)]
key-files:
  created:
    - tests/ph6-docs.test.ts
    - docs/ph6/README.md
    - docs/ph6/nap-audit.md
    - docs/ph6/tripadvisor-update.md
    - docs/ph6/google-posts-fr-en.md
    - docs/ph6/review-replies.md
decisions:
  - "Docs are drafts only; nothing sent or published, no external account touched"
metrics:
  completed: 2026-10-17
---

# Phase 6 Plan 03: Off-site slice A Summary

Owner-ready drafts in `docs/ph6/`: 8 Google posts (FR/EN), 21 review reply templates (FR/EN/DE, 48 h rule, no incentive), NAP audit table with canonical values tied to `buildRestaurantJsonLd`, TripAdvisor checklist with paste-ready EN/FR text, and a README with the "nothing published without written approval" rule and the open owner decisions.

## Commits
- 102a961 test: failing doc-scan gate (RED)
- 8b2d241 docs: README, NAP audit, TripAdvisor update
- GREEN docs commit: Google posts and review replies (see git log)

## Deviations from Plan
- README index lists plan numbers for later files (outreach, concierge, review/de|sv) as best guesses; adjust when those plans land.
- Worktree had no node_modules; a symlink to the main repo's node_modules (git-ignored) was used to run tests.
- The posts rules block avoids the word "alcool" to satisfy the ban test (phrased as "produits réglementés").

## Verification
`npx vitest run`: 40 files, 414 tests pass, including 6 in tests/ph6-docs.test.ts. ESLint clean on the new test.

## Known Stubs
Intentional owner placeholders: low-season offer, event date/time, "à relever" cells in the NAP table, publication dates.

## Self-Check: PASSED
