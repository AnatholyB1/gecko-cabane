# Checklist de déploiement - v1.1 Refonte de l'admin

Actions humaines ou soumises à accord, notées au fil du milestone. Rien n'est appliqué sans accord.

| # | Action | Quand | Qui | État |
|---|---|---|---|---|
| 1 | Valider par écrit les verdicts d'audit, la navigation cible et le brief de design (AUDIT-01/02) | avant P11 | propriétaire | ouvert |
| 2 | Recueillir l'usage réel auprès de la cheffe et des serveurs via `09-USAGE-QUESTIONNAIRE.md` (AUDIT-04) | pendant P9-P12 | propriétaire | ouvert |
| 3 | Valider les maquettes D1-D4 (galerie) | avant P11 | propriétaire | ouvert |
| 4 | UAT sur preview de P15 (emails de confirmation et d'annulation, cron d'avis J+1, couverts KPI) ; fusion et test HORS service 12h-22h (heure de Krabi) | fin P15 | propriétaire + orchestrateur | ouvert |
| 5 | ACC-01 : accord pour la migration « revoke seulement » sur `gecko_table*` après vérification qu'aucune autre application du projet Supabase partagé ne les lit ; la migration est écrite comme fichier, appliquée seulement après accord | P17 | propriétaire | ouvert |
| 6 | ACC-02 : choisir le processus d'invitation d'un nouvel admin avant de supprimer `/admin/signup` | P17 | propriétaire | ouvert |
| 7 | ACC-03 : décider le modèle de données de « Complet ce soir » | P17 | propriétaire | ouvert |
| 8 | Aucun envoi KPI live avant le 2026-11-16 et sans accord (`KPI_REPORT_MODE`) | hors v1.1 | propriétaire | verrouillé |
| 9 | Déploiement en production : uniquement sur demande explicite | fin | propriétaire | ouvert |
