---
phase: 06-plan-de-pages-seo-allemand-su-dois-et-pr-sence-externe
plan: 12
subsystem: seo-pages
tags: [seo, owner-gate, alcohol, transport]
requires: [06-07, 06-09]
provides:
  - "/en/wine-belgian-beer-krabi published (sitemap, Guides menu, footer, related blocks)"
  - "Grab recommendation on /en/getting-here-from-ao-nang, no invented figures"
affects: [src/utils/seo.ts, messages/en.json]
key-files:
  modified:
    - src/utils/seo.ts
    - src/components/seo/pages.config.ts
    - messages/en.json
    - docs/ph6/review/en/wine-belgian-beer-krabi.md
    - tests/seo-landing-pages.test.ts
    - tests/seo-nav.test.ts
    - tests/seo-slugs.test.ts
decisions:
  - "Owner decision on alcohol check: publish as written (2026-10-18, Claude Code conversation, 'fiche alcool approved')"
  - "No transport figures: TRANSPORT_FACTS stay null; copy recommends Grab (price and ETA shown in app)"
metrics:
  completed: 2026-10-18
  tasks: 3
requirements: [PAGE-05, PAGE-06]
---

# Phase 6 Plan 12: Owner gates, wine page and transport Summary

Wine/Belgian beer page published in EN after dated owner sign-off; getting-here page now recommends booking a Grab ride, with no duration or price figures.

## Tasks

| Task | Commit | Notes |
|------|--------|-------|
| 1 Owner alcohol decision | ca7a7fb | "Décision du propriétaire : publish (2026-10-18)", sign-off line ticked (propriétaire, conversation Claude Code) |
| 2 Transport | 9897bcb | New `gettingHere.sections.options.p3` (Grab, destination "Gecko Cabane Restaurant", app shows price and ETA, short ride); options section paras 2 to 3; test asserts Grab mention, no digits, all TRANSPORT_FACTS null |
| 3 Apply decisions | e19e481 | PUBLISHED_PAGES entry, contentLocales ['en'], gated-state tests updated (seo-landing-pages, seo-nav, seo-slugs); sign-off test now requires a ticked line |

## Deviations from Plan

- [Rule 3] tests/seo-slugs.test.ts ("noindexes unpublished pairs") asserted the gated wine/en state; updated to assert FR still noindex and EN indexed.
- Task 2 deliberately differs from the plan: the owner gave no figures, so none were recorded (D-10 respected). The existing "ask us about your ride back" line was kept (still accurate).

## Pending

- Owner to confirm a typical duration range (and optionally THB) for the Ao Nang to Krabi Town ride; public sources conflict (about 15-16 min vs much higher). Until then TRANSPORT_FACTS remain null and no figures display. The owner's proposed range is to be confirmed by the owner, not assumed.

## Verification

npm test (558 passed), npx tsc --noEmit clean, npm run lint 0 errors (8 pre-existing warnings).

## Self-Check: PASSED
