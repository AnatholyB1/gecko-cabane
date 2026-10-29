---
phase: 06-plan-de-pages-seo-allemand-su-dois-et-pr-sence-externe
plan: 04
subsystem: off-site presence
tags: [outreach, concierge, pdf, docs]
requires: []
provides:
  - outreach target list and 12 FR/EN/DE messages (unsent)
  - concierge dossier (Markdown + printable PDF with A6 card)
affects: []
tech-stack:
  added: []
  patterns: [offline pdfkit + qrcode generator, doc test]
key-files:
  created:
    - tests/ph6-outreach.test.ts
    - docs/ph6/outreach-targets.md
    - docs/ph6/outreach-messages.md
    - docs/ph6/concierge-dossier.md
    - docs/ph6/concierge-dossier.pdf
    - scripts/generate-concierge-dossier.mjs
key-decisions:
  - "Commission left as placeholder; tests forbid any figure or percentage"
  - "Contact routes not verified are flagged A VÉRIFIER; no personal addresses copied"
requirements-completed: [OPS-06, OPS-07]
duration: 10min
completed: 2026-10-17
---

# Phase 6 Plan 04: Outreach and concierge dossier Summary

Ready-to-send but unsent outreach material for four travel guides (12 FR/EN/DE messages) plus a hotel concierge dossier with an offline-generated PDF including an A6 recommendation card with QR.

## Tasks

| Task | Commit |
|------|--------|
| 1 RED doc test | af2789a |
| 2 Outreach targets and messages | ff881d9 |
| 3 Concierge dossier, generator, PDF | 66afbe3 |

## Verification

`npm test` green (40 files, 415 tests). `node scripts/generate-concierge-dossier.mjs` runs offline.

## Deviations from Plan

- Worktree was reset to the expected base commit 65bf0fb at startup, and `npm ci` was run in the worktree to get dependencies (no package added).
- English and German messages use "Subject:/Betreff:" labels instead of the French "Objet", for readability.

## Notes for the owner

- DE messages need review by the DE reader (D-06).
- Nothing was sent; no Gmail drafts created.
- Hotel checklists and commission are left blank for the owner.

## Known Stubs

Intentional placeholders: commission "[à définir par le propriétaire]", empty hotel tables, signature "____".

## Self-Check: PASSED
