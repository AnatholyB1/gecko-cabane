---
phase: 07-newsletter
plan: 07
subsystem: newsletter
tags: [brevo, sequences, privacy, pdpa, gdpr, docs]
requires: [07-03, 07-04]
provides:
  - FR/EN drafts for after-visit J+2, during-stay J+3, October return, green season
  - SEQUENCES.md sequence map and BREVO-SETUP.md owner runbook
  - /privacy newsletter section (fr/en, 7 items)
  - tests/newsletter-docs.test.ts
affects: [07-10, 07-11]
key-files:
  created:
    - docs/newsletter/SEQUENCES.md
    - docs/newsletter/BREVO-SETUP.md
    - docs/newsletter/sequences/*.md (8 drafts)
    - tests/newsletter-docs.test.ts
  modified:
    - messages/fr.json
    - messages/en.json
    - src/app/[locale]/privacy/page.tsx
requirements-completed: []
status: PARTIAL - awaiting owner review (Task 3 checkpoint)
completed: 2026-10-17
---

# Phase 7 Plan 07: Sequences, Brevo runbook and privacy Summary (partial)

Autonomous tasks 1 and 2 are done; Task 3 (owner review) is pending. NEWS-06 and NEWS-01 are not marked complete until the owner approves.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. Drafts, sequence map, Brevo runbook, docs test | b503ef5 | docs test 6 passed |
| 2. Privacy newsletter section fr/en | a1e9f34 | i18n, i18n-hardcoded, seo-pages 18 passed |
| 3. Owner review | pending | checkpoint |

## Deviations from Plan

None. The welcome-email-via-Resend choice is the plan's own documented deviation from D-05 and is recorded in SEQUENCES.md as "à valider" until the owner answers.

## Pending owner answers (not fabricated)

- Welcome email via Resend: accept or refuse (no answer yet).
- Approval of the four Brevo sequences (no answer yet). SEQUENCES.md shows "brouillon".
- Each `[À CONFIRMER PAR LE PROPRIÉTAIRE]` marker in the drafts is unresolved (after-visit: mention review link; during-stay: dish suggestion; October return: season opening and menu news; green season: seasonal dish or hours).

## Known Stubs

The unresolved owner markers above are intentional and must be cleared at the checkpoint.

## Self-Check: PASSED (tasks 1-2)

Files exist, docs test and i18n tests green.
