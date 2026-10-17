---
phase: 05-conversion-et-mesure
plan: 04
subsystem: conversion
tags: [line, whatsapp, floating-contact, plausible, i18n]
requires: [05-01, 05-03]
provides:
  - parseLineUrl/getLineUrl with host allowlist (inert without NEXT_PUBLIC_LINE_URL)
  - FloatingContact stack (LINE above WhatsApp) with shared mobile hide logic
  - WhatsApp Click / LINE Click events with locale and utm_source
affects: []
tech-stack:
  added: []
  patterns: [env-gated UI, source-scan tests]
key-files:
  created:
    - src/utils/line.ts
    - src/components/FloatingContact.tsx
    - tests/line.test.ts
    - tests/floating-contact.test.ts
  modified:
    - src/app/[locale]/layout.tsx
    - src/app/globals.css
    - messages/fr.json
    - messages/en.json
  deleted:
    - src/components/WhatsAppButton.tsx
key-decisions:
  - "LINE URL validated at build/render: https + exact host in line.me, lin.ee, page.line.me, no credentials; otherwise no button"
requirements-completed: [RESA-05, RESA-06, KPI-01]
duration: 8min
completed: 2026-10-17
---

# Phase 5 Plan 04: LINE and WhatsApp floating contact Summary

**A validated, env-gated LINE button stacked above WhatsApp in one FloatingContact, with both taps tracked in Plausible without delaying navigation.**

## Accomplishments
- line.ts rejects non-https, foreign hosts (including lin.ee.evil.com), credentials and javascript: URLs (T-05-16).
- FloatingContact hides as one unit on mobile while #reservation-submit is visible; anchors get tabIndex -1 and aria-hidden while hidden.
- Click handlers read attribution at click time and send locale plus utm_source when present; no preventDefault.
- LINE color tokens (#06A94D / #058A3E) and `line` i18n namespace (fr/en).

## Task Commits
1. Task 1 (RED tests): 95de711
2. Task 2 (implementation): ea87dc0

## Deviations from Plan
None. The LINE glyph is a simple speech-bubble path drawn for this plan, not the official brand mark; swap in the official asset if the owner wants brand fidelity.

## Verification
Full vitest suite (506 tests), tsc, lint (0 errors, pre-existing warnings) and `npm run build` pass.

## Owner actions pending
Set NEXT_PUBLIC_LINE_URL (https://lin.ee/... or https://line.me/R/ti/p/@...) in Vercel and redeploy; until then only WhatsApp shows.

## Self-Check: PASSED
