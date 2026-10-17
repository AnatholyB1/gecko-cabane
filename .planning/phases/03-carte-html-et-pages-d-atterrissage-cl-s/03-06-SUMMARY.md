---
phase: 03-carte-html-et-pages-d-atterrissage-cl-s
plan: 06
status: complete
requirements-completed: [MENU-01, PAGE-01, PAGE-02]
---

# Plan 03-06 Summary: production launch

- Owner approved migration 013, landing copy, rating line, allergy line and deploy (03-LAUNCH.md).
- Migration 013 applied to production via psql plus `supabase migration repair` (dry-run unusable on the shared project); verified read-only: `is_gluten_free` default false, 0/162 flagged, `vins-bieres-belges` page inactive.
- Deployed to Vercel production; curl probes all green (/fr|en/menu 200 with ฿, hasMenu on /fr and /en, EN title, landing 200, /fr landing 404, sitemap 7 URLs).
- Owner decision: gluten-free is on request. Menu-wide line added to `menuPage.allergyNote` (08c497d); per-dish flag unused; chef sheet not needed.
- Owner confirmed the live pages ("live ok").

MENU-02 remains pending the owner's wine and Belgian beer list (plans 03-07, 03-08).
