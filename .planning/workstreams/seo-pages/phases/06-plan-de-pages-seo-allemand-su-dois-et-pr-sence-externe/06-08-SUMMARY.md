---
phase: 06-plan-de-pages-seo-allemand-su-dois-et-pr-sence-externe
plan: 08
subsystem: navigation
tags: [nav, i18n, language-switcher, tripadvisor, seo]
requires: [06-07]
provides:
  - Guides disclosure menu (header + home)
  - Slug-aware, published-only language switcher
  - Footer guides lists (SiteFooter + home)
  - TripAdvisor .com link on home
affects: [06-09]
key-files:
  created:
    - src/components/GuidesMenu.tsx
    - src/components/guideItems.ts
    - tests/seo-nav.test.ts
  modified:
    - src/utils/seo.ts
    - src/components/LanguageSwitcher.tsx
    - src/components/SiteHeader.tsx
    - src/components/SiteFooter.tsx
    - src/components/seo/SeoLandingPage.tsx
    - src/app/[locale]/french-restaurant-krabi/page.tsx
    - src/app/[locale]/page.tsx
    - messages/en.json
    - messages/fr.json
    - tests/landing-page.test.ts
    - tests/seo-no-legacy-domain.test.ts
requirements-completed: [PAGE-07, OPS-04]
completed: 2026-10-17
---

# Phase 6 Plan 08: Guides navigation, slug-aware switcher, TripAdvisor .com Summary

Registry-driven navigation: a "Guides" disclosure in every header (home included), footer guide lists, and a language switcher that links to each locale's own slug and only offers locales where the page is published.

## What was built
- `seo.ts`: `GUIDE_KEYS`, `guidesFor(locale)`, `switcherTargets(pathname)` (hrefs from the registry only; unknown path returns `[]`), `TRIPADVISOR_URL`.
- `GuidesMenu` (client): button with `aria-expanded`/`aria-controls`, closes on Escape (focus returns to toggle), outside pointerdown, route change and focus leaving; mobile full-width sheet, md+ dropdown panel; no ARIA `menu` role.
- `LanguageSwitcher`: no props, uses `switcherTargets`, `hrefLang`/`lang`, hidden under 2 targets; the current locale renders as a non-link span.
- `SiteHeader`: Menu link (hidden below 400px), Guides, switcher, Book; `availableLocales` removed everywhere.
- `SiteFooter`: three columns (Navigate, Guides, Contact with TripAdvisor link, `noopener noreferrer`).
- Home: ARIA menubar/menuitem replaced by a plain list, Guides menu added, footer guides list, TripAdvisor card href now `TRIPADVISOR_URL`. The five static stars were not touched; they are already flagged to the owner in `docs/ph6/README.md` (phase 5 owns social proof).
- Messages (en/fr): `guides.*`, `footer.guidesTitle`, `footer.navigateTitle`, `language.changeLanguage`.

## Commits
- 19c2671 test: failing nav/switcher/TripAdvisor tests (RED)
- 435ab20 feat: Guides menu, switcher, header and footer
- 3e1b137 feat: home navigation, footer guides, TripAdvisor .com

## Verification
`npm test` (44 files, 527 tests), `npx tsc --noEmit` and `npm run lint` (0 errors, only pre-existing warnings) pass. Manual UI-SPEC checks (Guides menu at 320/360px, keyboard flow) not performed.

## Deviations from Plan
- **[Rule 3 - Blocking/cleanup]** Added `src/components/guideItems.ts` (server helper building translated guide items) to avoid duplicating label/hint translation in the header and home. Removed now-unused `publishedLocales` imports (lint).
- `footer.contactTitle` already existed, so it was not re-added.
- The footer guides on the home page sit under the Hours column rather than in a new grid column, to keep the existing 4-column layout.

## Known Stubs
None.

## Threat Flags
None. T-06-26/27/28 mitigated as planned (registry-only hrefs, published-only filtering, `rel="noopener noreferrer"`); T-06-29 accepted.

## Self-Check: PASSED
