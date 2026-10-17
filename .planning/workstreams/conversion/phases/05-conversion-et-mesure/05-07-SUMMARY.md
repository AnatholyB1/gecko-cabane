---
phase: 05-conversion-et-mesure
plan: 07
subsystem: performance
tags: [next-image, avif, webp, lcp, seo-08]
requires: [05-01, 05-03]
provides:
  - hero served as preloaded AVIF/WebP from a 219 KB source
  - responsive lazy next/image for home raster photos
affects: [05-08, 05-09, 05-13]
tech-stack:
  patterns: [next/image preload + fill, images.qualities allowlist]
key-files:
  modified:
    - public/hero-bg.jpg
    - public/chef-jariya.jpg
    - next.config.ts
    - src/app/[locale]/page.tsx
  created:
    - tests/hero-image.test.ts
decisions:
  - "Gate (Task 3) left UNVERIFIED: no score claimed; carried to the 05-13 owner checkpoint"
metrics:
  completed: 2026-10-17
  tasks: 2 of 3 automated; Task 3 measurement unverified
---

# Phase 5 Plan 07: Hero and image performance Summary

Hero background downscaled 6.08 MB to 219 KB and served through next/image as preloaded AVIF/WebP; chef, gallery and contact photos converted to responsive, lazy next/image.

## Commits
- test(05-07) RED: tests/hero-image.test.ts (7 tests failing as expected)
- 5ea9b79 perf(05-07): resize images, next.config images block, page.tsx conversions

## Image sizes (sharp, EXIF rotate, metadata stripped)
| File | Before | After |
|------|--------|-------|
| public/hero-bg.jpg | 6,080,622 B, 2688x1520 | 219,395 B, 2400x1357 (q75) |
| public/chef-jariya.jpg | 467,502 B, 1024x1024 | 70,252 B, 1024x1024 (q80; width not enlarged) |

Filenames unchanged. next.config.ts: formats avif/webp, qualities [60, 75], minimumCacheTTL 2678400, no remotePatterns.
Visual parity kept: hero opacity 0.28, chef sepia filter, aspect ratios 3/4, 4/5, 4/3. SVG and gecko-mark.png img tags untouched.

## Measurement gate (Task 3): NOT VERIFIED
- Baseline of production: **unavailable**. PSI API returned HTTP 429 (daily quota exceeded for the keyless project).
- Post-change score and LCP: **not measured**. A preview needs a push (forbidden for this run), the PSI API is quota-limited, and Lighthouse is not installed locally (installing a package was out of scope).
- No score or LCP is claimed. The gate (score >= 85, LCP < 2.5 s) must be measured at the 05-13 owner checkpoint (preview URL or Chrome DevTools Lighthouse mobile). If it fails, apply levers in order: (a) fonts, (b) Sentry client Replay / tracesSampleRate, (c) hero quality 50 / width 1920. None were applied since there are no numbers to justify them.
- Indirect evidence from a local production build (`next start`): /fr returns 200; the HTML contains a `<link rel="preload" as="image">` for the hero with srcset q=60; `/_next/image?url=/hero-bg.jpg&w=1920&q=60` returns image/avif at 42,658 B and image/webp at 84,708 B.

## Verification
- Full vitest: 50 files, 549 tests pass. tsc --noEmit clean. `npm run build` passes. `npm run lint`: 0 errors, 8 warnings (decorative svg/png img tags, plus a pre-existing unused var in admin reservations).

## Deviations from Plan
None in code. The checkpoint Task 3 could not be completed with real numbers (see above); wave 3 (05-08, 05-09) should be treated as proceeding on an unverified gate.

## Self-Check: PASSED
