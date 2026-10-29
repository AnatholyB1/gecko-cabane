---
phase: 7
slug: newsletter
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-17
---

# Phase 7 — Validation Strategy

See the "Validation Architecture" section of `07-RESEARCH.md` for the full test map.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/newsletter*.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

## Sampling Rate

- **After every task commit:** quick run command
- **After every plan wave:** `npm test`
- **Before verify-work:** full suite green, `npm run lint`
- **Max feedback latency:** 60 seconds

## Per-Task Verification Map

Filled by the planner from the plans' tasks (NEWS-01..07).

## Wave 0 Requirements

- [ ] `tests/newsletter-*.test.ts` stubs (consent resolver, signed links, Brevo payload mapping, segment/country logic, i18n parity)

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Brevo list, attributes, webhook, automations | NEWS-01, NEWS-06 | Owner account | Checkpoint tasks |
| Pop-up on real mobile | NEWS-02 | Visual | Check bottom sheet, once only |
| Print supports (bill QR, WiFi card) | NEWS-03, NEWS-04 | Physical | Scan QR |

**Approval:** pending
