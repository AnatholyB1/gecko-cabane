# Phase 17c - Passe qualité finale (QA-01..04, REP-03)

Base : `milestone/v1.1` (17b). Branche : `phase/17c-quality`. Date : 2026-10-31.

## Décisions
- REP-03 (propriétaire, 2026-10-31) : plus de saisie manuelle du total Google ; la collecte KPI hebdomadaire est la seule source.
  La saisie du total TripAdvisor est conservée. Aucune route d'API ni migration modifiée : `PUT /api/review/stats` accepte
  un corps sans clé `google` (la route saute les plateformes absentes). L'écran envoie `{ month, tripadvisor }` (`src/utils/review-totals.ts`)
  et affiche en lecture seule le dernier total Google collecté (`GET /api/kpi`, `google_reviews_total`) avec sa date de collecte.
- Les 5 étiquettes de navigation à 12 px sont une exception ACCEPTÉE par le propriétaire (laissées telles quelles).
- Une 404 propre sous `/admin` : `src/app/admin/[...rest]/page.tsx` appelle `notFound()` (rend `admin/not-found.tsx`, jetons admin).

## Méthode de mesure
Serveur `next dev` sur 3120 depuis une copie hors `.claude` (Turbopack échoue sur `next/font/google` dans le worktree imbriqué : racine inférée
= `C:\gecko-cabane`). Supabase simulé par un petit serveur local (aucune base réelle), API `/api/*` simulée dans Playwright. axe-core est lu
depuis `node_modules` et injecté par le script, jamais ajouté à `package.json`. Scripts : dossier temporaire hors dépôt.
Zoom 200 % modélisé par la largeur de mise en page (390 -> 195 px, sans émulation mobile : Chromium impose 264 px minimum en mode mobile).

## Changements
- `admin.css` : barre du bas `minmax(0, 1fr)`, libellés qui s'enroulent ; < 260 px : libellés en lecture d'écran seule, deux rangées de 44 px,
  « + Réservation » réduit à son icône (nom accessible conservé) ; reflow des titres/boutons du contenu.
- `site.css` : onglets du site publics en `flex-wrap`, cible >= 44 px.
- `auth.css` : enroulement des titres et boutons des écrans publics.
- `focus-loop.ts` + 3 dialogues (confirmation partagée, feuille carte, nouvelle réservation) : boucle de focus premier <-> dernier.
- Tests : `review-totals`, `admin-legacy-tokens` (QA-03), `admin-focus-loop` ; `admin-shell` et `admin-nav-links` et `reputation-send-guard` mis à jour.
