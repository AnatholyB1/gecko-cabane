---
phase: 05-conversion-et-mesure
plan: 03
subsystem: conversion
tags: [social-proof, json-ld, aggregateRating, payment-note, i18n]
requires: []
provides:
  - social-proof config (SOCIAL_PROOF, SHOW_AGGREGATE_RATING, aggregateRatingFor, visibleReviews, isValidSocialReview)
  - SocialProof server component placed right before #reservation
  - aggregateRating in Restaurant JSON-LD derived from the same constants
  - shared payment.note under the reservation form and on /menu
affects: [05-12, 05-13, 05-11]
tech-stack:
  added: []
  patterns: [config-driven content with validation gate, JSON-LD derived from visible constants]
key-files:
  created:
    - src/utils/social-proof.ts
    - src/components/SocialProof.tsx
    - tests/social-proof.test.ts
    - tests/payment-note.test.ts
  modified:
    - src/utils/seo.ts
    - src/app/[locale]/page.tsx
    - src/app/[locale]/menu/page.tsx
    - messages/fr.json
    - messages/en.json
    - tests/seo-jsonld.test.ts
    - tests/seo-jsonld-wiring.test.ts
    - tests/home-page.test.ts
key-decisions:
  - "reviews ships empty (owner gate); aggregateRating is emitted only once at least one validated review is displayed"
  - "Old SOCIAL block folded into SocialProof so the 4,7 / 1 062 rating is shown once; Facebook and TripAdvisor links preserved there"
requirements-completed: [CONV-01, MENU-03]
duration: 20min
completed: 2026-10-17
---

# Phase 5 Plan 03: Social proof and payment note Summary

**A config-driven social-proof section (rating badge, Travellers' Choice, platform links, "Laisser un avis" CTA) now sits before the booking form, aggregateRating is wired to the same constants, and the card-fee payment line shows under the form and on /menu.**

## Accomplishments
- `src/utils/social-proof.ts` holds the rating constants and validated reviews (https hosts allowlist, 1-5 integer rating, 2-letter lang, cap 4). `reviews` is empty: no review is invented.
- `SocialProof.tsx` (server component) renders badge, links, review cards (with `lang`, original-language chip, source link) only when validated reviews exist, and the CTA to `/review?src=site` with `prefetch={false}`.
- `buildRestaurantJsonLd` adds `aggregateRating` via `aggregateRatingFor()`; currently absent because there are no reviews (owner-gated).
- `payment.note` (fr/en) rendered under `<ReservationForm />` and at the end of /menu.
- Tests that asserted "no aggregateRating" / old home reviews line were deliberately updated.

## Task Commits
1. RED tests: bf7d5b2
2. Config, seo.ts, component, i18n: 2e1a125
3. Page and menu wiring: ca27b3b

## Verification
Full vitest 471/471, `tsc --noEmit` clean, lint 0 errors (8 pre-existing warnings), `npm run build` succeeds.

## Deviations from Plan
None - plan executed as written. The menu page background is light (ivory), so the `text-gc-text-mid` variant was used for the payment line.

## Owner actions pending
- Real reviews (3-4) and Travellers' Choice year: plans 05-12 / 05-13. Until then the cards and aggregateRating stay off.
- Google review-snippet policy risk for aggregateRating: `SHOW_AGGREGATE_RATING` is the off-switch (to be listed in OWNER-CHECKLIST, 05-11).

## Self-Check: PASSED
