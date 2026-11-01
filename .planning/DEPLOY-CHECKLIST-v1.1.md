# Checklist de déploiement - v1.1 Refonte de l'admin

Actions humaines ou soumises à accord, notées au fil du milestone. Rien n'est appliqué sans accord.

| # | Action | Quand | Qui | État |
|---|---|---|---|---|
| 1 | Valider par écrit les verdicts d'audit, la navigation cible et le brief de design (AUDIT-01/02) | avant P11 | propriétaire | ouvert |
| 2 | Recueillir l'usage réel auprès de la cheffe et des serveurs via `09-USAGE-QUESTIONNAIRE.md` (AUDIT-04) | pendant P9-P12 | propriétaire | ouvert |
| 3 | Valider les maquettes D1-D4 (galerie) | avant P11 | propriétaire | ouvert |
| 4 | UAT sur preview de P15 (emails de confirmation et d'annulation, cron d'avis J+1, couverts KPI) ; fusion et test HORS service 12h-22h (heure de Krabi) | fin P15 | propriétaire + orchestrateur | ouvert |
| 5 | ACC-01 : migration 020 (revoke seulement sur `gecko_table*`) | P17 | propriétaire | FAIT le 2026-11-01 : accord du propriétaire, vérification (aucune fonction/vue ne référence ces tables ; les 3 lectures des dernières 24 h viennent du code v1.0 de master), appliquée sur le projet `portfolio`, état final vérifié ; rollback en commentaire du fichier |
| 6 | ACC-02 : choisir le processus d'invitation d'un nouvel admin avant de supprimer `/admin/signup` | P17 | propriétaire | ouvert |
| 7 | ACC-03 : décider le modèle de données de « Complet ce soir » | P17 | propriétaire | ouvert |
| 8 | Aucun envoi KPI live avant le 2026-11-16 et sans accord (`KPI_REPORT_MODE`) | hors v1.1 | propriétaire | verrouillé |
| 9 | Déploiement en production : uniquement sur demande explicite | fin | propriétaire | ouvert |
| 10 | Migration 019 (colonne `allergies`, fichier `supabase/migrations/019_reservation_allergies.sql`) : appliquer AVANT de déployer le code de P15 ; rollback en commentaire du fichier | avant déploiement | propriétaire | ouvert |
| 11 | Supabase > Auth > Providers > Email : vérifier que « Allow new users to sign up » est désactivé (la route `/api/auth/signup` est supprimée, mais l'API publique de Supabase reste appelable avec la clé anon) | avant déploiement | propriétaire | ouvert |
| 12 | Dette de l'API (non corrigée, hors périmètre) : `POST /api/menu/items` prix 0 -> null ; `PUT /api/announcement` sans validation ; `PUT /api/hours` sans transaction ; `DELETE /api/special-hours` renvoie 500 si l'identifiant n'est pas numérique ; `PUT /api/reservations` n'accepte pas `allergies` ; `GET /api/auth/logout` par GET | après v1.1 | propriétaire | noté |
| 13 | Le mode TEST/live de l'écran KPI lit `KPI_REPORT_MODE` côté serveur : vérifier sa valeur réelle en production | avant déploiement | propriétaire | ouvert |
