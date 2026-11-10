# Quick 261110 : aggregateRating sur l'accueil uniquement

Décision du propriétaire (2026-11-10) : la note (4,7 / 1 065 avis Google) n'est visible que sur l'accueil, donc le `aggregateRating` du JSON-LD Restaurant n'y est émis que là.

- `buildRestaurantJsonLd` : `aggregateRating` devient opt-in (défaut `null`).
- `RestaurantJsonLd` : prop `includeRating` (défaut `false`), passée uniquement par `src/app/[locale]/page.tsx`.
- Inchangés : badge visible, chiffres, `SHOW_AGGREGATE_RATING` (true).
- Tests : accueil (via builder + câblage) a la note, menu et french-restaurant-krabi n'ont pas `includeRating`.
- Commentaire D-14 de `social-proof.ts` et `DEPLOY-CHECKLIST-v1.2.md` mis à jour.
