---
phase: 04-tunnel-d-avis-et-fiche-google
plan: 01
subsystem: ui
tags: [next-intl, nextjs, middleware, reviews, routing]

requires:
  - phase: 02-seo
    provides: seo.ts helpers, SAME_AS place and TripAdvisor URLs
provides:
  - Pure review link/locale helpers (review-links.ts)
  - Centralized googleReviewUrl() / tripAdvisorReviewUrl() in seo.ts
  - /review, /avis, /bewertung 307 alias handlers with middleware pass-through
  - Noindex /{locale}/review page (Google then TripAdvisor buttons) and review i18n namespace
affects: [04-06 email review tracking, 04-07 owner device tests]

tech-stack:
  added: []
  patterns:
    - "Shared alias handler (handleReviewAlias) with whitelisted query forwarding"
    - "Middleware early pass-through for root-level alias routes before next-intl"

key-files:
  created:
    - src/utils/review-links.ts
    - src/utils/review-alias.ts
    - src/app/[locale]/review/page.tsx
    - src/app/review/route.ts
    - src/app/avis/route.ts
    - src/app/bewertung/route.ts
    - tests/review-links.test.ts
    - tests/review-page-wiring.test.ts
  modified:
    - src/utils/seo.ts
    - src/middleware.ts
    - messages/fr.json
    - messages/en.json
    - tests/middleware-matcher.test.ts

key-decisions:
  - "Alias redirect is 307 with Cache-Control private, no-store (never a cached permanent redirect)"
  - "Review page returns only title + robots noindex; no canonical/hreflang, not in sitemap"
  - "Locale precedence: reservation locale > alias hint > Accept-Language > en; de/sv map to en"

patterns-established:
  - "Open-redirect guard: redirect path built only from whitelisted locale + fixed /review"

requirements-completed: [REV-01]

duration: 15min
completed: 2026-10-17
---

# Phase 4 Plan 01: Review entry point Summary

**QR and short-URL review entry: /review, /avis, /bewertung 307-redirect to a noindex /{locale}/review page with Google then TripAdvisor buttons, backed by pure, unit-tested locale and link helpers.**

## Accomplishments
- Pure helpers (token/source guards, q-value Accept-Language parsing, locale resolution, redirect builder) with table-driven tests
- Review URLs centralized in seo.ts; SAME_AS, PUBLISHED_PAGES and PUBLISHED_PATHS untouched
- Noindex review page in the privacy card style, fully translated (fr/en), both links `target="_blank" rel="noopener noreferrer"`
- Middleware pass-through so next-intl does not pre-empt the alias handlers; handler has a marked spot for plan 04-06 rid lookup

## Task Commits
1. Task 1: RED 217a4ea, GREEN 610286e
2. Task 2: RED (test commit following 610286e), GREEN af02466
3. Task 3: RED (test commit following af02466), GREEN 8abdbb0

## Deviations from Plan
None - plan executed as written. One wording tweak: a code comment avoided the word "canonical" in the page source because the wiring test forbids that token.

## Verification
- Full vitest suite: 33 files, 361 tests pass
- npm run lint: 0 errors (7 pre-existing warnings in unrelated files)
- tsc --noEmit: clean
- Local dev smoke (curl on 307 and location) not run.

## Known Stubs
None.

## Open items for owner (plan 04-07)
- TripAdvisor UserReviewEdit link must be device-tested (undocumented schema)
- "Chaque avis est lu par Jariya et son équipe." claim needs owner confirmation (fallback text in UI-SPEC)

## Self-Check: PASSED
