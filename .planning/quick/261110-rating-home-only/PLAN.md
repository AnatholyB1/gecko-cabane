# Quick 261110 : aggregateRating retiré partout

Décision du propriétaire (2026-11-10, révisée) : la décision « accueil seulement » est remplacée par « le retirer partout ». Plus aucun `aggregateRating` dans le JSON-LD d'aucune page, accueils compris, pour supprimer tout risque de sanction Google (note auto-balisée « self-serving » et agrégat d'un tiers : la note vient de Google, les avis affichés de TripAdvisor).

- `SHOW_AGGREGATE_RATING = false` dans `src/utils/social-proof.ts` : commutateur unique (D-14). `aggregateRatingFor()` renvoie `null` quand il est false, donc aucune page n'émet la note.
- `RestaurantJsonLd` : la prop `includeRating` (introduite par 3426008) reste, inoffensive : sans effet tant que le commutateur est false. API inchangée.
- Inchangés : badge visible, chiffres (4,7 / 1 065), avis visibles.
- Tests (`seo-jsonld`, `seo-jsonld-wiring`, `home-page`, `social-proof`) : affirment l'absence de note par défaut et le badge visible.
- Pour réactiver : passer `SHOW_AGGREGATE_RATING` à true après décision du propriétaire.
- `DEPLOY-CHECKLIST-v1.2.md` : décision consignée ; après déploiement le Rich Results Test ne doit plus montrer « Review snippets ».
