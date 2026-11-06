# Quick 261106-op0 Summary

Fixes Sentry GECKO-CABANE-R (Resend contact upsert masking errors) and GECKO-CABANE-S (invalid locale crash on /apple-touch-icon-precomposed.png).

## Root cause R and Step A finding

`upsertResendContact` discarded the create error and called `update` (PATCH by email), which returns `not_found` for a missing contact. Read-only Step A diagnosis (contactProperties.list, segments.list, vercel env names only):

- **All 6 contact properties are missing in Resend** (language, country, resident, source, consent_at, last_visit). This is the persistent create failure for the 11 unsynced rows.
- Resend has 1 segment ("General"); `RESEND_SEGMENT_ID` is NOT set in Vercel production (only RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_WEBHOOK_SECRET), so segments are sent empty (not the failure cause).

## Changes

- `src/utils/resend-contacts.ts`: create -> get -> update; update only if the contact exists; real create error reported as "Resend contact create failed: <code>" (message redacted of the email); email normalized; `unsubscribed: false` only with `freshOptIn` (confirm route passes it); cron never re-subscribes (info message when ledger active but Resend unsubscribed); 600 ms pause between fallback calls only.
- `src/app/api/newsletter/confirm/route.ts`: `freshOptIn: true`.
- `[locale]/layout.tsx`: `dynamicParams = false`; `page.tsx`: `SocialProof locale={toSeoLocale(locale)}`; `public/apple-touch-icon-precomposed.png` added.
- Tests: `tests/resend-contacts.test.ts`, `tests/locale-param-guard.test.ts`.

## Deviations

- **[Rule 3 - Blocking]** `tests/p15-audit-fixes.test.ts` froze `src/utils/resend-contacts.ts` to commit c6bc779; the plan requires editing it. Removed that path from `FROZEN_PATHS` with a comment referencing this fix.
- Narrowed my own negative assertion in the locale guard test (other `locale as SeoLocale` usages remain in page.tsx).

## Verification

Full `npx vitest run`: 139 files, 2240 passed, 1 skipped. `tsc --noEmit`: no errors in src/tests (only stale `.next/types` validator errors, pre-existing). Lint: 0 errors, 2 warnings. Dev-server smoke not run. `npm run build` not run.

## Owner actions (required)

1. Approve and run `node scripts/setup-resend-newsletter.mjs` to create the 6 contact properties in Resend (writes to third-party account; not done by me).
2. Optionally set `RESEND_SEGMENT_ID` (General segment id exists) in Vercel production if contacts should join a segment.
3. After deploy and the next 11:00 UTC cron run is clean, resolve R and S in Sentry. Until step 1, R will show as "Resend contact create failed: <code>" (the real cause).

## Commits

- a56a235: Resend upsert fix
- Task 2 commit: locale guard (see git log, head of master)

## Self-Check: PASSED
