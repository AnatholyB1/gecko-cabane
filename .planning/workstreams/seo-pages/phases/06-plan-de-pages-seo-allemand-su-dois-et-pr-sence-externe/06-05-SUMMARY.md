---
phase: 06-plan-de-pages-seo-allemand-su-dois-et-pr-sence-externe
plan: 05
subsystem: seo
tags: [next-intl, landing-template, cross-links, romantic-dinner]
requires: [06-01]
provides:
  - SeoLandingPage shared Server Component and LANDING config (src/components/seo)
  - RelatedGuides "A decouvrir" block fed by relatedFor() (published-only)
  - Romantic dinner page live at /en/romantic-dinner-krabi and /fr/diner-romantique-krabi
  - seoLanding and nav message namespaces (EN/FR)
affects: [06-06, 06-07, 06-08, 06-11, 06-14]
key-files:
  created:
    - src/components/seo/styles.ts
    - src/components/seo/pages.config.ts
    - src/components/seo/SeoLandingPage.tsx
    - src/components/seo/RelatedGuides.tsx
    - src/app/[locale]/romantic-dinner-krabi/page.tsx
    - tests/seo-landing-pages.test.ts
  modified:
    - src/utils/seo.ts
    - src/app/[locale]/french-restaurant-krabi/page.tsx
    - messages/en.json
    - messages/fr.json
    - tests/seo-slugs.test.ts
decisions:
  - "PAGE-03 tasting menu intentionally absent (D-12): no offer, formula or price on the page"
  - "French restaurant page keeps its own markup but shares styles and RelatedGuides"
  - "'belgian' and 'directions' link kinds render nothing yet (plan 07)"
metrics:
  tasks: 3
  completed: 2026-10-17
---

# Phase 6 Plan 05: Shared landing template and romantic dinner page Summary

Shared `SeoLandingPage` template plus `RelatedGuides` cross-link block, with the romantic dinner page published in EN and FR using copy written per language and bans on price, formula, tasting menu and ratings.

## Commits
- b680c8a test(06-05): failing landing page gate tests (RED)
- 82854d2 feat(06-05): shared SeoLandingPage template and RelatedGuides block
- 631faf6 feat(06-05): publish romantic dinner page in EN and FR

## Verification
- `npm test`: 43 files, 480 tests pass. `npx tsc --noEmit` clean. `npm run lint`: 0 errors (8 pre-existing warnings).
- Manual browser check at 360px not run.

## Deviations from Plan

**1. [Rule 1 - Bug] Obsolete assertion in tests/seo-slugs.test.ts**
- It expected `/romantic-dinner-krabi` EN to be unpublished; now published, so the test uses `/wine-belgian-beer-krabi`.

**2. Soft copy edit**
- The nav hint for the romantic page avoids any unverifiable claim about the kitchen layout.

## Known Stubs
None. Link kinds `belgian` and `directions` are deliberately unimplemented until plan 07 (no config uses them).

## Self-Check: PASSED
