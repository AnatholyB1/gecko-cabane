---
phase: 06-plan-de-pages-seo-allemand-su-dois-et-pr-sence-externe
plan: 11
subsystem: i18n
tags: [i18n, de, review-docs, resend, next-intl]
requires:
  - phase: 06-09
    provides: de/sv locales with English fallback, translation-scope.json, publication gate
provides:
  - messages/de.json complete DE draft for the scope files (noindex, "à relire")
  - docs/ph6/review/de/*.md side-by-side FR | DE review documents (unsigned)
  - scripts/generate-review-docs.mjs offline generator preserving corrections and sign-off
  - COPY.de / REVIEW_COPY.de inactive email copy, EMAIL_LOCALES whitelist
affects: [06-13 DE publication, 06-14 SV drafting]
tech-stack:
  added: []
  patterns: [whitelist of email locales, generated review tables]
key-files:
  created:
    - tests/review-docs.test.ts
    - scripts/generate-review-docs.mjs
    - src/utils/email-locales.ts
    - docs/ph6/review/de/ (ui, home, menu, french-restaurant-krabi, romantic-dinner-krabi, where-to-eat-krabi-town, review, emails, qr-print)
  modified:
    - messages/de.json
    - src/utils/resend.ts
    - src/utils/review-invitations.ts
    - tests/resend-locale.test.ts
key-decisions:
  - "EMAIL_LOCALES lives in src/utils/email-locales.ts (pure) and is re-exported by resend.ts"
  - "Dish names/descriptions stay French on /de/menu; menuPage.intro adds a German note that dishes are described in French"
requirements-completed: [I18N-01]
duration: 20 min
completed: 2026-10-17
---

# Phase 6 Plan 11: DE draft and review material Summary

German draft for the whole DE scope, one FR | DE review document per page plus emails and QR print texts, and German email copy that stays inactive. Nothing is published and no document is signed.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1 RED tests | d36bada | tests/review-docs.test.ts, extended tests/resend-locale.test.ts; 13 failures before implementation |
| 2 messages/de.json | 0ec55a6 | All scoped keys, Sie form, umlauts; meta titles 30-60 and descriptions 120-165 chars |
| 3 Emails, generator, docs | a13a1c4 | COPY.de, REVIEW_COPY.de, generator, 9 review documents |

## Verification

npm test: 46 files, 555 tests pass. `npx tsc --noEmit` clean. `npm run lint`: 0 errors (8 pre-existing warnings, unrelated).

## Deviations from Plan

**1. [Rule 3 - Blocking] EMAIL_LOCALES placed in a pure module**
- **Found during:** Task 3
- **Issue:** `review-invitations.ts` is imported by the client admin page (`src/app/admin/reservations/page.tsx`); importing a value from `resend.ts` would pull the `resend` SDK into the client bundle.
- **Fix:** `EmailLocale` type and `EMAIL_LOCALES` defined in `src/utils/email-locales.ts`; `resend.ts` re-exports both; `review-invitations.ts` imports from the pure module. Contract unchanged for consumers (`EMAIL_LOCALES` is still exported from resend.ts). The literal `export const EMAIL_LOCALES` grep in the acceptance criterion therefore matches email-locales.ts, not resend.ts.
- **Commit:** a13a1c4

**2. [Minor] menuPage.intro** adds a sentence saying dishes are described in French (D-08 caption). Flag for the reviewer.

## Status and gates (unchanged)

- No de page added to PUBLISHED_PAGES; /de remains noindex.
- All review documents, emails.md and qr-print.md keep the unsigned line `- [ ] Validé par écrit par : ____ ...`. Plan 13 requires a human reviewer to sign.
- DE texts are Claude-drafted, marked "Statut : à relire". DE emails not active: `emailLocaleFor('de') === 'en'`.
- No owner checkpoint in this plan. Nothing published or sent.

## Known Stubs

None.

## Self-Check: PASSED

Files and commits d36bada, 0ec55a6, a13a1c4 verified present.
