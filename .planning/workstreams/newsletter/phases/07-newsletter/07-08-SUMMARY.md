---
phase: 07-newsletter
plan: 08
subsystem: newsletter
tags: [unsubscribe, rfc8058, brevo-webhook, pdpa, gdpr]
requires: [07-01, 07-03, 07-04]
provides:
  - newsletter-withdrawal.ts (maskEmail, parseBrevoWebhookEvents, tokenMatches, buildWithdrawalRow)
  - POST /api/newsletter/unsubscribe (JSON or RFC 8058 one-click form, then Brevo blacklist)
  - noindex unsubscribe page (GET writes nothing, masked address) and client button
  - POST /api/webhooks/brevo (bearer or ?token=, fail closed, writes brevo_webhook rows)
affects: [07-10, 07-11]
tech-stack:
  added: []
  patterns: [GET renders, POST mutates, append-only withdrawal rows, constant-time token check]
key-files:
  created:
    - src/utils/newsletter-withdrawal.ts
    - src/app/api/newsletter/unsubscribe/route.ts
    - src/app/[locale]/newsletter/unsubscribe/page.tsx
    - src/components/NewsletterUnsubscribeButton.tsx
    - src/app/api/webhooks/brevo/route.ts
    - tests/newsletter-unsubscribe.test.ts
    - tests/newsletter-webhook.test.ts
key-decisions:
  - "Webhook never calls Brevo back; unsubscribe route blacklists after the ledger insert and only reports Brevo failures to Sentry"
  - "Unsubscribe page verifies the link with nowSec=0 since unsubscribe links carry no expiry (avoids impure Date.now in render, React Compiler lint)"
requirements-completed: [NEWS-01]
duration: ~15 min
completed: 2026-10-17
---

# Phase 7 Plan 08: Unsubscribe paths Summary

Both D-04 withdrawal paths: the signed Resend link (page, button, POST, RFC 8058 one-click) and the Brevo webhook, each appending an idempotent consent=false row to the ledger.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. Tests (RED) and helpers | 54a5516, then feat(07-08) helpers commit | helper module pure, no next/supabase imports |
| 2-3. Routes, page, button, webhook | feat(07-08) routes commit | vitest 570 passed, tsc clean, eslint 0 errors |

## Deviations from Plan

**1. [Rule 3 - Blocking] Helper-only test run could not pass before the routes existed**
- The wiring tests read route sources at module load, so the Task 1 filtered command fails until Tasks 2-3 exist. Helpers were verified in the full run after all tasks. Helper commit therefore landed before a green run.

**2. [Rule 1 - Bug] Lint error "impure function during render" in the page**
- `Date.now()` in the Server Component tripped the React Compiler rule. Fixed by passing 0 as nowSec (no exp on unsubscribe links).

No i18n keys were added; the existing newsletter.unsubscribe keys from 07-03 were used. 07-07 files untouched. No external service called.

## Known Stubs

None.

## Notes for downstream plans

- Required env: `BREVO_WEBHOOK_TOKEN` (webhook returns 401 when unset), `NEWSLETTER_SIGNING_SECRET`, `BREVO_API_KEY`.
- Assumption A1 (Brevo sends `Authorization: Bearer`) to verify live in 07-11; `?token=` fallback is supported.
- The unsubscribe-page invalid state uses the contact email constant from the privacy page.

## Threat Flags

None beyond the plan threat model.

## Self-Check: PASSED

All created files exist; vitest (570), tsc and eslint (0 errors) clean.
