---
phase: 05-conversion-et-mesure
plan: 08
subsystem: reviews
tags: [feedback, resend, rate-limit, honeypot]
requires: [05-05, 05-04, 05-07]
provides:
  - POST /api/review/feedback (honeypot, fill time, zod, 3/h per hashed IP, after() Resend to owner, nothing stored)
  - feedbackRequestSchema, feedbackEmail, checkFeedbackRateLimit ('feedback' bucket)
  - ReviewFeedbackForm mounted unfiltered on /review, reviewFeedback i18n namespace (fr/en)
affects: [05-11]
tech-stack:
  added: []
  patterns: [reuse of reservation anti-spam pipeline, separate rate-limit key prefix]
key-files:
  created:
    - src/utils/review-feedback.ts
    - src/app/api/review/feedback/route.ts
    - src/components/ReviewFeedbackForm.tsx
    - tests/review-feedback.test.ts
  modified:
    - src/utils/rate-limit.ts
    - src/app/[locale]/review/page.tsx
    - messages/fr.json
    - messages/en.json
    - tests/rate-limit.test.ts
    - tests/review-page-wiring.test.ts
key-decisions:
  - "All new copy lives in a new reviewFeedback namespace so the review namespace key list is unchanged"
  - "Form shown unconditionally next to the review buttons (D-23, no rating filter)"
requirements-completed: [REV-07]
duration: 20min
completed: 2026-10-17
---

# Phase 5 Plan 08: Un souci ? feedback Summary

**Private "Un souci ?" form on /review that emails the owner via Resend (escaped, source and rid noted), with honeypot, fill-time and 3-per-hour per-IP limits, and no message storage.**

## Accomplishments
- Rate-limit extended with a `feedback:` HMAC bucket (3/hour), fail-open with Sentry report, null IP skips the RPC.
- Route validates before consuming quota, returns localized 429 with WhatsApp fallback, sends owner mail in `after()` with `replyTo` only when a valid guest email is given; unconfigured Resend is reported to Sentry.
- Route source-scanned: no `.from(` / `.insert(`, message never sent to Sentry.
- Client form with idle/pending/success/error/rate-limited states, no tracking call, does not import the server module.

## Task Commits
1. RED tests: see `test(05-08)` commit
2. Rate limit, schema/email, route: `feat(05-08): add feedback rate limit, schema, owner email and POST route`
3. Form, page mount, copy: `feat(05-08): add Un souci form on /review with reviewFeedback copy`

## Verification
Full vitest 572/572, tsc clean, lint 0 errors (8 pre-existing warnings), `npm run build` succeeds.

## Deviations from Plan
None.

## Pending / not verified
- REV-07 is implemented and unit-tested, but acceptance includes a real test message reaching the owner inbox on a preview (05-11 checkpoint). That is not verified, so REV-07 is not marked complete in REQUIREMENTS.md.
- The 05-07 PageSpeed gate remains deferred to 05-13 (unchanged).
- Privacy copy update is covered by 05-11.

## Self-Check: PASSED
