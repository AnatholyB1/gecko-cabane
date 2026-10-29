---
phase: 06-plan-de-pages-seo-allemand-su-dois-et-pr-sence-externe
plan: 13
subsystem: i18n
tags: [de, hreflang, sitemap, review-links, resend, publication-gate]
requires: [06-11, 06-12]
provides:
  - DE pages published (home, /menu, French restaurant, romantic dinner, where-to-eat)
  - REVIEW_LOCALES and EMAIL_LOCALES include de (sv still falls back to en)
key-files:
  modified:
    - docs/ph6/review/de/*.md (9 sign-off lines)
    - src/utils/seo.ts
    - src/utils/review-links.ts
    - src/utils/email-locales.ts
    - tests/i18n-publication-gate.test.ts
    - tests/review-links.test.ts
    - tests/resend-locale.test.ts
    - tests/review-invitations.test.ts
    - tests/seo-*.test.ts
decisions:
  - "Owner declared the German review approved for all nine documents on 2026-10-18 (Claude Code conversation); no reviewer name or corrections supplied, so none were applied and no name was invented"
  - "/privacy not published in de (contentLocales fr/en only); wine and getting-here pages stay EN-only"
metrics:
  completed: 2026-10-18
---

# Phase 6 Plan 13: DE publication Summary

German pages and German review/email flows are live in code, gated by the owner's recorded validation.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. Owner validation (resume-signal given in chat) | aecce1f | All nine review docs signed with the prescribed line (owner, 2026-10-18, Claude Code conversation) |
| 2. Publish validated DE content | e330bb6 | `de` added to PUBLISHED_PAGES for 5 pages; REVIEW_LOCALES and EMAIL_LOCALES include `de`; `mapLanguage` returns de when listed, sv -> en |

## Verification

- `npm test` 572 passed, `npx tsc --noEmit` clean, `npm run lint` 0 errors (8 pre-existing warnings), `npm run build` exit 0.
- Gate test extended: de in REVIEW_LOCALES / EMAIL_LOCALES requires signed review.md / emails.md; neither may list sv.
- Existing tests that encoded "no de" (hreflang, OG, sitemap, guides, switcher, jsonld, email locale) updated to the published reality; reciprocal hreflang test passes for every page.

## Deviations from Plan

- [Rule 3] Roughly a dozen existing tests asserted de was unpublished; updated them to match intended behaviour.
- No reviewer corrections existed, so `messages/de.json` and `resend.ts` copy were unchanged and `generate-review-docs.mjs` was not re-run. qr-print.md got no "a regenerer" line since no QR text was corrected; QR/print PDFs not regenerated.
- Owner sign-off line names the owner, not an independent reviewer (as instructed).

## Known Stubs

None.

## Self-Check: PASSED
