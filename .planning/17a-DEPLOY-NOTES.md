# 17a (ACC-03 « Complet ce soir ») : notes de déploiement

## Migration
Aucune. Le modèle réutilise `gecko_special_hours` et `gecko_restaurant_settings` (clé `service_closure_prev:YYYY-MM-DD`).
Prérequis déjà en place (migration 007) : politique RLS « Admin manage » sur ces deux tables pour `gecko_is_admin()` (l'écriture se fait avec la session de l'administrateur, pas la clé service-role). Non vérifié sur la vraie base : à constater pendant l'UAT (si la fermeture répond « Internal server error », vérifier les droits INSERT/UPDATE/DELETE du rôle `authenticated` après la migration 010).

## Variables d'environnement
Aucune nouvelle.

## UAT sur preview (HORS service 12h à 22h heure de Krabi)
Compte administrateur réel. Date de test : demain (jamais une date avec de vraies réservations à protéger, mais les réservations existantes ne sont de toute façon pas modifiées).
1. Admin > Aujourd'hui : bouton « Complet ce soir » sous la légende de capacité.
2. Tap : dialogue « Fermer les réservations ce soir ? » ; « Non, garder ouvert » ferme sans effet ; « Oui, complet ce soir » : toast, bandeau « Service complet » + « Service complet — rouvrir ».
3. Site public (préview) : choisir la date du jour dans le formulaire : plus aucun créneau du dîner, message d'indisponibilité ; le déjeuner reste proposé.
4. Réservation directe : tenter un POST sur `/api/reservations` avec un créneau 19:00 de la date : 422 `slot_unavailable`.
5. Admin > Site public > Exceptions : la ligne « Dîner complet » (fin 16:00) apparaît pour la date.
6. « Rouvrir » : la ligne disparaît (ou l'ancienne exception réapparaît à l'identique) ; le formulaire propose de nouveau le dîner.
7. Re-tester avec une exception préexistante sur la date (créée à la main) : après fermer puis rouvrir, elle est identique.
8. Aucun email envoyé pendant ce test (aucune réservation créée par la fermeture).

## À savoir
- La fermeture s'applique à la date d'aujourd'hui à Krabi (écran « Aujourd'hui »). L'API accepte n'importe quelle date de aujourd'hui à +180 jours (prête pour un futur écran par date).
- Les réservations existantes ne sont jamais touchées ; l'équipe peut toujours saisir une réservation à la main (route manuelle, sans contrôle d'horaire).
- Le public voit « Dîner complet 12:00 — 16:00 » dans les horaires exceptionnels de la date.
- Textes publics : aucune nouvelle clé i18n (message existant `reservationForm.slotUnavailable`), donc rien à faire relire en DE/SV.
