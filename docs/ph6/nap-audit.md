Statut : brouillon
Validé par le propriétaire : 2026-10-17 (méthode et relevé en lecture seule ; corrections soumises à accord, voir ci-dessous)
Envoyé/publié par le propriétaire : ____ (date)

# Audit NAP (nom, adresse, téléphone) — OPS-05

Objectif : le même nom, la même adresse et le même numéro partout. Les valeurs de référence viennent du code du site (`buildRestaurantJsonLd` dans `src/utils/seo.ts`).

## Bloc de référence

| Champ | Valeur |
|-------|--------|
| Nom affiché | Gecko Cabane Restaurant (variante acceptée : Gecko Cabane) |
| Adresse | 1/36-37 Soi Ruamjit, Maharat Road, Krabi Town 81000, Thailand |
| Téléphone (affichage) | +66 81 958 5945 |
| Téléphone (technique, tel: et JSON-LD) | +66819585945 |
| Site web | https://geckocabanerestaurant.com |
| Horaires | à relever dans l'admin (table des horaires), ne pas recopier de mémoire |

## Méthode

1. **Relevé en lecture seule** : vous êtes connecté, une capture d'écran par plateforme, on remplit le tableau sans rien modifier.
2. **Liste des écarts** : on les passe en revue ensemble.
3. **Correction** : seulement avec votre accord avant chaque clic (D-17).

## Règles de comparaison

- Comparer les chiffres du téléphone sans espaces ni tirets.
- Signaler : lien `tripadvisor.be`, adresse du site en `http://`, anciens domaines, forme `www` ou sans `www` du site.
- Une variante de nom acceptée (Gecko Cabane) n'est pas un écart, une faute d'orthographe oui.

## Tableau de contrôle

| Surface | URL | Nom relevé | Adresse relevée | Téléphone relevé | Lien site | Horaires | Conforme ? | Action | Accord propriétaire | Fait (date) |
|---------|-----|------------|-----------------|------------------|-----------|----------|------------|--------|---------------------|-------------|
| Site (accueil, contact, pied de page, /privacy, JSON-LD) | https://geckocabanerestaurant.com | Gecko Cabane (site) / Gecko Cabane Restaurant (JSON-LD) | 1/36-37 Soi Ruamjit Maharat Road Krabi Town 81000 | +66 81 958 5945 | lui-même | API /api/hours : 12:00-22:00 tous les jours, mardi fermé (mercredi 12:00-22:00) | | | | |
| Google Business Profile | https://www.google.com/maps/place/?q=place_id:ChIJozpAo2GUUTARABLcICH3H7I | Gecko Cabane Restaurant | 1, 36-37 Soi Ruam Jit Krabi, Tambon Pak Nam, Amphoe Mueang Krabi, Krabi 81000, Thailand (sans « Maharat Road », « Ruam Jit » en deux mots) | +66 81 958 5945 | geckocabanerestaurant.com | Ouvre 12:00 ; mercredi 17:00-22:00 d'après Wanderlog (données Google) | | | | |
| TripAdvisor | https://www.tripadvisor.com/Restaurant_Review-g297927-d2413872-Reviews-Gecko_Cabane_Restaurant_krabi-Krabi_Town_Krabi_Province.html | Gecko Cabane Restaurant @krabi (suffixe « @krabi ») | 1/36-37 Soi Ruamjit, Maharat Road, Krabi Town 81000 Thailand | +66 81 958 5945 | bouton « Website » présent, cible non lue en lecture seule | 12:00-22:00, mardi fermé (mercredi 12:00-22:00) | | | | |
| Facebook | https://www.facebook.com/GeckoCabaneRestaurant/ | Gecko Cabane Restaurant Paklow Jariya | 1/36 37 ruamjit soi maharaj road, Krabi, Thailand, Krabi (sans code postal, « maharaj ») | +66 81 958 5945 | geckocabanerestaurant.com | Publication du 1 oct. : jeu-lun 12:00-22:00, mercredi 17:00-22:00 (cuisine jusqu'à 21:30) | | | | |
| Trip.com | https://www.trip.com/restaurant/thailand/krabi-town/detail/gecko-cabane-restaurant-17217000/ | Gecko Cabane Restaurant | 1, 36-37 Soi Ruam Jit Krabi, Tambon Pak Nam, Amphoe Mueang Krabi, Krabi 81000, Thailand | +66819585945 | aucun lien site affiché | « Temporarily closed / Business suspended » | | | | |
| Wanderlog | https://wanderlog.com/place/details/2352102/gecko-cabane-restaurant | Gecko Cabane Restaurant | 1, 36-37 Soi Ruam Jit Krabi, Tambon Pak Nam, Amphoe Mueang Krabi, Krabi 81000, Thailand | +66 81 958 5945 | https://geckocabanerestaurant.com/ | mer. 17:00-22:00, mardi fermé, autres jours 12:00-22:00 | | | | |
| Instagram (bonus, bio) | non relevé | non relevé | non relevé | non relevé | non relevé | non relevé | | | | |

## Écarts constatés (2026-10-17, relevé en lecture seule, aucune modification faite)

Aucune correction n'a été faite : chaque ligne attend l'accord du propriétaire avant le clic (D-17).

| # | Surface | Écart | Correction proposée | Accord propriétaire | Fait |
|---|---------|-------|---------------------|---------------------|------|
| 1 | Horaires du mercredi | Site et TripAdvisor : 12:00-22:00. Google (via Wanderlog) et Facebook : 17:00-22:00. | Le propriétaire dit quel horaire est réel ; aligner site (admin), Google, TripAdvisor et Facebook. | en attente | en attente |
| 2 | Trip.com | Fiche marquée « Temporarily closed, opening hours to be confirmed / Business suspended ». | Demander la réouverture de la fiche (Trip.com Merchant) ; ajouter le site web. | en attente | en attente |
| 3 | Google Business Profile | Adresse sans « Maharat Road » et « Ruam Jit » en deux mots ; catégorie principale « Thai restaurant » (OPS-01 prévoyait « French restaurant »). | Aligner l'adresse sur le bloc de référence ; catégories de la phase 4 (D-20). | en attente | en attente |
| 4 | TripAdvisor | Nom « Gecko Cabane Restaurant @krabi » (suffixe). Cible du lien « Website » non vérifiée. Sur l'accueil, la carte TripAdvisor affiche cinq étoiles statiques sans donnée. | Retirer le suffixe si TripAdvisor l'accepte ; fixer le lien sur https://geckocabanerestaurant.com ; étoiles : voir README. | en attente | en attente |
| 5 | Facebook | Nom « … Paklow Jariya » (variante), adresse sans code postal avec « maharaj ». | Adresse au format du bloc de référence ; nom : variante à confirmer. | en attente | en attente |
| 6 | Trip.com, Google | Adresse au format Google (« 1, 36-37 Soi Ruam Jit Krabi, Tambon Pak Nam… »), différent du site. | Jugé acceptable (format normalisé Google) sauf avis contraire. | en attente | en attente |
| 7 | Instagram | Non relevé. | À relever avec le propriétaire connecté. | en attente | en attente |

Constat sans écart : téléphone identique (+66 81 958 5945) sur le site, Google, TripAdvisor, Facebook, Trip.com et Wanderlog ; site web de Google, Facebook et Wanderlog = geckocabanerestaurant.com.
