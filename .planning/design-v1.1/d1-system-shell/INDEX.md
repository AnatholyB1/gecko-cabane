# D1 — Système de design + shell + navigation : index

Slice D1 du milestone v1.1 (phases 11 et 12). Maquettes statiques et documents seulement ; aucun code applicatif. Ouvrir `kit.html` et `shell.html` dans un navigateur (ils chargent `tokens.css`, `kit.css` et `fonts/` en relatif).

| Fichier | Rôle |
|---|---|
| `D1-DESIGN-CONTRACT.md` | Contrat normatif : jetons, composants et états, microcopie FR, points de rupture, mouvement, accessibilité, vérifications mesurables, tableau DSN-02 à 07 / NAV-02 / NAV-03 |
| `D1-CRITIQUE.md` | Auto-critique, défauts restants, 5 questions ouvertes |
| `tokens.css` | Jetons `--adm-*` (14 imposés + affinages), polices, neutralisation `.adm-root`, mouvement réduit |
| `kit.css` | Styles des primitives et du shell (classes `adm-*`, traduisibles 1:1 en composants React) |
| `kit.html` | Kit : couleurs, typographie, Button, Field/Input/Select/Textarea, Card, Badge, DataTable (+ cartes mobile), PageHeader, dialogue de confirmation, Toast, états chargement/vide/erreur. Indicateur de largeur en tête. |
| `shell.html` | Shell responsive. Variantes par URL : `?v=home` (cartes de navigation), `site` (page avec contenu), `empty`, `loading`, `error` ; `&menu=1` (menu compte ouvert), `&toast=1` (toast de succès). |
| `fonts/` | Inter (variable) et Cormorant Garamond (variable), woff2, pour le rendu hors ligne des maquettes (en production : `next/font`) |
| `renders/` | PNG Playwright : `shell-{home,site,empty,loading,error,home-menu,site-toast}-{390,768,1440}.png` (390 x 844 DPR 2 ; 768 x 1024 ; 1440 x 900) et `kit-{390,768,1440}.png` (pleine page, échelle CSS) |
| `renders/measures.json` | Mesures brutes : débordement, texte, cibles, contraste, par page et par largeur (360, 390, 768, 1024 tactile, 1440) |
| `tools/` | Scripts de régénération : `build-icons.mjs` (inline les icônes lucide dans les sources `*.src.html`), `measure-and-render.mjs` (mesures + PNG). Playwright et lucide-static s'installent hors du repo (`npm i playwright lucide-static @fontsource-variable/inter @fontsource-variable/cormorant-garamond` dans un dossier temporaire) ; ces scripts ne sont pas exécutés par le projet. |

Données des maquettes : exemples (« Martin L. », etc.) ; adresse e-mail fictive en `.example` ; aucune photo (emplacement honnête).
