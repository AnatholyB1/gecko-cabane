---
phase: 3
slug: carte-html-et-pages-d-atterrissage-cl-s
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-17
---

# Phase 3 — Validation Strategy

> Per-phase validation contract. Detailed test-to-requirement map: see `03-RESEARCH.md` § Validation Architecture.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.1 (node env) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/seo-*.test.ts tests/i18n*.test.ts tests/migrations.test.ts` |
| **Full suite command** | `npm run build` (vitest run, then next build) |
| **Estimated runtime** | ~60 seconds |

## Sampling Rate

- **After every task commit:** quick run command
- **After every plan wave:** `npx vitest run` + `npm run lint`
- **Before verify-work:** `npm run build` green
- **Max feedback latency:** 90 seconds

## Per-Task Verification Map

Filled by the planner from the RESEARCH.md test map (MENU-01, MENU-02, PAGE-01, PAGE-02): every task carries an `<automated>` command or a Wave 0 dependency.

## Wave 0 Requirements

- [ ] Update existing tests that forbid `hasMenu` / pin 4 sitemap URLs / pin `PUBLISHED_PATHS` (`seo-jsonld`, `seo-sitemap-robots`, `seo-metadata`, `seo-pages`) in the same plan as the code change
- [ ] New tests for menu rendering helper, EN-only metadata/sitemap entry, migration 013 numbering

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Belgian wine/beer content present | MENU-02 | Owner must supply the list | Activate the `vins-bieres-belges` page in admin after data entry; check `/menu#vins-bieres-belges` |
| Gluten-free flags correct | MENU-01 | Chef must confirm dishes | Compare flagged items to the chef's signed sheet |
| Rich Results Test on deployed `/en` | MENU-01 / PAGE-01 | External tool | Run on production URL after deploy |

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependency
- [ ] Sampling continuity maintained
- [ ] `nyquist_compliant: true` set once the plan checker passes

**Approval:** pending
