# D2 — Aujourd'hui + Réservations (phase 15) : index

Branche : `design/d2-today-reservations` (depuis `milestone/v1.1`). Maquettes statiques, aucune dépendance applicative, données d'exemple.

## Documents
- `D2-DESIGN-CONTRACT.md` : direction, jetons, primitives, statuts, écrans, états, microcopie FR, breakpoints, mouvement, accessibilité, mesures, tableau exigence -> écran -> vérification.
- `D2-CRITIQUE.md` : revue et 5 questions ouvertes.

## Prototypes (à ouvrir dans un navigateur ; `tokens.css` + `d2.css`)
| Écran | Fichiers |
|---|---|
| Aujourd'hui | `today.html`, `today-loading.html`, `today-empty.html`, `today-error.html`, `today-confirm-full.html`, `today-full.html` |
| Réservations | `reservations.html`, `reservations-success.html`, `reservations-busy.html`, `reservations-loading.html`, `reservations-empty.html`, `reservations-noresult.html`, `reservations-error.html`, `reservations-actionfail.html`, `reservations-cancel.html` |
| Saisie manuelle | `manual-form.html`, `manual-form-invalid.html`, `manual-form-busy.html`, `manual-form-error.html` |

## Captures et mesures
- `screenshots/` : `<page>-390.png` (390x844, DPR2), `-768.png` (768x1024), `-1440.png` (1440x900) ; pleine page sauf dialogues (viewport).
- `measures.json` : débordement, texte < 14 px, cibles < 44 px, contraste AA, par page et viewport (0 violation).
- `tools/build.js` (génère les HTML) et `tools/shoot.js` (captures + mesures). Playwright (`playwright-core`) est installé hors du dépôt, dans `C:\Users\Anatholy\AppData\Local\Temp\gecko-pw-d2`, avec le Chromium de `ms-playwright` ; ces scripts ne tournent pas depuis le dépôt tel quel.
