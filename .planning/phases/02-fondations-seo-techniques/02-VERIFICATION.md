---
phase: 02-fondations-seo-techniques
verified: 2026-10-17T00:00:00Z
status: human_needed
score: 4/5 roadmap criteria verified (SC5 partial; accepted deviations applied to SC1, SC2)
overrides_applied: 0
human_verification:
  - test: "Soumettre sitemap.xml dans Google Search Console (propriete de domaine) et verifier qu'il apparait dans la liste"
    expected: "https://geckocabanerestaurant.com/sitemap.xml listed, status Success"
    why_human: "3 tentatives UI sans liste visible; action sur un compte tiers"
  - test: "Importer le site dans Bing Webmaster Tools depuis GSC et soumettre le sitemap"
    expected: "Site verifie dans Bing, sitemap soumis"
    why_human: "Compte proprietaire requis"
  - test: "Lancer le Rich Results Test sur /fr et /en"
    expected: "Restaurant valide sans erreur, aucun aggregateRating"
    why_human: "Outil Google interactif, non execute"
---

# Phase 2: Fondations SEO techniques - Verification

**Goal:** Google et Bing indexent correctement le site FR et EN, sur le bon domaine, avec un schema complet.
**Status:** human_needed (aucun gap de code; reste SC5 et Rich Results Test, actions proprietaire)

## Truths (ROADMAP success criteria)

| # | Criterion | Status | Evidence (production probes 2026-10-17 + code) |
|---|-----------|--------|----------|
| 1 | Canonical auto-referent; gecko-cabane.com 301 | VERIFIED (deviation D-01 accepted) | /fr canonical = https://geckocabanerestaurant.com/fr, /en = .../en; `grep gecko-cabane.com src messages` = 0 hit; / -> 308 /fr; www -> 301 apex. Redirection de gecko-cabane.com impossible (domaine non possede). |
| 2 | Schema Restaurant valide (geo, hasMenu, acceptsReservations, sameAs, paymentAccepted, priceRange), sans aggregateRating | VERIFIED code-side, PARTIAL on validation | JSON-LD live /fr et /en: geo 8.06147/98.91566, acceptsReservations true, sameAs 4 URLs (Maps, TripAdvisor, Facebook, Instagram), paymentAccepted, currenciesAccepted THB, priceRange, hours 12-22 sans mardi, no aggregateRating. hasMenu absent = D-08 (phase 3). Rich Results Test NOT run (human). |
| 3 | /en entierement anglais | VERIFIED | title "Gecko Cabane - French-Thai Restaurant in Krabi Town", meta EN, og:locale en_US, schema description EN, sections "Our Story / The Menu / Our Creations", zero occurrence "Notre Histoire/La Carte/Nos Creations" sur /en. |
| 4 | hreflang fr/en/x-default; sitemap complet; robots le declare | VERIFIED | hreflang fr,en,x-default sur /fr et /en (pas de de); sitemap.xml 4 URLs (fr, en, fr/privacy, en/privacy) avec alternates; robots.txt contient `Sitemap: https://geckocabanerestaurant.com/sitemap.xml`. |
| 5 | Domaine verifie GSC et Bing, sitemap soumis | PARTIAL | dns.google TXT: `google-site-verification=DCDag...` present (GSC domaine verifie). Soumission sitemap NON confirmee; Bing NON fait. |

**Tests:** `vitest run` 26 files, 239/239 pass.

## Requirements

SEO-01..06 satisfaits (avec deviations D-01, D-08 documentees). SEO-07 partiel: verification GSC prouvee par DNS; sitemap/Bing en attente.

## Anti-patterns
Aucun marqueur bloquant releve; pas de gecko-cabane.com residuel; /admin noindex (rapporte par 02-LAUNCH).

## Gaps Summary
Aucun gap de code ou de contenu. Le seul manquant (SC5 : sitemap GSC, Bing, Rich Results Test) depend de comptes tiers du proprietaire, pas d'un defaut d'implementation; il est classe human_needed plutot que passed car le critere "sitemap soumis" n'est pas prouve. Le sitemap et robots sont servis correctement, donc la soumission est un simple geste manuel (GSC detecte aussi robots.txt).

_Verifier: Claude (gsd-verifier)_

## Owner steps update (2026-10-17, done by Claude on the owner's request)

- Google Search Console: sitemap `https://geckocabanerestaurant.com/sitemap.xml` submitted on `sc-domain:geckocabanerestaurant.com` via the GSC tool. Google fetched it at 12:52 Krabi time: 7 URLs submitted, 0 indexed yet, 0 errors, 0 warnings.
- Rich Results Test on https://geckocabanerestaurant.com/en (Chrome): crawled successfully; 2 valid items detected (Local business 1, Organisation 1), no errors or warnings.
- Bing Webmaster: NOT done. Needs the owner to sign in (Claude does not sign in or grant account access). Remaining for SEO-07: import the site from GSC in Bing Webmaster and submit the sitemap there.
- Bing Webmaster (2026-10-17, later): owner signed in and approved the Google import; geckocabanerestaurant.com is in Bing Webmaster. Sitemap `https://geckocabanerestaurant.com/sitemap.xml` submitted by Claude in Chrome: "successfully submitted for processing" (1 sitemap, 0 errors, 0 warnings, status Processing).
- SEO-07 is now complete (GSC verified + sitemap submitted, Bing imported + sitemap submitted). Indexing itself will take days; monitor in both consoles.
