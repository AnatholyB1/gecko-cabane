---
phase: 01-r-servation-s-re-et-sans-friction
plan: 02
subsystem: ui
tags: [whatsapp, privacy, i18n, pdpa, next-intl]
requires: []
provides:
  - "buildWhatsAppUrl / getWhatsAppNumber / WHATSAPP_FALLBACK_NUMBER (src/utils/whatsapp.ts)"
  - "Floating WhatsAppButton mounted on all /[locale] pages"
  - "/fr/privacy and /en/privacy localized policy page"
  - "i18n namespaces whatsapp.* and privacy.*; --gc-whatsapp color tokens"
affects: [01-07, 01-10]
tech-stack:
  added: []
  patterns: ["flat item1..itemN i18n keys for lists (parity-test friendly)", "IntersectionObserver on #reservation-submit, mobile only"]
key-files:
  created: [src/utils/whatsapp.ts, tests/whatsapp.test.ts, src/components/WhatsAppButton.tsx, "src/app/[locale]/privacy/page.tsx"]
  modified: ["src/app/[locale]/layout.tsx", src/app/globals.css, messages/fr.json, messages/en.json]
key-decisions:
  - "Number from NEXT_PUBLIC_WHATSAPP_NUMBER with fallback 66819585945 so the button always renders"
  - "Accessible WhatsApp green #128C7E / #0B6B5F as dedicated tokens"
  - "Privacy retention values (24 months reservations, 2 days hashes) are proposals pending owner validation in plan 01-10"
requirements-completed: [RESA-04, RESA-02]
duration: 15min
completed: 2026-10-16
---

# Phase 1 Plan 02: WhatsApp button and privacy page Summary

Floating 56px WhatsApp link (prefilled message in the page language, hides over the mobile submit button) on every public page, plus a fully translated FR/EN `/privacy` page for the consent link.

## Tasks

1. WhatsApp util (4 tests), button, layout mount, color tokens, i18n keys - commit 910a9be
2. `/privacy` server component with metadata and `privacy.*` keys in fr/en - commit 344a563

## Deviations from Plan

None - plan executed as written. TDD: test file and implementation were committed together in one commit (no separate RED commit).

Notes:
- Full `npm run lint` reports 7 pre-existing errors in unrelated files (e.g. menu admin page `react-hooks/immutability`); files touched by this plan lint clean. Out of scope.
- Privacy text must be validated by the owner (plan 01-10 checkpoint) before going live.
- Visual dev-server check of the button and pages was not run; verified via lint, tsc (no errors in new files) and tests.

## Known Stubs

None.

## Self-Check: PASSED
