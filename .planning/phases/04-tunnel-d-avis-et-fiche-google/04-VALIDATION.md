---
phase: 4
slug: tunnel-d-avis-et-fiche-google
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-17
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Source: `04-RESEARCH.md` §Validation Architecture.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.0 (node env) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/review-invitations.test.ts tests/review-links.test.ts` |
| **Full suite command** | `npm test` (also gates `npm run build`) |
| **Estimated runtime** | ~30 seconds |

## Sampling Rate

- **After every task commit:** targeted vitest files
- **After every plan wave:** `npm test`
- **Before `/gsd:verify-work`:** full suite green + `npm run lint`
- **Max feedback latency:** 60 seconds

## Per-Task Verification Map

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| REV-03 | `krabiToday` UTC+7 midnight edge | unit | `npx vitest run tests/review-invitations.test.ts` | ❌ W0 | ⬜ pending |
| REV-02/03 | Only confirmed/completed eligible; pending/cancelled/no_show/no-email excluded | unit | same | ❌ W0 | ⬜ pending |
| REV-03 | Invite window [D-3,D-1]; remind window [D-7,D-5]; clicked/sent excluded | unit | same | ❌ W0 | ⬜ pending |
| REV-03 | de/sv email locale falls back to en | unit | same | ❌ W0 | ⬜ pending |
| REV-03 | Email HTML escaped, link `/review?rid=<token>&src=email` | unit | `npx vitest run tests/resend-review.test.ts` | ❌ W0 | ⬜ pending |
| REV-03 | Cron route 401 without Bearer; atomic claim; `vercel.json` cron `0 4 * * *` | wiring | `npx vitest run tests/review-wiring.test.ts` | ❌ W0 | ⬜ pending |
| REV-01 | Locale resolution precedence; Google/TripAdvisor URL builders | unit | `npx vitest run tests/review-links.test.ts` | ❌ W0 | ⬜ pending |
| REV-01 | Middleware pass-through for aliases; page noindex | wiring | `tests/middleware-matcher.test.ts`, `tests/review-wiring.test.ts` | extend | ⬜ pending |
| REV-01 | i18n parity for `review` namespace | unit | `npx vitest run tests/i18n.test.ts` | ✅ | ⬜ pending |
| REV-04 | PDFs in `docs/print/` start with `%PDF`; QR URL = `/review?src=qr` | smoke | `npx vitest run tests/review-print.test.ts` | ❌ W0 | ⬜ pending |
| REV-03 | Migration 014 sequential and idempotent | unit | `npx vitest run tests/migrations.test.ts` | extend | ⬜ pending |

## Wave 0 Requirements

- [ ] `tests/review-invitations.test.ts`
- [ ] `tests/review-links.test.ts`
- [ ] `tests/resend-review.test.ts`
- [ ] `tests/review-wiring.test.ts`
- [ ] `tests/review-print.test.ts`

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google GBP fields, categories, booking link, menu link | OPS-01 | External service, owner approval | Review each change in Chrome before click; confirm on phone |
| Both review links open the review window on a phone | REV-01 | Undocumented third-party URLs | Owner taps Google and TripAdvisor buttons on iOS/Android |
| DE print text proofread | REV-04 | Human review required | Owner validates DE before printing |

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Wave 0 covers all MISSING references
- [ ] `nyquist_compliant: true` set after execution

**Approval:** pending
