# D3 : Site public + Carte (phases 13 et 14), index

Branche `design/d3-site-menu` (depuis `milestone/v1.1`). Documents : `D3-DESIGN-CONTRACT.md` (contrat), `D3-CRITIQUE.md` (critique, 5 questions ouvertes). Styles : `tokens.css` (jetons partagés exacts), `d3.css` (composants D3, dérivés `--d3-*`). Ouvrir un `.html` directement dans le navigateur ; captures dans `screens/<page>__390|768|1440.png`.

## Site public (4 onglets, une entrée)
| Page | États (suffixe `--…`) |
|---|---|
| `site-public-horaires.html` | `chargement`, `erreur`, `non-enregistre`, `enregistrement`, `succes`, `echec`, `quitter` |
| `site-public-exceptions.html` | `chargement`, `erreur`, `vide`, `succes`, `echec`, `suppression` |
| `site-public-annonces.html` | `chargement`, `erreur`, `vide`, `non-enregistre`, `enregistrement`, `succes`, `echec` |
| `site-public-capacite.html` | `chargement`, `erreur`, `non-enregistre`, `invalide`, `succes`, `echec` |

## Carte (un écran)
`carte.html` (déjeuner, 9 plats, 1 indisponible) ; états : `chargement`, `erreur`, `vide`, `recherche-vide`, `replie`, `prix-edition`, `prix-enregistrement`, `prix-succes`, `prix-echec`, `dispo-succes`, `dispo-echec`, `ajout-rapide`, `ajout-echec`, `details`, `suppression`, `suppression-categorie`, `quitter`, `reordonner`.

## Outils (`verify/`)
`gen.mjs` génère les 49 pages ; `run.mjs` rend (Playwright, 390x844 DPR2 / 768x1024 / 1440x900) et mesure (débordement, texte < 14 px, cibles < 44 px, contraste AA). Playwright n'est pas une dépendance du projet : installer `playwright-core` dans un dossier hors dépôt (ex. `C:\Users\Anatholy\AppData\Local\Temp\gecko-pw-d3`), y copier `run.mjs`, adapter les chemins `DIR` et `executablePath`.

## Remarques
- Données d'exemple (plats, dates, textes d'annonce) : factices, non issues de la base.
- Aucune photo de plat : cadre étiqueté « Emplacement photo : aucune photo enregistrée ».
- Zones « Navigation / Menu (D1) » en pointillés : réservations pour le shell D1.
- Fichier `.pages.json` : liste des pages pour `run.mjs`.
