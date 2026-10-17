# Phase 6: Plan de pages SEO, allemand/suédois et présence externe - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-17
**Phase:** 6-Plan de pages SEO, allemand/suédois et présence externe
**Areas discussed:** URLs et slugs localisés, Ouverture technique de DE/SV, Sources des faits des pages, Livrables présence externe

---

## URLs et slugs localisés

| Option | Description | Selected |
|--------|-------------|----------|
| Slugs traduits (Recommended) | Mot-clé dans l'URL de chaque langue ; mapping next-intl + table dans seo.ts | ✓ |
| Slug EN partout | Plus simple, mais URL FR en anglais | |
| Vous décidez | Claude choisit | |

**User's choice:** Slugs traduits.

| Option | Description | Selected |
|--------|-------------|----------|
| Garder EN tel quel (Recommended) | Slugs EN publiés inchangés, pas de 301 | ✓ |
| Tout renommer + 301 | Harmonisé, risque avant le 1er novembre | |

**User's choice:** Garder EN tel quel.

| Option | Description | Selected |
|--------|-------------|----------|
| Gabarit commun, texte par langue (Recommended) | Composant partagé, clés rédigées par langue | ✓ |
| Pages entièrement distinctes par langue | Plus de code et de maintenance | |

**User's choice:** Gabarit commun.

| Option | Description | Selected |
|--------|-------------|----------|
| Menu court + bloc « À découvrir » (Recommended) | Sous-menu « Guides », liens contextuels + CTA | ✓ |
| Tout dans le header | 7 liens, lourd sur mobile | |
| Footer + liens dans le texte seulement | Moins visible | |

**User's choice:** Menu court + bloc « À découvrir ».

---

## Ouverture technique de DE/SV

| Option | Description | Selected |
|--------|-------------|----------|
| Indicateur par page et par langue (Recommended) | PUBLISHED_PAGES pilote sitemap/hreflang ; page non listée en noindex | ✓ |
| Fichiers de messages hors build | /de en 404 avant publication | |
| Vous décidez | Claude choisit | |

**User's choice:** Indicateur par page et par langue.

| Option | Description | Selected |
|--------|-------------|----------|
| Je fournis un relecteur | Document côte à côte, validation écrite | ✓ |
| Pas encore de relecteur | DE « prêt, en attente » | |
| Relecture par un outil + humain | Contrôle automatisé puis humain | |

**User's choice:** Je fournis un relecteur.

| Option | Description | Selected |
|--------|-------------|----------|
| DE complet, SV en socle (Recommended) | SV rédigé et publié après DE | ✓ |
| DE et SV en parallèle | Double la charge de relecture | |
| DE seulement | I18N-02 reste ouvert | |

**User's choice:** DE complet, SV en socle.

| Option | Description | Selected |
|--------|-------------|----------|
| Rester en français (Recommended) | Noms de plats FR, interface traduite | ✓ |
| Colonnes name_de/description_de | 162 plats à traduire et relire | |
| Descriptions courtes seulement | Ardoise et signatures | |

**User's choice:** Rester en français.

| Option | Description | Selected |
|--------|-------------|----------|
| Locales actives dès cette phase (Recommended) | de/sv dans config, pages non publiées noindex | ✓ |
| Ajout à la publication seulement | Tout le code DE d'un coup | |

**User's choice:** Locales actives dès cette phase.

---

## Sources des faits des pages

| Option | Description | Selected |
|--------|-------------|----------|
| Propriétaire + sources vérifiées (Recommended) | Prix du couple recoupés avec sources publiques | ✓ |
| Recherche web par Claude | Risque d'infos périmées | |
| Sans prix précis | Moins risqué, moins utile | |

**User's choice:** Propriétaire + sources vérifiées.

| Option | Description | Selected |
|--------|-------------|----------|
| Lieux, marchés et quartiers, pas de concurrents nommés (Recommended) | Aucun classement ni avis inventé | ✓ |
| Quelques adresses nommées | Accord requis sur les noms | |

**User's choice:** Lieux, marchés et quartiers, sans concurrents nommés.

| Option | Description | Selected |
|--------|-------------|----------|
| Photos existantes + menu pour deux (Recommended) | Menu pour deux si confirmé | |
| Ambiance sans offre chiffrée | Pas de formule ni de prix | ✓ |
| Attendre de nouvelles photos | Retarde la page | |

**User's choice:** Ambiance sans offre chiffrée (photos existantes uniquement, déduit du contexte et de D-13 de la phase 3).

| Option | Description | Selected |
|--------|-------------|----------|
| Présentation + accords, carte renvoyée vers /menu (Recommended) | Pas de contenu dupliqué | ✓ |
| Liste complète + accords sur la page | Risque de doublon | |

**User's choice:** Présentation + accords, carte renvoyée vers /menu.

---

## Livrables présence externe

| Option | Description | Selected |
|--------|-------------|----------|
| Dossier docs/ph6 dans le repo (Recommended) | Markdown/PDF versionnés | ✓ |
| Notion ou Google Docs | Hors repo | |

**User's choice:** Dossier docs/ph6 dans le repo.

| Option | Description | Selected |
|--------|-------------|----------|
| 4 semaines d'avance, FR+EN (Recommended) | Posts prêts, validés par le propriétaire | ✓ |
| Modèles réutilisables seulement | Propriétaire rédige | |

**User's choice:** 4 semaines d'avance, FR+EN.

| Option | Description | Selected |
|--------|-------------|----------|
| Chrome piloté, validation avant chaque clic (Recommended) | Comme GBP en phase 4 | ✓ |
| Textes prêts, propriétaire exécute | Saisie par le propriétaire | |

**User's choice:** Chrome piloté, validation avant chaque clic.

| Option | Description | Selected |
|--------|-------------|----------|
| Préparés, rien d'envoyé (Recommended) | Le propriétaire déclenche chaque envoi | ✓ |
| Préparés + brouillons Gmail | Brouillons dans la boîte du propriétaire | |

**User's choice:** Préparés, rien d'envoyé.

---

## Claude's Discretion

- Noms exacts des slugs FR/DE, structure du composant de page partagé, clés i18n, style du sous-menu « Guides » et du bloc « À découvrir », forme du document de relecture DE, ordre de livraison avant le 1er novembre, données structurées par page, tests.

## Deferred Ideas

- Traduction des plats, formule « menu pour deux », guide avec établissements nommés, brouillons Gmail, FAQ/BreadcrumbList avancés.
