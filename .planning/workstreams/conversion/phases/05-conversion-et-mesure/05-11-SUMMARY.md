---
phase: 05-conversion-et-mesure
plan: 11
subsystem: privacy-compliance
tags: [privacy, plausible, pdpa, gdpr, owner-checklist]
requires: [05-01, 05-08, 05-10]
provides:
  - Privacy page items for "Un souci ?" messages (data.item7) and Plausible (sharing.item4), FR and EN
  - OWNER-CHECKLIST.md consolidating every owner-dependent item of phase 5
affects: [privacy page, owner launch]
tech-stack:
  added: []
  patterns: [flat itemN keys counted by SECTIONS, source-scan copy tests]
key-files:
  created:
    - tests/privacy-copy.test.ts
    - .planning/workstreams/conversion/phases/05-conversion-et-mesure/OWNER-CHECKLIST.md
  modified:
    - src/app/[locale]/privacy/page.tsx
    - messages/fr.json
    - messages/en.json
decisions:
  - "EU hosting claim included: verified by read-only fetch of plausible.io/data-policy (2026-10-17): 'All visitor data is securely processed and stored in the EU'"
metrics:
  tasks: 2
  completed: 2026-10-17
requirements-completed: []
---

# Phase 5 Plan 11: Privacy copy and owner checklist Summary

**The privacy page now discloses cookieless Plausible measurement and the handling of "Un souci ?" messages in FR and EN, and OWNER-CHECKLIST.md lists every owner action with the explicit CONV-01 / D-14 review gate.**

## Accomplishments
- privacy.data.item7: "Un souci ?" message and optional email are sent by email to the restaurant and not stored on the site.
- privacy.sharing.item4: Plausible Analytics, no cookies, no personal identifier, hosted in the EU. Hosting claim verified on plausible.io/data-policy (curl, read-only, since WebFetch was unavailable); the page says data is processed and stored in the EU.
- Previous last items re-punctuated (';'), SECTIONS counts bumped (data 7, sharing 4), lastUpdated set to 17 octobre 2026 / 17 October 2026.
- OWNER-CHECKLIST.md (26 checkboxes, French): migrations 015 then 016 before deploy, Vercel env vars, REV-07 inbox test, manual-reservation RLS check, Plausible id/goals/props, LINE URL, blocking review gate (05-12 then 05-13), aggregateRating policy risk and SHOW_AGGREGATE_RATING switch, couple photo / owner text / trajets, DE WhatsApp proofreading, optional pb= map URL, privacy text validation, unverified PageSpeed gate.

## Commits
- RED test: 866ffb5
- Privacy copy: 061db69
- Checklist: a64375b

## Verification
Full vitest 603/603, tsc clean, lint 0 errors (8 pre-existing warnings), `npm run build` succeeds.

## Deviations from Plan
None. WebFetch was not available, so the Plausible page was fetched with curl (read-only) instead.

## Notes for the owner
- The privacy text is a **draft for owner validation** (project rule: nothing legal-facing is final without the owner and, ideally, a legal read).
- 05-07 PageSpeed gate remains unverified; REV-07 email delivery and CONV-01/D-14 remain open (see checklist). No requirements were marked complete.

## Self-Check: PASSED
