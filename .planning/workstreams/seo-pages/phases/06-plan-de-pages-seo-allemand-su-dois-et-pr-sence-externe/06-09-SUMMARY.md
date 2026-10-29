---
phase: 06-plan-de-pages-seo-allemand-su-dois-et-pr-sence-externe
plan: 09
subsystem: i18n
tags: [next-intl, i18n, seo, de, sv, publication-gate]
requires: [06-02, 06-08]
provides:
  - four active locales (fr, en, de, sv) with English message fallback
  - DE/SV slugs in the PAGES registry
  - mechanical de/sv publication gate (signed review + complete keys)
  - scripts/translation-scope.json (review file to message prefixes map)
affects: [06-11, 06-13, 06-14, 06-15]
tech-stack:
  added: []
  patterns: [deepMerge of en under de/sv in request.ts, build-failing publication gate test]
key-files:
  created:
    - scripts/translation-scope.json
    - tests/i18n-publication-gate.test.ts
    - messages/de.json
    - messages/sv.json
  modified:
    - src/i18n/config.ts
    - src/i18n/request.ts
    - src/utils/seo.ts
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/opengraph-image.tsx
    - src/components/AnnouncementBanner.tsx
    - messages/en.json
    - messages/fr.json
    - tests/i18n.test.ts
    - tests/seo-slugs.test.ts
    - tests/seo-jsonld.test.ts
    - tests/seo-jsonld-wiring.test.ts
    - tests/seo-metadata.test.ts
    - tests/seo-landing-pages.test.ts
key-decisions:
  - "PUBLISHED_PAGES untouched: de/sv URLs resolve but are noindex, absent from sitemap and hreflang"
  - "Restaurant JSON-LD url/hasMenu fall back to EN URLs while the page is unpublished in the locale"
  - "Layout no longer sets openGraph.alternateLocale; per-page buildPageMetadata owns it"
requirements-completed: [I18N-01, I18N-02]
duration: ~15 min
completed: 2026-10-17
---

# Phase 6 Plan 09: de/sv locales and publication gate Summary

German and Swedish are now active locales that serve English text through a deep-merge fallback. They stay unindexed, and a build-failing gate blocks any de/sv publication that lacks a signed review.

## Tasks

| Task | Commit | Notes |
|------|--------|-------|
| 1. RED tests, scope map | 036181c | gate test, i18n and slug tests, translation-scope.json |
| 2. Activate de/sv | ea73b20 | config, request.ts deepMerge, seo.ts slugs and OG locales, empty de/sv.json, language endonyms |
| 3. Layout, JSON-LD, OG, dates | 83ad406 | JSON-LD gated on isPublished, alternateLocale removed, locale cast widened, de-DE/sv-SE dates |

## Verification

`npm test` passes (45 files, 541 tests), `npx tsc --noEmit` passes, and `npm run lint` reports 0 errors. The 8 remaining warnings are in admin pages and were already there. I did not run the optional dev-server smoke check (curl on /de/menu).

## Deviations from Plan

**[Rule 3 - Blocking] Existing tests assumed two locales.** Once `LOCALES` and `OG_LOCALE` grew to four entries, `tests/seo-metadata.test.ts` and `tests/seo-landing-pages.test.ts` failed or stopped compiling.
- `seo-metadata`: the buildPageMetadata loop now iterates fr and en explicitly, because only those locales are published. The `LOCALES` and `OG_LOCALE` assertions now expect all four.
- `seo-landing-pages`: the messages map is typed `Record<string, ...>`, and an unused `SeoLocale` import was removed.
- The `buildPathnames` assertion in `tests/seo-slugs.test.ts` now expects the fr, de and sv rewrites.

## Known Stubs

`messages/de.json` and `messages/sv.json` are intentionally `{}`. The DE/SV text arrives in plans 11 and 14, and English fallback covers the gap until then.

## Publication safety

No de/sv entry was added to PUBLISHED_PAGES, the sitemap or hreflang. The gate test asserts this. It also requires, for any future de/sv entry, signed review files `docs/ph6/review/<loc>/<file>.md` carrying a dated "Validé par écrit par" line, plus complete message keys. Nothing was published to a third party, and no owner checkpoint was encountered.

## Self-Check: PASSED

Created files exist (translation-scope.json, i18n-publication-gate.test.ts, de.json, sv.json). Commits 036181c, ea73b20 and 83ad406 are in the git log.
