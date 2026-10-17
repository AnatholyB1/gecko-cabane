---
phase: 07-newsletter
plan: 06
subsystem: newsletter
tags: [popup, exit-intent, frequency-capping, anonymous-counters]
requires: [07-01, 07-03]
provides:
  - pure popup rules (capping 90 days, path exclusions, triggers) in newsletter-popup.ts
  - POST /api/newsletter/event anonymous counter (popup_shown, popup_dismissed; source fixed to popup)
  - NewsletterPopup client component (desktop dialog on exit intent, mobile bottom sheet) mounted in the locale layout
affects: [07-10, 07-11]
tech-stack:
  added: []
  patterns: [pure rules module + client shell, source-scan tests]
key-files:
  created:
    - src/utils/newsletter-popup.ts
    - src/components/NewsletterPopup.tsx
    - src/app/api/newsletter/event/route.ts
    - tests/newsletter-popup.test.ts
  modified:
    - src/app/[locale]/layout.tsx
key-decisions:
  - "Showing writes the 'dismissed' memory immediately, so leaving without closing does not re-show (once per visitor, 90 days)"
  - "Blocked localStorage means nothing is armed, rather than showing on every page"
  - "Entrance animation uses motion-safe transition classes driven by a rAF-toggled state"
requirements-completed: [NEWS-02]
duration: ~20 min
completed: 2026-10-17
---

# Phase 7 Plan 06: Exit-intent pop-up Summary

One discreet newsletter invitation per visitor: a 480 px focus-trapped dialog on desktop exit intent, a non-modal capped bottom sheet on mobile, with anonymous shown/dismissed counters so the signup rate is measurable per source.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. Pure popup rules + tests | 2fe49f0 | 24 tests green, module has no browser access |
| 2. Event counter route | be7139e | whitelist, fixed source, 204, no IP; tsc clean |
| 3. Component + layout mount | 9c78fcb | vitest 547 passed, tsc clean, eslint 0 errors |

## Deviations from Plan

None - plan executed as written. The reservation guard also detaches the triggers for the rest of the page view once the visitor focuses or types in `#reservation`.

## Known Stubs

None.

## Notes for downstream plans

- 07-10: migration 015 (RPC `gecko_newsletter_count`) must be applied before the counter returns 204 in production.
- 07-11: real-device check of the mobile sheet (WhatsApp clearance, keyboard, scroll) and desktop exit intent; not testable in jsdom/node.
- Signup rate = confirmed(popup) / popup_shown.

## Threat Flags

None beyond the plan threat model.

## Self-Check: PASSED

Files exist, commits 2fe49f0, be7139e, 9c78fcb present; vitest (547), tsc and eslint (0 errors) clean.
