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
| 06-01-T1 | 01 | 1 | PAGE-08, PAGE-07 | unit | `npx vitest run tests/seo-slugs.test.ts tests/seo-sitemap-robots.test.ts tests/seo-metadata.test.ts` | ❌ W0 (created by task) | ⬜ pending |
| 06-01-T2 | 01 | 1 | PAGE-08 | unit + source-scan | `npx vitest run tests/seo-slugs.test.ts tests/seo-pages.test.ts tests/middleware-matcher.test.ts && npx tsc --noEmit` | ✅ after T1 | ⬜ pending |
| 06-01-T3 | 01 | 1 | PAGE-08 | unit | `npx vitest run tests/landing-page.test.ts tests/i18n.test.ts tests/i18n-hardcoded.test.ts` | ✅ | ⬜ pending |
| 06-02-T1/T2 | 02 | 1 | I18N-01, I18N-02 | unit + source-scan | `npx vitest run tests/reservation-schema.test.ts tests/reservations-post.test.ts` | ✅ (extended) | ⬜ pending |
| 06-03-T1..T3 | 03 | 1 | OPS-02, OPS-03, OPS-04, OPS-05 | doc-scan | `npx vitest run tests/ph6-docs.test.ts` | ❌ W0 (created by T1) | ⬜ pending |
| 06-04-T1..T3 | 04 | 1 | OPS-06, OPS-07 | doc-scan | `node scripts/generate-concierge-dossier.mjs && npx vitest run tests/ph6-outreach.test.ts` | ❌ W0 (created by T1) | ⬜ pending |
| 06-05-T1..T3 | 05 | 2 | PAGE-03, PAGE-07, PAGE-08 | unit + source-scan | `npx vitest run tests/seo-landing-pages.test.ts` then `npm test` | ❌ W0 (created by T1) | ⬜ pending |
| 06-06-T1/T2 | 06 | 3 | PAGE-04, PAGE-07, PAGE-08 | unit | `npx vitest run tests/seo-landing-pages.test.ts` then `npm test` | ✅ (extended) | ⬜ pending |
| 06-07-T1..T3 | 07 | 4 | PAGE-05, PAGE-06, PAGE-07 | unit + source-scan | `npx vitest run tests/seo-landing-pages.test.ts tests/i18n.test.ts` then `npm test` | ✅ (extended) | ⬜ pending |
| 06-08-T1..T3 | 08 | 5 | PAGE-07, OPS-04 | unit + source-scan | `npx vitest run tests/seo-nav.test.ts tests/seo-no-legacy-domain.test.ts` then `npm test && npm run lint` | ❌ W0 (created by T1) | ⬜ pending |
| 06-09-T1..T3 | 09 | 6 | I18N-01, I18N-02 | unit + file-I/O | `npx vitest run tests/i18n.test.ts tests/i18n-publication-gate.test.ts tests/seo-slugs.test.ts tests/seo-jsonld.test.ts` | ❌ W0 (gate test created by T1) | ⬜ pending |
| 06-10-T1..T3 | 10 | 6 | OPS-02, OPS-04, OPS-05 | doc-scan + manual (owner) | `npx vitest run tests/ph6-docs.test.ts` | ✅ | ⬜ pending |
| 06-11-T1..T3 | 11 | 7 | I18N-01 | unit + file-I/O | `node scripts/generate-review-docs.mjs de && npx vitest run tests/review-docs.test.ts tests/resend-locale.test.ts` | ❌ W0 (created by T1) | ⬜ pending |
| 06-12-T1..T3 | 12 | 7 | PAGE-05, PAGE-06 | unit + manual (owner) | `npx vitest run tests/seo-landing-pages.test.ts` then `npm test` | ✅ | ⬜ pending |
| 06-13-T1/T2 | 13 | 8 | I18N-01 | file-I/O gate + manual (reviewer) | `npm test && npm run build` | ✅ | ⬜ pending |
| 06-14-T1/T2 | 14 | 9 | I18N-02 | unit + file-I/O | `node scripts/generate-review-docs.mjs sv && npx vitest run tests/review-docs.test.ts tests/resend-locale.test.ts` | ✅ (extended) | ⬜ pending |
| 06-15-T1/T2 | 15 | 10 | I18N-02 | file-I/O gate + manual (reviewer) | `npm test && npm run build` | ✅ | ⬜ pending |

## Wave 0 Requirements

- [ ] `tests/seo-slugs.test.ts` — slug table, pathnames, noindex resolver, hreflang reciprocity (plan 01 T1; extended in 09)
- [ ] `tests/seo-nav.test.ts` — switcher helper, Guides, TripAdvisor URL (plan 08 T1)
- [ ] `tests/ph6-outreach.test.ts` — outreach and concierge docs (plan 04 T1)
- [ ] `tests/review-docs.test.ts` — DE/SV review documents and completeness (plan 11 T1)
- [ ] `tests/seo-landing-pages.test.ts` — page folders, shared component, meta keys, cross-links (plan 05 T1)
- [ ] `tests/i18n-publication-gate.test.ts` — de/sv completeness and signed review files (plan 09 T1)
- [ ] `tests/ph6-docs.test.ts` — docs/ph6 structure and canonical NAP block (plan 03 T1)

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
