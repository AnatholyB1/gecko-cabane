---
phase: 07-newsletter
plan: 03
subsystem: newsletter
tags: [footer-signup, i18n, next-intl, accessibility]
requires: [07-01]
provides:
  - NewsletterForm shared client form (footer, popup, /newsletter, /wifi)
  - NewsletterFooterSection on SiteFooter and the home footer
  - buttonClasses and UtilityCard shared modules
  - full fr/en newsletter.* and wifi.* key contract
affects: [07-04, 07-05, 07-06, 07-07, 07-08]
tech-stack:
  added: []
  patterns: [source-scan component tests, uniform success panel]
key-files:
  created:
    - src/components/NewsletterForm.tsx
    - src/components/NewsletterFooterSection.tsx
    - src/components/ui/buttonClasses.ts
    - src/components/ui/UtilityCard.tsx
    - tests/newsletter-form.test.ts
  modified:
    - messages/fr.json
    - messages/en.json
    - src/components/SiteFooter.tsx
    - src/app/[locale]/page.tsx
    - src/utils/newsletter-schema.ts
key-decisions:
  - "started_at is captured via lazy useState(Date.now) so the render stays pure under the React Compiler"
  - "unsubscribe.invalid takes an {email} ICU param; the caller supplies the contact address"
requirements-completed: [NEWS-02]
duration: ~20 min
completed: 2026-10-17
---

# Phase 7 Plan 03: Footer sign-up and i18n contract Summary

Footer newsletter sign-up (source `footer`, page locale as language, honeypot and fill time sent) on every public footer, plus the complete fr/en key contract for all later newsletter surfaces.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. i18n contract and failing test (RED) | c239930 | newsletter.* and wifi.* in fr and en; form test fails until components exist |
| 2. Button classes, UtilityCard, NewsletterForm | 65e9e36 | tsc and eslint clean |
| 3. Footer section wired in | 434886f | full suite 471 passed, tsc clean, lint 0 errors |

## Deviations from Plan

**1. [Rule 3 - Blocking] NewsletterSource type was not exported**
- **Issue:** The plan said `newsletter-schema.ts` exports `NewsletterSource`; it only exported `NEWSLETTER_SOURCES`.
- **Fix:** Added `export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number]`.
- **Commit:** 65e9e36

**2. [Minor] Extra keys** - added `newsletter.confirm.error` and `newsletter.unsubscribe.error` wording (reused server-error copy), as the plan specified, with an unsubscribe-specific wording.

`review/page.tsx` intentionally untouched (07-05 switches it to the shared modules). Eyebrow in UtilityCard is 14px per UI-SPEC (review page still uses 11px until 07-05).

## Known Stubs

None.

## Notes for downstream plans

- `/privacy` consent link uses `Link` from `@/i18n/navigation`.
- Footer form shows no resident checkbox; pass `showResident` on `/newsletter` and `/wifi`.
- Manual browser glance not done; launch probes belong to 07-10.

## Threat Flags

None.

## Self-Check: PASSED

Files exist, commits c239930 and 65e9e36 present, footer commit present; vitest (471), tsc and eslint (0 errors) clean.
