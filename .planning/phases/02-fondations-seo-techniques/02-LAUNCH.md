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

Filled by 02-07. Not verified yet (no deploy, no rendered-HTML check, no visual check of the per-locale OG image).

## Owner confirmations

Filled by 02-07.

## Search Console / Bing

Filled by 02-08.

## Known limitations

- Root `not-found` / `global-error` stay French, outside `[locale]`.
- Footer hours copy is static and must follow admin hour changes; the footer 12h-22h change is pending owner confirmation in 02-07.
- gecko-cabane.com is not owned, so no 301 (D-01).
- The vercel.app host keeps serving, with absolute canonicals (RESEARCH Q3 resolved).
- SEO-03 `hasMenu` deferred to phase 3 (D-08).
