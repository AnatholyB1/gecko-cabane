---
phase: 02-fondations-seo-techniques
plan: 08
subsystem: seo
tags: [search-console, dns, traceability]
requires: ["02-07"]
provides:
  - GSC Domain property sc-domain:geckocabanerestaurant.com verified (TXT on Vercel DNS)
  - Requirement notes for SEO-01, SEO-03, SEO-07
key-files:
  modified:
    - .planning/phases/02-fondations-seo-techniques/02-LAUNCH.md
    - .planning/REQUIREMENTS.md
key-decisions:
  - "SEO-07 is Partial: GSC verified; sitemap submission and Bing import pending owner"
  - "SEO-01 301 part void (gecko-cabane.com not owned, D-01); SEO-03 hasMenu deferred to phase 3 (D-08)"
metrics:
  completed: 2026-10-17
---

# Phase 2 Plan 08: Search Console verification and traceability Summary

The domain is verified in Google Search Console through a TXT record on Vercel DNS, but the sitemap submission, the Bing import and the Rich Results Test are still pending the owner, so SEO-07 is only partially complete.

## What was done

- GSC: the domain was not in the owner's account. A Domain property was created in the owner's Chrome, the TXT token was added with `vercel dns add` (rec_39f12c48391ef92fb6e840c1), dns.google confirmed it, and GSC reported "Ownership verified". The record must be kept.
- Docs: "Search Console / Bing" section added to 02-LAUNCH.md; REQUIREMENTS.md notes and traceability updated (SEO-01 and SEO-03 notes, SEO-03 "Partial (hasMenu -> Phase 3)", SEO-07 "Partial").

## Not done (owner TODO)

- Sitemap: `mcp__gsc__submit_sitemap` is read-only (403). Three UI attempts did not register (table empty after reload, `list_sitemaps` returned `{}`). Not confirmed submitted. Owner: GSC > Sitemaps > `sitemap.xml` > Submit. Google also finds it via robots.txt.
- Bing Webmaster: "Import from Google Search Console" requires the owner's Bing sign-in. IndexNow optional.
- Rich Results Test on /fr and /en: not run by Claude. Live JSON-LD was probed as structurally valid.

## Deviations from Plan

The plan's sitemap and Bing truths are not met; they are recorded as owner TODOs rather than claimed. No production, DNS (other than the one appended TXT), or Vercel config was touched in this docs step.

## Self-Check: PASSED
