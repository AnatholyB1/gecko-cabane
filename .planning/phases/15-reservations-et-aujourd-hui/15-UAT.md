# Phase 15 : script d'UAT (RSV-06), à exécuter par le propriétaire

**Rien n'a été envoyé ni exécuté par le builder.** Ce script prouve ce que le proxy navigateur ne peut pas prouver : les vrais emails, le vrai cron J+1, les couverts des KPI, sur une vraie base.

## Conditions
- Preview Vercel de la branche, **hors service : entre 22h et 12h, heure de Krabi** (jamais pendant 12h-22h). Base : de préférence une copie, ou des lignes de test supprimées à la fin.
- Migration `supabase/migrations/019_reservation_allergies.sql` **appliquée avant** de déployer (sinon le champ « Allergies » du formulaire échoue ; le reste fonctionne sans).
- Adresse de test `A` que vous contrôlez, et une réservation de test **sans** adresse email.
- Compte admin connecté. Relevez l'heure de Krabi au début.

## A. Contenu des emails inchangé (RSV-06a)
1. `+ Réservation` (en-tête) : source WhatsApp, nom « TEST UAT 1 », téléphone `+66 81 000 0001`, demain 19:30, 2 couverts, **sans email**. Attendu : toast « Réservation ajoutée », ligne visible dans Réservations (demain), **aucun email** (la route manuelle n'en envoie pas, comme avant).
2. Créer une réservation **depuis le site public** (formulaire inchangé) avec l'adresse `A`, demain 20:00, 2 couverts. Attendu : comportement d'avant la phase.
3. Dans Réservations (demain) : **Confirmer** cette réservation (un tap). Attendu : 1 email de **confirmation** à `A`, identique en forme à celui d'avant la phase (objet, texte, langue de la réservation).
4. **Annuler** une autre réservation de test avec email `A` : le dialogue annonce « Un email d'annulation sera envoyé à A ». Confirmer. Attendu : 1 email d'**annulation** à `A`. Refaire sur « TEST UAT 1 » (sans email) : le dialogue dit « Aucun email ne sera envoyé » ; aucun email.
5. **Terminer** et **Absent** n'envoient rien.

## B. Cron d'avis J+1 (RSV-06b)
Le cron `/api/cron/review-invitations` tourne chaque jour à 04:00 UTC (11:00 Krabi) ; l'envoi peut avoir lieu entre 11h et 12h.
1. Créer deux réservations de test **hier** (date d'hier à Krabi) avec l'adresse `A` : (a) la terminer (`Terminer`) ; (b) la marquer `Absent` (dialogue, bouton « Marquer non présenté »).
2. Après 11h Krabi du lendemain du service (ou lancer le cron à la main depuis le tableau de bord Vercel, **hors 12h-22h**) : (a) reçoit l'invitation à laisser un avis ; (b) n'en reçoit **pas**. Dans Détails de (a) : badge « Invitation envoyée le … ».
3. Une réservation « Confirmée » du jour : Détails affiche l'avertissement « À marquer avant 11h (Krabi) le lendemain du service ».

## C. Couverts et KPI (RSV-06c)
1. Sur Aujourd'hui, noter : jauges Déjeuner / Dîner (pic simultané), « N couverts sur la journée », créneaux par heure.
2. Recompter à la main : total = somme des couverts des réservations non annulées / non présentées ; pic = plus grand total de couverts dont le début tombe dans la même fenêtre de 2 h.
3. Comparer à la disponibilité publique : si le créneau 19h affiche « 33 couverts sur 40 », essayer sur la preview de réserver 8 couverts à 19h30 depuis le site : refusé (33 + 8 > 40) ; 7 couverts : accepté.
4. Après le lundi suivant (ou en lançant `/api/cron/weekly-kpi` hors service) : les couverts de la semaine de test dans les KPI sont ceux attendus (aucune requête KPI modifiée par cette phase).

## D. Ergonomie sur le téléphone de la cheffe
3 lignes ou plus par écran dans Réservations ; toast en haut ; `tel:` lance l'appel ; WhatsApp s'ouvre dans un nouvel onglet ; « + Réservation » ouvre la feuille depuis chaque page ; Échap ou « Fermer » rend le focus au bouton.

## Nettoyage
Supprimer les lignes TEST UAT (Détails > Supprimer, avec dialogue). Consigner les résultats (date/heure Krabi, OK/KO, capture) dans `15-VERIFICATION.md`, section « UAT propriétaire ».
