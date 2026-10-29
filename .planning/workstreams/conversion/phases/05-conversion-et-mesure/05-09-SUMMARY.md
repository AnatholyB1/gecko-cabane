---
phase: 05-conversion-et-mesure
plan: 09
subsystem: reviews-admin
tags: [admin, review-stats, whatsapp, supabase-rls]
requires: [05-05, 05-06, 05-07]
provides:
  - review-report.ts (REVIEW_SOURCE_LABELS, buildMonthTable, totalsEvolution, lastMonths, parseMonthParam, isValidTotal)
  - review-whatsapp.ts (REVIEW_WA_LINK, REVIEW_WA_TEMPLATES fr/en/de, reviewWhatsAppShareUrl)
  - GET/PUT /api/review/stats (admin-only, RLS cookie client)
  - /admin/avis page and admin home tile
affects: [05-11, 05-13]
key-files:
  created:
    - src/utils/review-report.ts
    - src/utils/review-whatsapp.ts
    - src/app/api/review/stats/route.ts
    - src/app/admin/avis/page.tsx
    - tests/review-report.test.ts
    - tests/review-whatsapp.test.ts
  modified:
    - src/app/admin/page.tsx
    - tests/admin-routes-guarded.test.ts
key-decisions:
  - "months query param is clamped to 1..24 rather than rejected"
  - "No Google/TripAdvisor API: totals are typed in by the owner"
requirements-completed: []
duration: 15min
completed: 2026-10-17
---

# Phase 5 Plan 09: Admin Avis page Summary

**The owner now has /admin/avis: monthly /review visits and Google/TripAdvisor clicks per source, manual platform totals with month-over-month deltas, and FR/EN/DE WhatsApp invitation messages (copy or open in WhatsApp).**

## Accomplishments
- Pure helpers with Asia/Bangkok month boundaries, zero-filled per-source table, totals evolution with deltas.
- Admin-only stats API under RLS (no service role, no external review API); validated month and integer totals 0..100000; added to the admin guard scan.
- French fixed admin page (table with sr-only caption and scoped headers, labelled inputs, copy button with aria-live, DE card badged "à relire") and an "Avis" tile plus quick link on the admin home.

## Task Commits
1. RED tests: a0c3835
2. Helpers, templates, stats API: f3e54ae
3. Page and admin tile: ed5a8f6

## Verification
Full vitest 588/588 passed, `tsc --noEmit` clean, lint 0 errors (8 pre-existing warnings), `npm run build` succeeds.

## Deviations from Plan
None. (An unused eslint-disable directive was removed after lint flagged it.)

## Requirements status
REV-05 and REV-06 are intentionally NOT (re)marked complete by this plan:
- REV-05: the DE message must be proofread by a human (PROJECT constraint); sending is a manual owner action.
- REV-06: the page only shows data once migration 016 (05-05) is applied to production, an owner action not performed here. The REV-06 checkbox was already set by 05-05; leaving it as is.

## Owner actions pending
- Apply migration 016 to production (otherwise /admin/avis shows the load error).
- Proofread the DE WhatsApp text.

## Known Stubs
None.

## Self-Check: PASSED
