---
phase: 07-newsletter
plan: 04
subsystem: newsletter
tags: [double-opt-in, brevo, segmentation, resend, pdpa, gdpr]
requires: [07-01, 07-03]
provides:
  - POST /api/newsletter/confirm (conditional confirmed_at, then Brevo upsert, then welcome email)
  - noindex confirm page with a no-write GET and a client confirm button
  - brevo.ts client (upsert, attribute update, blacklist, list add/remove) that never throws
  - newsletter-segments.ts (country, resident, Krabi visit date, subscriber profile)
  - newsletterWelcomeEmail (fr/en) with guide, optional recipe, unsubscribe link
affects: [07-05, 07-09, 07-10]
tech-stack:
  added: []
  patterns: [GET renders, POST mutates (prefetch-safe), best-effort external sync with cron retry]
key-files:
  created:
    - src/utils/newsletter-segments.ts
    - src/utils/brevo.ts
    - src/app/api/newsletter/confirm/route.ts
    - src/app/[locale]/newsletter/confirm/page.tsx
    - src/components/NewsletterConfirmButton.tsx
    - tests/newsletter-segments.test.ts
    - tests/newsletter-brevo.test.ts
    - tests/newsletter-confirm.test.ts
  modified:
    - src/utils/resend.ts
key-decisions:
  - "Geo country is ignored for bill_qr and wifi (devices at the restaurant geolocate to TH); phone country or empty is used instead (narrowing of D-14, owner approval item 13 in 07-10)"
  - "updateBrevoContactAttributes never sends listIds so a Brevo-side unsubscribe is not undone by a sync"
  - "Brevo or Resend failure never undoes a confirmation; brevo_synced_at stays null for the 07-09 cron retry"
requirements-completed: [NEWS-01, NEWS-05, NEWS-07]
duration: ~20 min
completed: 2026-10-17
---

# Phase 7 Plan 04: Confirm flow, Brevo and segments Summary

Closes the double opt-in loop: a confirm page whose GET changes nothing, a POST that sets confirmed_at once, then pushes the contact to Brevo with LANGUAGE/COUNTRY/RESIDENT/SOURCE/CONSENT_AT (and LAST_VISIT_DATE) and mails the guide.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. Failing tests (RED) | f2ab9de | segments, Brevo, confirm wiring tests |
| 2. Segments and Brevo client | cce2ec3 | 21 tests green |
| 3. Route, page, button, welcome email | 98793f1 | vitest 503 passed, tsc clean, eslint 0 errors |

## Deviations from Plan

None - plan executed as written. No external service was called; Brevo tests mock fetch.

## Known Stubs

None.

## Notes for downstream plans

- Required env at launch: `BREVO_API_KEY`, `BREVO_LIST_ID`, `NEWSLETTER_SIGNING_SECRET`, `RESEND_API_KEY`. Brevo contact attributes (LANGUAGE, COUNTRY, RESIDENT, SOURCE, CONSENT_AT, LAST_VISIT_DATE) must exist in Brevo; date format YYYY-MM-DD is assumption A2, verify at launch.
- 07-09 cron should retry rows with confirmed_at set and brevo_synced_at null.
- The confirm page shows the button directly; no extra explanation key was added since none exists in the i18n contract.

## Threat Flags

None beyond the plan threat model.

## Self-Check: PASSED

Created files exist; commits f2ab9de, cce2ec3 and 98793f1 present; vitest (503), tsc and eslint (0 errors) clean.
