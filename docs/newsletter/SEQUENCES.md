# Séquences newsletter Gecko Cabane

Cartographie des séquences. Les brouillons sont dans `docs/newsletter/sequences/`. La configuration Resend est décrite dans `RESEND-SETUP.md` (Resend remplace Brevo, décision du propriétaire 2026-10-29).

| Séquence | Outil | Déclencheur | Délai | Audience | Langues | Heure d'envoi | Compte dans le plafond 1/mois | Statut propriétaire |
|----------|-------|-------------|-------|----------|---------|---------------|-------------------------------|---------------------|
| Bienvenue | Resend (code, 07-04) | confirmation du double opt-in | immédiat | tous les inscrits confirmés (guide, recette si source bill_qr) | FR/EN | immédiat | non | accepted Resend 2026-10-18 |
| Après-visite | Cron app (Resend) | LAST_VISIT_DATE + 2 jours | J+2 | inscrits avec une date de visite | FR/EN actifs | 18:00 Asia/Bangkok | non (séquence) | approuvé 2026-10-18 |
| Pendant le séjour | Cron app (Resend) | LAST_VISIT_DATE + 3 jours | J+3 | RESIDENT = false, date de visite renseignée | FR/EN actifs | 18:00 Asia/Bangkok | non (séquence) | approuvé 2026-10-18 |
| Retour en octobre | Cron app (Resend), campagne | chaque septembre ou octobre | annuel | RESIDENT = false et LAST_VISIT_DATE renseignée | FR/EN actifs | 18:00 Asia/Bangkok | oui | approuvé 2026-10-18 |
| Saison verte | Cron app (Resend), saisonnier | mai à octobre | selon le calendrier | RESIDENT = true, ou LAST_VISIT_DATE renseignée | FR/EN actifs | 18:00 Asia/Bangkok | oui | approuvé 2026-10-18 |

DE et SV : après relecture humaine (phase 6), inactifs. Aucun brouillon DE/SV dans cette phase (D-09).

## Pourquoi J+2 et J+3

L'invitation d'avis (phase 4) part à J+1, à 11:00 heure de Krabi (cron Resend 04:00 UTC). L'email après-visite est donc à J+2 et l'email pendant le séjour à J+3, à 18:00 heure de Krabi, pour qu'un contact ne reçoive jamais deux emails le même jour (D-07).

## Pourquoi la bienvenue part du code

Le guide doit arriver juste après le double opt-in (D-17). L'envoi par Resend depuis notre code garantit un envoi unique. C'est un écart par rapport à la lettre de D-05, qui place les séquences dans Brevo. Les quatre autres séquences restent dans les automatisations Brevo. L'acceptation du propriétaire est requise (voir tableau, ligne Bienvenue).

## Plafond mensuel

Au plus 1 email par mois hors séquences (D-08). Appliqué dans le code : au plus 1 campagne par 30 jours et par contact (journal gecko_newsletter_sends).

## Règles

- Aucun envoi réel (NEWSLETTER_SEQUENCES_ENABLED, NEWSLETTER_CAMPAIGNS_ENABLED) avant l'approbation écrite du propriétaire pour chaque brouillon (D-09).
- Les textes ne contiennent que des faits vérifiés. Tout le reste est marqué comme à confirmer par le propriétaire et doit être résolu avant approbation.
