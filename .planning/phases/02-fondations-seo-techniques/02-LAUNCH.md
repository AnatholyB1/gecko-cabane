# Phase 2 - Launch evidence

## sameAs verification (D-09)

Checks run 2026-10-16 with `curl -sIL -A 'Mozilla/5.0'` and a title/description fetch (read-only). Rule: SAME_AS holds only URLs already published as hrefs in `src/app/[locale]/page.tsx` (byte-identical, enforced by `tests/seo-jsonld-wiring.test.ts`). Everything else waits for the owner.

| Profile | URL | Source | Check performed | HTTP status | Evidence | Decision |
|---------|-----|--------|-----------------|-------------|----------|----------|
| TripAdvisor (fr.tripadvisor.be) | https://fr.tripadvisor.be/Restaurant_Review-g297927-d2413872-Reviews-Gecko_Cabane_Restaurant_krabi-Krabi_Town_Krabi_Province.html | published on site (page.tsx l.507) | curl -sIL | 403 | Bot-block by TripAdvisor; URL slug names Gecko Cabane, Krabi Town; already linked on the site | included (already published) |
| Facebook | https://www.facebook.com/GeckoCabaneRestaurant/ | published on site (page.tsx l.529) | curl -sIL + title | 200 | `<title>Gecko Cabane Restaurant Paklow Jariya \| Krabi` | included (already published) |
| TripAdvisor canonical .com form | https://www.tripadvisor.com/Restaurant_Review-g297927-d2413872-Reviews-Gecko_Cabane_Restaurant_krabi-Krabi_Town_Krabi_Province.html | candidate (RESEARCH) | curl -sIL | 403 | Bot-block; same listing id d2413872 as the published .be URL | candidate - awaiting owner (02-07) |
| Instagram | https://www.instagram.com/geckocabane/ | candidate (handle guessed by Claude, not in repo) | curl -sIL + title | 200 | Profile "Paklow Jariya (@geckocabane)", 77 followers, 3 posts; Chef is Jariya but bio not confirmed to name the restaurant | candidate - awaiting owner (02-07) |
| Google Maps place URL | none found | candidate | search | n/a | Only the search-query link `maps.google.com/?q=...` exists in page.tsx (l.673); it is not a profile and is never put in SAME_AS. No place URL / maps.app.goo.gl / g.page link located | candidate - awaiting owner (02-07): owner to supply the place URL |

## Deploy & live probes

### Task 1 results (2026-10-17)

**Gates:** `npm run lint` 0 errors (7 pre-existing warnings); `npm run build` (vitest then next build) green. D-09 pre-push check: both SAME_AS URLs are hrefs in `page.tsx` (grep count 1 each), no candidate online.

**Deploy:** `git push origin master` (2b52c60). Production deployment `https://gecko-cabane-restaurant-hfxroyj0c-anatholyb1s-projects.vercel.app` Ready (51s), no Google Fonts failure.

**Second push (fix found by probes):** privacy page titles rendered `Privacy policy | Gecko Cabane | Gecko Cabane` (messages `privacy.metaTitle` already carried the suffix that the layout template adds). Fixed in 991ceba (suffix removed from `messages/fr.json` and `en.json`); vitest 238/238; deployment `gecko-cabane-restaurant-4hngfqh6v` Ready (45s). Re-probed: `/fr/privacy` = `Politique de confidentialité | Gecko Cabane`, `/en/privacy` = `Privacy policy | Gecko Cabane`.

**www (D-02):** `vercel domains add www.geckocabanerestaurant.com gecko-cabane-restaurant`, then `vercel api /v9/projects/prj_h3Iz5JTpoyxi0xs1az4YfMFEk29v/domains/www.geckocabanerestaurant.com -X PATCH redirect=geckocabanerestaurant.com redirectStatusCode=301` -> `verified: true`, redirect 301. DNS untouched (wildcard ALIAS to Vercel already covers www).

**Probes (curl against production):**

| Probe | Result |
|-------|--------|
| `curl -sI https://geckocabanerestaurant.com/` | 308, `Location: /fr` |
| `curl -sI https://www.geckocabanerestaurant.com/fr` | 301, `Location: https://geckocabanerestaurant.com/fr` |
| `/sitemap.xml` | 200 `application/xml`, 4 URLs (fr, fr/privacy, en, en/privacy) each with hreflang fr/en/x-default (x-default -> /fr variant) |
| `/robots.txt` | 200 `text/plain`, contains `Sitemap: https://geckocabanerestaurant.com/sitemap.xml`; Disallow /admin /api /auth /monitoring |
| `/fr` `Link:` header | only font/css preload, no hreflang |
| og:image `/fr/opengraph-image?11ebe35742c573a1` and `/en/opengraph-image?11ebe35742c573a1` | 200 `image/png` (visual check of the image still not done) |
| `/admin/login` | `<meta name="robots" content="noindex, nofollow"/>` |

HTML checks (/fr, /en, /fr/privacy, /en/privacy): canonical equals page URL on all 4; hreflang set exactly fr, en, x-default (-> the /fr variant), no de; og:locale fr_FR (alternate en_US) on fr pages, en_US (alternate fr_FR) on en pages; `<html lang>` = locale. Titles: /fr `Gecko Cabane – Restaurant franco-thaï à Krabi Town`; /en `Gecko Cabane – French-Thai Restaurant in Krabi Town` (exact match). `grep -c aggregateRating /en` = 0; canonical grep count on /en = 1.

Live JSON-LD (/fr and /en, one script each): `@type` Restaurant; localized description (FR / EN); geo 8.0615, 98.9157; openingHoursSpecification single block Sunday, Monday, Wednesday-Saturday 12:00-22:00 (Tuesday absent); priceRange `฿฿`; acceptsReservations true; paymentAccepted `Cash, Credit Card`; currenciesAccepted THB; no aggregateRating / hasMenu / menu; sameAs = exactly the 2 published URLs (TripAdvisor .be, Facebook).

**Read-only pre-check for 02-08:** `vercel dns ls geckocabanerestaurant.com`: TXT `resend._domainkey`, TXT `send` (SPF), MX `send`, CNAME `admin`, wildcard ALIAS; no Google-site-verification TXT present. `mcp__gsc__list_sites` not available in this executor session (tool not reachable), so GSC property state is unchecked.

Failing: none after the privacy title fix. Not done here: Rich Results Test, geo/hours owner confirmation, sameAs approvals (Task 2), visual check of OG image.

## Owner confirmations

### Owner approvals / Task 2 outcome (2026-10-17)

The owner answered "cherche-les toi-même": the lookups were delegated to Claude and Claude's actions approved. The values below were found by Claude via web sources and applied under that delegation. Rich Results Test (interactive Google tool) was not run by the owner; to be re-checked later.

1. **Geo**: wanderlog.com (place 2352102) and visitthailandtoday.com both give 8.0614728, 98.9156616 (Google Maps pin). Matches D-06 (8.0615, 98.9157) to rounding. Applied as 8.06147 / 98.91566 (5 decimals, Google recommendation).
2. **Footer hours 12h-22h**: confirmed by DB consistency (`gecko_opening_hours`, admin-managed, and the schema); owner did not object. Reminder: third-party listings still show 11:00-23:00 daily (stale) - update Google Business Profile / TripAdvisor in phase 4/6.
3. **sameAs final list** (replaces the previous 2), owner-approved/delegated 2026-10-17:

| Profile | URL | Evidence | Decision |
|---------|-----|----------|----------|
| Google Maps place | https://www.google.com/maps/place/?q=place_id:ChIJozpAo2GUUTARABLcICH3H7I | place id found on both sites above; `curl -sIL` returns HTTP 200 on google.com/maps (no redirect for bots) | included (owner-approved/delegated 2026-10-17) |
| TripAdvisor (.com canonical) | https://www.tripadvisor.com/Restaurant_Review-g297927-d2413872-Reviews-Gecko_Cabane_Restaurant_krabi-Krabi_Town_Krabi_Province.html | same listing id d2413872 as the visible .be link (left unchanged in page.tsx, OPS-04 phase 6) | included (owner-approved/delegated 2026-10-17) |
| Facebook | https://www.facebook.com/GeckoCabaneRestaurant/ | already published, page title "Gecko Cabane Restaurant Paklow Jariya \| Krabi" | included (already published) |
| Instagram | https://www.instagram.com/geckocabane/ | probable, same owner: handle equals the restaurant name; display name "Paklow Jariya" is the same as the official Facebook page; bio not readable by bots | included (owner-approved/delegated 2026-10-17) |

The old `fr.tripadvisor.be` URL is dropped from sameAs only (still linked visibly on the page). The D-09 test (hrefs in page.tsx) was relaxed to: https, host allow-list (google.com/maps, tripadvisor.com, facebook.com, instagram.com) and listed in this file.

## Search Console / Bing

Filled by 02-08.

## Known limitations

- Root `not-found` / `global-error` stay French, outside `[locale]`.
- Footer hours copy is static and must follow admin hour changes; the footer 12h-22h change is pending owner confirmation in 02-07.
- gecko-cabane.com is not owned, so no 301 (D-01).
- The vercel.app host keeps serving, with absolute canonicals (RESEARCH Q3 resolved).
- SEO-03 `hasMenu` deferred to phase 3 (D-08).
