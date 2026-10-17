---
phase: 6
slug: plan-de-pages-seo-allemand-suedois-et-presence-externe
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-17
---

# Phase 6 — Validation Strategy

> Per-phase validation contract. Full test map: `06-RESEARCH.md` § Validation Architecture.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.0 (node env) |
| **Config file** | `vitest.config.ts` (has the `@` alias) |
| **Quick run command** | `npx vitest run tests/seo-slugs.test.ts tests/seo-sitemap-robots.test.ts tests/i18n.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

## Sampling Rate

- **After every task commit:** quick run command
- **After every plan wave:** `npm test` then `npm run lint`
- **Before `/gsd-verify-work`:** `npm run build` green (runs vitest then `next build`)
- **Max feedback latency:** 60 seconds

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD (filled by planner) | — | — | PAGE-03..08, I18N-01/02, OPS-02..07 | unit / source-scan / doc-scan | see RESEARCH map | ❌ W0 | ⬜ pending |

## Wave 0 Requirements

- [ ] `tests/seo-slugs.test.ts` — slug table, pathnames, noindex resolver, switcher helper, hreflang reciprocity
- [ ] `tests/seo-landing-pages.test.ts` — page folders, shared component, meta keys, cross-links
- [ ] `tests/i18n-publication-gate.test.ts` — de/sv completeness and signed review files
- [ ] `tests/ph6-docs.test.ts` — docs/ph6 structure and canonical NAP block

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Human review of DE (then SV) texts | I18N-01/02 | Human sign-off required by project constraint | Reviewer completes `docs/ph6/review/<loc>/<page>.md`, checks sign-off box |
| TripAdvisor/NAP/GBP edits | OPS-04, OPS-05 | External account, owner validates each click | Chrome-driven, owner approval before every action |
| Alcohol-advertising check on wine/beer page and posts | PAGE-06, OPS-02 | Legal reading unverified | Owner confirms before PAGE-06 goes live |
| Prices/times on getting-here page | PAGE-05 | Facts come from owner | Owner confirms figures |

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] No 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
