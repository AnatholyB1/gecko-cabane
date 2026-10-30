# Rapport KPI hebdomadaire : marche à suivre du propriétaire

Runbook pour le propriétaire (Phase 8, KPI-02 à KPI-08). Il ne contient aucune valeur de clé : seuls les noms des variables sont écrits ici.

Variables de la phase (noms seulement) : `CRON_SECRET` (existante), `RESEND_API_KEY` (existante), `RESTAURANT_NOTIFICATION_EMAIL` (existante), `GSC_SERVICE_ACCOUNT_JSON`, `GSC_SITE_URL`, `BRIGHTDATA_API_KEY`, `BRIGHTDATA_ZONE`, `TRIPADVISOR_URL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `KPI_REPORT_MODE`, `KPI_REPORT_RECIPIENTS`.

## 1. Règle sur les secrets

Aucun secret ne doit être collé dans un chat, un ticket, un document ou le dépôt. Saisir les valeurs uniquement dans Vercel (Settings, Environment Variables, Production) ou dans `.env.local` (ignoré par git). Les variables ne sont lues qu'au déploiement : redéployer après toute modification.

## 2. Migration 018 (table `gecko_weekly_kpis`)

La migration `supabase/migrations/018_*.sql` est écrite en fichier mais n'est appliquée qu'après accord explicite du propriétaire. Procédure : l'exécuter via `psql` sur la base du projet, puis enregistrer l'état avec `supabase migration repair --status applied 018`. Ne jamais utiliser `db push` (la base est partagée avec un autre projet). Ne jamais appliquer le contenu de `supabase/legacy/`.

## 3. Search Console (clics, impressions, position)

1. Dans Google Cloud, créer un projet (ou en réutiliser un).
2. Activer « Google Search Console API ».
3. Créer un compte de service, sans aucun rôle IAM.
4. Générer une clé JSON pour ce compte (téléchargement local, ne pas la partager).
5. Dans Search Console, Paramètres, Utilisateurs et autorisations : ajouter l'adresse email du compte de service comme utilisateur « Restreint » de la propriété.
6. Coller le JSON entier dans la variable `GSC_SERVICE_ACCOUNT_JSON` (Vercel).
7. Renseigner `GSC_SITE_URL` : `sc-domain:geckocabanerestaurant.com` pour une propriété de domaine, ou l'URL préfixe exacte de la propriété.

Sans ces variables, la ligne Search Console du rapport affiche « non disponible », sans bloquer le rapport.

## 4. Rang TripAdvisor via Bright Data

1. Dans Bright Data, créer une zone de type Web Unlocker.
2. Renseigner `BRIGHTDATA_ZONE` (nom de la zone) et `BRIGHTDATA_API_KEY`.
3. Renseigner `TRIPADVISOR_URL` : l'URL https de la fiche du restaurant.

Coût attendu : environ 4 à 5 requêtes par mois, un seul appel par semaine, plafonné (tarif à confirmer, hypothèse A3).

Risque à contrôler (hypothèse A4) : le format du rang (« #N of M » ou équivalent français) n'est pas encore validé. Si le parseur ne reconnaît pas la page, le rang est « non disponible » mais la tentative hebdomadaire est consommée. Avant la première exécution réelle, faire un contrôle sur un échantillon réel de page, hors production (page enregistrée en local, aucun appel au cron), et n'activer la collecte qu'une fois le parseur validé sur cet échantillon.

## 5. Synthèse Claude

Renseigner `ANTHROPIC_API_KEY` et `ANTHROPIC_MODEL` (aucun modèle codé en dur). Si l'une des deux manque ou si l'appel échoue, le rapport utilise un texte de repli sans IA : il part quand même.

## 6. Mode TEST puis live

- `KPI_REPORT_MODE` absent ou invalide : mode `test`. Le rapport part à un seul destinataire, `RESTAURANT_NOTIFICATION_EMAIL`, avec le sujet préfixé « [TEST] ».
- `live` : uniquement après deux rapports TEST validés par le propriétaire, au plus tôt mi-novembre 2026 (KPI-08, D-09). Les destinataires sont alors lus dans `KPI_REPORT_RECIPIENTS` (emails séparés par des virgules).

## 7. Horaires

Collecte le lundi 00:00 UTC (7h à Krabi), envoi le lundi 01:00 UTC (8h à Krabi). Sur un plan Vercel Hobby, l'exécution peut glisser jusqu'à environ 59 minutes (hypothèse A1) : l'envoi peut arriver vers 9h. Vérifier le plan Vercel.

Rattrapage : deux entrées supplémentaires (lundi 02:00 et 04:00 UTC) relancent la route après un échec d'envoi. Elles sont sans risque de doublon (la semaine n'est réclamée qu'une fois, la lecture déjà générée est réutilisée telle quelle). `?week=AAAA-MM-JJ&send=1` reste le rattrapage manuel au-delà.

Search Console : la latence de ses données est d'environ deux jours. Les clics et impressions collectés le lundi sont donc partiels (le dimanche est incomplet) et indiqués comme tels (`gsc_partial`). Ne pas les comparer à la lettre à ceux de la semaine précédente.

Rapport live : la note manuelle libre n'est jamais incluse (donnée potentiellement personnelle) ; elle reste visible dans l'admin et dans le rapport TEST du propriétaire.

## 8. Contrôle à blanc

Appeler `/api/cron/weekly-kpi?dry=1` avec l'en-tête `Authorization: Bearer` suivi du secret `CRON_SECRET`. Le mode à blanc n'écrit rien et n'envoie rien. Le faire avant et après chaque changement de variable.

## 9. Seuils d'alerte validés

Validé par le propriétaire le 2026-10-30 (décision « Garder les défauts » : les valeurs proposées sont conservées sans changement). La spec chiffrée d'origine reste introuvable ; ces valeurs font foi. Elles sont définies à un seul endroit : `ALERT_THRESHOLDS` dans `src/utils/kpi-alerts.ts`.

| Indicateur | Seuil d'alerte | Constante |
|------------|----------------|-----------|
| Réservations | baisse de 30 % ou plus vs S-1 (base d'au moins 5) | `reservationsDropPct`, `reservationsMinBase` |
| No-show | plus de 15 % (au moins 2 cas) | `noShowRateMax`, `noShowMinCount` |
| Clics Search Console | baisse de 30 % vs S-1 | `gscClicksDropPct` |
| Position moyenne | dégradée de plus de 3 places | `gscPositionWorsen` |
| Rang TripAdvisor | dégradé de 3 places ou plus | `tripadvisorRankWorsen` |
| Newsletter | désinscriptions supérieures aux confirmations | (aucune valeur numérique) |
| Avis | 3 étoiles ou moins (alerte immédiate, fixé par la décision D-08) | `lowRatingMax` |
| Source indisponible | 2 semaines de suite | `sourceUnavailableWeeks` |

## 10. Questions ouvertes pour le propriétaire

1. Seuils d'alerte : validés le 2026-10-30 (section 9), plus de question ouverte.
2. Quel est le plan Vercel (Hobby ou Pro) ?
3. Qui reçoit le rapport en mode live (liste `KPI_REPORT_RECIPIENTS`) ?
4. Saisie manuelle hebdomadaire (avis Google, Google Business Profile hors v1) : confirmer les champs à saisir dans l'admin (nombre d'avis, note, avis récents) et qui les saisit chaque semaine. Les champs retenus par le code sont des propositions tant que le propriétaire ne les a pas confirmés.
5. Accord pour appliquer la migration 018 et date prévue.
