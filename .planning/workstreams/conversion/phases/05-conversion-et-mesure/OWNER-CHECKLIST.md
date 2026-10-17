# Phase 5 - Checklist propriétaire

Tout ce que le code ne peut pas faire à votre place. Pour chaque action : **Où**, **Quoi**, **En attendant** (ce qui est dégradé).
Rien de ce qui suit n'a été exécuté par Claude (migrations, variables Vercel, comptes, déploiement).

## 1. Avant le déploiement (ordre obligatoire)

- [ ] Appliquer la migration `supabase/migrations/015_reservation_source.sql`
  - **Où** : Supabase > SQL Editor. **Quoi** : coller et exécuter 015 en premier.
  - **En attendant** : le code écrit `source` / `utm_*` ; sans 015 les réservations avec source échouent ou perdent la source.
- [ ] Appliquer ensuite `supabase/migrations/016_review_stats.sql`
  - **Où** : Supabase > SQL Editor. **Quoi** : exécuter 016 après 015 (crée `gecko_review_clicks`, `gecko_review_click_hit`, totaux mensuels).
  - **En attendant** : les compteurs de clics avis échouent sans bruit et `/admin/avis` affiche une erreur de chargement.
- [ ] Vérifier `RESEND_API_KEY`, `RESTAURANT_NOTIFICATION_EMAIL` et `RATE_LIMIT_SECRET` dans Vercel
  - **Où** : Vercel > Project > Settings > Environment Variables (Production).
  - **En attendant** : le formulaire « Un souci ? » ne peut pas vous prévenir, la limite par IP n'est pas fiable.
- [ ] Vérifier qu'un message « Un souci ? » de test arrive bien dans votre boîte (REV-07), sur la préversion
  - **En attendant** : REV-07 reste non validé.
- [ ] Vérifier qu'une réservation manuelle (admin > Réservations) s'enregistre bien avec une source (RLS), après 015.

## 2. Mesure d'audience (Plausible)

- [ ] Créer le compte Plausible Cloud (environ 9 EUR/mois, D-02) pour `geckocabanerestaurant.com`
- [ ] Copier l'identifiant `pa-...` dans `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID` (Vercel) puis **redéployer** (les rewrites sont figés au build)
  - **En attendant** : aucun script, aucune mesure, aucune erreur visible.
- [ ] Créer les objectifs `Reservation Sent`, `WhatsApp Click`, `LINE Click`
- [ ] Déclarer les propriétés personnalisées `locale` et `src`
- [ ] Contrôler via « Verify installation » puis le temps réel de Plausible

## 3. LINE

- [ ] Fournir l'URL d'ajout d'ami (`https://lin.ee/...` ou `https://line.me/R/ti/p/@...`) dans `NEXT_PUBLIC_LINE_URL` (Vercel) puis redéployer
  - **En attendant** : le bouton LINE n'apparaît pas, seul WhatsApp est affiché.

## 4. Avis réels - ÉTAPE BLOQUANTE pour CONV-01 et D-14

**Tant que cette étape n'est pas faite, CONV-01 (3 à 4 avis réels) et D-14 (aggregateRating) ne sont pas atteints : la section affiche seulement la note, le badge et les liens, et le JSON-LD n'a pas d'aggregateRating.**

- [ ] Accorder la consultation de vos avis Google / TripAdvisor (plan 05-12, tâche 1)
- [ ] Claude recopie mot pour mot des candidats (prénom, pays, langue, lien) - rien n'est inventé
- [ ] Choisir 3 ou 4 avis et confirmer prénom + pays de chacun (05-12, tâche 3)
- [ ] Les avis sont ajoutés dans `src/utils/social-proof.ts` (05-13, tâche 1)
- [ ] Confirmer l'année Travellers' Choice et les chiffres 4,7 / 1 062
  - **En attendant** : pas de cartes d'avis, pas d'aggregateRating.

## 5. Note de risque aggregateRating (D-14)

- [ ] Prendre connaissance du risque : réintroduit comme décidé, mais Google n'affiche généralement pas d'étoiles pour des avis tiers repris par l'établissement lui-même et peut considérer cela comme trompeur.
  - **Où** : interrupteur unique `SHOW_AGGREGATE_RATING` dans `src/utils/social-proof.ts` (le passer à `false` retire le balisage).
  - Surveiller Search Console > Améliorations > Extraits d'avis.

## 6. Page « Qui sommes-nous »

- [ ] Fournir la photo du couple (fichier + accord de publication) pour `COUPLE_PHOTO` dans `src/utils/about-content.ts`, fichier dans `public/`
- [ ] Compléter les éléments « à compléter (05-10) » : prénom du propriétaire, année d'ouverture, histoire du lieu / de la rencontre
- [ ] Valider les trajets : 20 min, 50 baht, 3 min, 15 min
  - **En attendant** : le créneau photo reste vide, seule l'histoire déjà publique est affichée.
- [ ] Texte DE : prévu en phase 6.

## 7. Messages en allemand

- [ ] Faire relire par un germanophone le modèle WhatsApp DE de `/admin/avis` (marqué « à relire »)
  - **En attendant** : ne pas l'envoyer à des clients.

## 8. Carte (optionnel)

- [ ] Remplacer l'URL d'intégration par celle de Google Maps > Partager > Intégrer une carte (`pb=`), à la place de l'URL sans clé supposée

## 9. Politique de confidentialité

- [ ] Relire et valider le texte ajouté (brouillon, date du 17 octobre 2026) : mesure d'audience Plausible sans cookies (hébergement UE vérifié sur plausible.io/data-policy) et messages « Un souci ? » envoyés par email, non enregistrés.

## 10. Après le déploiement

- [ ] Mesurer PageSpeed mobile : la référence de 05-07 est **non vérifiée** (quota PSI dépassé, aucun score revendiqué). Objectif score >= 85 et LCP < 2,5 s, à mesurer sur la préversion ou via Chrome DevTools Lighthouse (plan 05-13).
- [ ] Vérification finale de 05-13 : contrôles fonctionnels de bout en bout (réservation, LINE/WhatsApp, avis, carte).
