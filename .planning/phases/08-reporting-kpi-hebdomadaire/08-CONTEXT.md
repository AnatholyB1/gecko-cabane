# Phase 8: Reporting KPI hebdomadaire - Context

**Gathered:** 2026-10-30 | **Status:** Ready for planning

<domain>
Le propriétaire reçoit chaque lundi un rapport fiable (lecture + actions recommandées) et dispose d'un tableau de bord d'historique. Requirements: KPI-02..KPI-08 (KPI-01 déjà fait en phase 5).
</domain>

<decisions>
- D-01 Orchestration: job Vercel Cron dans l'appli (route `/api/cron/...`, Bearer CRON_SECRET comme les crons existants), PAS n8n. KPI-02 est réinterprété: "workflow n8n" devient "job cron dans l'appli". Collecte lundi 7h Krabi (00:00 UTC), envoi 8h Krabi (01:00 UTC).
- D-02 Sources v1: (a) en base: réservations, no-show, clics /review par source, newsletter (Resend, plus Brevo); (b) Search Console via compte de service Google (code + marche à suivre, accès créé par le propriétaire); (c) rang TripAdvisor via Bright Data (coût par appel, plafonné).
- D-03 Hors v1: Google Business Profile / avis Google automatiques. Champ de saisie manuelle hebdomadaire dans l'admin à la place (ne bloque pas le rapport). Une source indisponible est affichée "non disponible", jamais inventée.
- D-04 WhatsApp: PAS en v1. KPI-05 est livré en email seul; résumé WhatsApp reporté.
- D-05 Dashboard: page `/admin/kpi`, admins seulement (requireAdmin), français fixe, historique semaine par semaine. Pas de lien public.
- D-06 Table `weekly_kpis` (préfixe `gecko_` à respecter: `gecko_weekly_kpis`), migration numérotée 018, écrite en fichier, appliquée seulement après accord.
- D-07 Rédaction (KPI-04) par l'API Claude, 3 phrases de lecture + 3 actions en français; modèle réglé par variable d'env; repli sur texte sans IA si l'appel échoue.
- D-08 Alertes immédiates (KPI-07): avis <= 3 étoiles (saisie manuelle ou source) et retour privé "Un souci ?" de /review => email immédiat au propriétaire.
- D-09 KPI-08: 2 semaines de test en mode brouillon (rapport envoyé au propriétaire seulement, marqué TEST) avant déclaration "fiable"; ne peut pas être clos avant mi-novembre 2026.
</decisions>

<canonical_refs>
- .planning/ROADMAP.md (Phase 8), .planning/REQUIREMENTS.md (KPI-*)
- .planning/workstreams/conversion/phases/05-conversion-et-mesure/ (review stats, Plausible)
- src/app/api/cron/review-invitations/route.ts, vercel.json (modèle de cron)
- src/utils/review-stats.ts, supabase/migrations/016_review_stats.sql, 017_newsletter.sql
- "Specs site Gecko Cabane – SEO et conversion.md" (seuils d'alerte)
</canonical_refs>

<specifics>
Dépendance externe: ANTHROPIC_API_KEY, compte de service Search Console, clé Bright Data: à fournir par le propriétaire, jamais en chat.
</specifics>

<deferred>
WhatsApp automatique (Cloud API Meta); avis Google via Business Profile API; comparaison N-1 (2e saison); n8n.
</deferred>
