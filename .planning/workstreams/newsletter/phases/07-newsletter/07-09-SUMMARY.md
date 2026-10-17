---
phase: 07-newsletter
plan: 09
subsystem: newsletter
tags: [cron, brevo, segmentation, resend, pdpa, gdpr]
requires: [07-01, 07-04]
provides:
  - selectSyncUpdates, selectSequenceListAdds, selectLegacyConfirmations (+ latestHonoredByEmail, profileWithReservation) in newsletter-segments.ts
  - newsletterLegacyConfirmEmail (fr/en)
  - GET /api/cron/newsletter-sync (daily 30 4 * * *, attributes-only Brevo sync, retry, fallback list adds)
  - GET /api/cron/newsletter-legacy-confirm (manual D-03 one-shot, dry-run by default, not scheduled)
affects: [07-10, 07-11]
tech-stack:
  added: []
  patterns: [claim-before-send, fail-closed bearer secret, counts-only responses, pure selectors + source-scan wiring tests]
key-files:
  created:
    - src/app/api/cron/newsletter-sync/route.ts
    - src/app/api/cron/newsletter-legacy-confirm/route.ts
    - tests/newsletter-cron.test.ts
  modified:
    - src/utils/newsletter-segments.ts
    - src/utils/resend.ts
    - vercel.json
    - tests/review-wiring.test.ts
key-decisions:
  - "Sync PUTs attributes only (COUNTRY, RESIDENT, LAST_VISIT_DATE), never listIds; subscribers with brevo_synced_at null go through upsert retry instead, so a Brevo-side unsubscribe is never undone"
  - "Fallback list adds are batched: one remove + one add call per list (2 calls), within a 200-call budget and 150 ms pauses"
  - "Legacy job is dry-run unless ?send=1 is passed (stricter than the plan, which only had ?dry=1)"
requirements-completed: [NEWS-06, NEWS-07, NEWS-01]
duration: ~30 min
completed: 2026-10-17
---

# Phase 7 Plan 09: Daily Brevo sync and legacy confirmation Summary

Daily cron that keeps LAST_VISIT_DATE, COUNTRY and RESIDENT current in Brevo from honored reservations so the J+2/J+3 automations trigger on data, plus a manual D-03 job that mails one confirmation to past reservation-form consents.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. Selectors, legacy email, tests | 0f85383 | 13 pure tests green |
| 2. newsletter-sync cron, vercel.json | 168684e | wiring scans green |
| 3. Legacy confirmation job | 8532409, 6c84dd1 | full suite 587 passed, tsc clean, eslint 0 errors |

## Deviations from Plan

**1. [Rule 1 - Bug] review-wiring test asserted exactly one cron**
- `tests/review-wiring.test.ts` required `vercel.json` crons to equal a single entry, which the new schedule necessarily breaks. Changed to `toContainEqual` for the review entry.

**2. [Rule 2 - Safety] Legacy job defaults to dry-run**
- Per the executor brief, the route only sends when `?send=1` is present; `?dry=1` still forces dry-run. 07-11 must call it with `?send=1` after owner approval.

**3. Refactor** Extracted `latestHonoredByEmail` and `profileWithReservation` from selectSyncUpdates so the route can build retry/list profiles consistently (not in plan's export list).

Nothing was executed against production: no Brevo, Resend or Supabase call, no migration applied, nothing pushed. 07-07 files untouched.

## Known Stubs

None.

## Notes for downstream plans

- Env: `CRON_SECRET`, `NEWSLETTER_SIGNING_SECRET`, `BREVO_API_KEY`, `BREVO_LIST_ID`; optional `BREVO_LIST_AFTER_VISIT`, `BREVO_LIST_DURING_STAY` (positive ints). Without them the sync returns skipped counts.
- Reservation emails are matched case-sensitively in the SQL `.in()` (both original and lower-cased variants are queried); matching in code is case-insensitive.
- Live dry-runs belong to 07-10: `/api/cron/newsletter-sync?dry=1` and `/api/cron/newsletter-legacy-confirm` (dry by default).

## Threat Flags

None beyond the plan threat model.

## Self-Check: PASSED

Created files exist; commits 0f85383, 168684e, 8532409, 6c84dd1 present; vitest (587), tsc and eslint (0 errors) clean.
