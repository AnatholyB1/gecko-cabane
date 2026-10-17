---
phase: 05-conversion-et-mesure
plan: 10
subsystem: conversion
tags: [about, getting-here, google-maps, click-to-load, i18n]
requires: [05-03, 05-07, 05-08]
provides:
  - googleDirectionsUrl(), googleMapsEmbedUrl() in seo.ts
  - COUPLE_PHOTO gated slot (null until owner photo)
  - MapEmbed click-to-load client component
  - "Notre histoire" story in #about, "Comment venir" block in #contact
affects: [05-11, 05-13]
key-files:
  created:
    - src/utils/about-content.ts
    - src/components/MapEmbed.tsx
    - tests/about-section.test.ts
    - tests/map-embed.test.ts
  modified:
    - src/utils/seo.ts
    - src/app/[locale]/page.tsx
    - messages/fr.json
    - messages/en.json
key-decisions:
  - "Single directions button now uses googleDirectionsUrl(); GOOGLE_PLACE_URL and SAME_AS import removed from page.tsx"
  - "Embed uses the keyless legacy URL (RESEARCH A1, assumed); owner may swap for the pb= URL"
requirements-completed: []
duration: 25min
completed: 2026-10-17
---

# Phase 5 Plan 10: About story, getting here and click-to-load map Summary

**#about now tells who runs the place using only published facts, #contact gains a "Comment venir" list, one Google Maps directions button and a map iframe mounted only after a click.**

## Accomplishments
- `about.storyTitle` / `story1` (FR "Notre histoire", EN "Our story") inside the existing #about; no new id, anchor or nav item (test-enforced, 8 ids unchanged).
- Couple photo slot renders only when `COUPLE_PHOTO` is non-null; it ships `null`, so nothing is shown.
- #contact: trajets (Ao Nang 20 min taxi, songthaew 50 baht, Walking Street 3 min, Chao Fah Pier 15 min), exactly one directions anchor, `MapEmbed` with static local preview (`/exterior-sign.jpg`), fixed height, privacy line, aria-live announcement.
- The right-column "viewOnMap" link was kept.

## Sources for owner/origin text (D-18)
- `messages/*.json` landing `story1` (already public): opened by Chef Jariya and her French husband, she brings the cooking, he the French table, they welcome guests every evening.
- `.planning/PROJECT.md` line 5 and `04-GBP-DOSSIER.md` (owner-approved description): French cooking and Thai classics side by side, short list of wines and Belgian beers.

## Commits
- RED tests: 11374cd
- Helpers, MapEmbed, about-content, copy: df10716
- Page wiring: 1d85f7f

## Verification
Full vitest 599/599, `tsc --noEmit` clean, lint 0 errors (8 pre-existing warnings), `npm run build` succeeds.

## Deviations from Plan
- Trajets labels are resolved to literal `t('contactSection.gettingHere.<key>')` calls in an array (instead of a template string) so the source-scan test and static key checks see each key. No behaviour change.

## à compléter (05-10) - for OWNER-CHECKLIST (05-11)
Not verifiable in the repo, therefore NOT written:
- Owner's first name (the husband), year of opening
- History of the building/place, how the couple met
- Couple photo (set `COUPLE_PHOTO` in `src/utils/about-content.ts`, file in `public/`)
- Validate the travel times/price (20 min, 50 baht, 3 min, 15 min) as given in the plan
- Optionally swap the embed URL for the official `pb=` URL from Google Maps > Share > Embed (the keyless embed is an assumption, RESEARCH A1, not verified in a browser)

## Requirements status
CONV-02 and CONV-03 NOT marked complete: CONV-02 depends on owner text/photo (owner-gated) and DE copy is deferred to phase 6; CONV-03 depends on a real-browser check that the keyless embed and directions URL render, and on the 05-07 PageSpeed gate (unverified, deferred to 05-13).

## Self-Check: PASSED
