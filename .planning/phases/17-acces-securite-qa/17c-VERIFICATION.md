# 17c - Vérification (exigence -> test / mesure)

| Exigence | Preuve |
|---|---|
| REP-03 pas de saisie Google, TripAdvisor gardée | `tests/review-totals.test.ts` (payload sans clé `google`, valide pour `isValidTotal`, route inchangée, écran sans `total-google`), `tests/reputation-send-guard.test.ts` (libellés) |
| REP-03 total Google collecté en lecture seule + date | `latestCollectedGoogle` testé ; capture `reputation-avis-1440.png` : « 201, Collecté le 2026-10-26 (semaine du ...) » |
| QA-01 cibles >= 44 px, tactile | Script Playwright `measure.mjs`, 20 pages x largeurs 360, 390, 768, 1024 (tactile, pointeur grossier) : 0 cible < 44 px, 0 débordement horizontal. 320 px : 0. |
| QA-01 débordement 195 px (390 à 200 %) en-tête + barre du bas | Avant : 69 px (page Aujourd'hui 78). Après : 0 sur Aujourd'hui, Réservations, Carte, Réglages, Réputation (3 écrans), connexion, mot de passe oublié, invitation, 404. `tests/admin-shell.test.ts` (`minmax(0, 1fr)`) |
| QA-01 cibles 36 px tactiles | Aucune restante : `.adm-btn--sm` ne passe à 36 px qu'à >= 1024 px avec pointeur fin (souris) ; tablette tactile 1024 = 44 px mesuré |
| QA-01 statut jamais par la couleur seule | Pastilles/états avec icône + texte (captures) ; nav courante = pastille pleine + `aria-current` |
| QA-02 axe-core (wcag2a/aa, 21/22, best-practice), 20 pages x 390 et 1440 | 0 violation sauf `target-size` x2 (carte, bouton « Rendre disponible » partiellement recouvert par le conteneur, cible 100 x 14 px visible) |
| QA-02 clavier + focus visible | Tab sur 45 arrêts/page : indicateur présent partout (champs prix : anneau sur le conteneur `:focus-within`), aucun arrêt sous l'en-tête collant ni la barre du bas (scroll-padding) |
| QA-02 dialogues | 0 arrêt hors dialogue sur 36 Tab/Maj+Tab (avant : 26 sur 36 pour la confirmation, 3 à 5 pour la nouvelle réservation), Échap ferme, focus rendu. `tests/admin-focus-loop.test.ts` |
| QA-02 `prefers-reduced-motion` | 8 pages : aucune animation/transition > 50 ms active |
| QA-02 zoom 200 % | Voir QA-01 (195 px) ; résiduel dans 17c-GAPS.md |
| QA-03 aucun ancien jeton dans `src/app/admin` | `tests/admin-legacy-tokens.test.ts` (échoue sur faux exemples, passe sur le source) |
| QA-04 | vitest x3 : 135 fichiers, 2174 tests verts ; `tsc --noEmit` ; `npm run lint` (0 erreur, 2 avertissements préexistants) ; build : voir ci-dessous |

## Gate
Voir section finale du rapport (build x3 depuis une copie hors `.claude`).
