---
phase: 06-plan-de-pages-seo-allemand-su-dois-et-pr-sence-externe
plan: 07
subsystem: seo-landing-pages
tags: [seo, landing, en-only, getting-here, wine-beer, alcohol-gate]
requires: [06-01, 06-05, 06-06]
provides:
  - "/en/getting-here-from-ao-nang published (EN only) with Google Maps directions link"
  - "/wine-belgian-beer-krabi built but gated (404 everywhere) pending owner alcohol check"
affects: [sitemap, RelatedGuides on where-to-eat, i18n parity test]
tech-stack:
  added: []
  patterns: [LANDING config with facts/directions/belgian link kinds, EN-only i18n exemption derived from PAGES]
key-files:
  created:
    - src/app/[locale]/getting-here-from-ao-nang/page.tsx
    - src/app/[locale]/wine-belgian-beer-krabi/page.tsx
    - docs/ph6/review/en/wine-belgian-beer-krabi.md
  modified:
    - tests/seo-landing-pages.test.ts
    - tests/i18n.test.ts
    - src/components/seo/pages.config.ts
    - src/components/seo/SeoLandingPage.tsx
    - src/utils/seo.ts
    - messages/en.json
decisions:
  - "TRANSPORT_FACTS ships with every minutes/thb/source null (D-10): the facts list is not rendered until the owner supplies sourced figures in plan 12."
  - "Wine page not added to PUBLISHED_PAGES and contentLocales stays [] (D-13, T-06-22)."
  - "Pairing cards use generic c1..c4 keys (template convention) rather than per-id keys; PAIRINGS holds the ids for documentation."
metrics:
  tasks: 3
  completed: 2026-10-17
---

# Phase 6 Plan 07: Getting here from Ao Nang and wine/Belgian beer Summary

EN-only getting-here page is live with qualitative transport guidance and a Google Maps directions link (place id based); the wine and Belgian beer pairing page is fully built but returns 404 until the owner signs off on the alcohol-advertising check.

## Commits
- 8dab657 test(06-07): RED tests (EN-only pages, facts gating, alcohol-safe copy; i18n exemption derived from PAGES)
- 40b0630 feat(06-07): getting-here page, googleDirectionsUrl, TRANSPORT_FACTS, facts and directions in template
- 14b1367 feat(06-07): gated wine/Belgian beer page, belgian link kind, owner review sheet

## Verification
npm test: 43 files, 518 tests pass. npx tsc --noEmit clean. npm run lint: 0 errors (8 pre-existing warnings, unrelated).

## Deviations from Plan
None of substance. Minor: pairing card copy is keyed c1..c4 (as the shared template renders) instead of by PAIRINGS id.

## Owner items outstanding (plan 12)
- Supply sourced transport durations/fares (taxi, songthaew, transfer, scooter) to fill TRANSPORT_FACTS; until then the page has no figures.
- Sign docs/ph6/review/en/wine-belgian-beer-krabi.md (written validation) before adding the page to PUBLISHED_PAGES and setting contentLocales ['en'].
- The "ride back" sentence promises no service; confirm what, if anything, the restaurant can arrange.

## Known Stubs
TRANSPORT_FACTS values are intentionally null (D-10); resolved by plan 12 owner input.

## Threat Flags
None. Directions link uses target=_blank with rel="noopener noreferrer" (T-06-24).

## Self-Check: PASSED
Files and commits 8dab657, 40b0630, 14b1367 verified present.
