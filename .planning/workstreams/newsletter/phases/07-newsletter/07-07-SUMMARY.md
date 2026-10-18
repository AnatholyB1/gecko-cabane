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
requirements-completed: [NEWS-06, NEWS-01]
status: COMPLETE
completed: 2026-10-18
---

# Phase 7 Plan 07: Sequences, Brevo runbook and privacy Summary

Tasks 1-3 done. Owner review completed 2026-10-18.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. Drafts, sequence map, Brevo runbook, docs test | b503ef5 | docs test 6 passed |
| 2. Privacy newsletter section fr/en | a1e9f34 | i18n, i18n-hardcoded, seo-pages 18 passed |
| 3. Owner review | done | 1adda0c |

## Deviations from Plan

None. The welcome-email-via-Resend choice is the plan's own documented deviation from D-05 and is recorded in SEQUENCES.md as "à valider" until the owner answers.

## Owner review (2026-10-18)

Owner replies, quoted verbatim:

- Drafts: "review link yes; 2 -3 -4 depends on what we have new send them to menu or landing; approved"
- Welcome email via Resend and privacy text (including the no-network-location sentence): "approved for both"

Applied: review link added to the J+2 email (/{locale}/review?src=newsletter); placeholders removed from J+3, October return and green season; October return gained a menu link; all four Brevo sequences marked "approved 2026-10-18" in SEQUENCES.md; welcome row marked "accepted Resend 2026-10-18". Commit 1adda0c.
