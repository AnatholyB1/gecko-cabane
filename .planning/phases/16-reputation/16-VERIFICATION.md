# Phase 16 : VERIFICATION

## Exigence -> test

| Exigence | Test Vitest | Preuve navigateur (Chromium headless, `next build` + `next start`, port 3116) |
|---|---|---|
| REP-01 Avis + KPI sous Réputation, primitives P11, états | `tests/reputation-send-guard.test.ts` (REP-01 : un seul h1, segments, `aria-current`, `parseVue`, trois routes = même composant, LoadingState/EmptyState/ErrorState, note moyenne masquée) ; `tests/kpi-admin-wiring.test.ts` ; `tests/admin-shell.test.ts` (pas de seconde rangée d'onglets) ; `tests/admin-nav-links.test.ts` | 390 / 768 / 1440 : pas de débordement, cibles >= 44 px, texte >= 14 px (hors étiquettes de navigation 12 px, exception E1 du propriétaire), états données / vide / erreur / chargement pour Avis et KPI |
| REP-02 Garde-fou, libellés TEST/live, aucun envoi sans confirmation | `reputation-send-guard.test.ts` : dialogue d'alerte (confirmation avant PUT, refus = aucun PUT, pas de dialogue si note > 3), aucun fetch au rendu, segments = liens sans gestionnaire, aucune écriture hors 2 PUT dans des `onSubmit`, aucun « Passer en live », libellés et phrase de garde exacts ; `kpi-admin-wiring.test.ts` (chaînes de la section 9) | Aucune requête non GET à l'ouverture, au changement de semaine ou de segment ; dialogue : PUT absent à l'ouverture, après Annuler et après Échap, un seul PUT après confirmation ; focus initial sur Annuler, focus rendu au déclencheur ; toast en haut avec le texte exact |
| REP-03 Saisie manuelle gardée | `reputation-send-guard.test.ts` (libellés conservés, PUT `/api/review/stats`) ; `review-badges.test.ts` (tone) | Valeur invalide : message, aucun PUT ; valeur valide : PUT puis toast |

## Ce que les tests ne prouvent pas
- La garde admin (middleware, `isGeckoAdmin`) et la base : la vérification navigateur s'est faite sur une route temporaire (`/monitoring-p16`, hors du middleware, shell réel, API simulée par interception Playwright), RETIRÉE avant commit. Aucun mail, aucune base réelle.
- Le rendu Vitest est statique (`renderToStaticMarkup`, environnement node) : les effets et clics sont prouvés en navigateur seulement sur API simulée.
- Le mode live réel du serveur n'est pas lu (l'API ne l'expose pas) : la pastille est déduite du dernier rapport envoyé, TEST par défaut.
- Observation (hors périmètre, `ConfirmDialog` de la phase 11) : après les gardes de focus de Base UI, Tab peut atteindre le lien d'évitement derrière le voile ; aucun élément du contenu n'est atteint.
- `tests/admin-nav-single-source.test.ts` est instable de façon intermittente (simulation de module sous charge, indépendant de cette phase).
