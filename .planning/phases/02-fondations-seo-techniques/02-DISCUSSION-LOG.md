# Phase 2: Fondations SEO techniques - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-16
**Phase:** 2-Fondations SEO techniques
**Areas discussed:** Domaine et redirection 301, Contenu du schema Restaurant, Metadata par langue et /en, Sitemap/robots/Search Console

---

## Domaine et redirection 301

| Question | Options | Choix |
|---|---|---|
| gecko-cabane.com | Ajouter à Vercel + 301 / Il n'existe pas / pas à moi / Vérifier WHOIS | **Pas à moi** → supprimer les références |
| www et racine | www→apex 301 + /→/fr 308 / sans détection / détection navigateur | **www→apex, /→/fr** |

## Contenu du schema Restaurant

| Question | Options | Choix |
|---|---|---|
| Horaires/geo | DB + geo spec / en dur / DB + horaires spéciaux | **DB (gecko_opening_hours) + geo 8.0615/98.9157** |
| sameAs | Claude cherche + validation / URLs fournies / seulement vérifiables | **Claude cherche, l'utilisateur valide** |
| aggregateRating / hasMenu | Retirer les deux / ancre #menu / garder 4,7 | **Retirer aggregateRating ; hasMenu quand /menu existe** |

## Metadata par langue et /en

| Question | Options | Choix |
|---|---|---|
| Architecture | generateMetadata + namespace meta / constantes TS | **generateMetadata + messages/*.json** |
| Titles | EN imposé + FR calqué / FR gastronomique / textes fournis | **FR « Restaurant franco-thaï à Krabi Town »** |
| Portée /en | Tous textes en dur / titres seulement | **Tous les textes en dur → next-intl (+ test)** |

## Sitemap, robots, Search Console

| Question | Options | Choix |
|---|---|---|
| Vérification | Domaine GSC TXT DNS + import Bing / balises meta / déjà vérifié | **TXT DNS Vercel + import Bing** |
| Contenu | pages publiées seulement / avec pages futures / sans /privacy | **/fr /en /privacy ; robots bloque /admin /api** |

## Claude's Discretion

og:image par langue, manifest lang, noindex erreurs, helpers SEO, tests.

## Deferred Ideas

hasMenu (phase 3), aggregateRating (phase 5), de/sv (phase 6), redirection gecko-cabane.com, special_hours dans le schema.
