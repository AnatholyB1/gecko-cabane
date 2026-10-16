---
phase: 2
slug: fondations-seo-techniques
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-16
---

# Phase 2 — Validation Strategy

> Detailed requirement→test map: see `## Validation Architecture` in `02-RESEARCH.md`.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.1.0 (node env, `@` alias present) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `node_modules/.bin/vitest run` |
| **Full suite command** | `npm run lint && npm run build` (build runs vitest first) |
| **Estimated runtime** | ~30 s tests, ~2 min build |

## Sampling Rate

- **After every task commit:** quick run command
- **After every plan wave:** `npm run lint && npm run build`
- **Before `/gsd:verify-work`:** full suite green
- **Max feedback latency:** 60 s

## Per-Task Verification Map

| Plan/Task | Requirement | Automated command |
|-----------|-------------|-------------------|
| 02-01 T1 | SEO-01, SEO-05 | `node_modules/.bin/vitest run tests/seo-metadata.test.ts` |
| 02-01 T2 | SEO-02, SEO-03 | `node_modules/.bin/vitest run tests/seo-jsonld.test.ts` |
| 02-02 T1 | SEO-04 | `node_modules/.bin/vitest run tests/i18n.test.ts` |
| 02-02 T2 | SEO-04 | `node_modules/.bin/vitest run tests/i18n-hardcoded.test.ts tests/reservation-form.test.ts` |
| 02-03 T1 | SEO-06 | `node_modules/.bin/vitest run tests/seo-sitemap-robots.test.ts` |
| 02-03 T2 | SEO-06, SEO-05, SEO-01 | `node_modules/.bin/vitest run tests/middleware-matcher.test.ts tests/admin-routes-guarded.test.ts` |
| 02-04 T1-T2 | SEO-04 | `node_modules/.bin/vitest run tests/i18n-hardcoded.test.ts tests/i18n.test.ts` |
| 02-05 T1-T3 | SEO-01, SEO-04, SEO-05 | `node_modules/.bin/vitest run` (seo-pages, seo-no-legacy-domain) |
| 02-06 T1-T3 | SEO-02, SEO-03, SEO-04 | `node_modules/.bin/vitest run tests/seo-jsonld-wiring.test.ts tests/seo-jsonld.test.ts` + `npm run build` |
| 02-07 T1 | SEO-01, SEO-06 (live) | curl status checks (308 /, 301 www, 200 sitemap) |
| 02-07 T2 | SEO-02 (RRT) | manual (owner) |
| 02-08 T2/T4 | SEO-07 | `curl dns.google/resolve ... TXT` + `mcp__gsc__list_sitemaps` |

## Wave 0 Requirements

- [ ] `src/utils/seo.ts` — pure helper required by the tests
- [ ] test files listed in `02-RESEARCH.md` (six new files)

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Rich Results Test passes for Restaurant schema | SEO-02/03 | External Google tool | Run the test on `https://geckocabanerestaurant.com/fr` and `/en`; record in a LAUNCH note |
| GSC domain property verified, sitemap submitted | SEO-07 | Token only from GSC UI; owner sign-in | Owner copies the TXT token; Claude adds it via Vercel DNS, then submits the sitemap with the GSC tool |
| Bing Webmaster import from GSC | SEO-07 | Needs owner's Bing sign-in | Owner clicks "Import from Google Search Console" |
| `www` 301 and `/` 308 in production | SEO-01 | Needs deployed Vercel domain config | `curl -sI` checks recorded after deploy |

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] No 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60 s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
