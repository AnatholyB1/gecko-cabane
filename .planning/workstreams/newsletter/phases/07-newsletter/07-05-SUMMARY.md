---
phase: 07-newsletter
plan: 05
subsystem: newsletter
tags: [qr, wifi, short-urls, middleware, noindex]
requires: [07-03]
provides:
  - /newsletter and /wifi short URLs (locale from Accept-Language, EN default, 307 no-store)
  - /{locale}/newsletter bill QR landing (source bill_qr when src=qr, else newsletter_page)
  - /{locale}/wifi page showing WiFi credentials from server env, copy button, optional sign-up (source wifi)
  - pdf files in public/ excluded from the locale middleware
  - review page on shared UtilityCard and buttonClasses modules
affects: [07-10]
tech-stack:
  added: []
  patterns: [alias route reuse from /review, server-only env read at request time]
key-files:
  created:
    - src/utils/newsletter-alias.ts
    - src/app/newsletter/route.ts
    - src/app/wifi/route.ts
    - src/app/[locale]/newsletter/page.tsx
    - src/app/[locale]/wifi/page.tsx
    - src/components/WifiCopyButton.tsx
    - tests/newsletter-pages.test.ts
  modified:
    - src/middleware.ts
    - next.config.ts
    - src/app/[locale]/review/page.tsx
    - tests/middleware-matcher.test.ts
    - tests/no-public-secrets.test.ts
key-decisions:
  - "Only one src value per alias is forwarded (qr for /newsletter, wifi for /wifi); anything else is dropped"
  - "WIFI_SSID and WIFI_PASSWORD are read server-side per request (force-dynamic); missing either shows the unavailable state and keeps the form"
requirements-completed: [NEWS-03, NEWS-04]
duration: ~40 min
completed: 2026-10-17
---

# Phase 7 Plan 05: Bill QR and WiFi entry points Summary

Two in-restaurant entry points: the bill QR lands on the crab curry recipe offer (source bill_qr) and the WiFi card shows the credentials immediately with an optional sign-up (source wifi), both noindex, outside the sitemap, and distinct from the review link.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. Failing tests (RED) | 4fbcbea | pages, aliases, matcher, secrets |
| 2. Aliases, middleware, pdf exclusion, no-store header | d318b13 | alias and matcher tests green |
| 3. Pages, copy button, review refactor | 7ae0768 | vitest 517 passed, tsc clean, eslint 0 errors |

## Deviations from Plan

None - plan executed as written. The review page now renders the UtilityCard eyebrow at 14px (previously 11px), which follows the UI-SPEC minimum text size; existing review tests stay green.

## Known Stubs

None.

## Notes for downstream plans

- 07-10 must create `WIFI_SSID` and `WIFI_PASSWORD` in Vercel (server-only), probe `/newsletter`, `/wifi` and the PDFs live, and have the owner rotate the WiFi password.
- Several source files use CRLF line endings; edits must preserve them.

## Threat Flags

None beyond the plan threat model.

## Self-Check: PASSED

Created files exist; commits 4fbcbea, d318b13 and 7ae0768 present; vitest (517), tsc and eslint (0 errors) clean.
