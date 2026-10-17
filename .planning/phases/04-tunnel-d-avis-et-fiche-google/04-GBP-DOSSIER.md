# Dossier Google Business Profile — Gecko Cabane (OPS-01)

Statut : prêt pour la session Chrome (2026-10-17). Aucun nom, adresse, téléphone, horaire ni condition Google n'est modifié.

## Accord du propriétaire

Réponse du propriétaire dans la conversation (2026-10-17) : « approve do what you can on chrome ». Mode retenu : **chrome-guided**. Les éléments marqués « à confirmer par le propriétaire » ne sont PAS appliqués.

## Catégories

| champ | valeur proposée | source/justification | statut |
|-------|-----------------|----------------------|--------|
| Catégorie principale | French restaurant (Restaurant français) | D-20, OPS-01 | à appliquer |
| Secondaire 1 | Thai restaurant | D-20 (« Thai ») ; libellé le plus proche proposé par l'UI GBP | à appliquer |
| Secondaire 2 | Fusion restaurant | D-20 (« Fusion ») ; libellé le plus proche proposé par l'UI GBP | à appliquer |
| Secondaire 3 | Wine bar | D-20 | à appliquer |

## Attributs

| champ | valeur proposée | source/justification | statut |
|-------|-----------------|----------------------|--------|
| Sur place (dine-in) | oui | restaurant, réservation en ligne | vérifié (site) |
| Réservations acceptées | oui | formulaire de réservation en ligne | vérifié (site) |
| Options végétariennes | oui | `gecko_menu_items.is_vegetarian` existe | vérifié (code) |
| Sert du vin / de la bière | oui | pages vins et bières belges (phase 3) | vérifié (carte) |
| Moyens de paiement, Wi-Fi, accessibilité, terrasse | — | non vérifiables dans le dépôt | à confirmer par le propriétaire (non appliqué) |

## Liens

| champ | valeur proposée | note |
|-------|-----------------|------|
| Lien de réservation (EN, recommandé touristes européens) | https://geckocabanerestaurant.com/en?utm_source=google&utm_medium=gbp#reservation | la query précède le hash |
| Variante FR | https://geckocabanerestaurant.com/fr?utm_source=google&utm_medium=gbp#reservation | alternative |
| Lien de la carte | https://geckocabanerestaurant.com/en/menu?utm_source=google&utm_medium=gbp_menu | page /menu en ligne (phase 3) |
| Site web | https://geckocabanerestaurant.com/en?utm_source=google&utm_medium=gbp_website | |

Locale retenue pour les liens : EN (le propriétaire n'a pas précisé ; modifiable).

## Description

EN (≤ 750 caractères) :
Gecko Cabane is a French-Thai restaurant in the heart of Krabi Town, on Maharat Road. Chef Jariya and her husband serve French cooking and Thai classics side by side, with a short list of wines and Belgian beers. The dining room seats up to 40 guests. Open every day except Tuesday, kitchen until 10 pm. Book your table online in under a minute from our website, or message us on WhatsApp at +66 81 958 5945.

FR :
Gecko Cabane est un restaurant franco-thaï au cœur de Krabi Town, sur Maharat Road. La cheffe Jariya et son mari proposent une cuisine française et des classiques thaïs, avec une courte sélection de vins et de bières belges. La salle accueille jusqu'à 40 convives. Ouvert tous les jours sauf le mardi, cuisine jusqu'à 22 h. Réservez votre table en ligne en moins d'une minute sur notre site ou écrivez-nous sur WhatsApp au +66 81 958 5945.

Aucune note, récompense ni superlatif.

## Photos

Photos réelles de `public/` à ajouter : exterior-entrance.jpg (Extérieur), exterior-sign.jpg (Extérieur), food-bourguignon.jpg, food-massaman.jpg, food-poulet-creme.jpg, food-veloute.jpg (Nourriture), chef-jariya.jpg (Équipe). hero-bg.jpg : à vérifier visuellement avant envoi.

Exclus : blender-food-scene.png (rendu 3D), chef-jariya-source.jpg (doublon), textures/, brand/, icônes et svg.

**Reste à faire propriétaire :** fournir environ 13 photos récentes réelles pour atteindre 20. Ne bloque pas le 1er novembre.

## Horaires (contrôle)

Site (/api/hours, lecture seule) : dimanche, lundi, mercredi, jeudi, vendredi… 12:00–22:00 ; mardi fermé. À comparer avec GBP ; modification seulement sur demande séparée.

## Lien d'avis Google

Copier le lien court « Demander des avis » (g.page/r/…/review) depuis le tableau de bord GBP, à noter ici ; repli pour `googleReviewUrl()` à utiliser dans le plan 04-07 uniquement si le lien `placeid` échoue sur téléphone.

Lien court relevé : _à compléter pendant la session_

## Session log

| heure | champ | avant | après | accord propriétaire | résultat |
|-------|-------|-------|-------|---------------------|----------|
| 2026-10-17 | session Chrome | — | — | « approve do what you can on chrome » | Bloqué : le compte Google connecté dans Chrome affiche 0 établissement dans Business Profile Manager. Aucune modification faite. |
