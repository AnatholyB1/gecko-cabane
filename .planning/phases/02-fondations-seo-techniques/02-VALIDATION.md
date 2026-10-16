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

Filled by the planner from `02-RESEARCH.md` §Validation Architecture (seo helper unit tests, schema without aggregateRating, sitemap/robots shape, middleware matcher excludes sitemap/robots/opengraph-image, meta namespace parity, no hard-coded French literals, no `gecko-cabane.com`).

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
