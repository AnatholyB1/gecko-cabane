---
status: complete
---
# Quick 261110 : aggregateRating retiré partout

Décision du propriétaire (2026-11-10) : d'abord « accueil seulement », remplacée par « le retirer partout » (risque Google : note auto-balisée et agrégat d'un tiers). `SHOW_AGGREGATE_RATING=false` ; `aggregateRatingFor()` renvoie null ; plus aucune page n'émet la note ; aucun autre émetteur (grep src). Le badge, les chiffres 4,7 / 1 065 et les avis visibles sur l'accueil sont inchangés.
Vérifié (build + next start) : 4 accueils, /en/menu, /fr/menu, /en/french-restaurant-krabi sans aggregateRating ; JSON-LD Restaurant parsable (horaires, sameAs, hasMenu). Gate : vitest 2504, tsc, lint, build, check:build-output. Non prouvé : effet chez Google (Rich Results Test après déploiement).
