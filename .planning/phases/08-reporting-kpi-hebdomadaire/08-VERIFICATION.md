---
phase: 08-reporting-kpi-hebdomadaire
verified: 2026-10-30
status: gaps_found
score: 6/7 exigences code VERIFIED ; KPI-08 volontairement ouverte
branch: audit/p8-verify (base milestone/v1.0-phase8, 65adc81)
---

# Phase 8 : vérification objectif-arrière

Tests : `npx vitest run tests/kpi-*.test.ts` = 17 fichiers, 249 tests verts. Lecture seule, aucun appel externe.

## Exigence -> preuve -> statut

| Exigence | Preuve (code ouvert) | Statut |
|---|---|---|
| KPI-02 collecte + écriture | `vercel.json` : 2 entrées `/api/cron/weekly-kpi` (`0 0 * * 1` = 07h Krabi, `0 1 * * 1` = 08h Krabi). Route : Bearer CRON_SECRET fail-closed, `collectDbKpis` (réservations, no-show, `gecko_review_clicks`, `gecko_newsletter_events`, consentements) + `collectExternalKpis` (GSC, TripAdvisor/Bright Data, `skipPaid` en dry), upsert `gecko_weekly_kpis` par `week_start`, colonnes manuelles jamais écrasées. Types TS = colonnes migration 018 (39/39, diff vide). Saisie manuelle Google : `PUT /api/kpi` + `/admin/kpi` | VERIFIED (code) |
| KPI-03 S-1 + seuils | `compareWeeks`/`detectAlerts` (`kpi-alerts.ts`) appelés dans `buildReading`, S-1 lue via `addDays(week,-7)`. N-1 : non applicable avant la 2e saison | VERIFIED |
| KPI-04 lecture Claude | `generateNarrative` (clé + modèle par env, aucun modèle en dur), budget 50 s, repli déterministe, jamais d'IA en dry run | VERIFIED |
| KPI-05 email lundi 8h | `shouldSendNow` = lundi Krabi >= 08h donc seul le passage 01:00 UTC envoie ; 00:00 UTC collecte seulement. Claim `report_sent_at` avant envoi + idempotencyKey + libération si échec. Pas de WhatsApp (D-04 : seul `whatsapp` = valeur de source de réservation dans `kpi-collect.ts`) | VERIFIED |
| KPI-06 dashboard | `src/app/admin/kpi/page.tsx` + `GET /api/kpi` (requireAdmin, RLS cookie client, 1..52 semaines). Lien depuis `src/app/admin/page.tsx` (l.97 carte, l.166). Sources `unavailable` affichées « Sources non disponibles » (page et email), pas de valeur inventée | VERIFIED |
| KPI-07 alerte immédiate | Note <= seuil : `PUT /api/kpi` -> `shouldAlertLowRating` (nouvelle/modifiée) -> email via `after()`, idempotencyKey. Retour privé `/review` : `src/app/api/review/feedback/route.ts` envoie un email immédiat au propriétaire | VERIFIED |
| KPI-08 2 semaines de TEST | Mode par défaut = `test` (`resolveReportMode` : tout sauf exactement `live`), destinataire unique, sujet `[TEST]`. Aucune semaine TEST encore envoyée (018 non appliquée). Doit rester ouverte avant 2026-11-16 (plan 08-13 sans SUMMARY, REQUIREMENTS.md « Pending ») | MISSING, attendu (correctement ouvert) |

## Points de câblage demandés

- Deux déclenchements lundi 00:00/01:00 UTC dans vercel.json : OK, route unique référencée.
- Variables d'env : les 11 utilisées par le code (CRON_SECRET, GSC_SERVICE_ACCOUNT_JSON, GSC_SITE_URL, BRIGHTDATA_API_KEY, BRIGHTDATA_ZONE, TRIPADVISOR_URL, ANTHROPIC_API_KEY, ANTHROPIC_MODEL, KPI_REPORT_MODE, KPI_REPORT_RECIPIENTS + existantes) sont toutes dans `docs/kpi/KPI-SETUP.md`.
- Migration 018 : colonnes lues/écrites par cron et API correspondent ; grants colonne par colonne cohérents avec select puis update/insert (pas d'upsert côté admin).
- « n8n » sous `src/` : aucune occurrence.
- Migration 018 : fichier seulement, NON appliquée (plan 08-12 [BLOCKING], accord propriétaire requis). Tant que ce n'est pas fait, le cron et le dashboard échouent (500 / erreur) en production.

## Gaps

| SEV | Fichier | Problème | Correctif |
|---|---|---|---|
| HIGH (bloquant mise en prod) | supabase/migrations/018_weekly_kpis.sql | Non appliquée ; 08-12 sans SUMMARY. Le cron du lundi 2 nov. échouera sans table | Après accord du propriétaire : psql + `supabase migration repair`, puis `?dry=1` |
| MED | .planning/REQUIREMENTS.md, ROADMAP.md | KPI-02..07 et plans 08-01..11 encore « Pending »/non cochés ; ligne « phase 8 non démarrée » périmée | Mettre à jour la traçabilité après application de 018 |
| MED | env Vercel | Ni ANTHROPIC_*, ni GSC/Bright Data confirmés ; sans eux le rapport part avec texte de repli et « sources non disponibles » (comportement honnête, mais rapport peu utile) | Poser les variables selon KPI-SETUP.md |
| LOW | api/cron/weekly-kpi/route.ts | Saisie manuelle de la semaine généralement absente à 08h le lundi : l'email du lundi n'inclut pas les avis Google | Documenter (déjà implicite) ou saisie avant le lundi |
| INFO | KPI-08 | Clôture impossible avant 2026-11-16 et 2 rapports TEST validés par le propriétaire | Ne pas cocher ; basculer `KPI_REPORT_MODE=live` seulement ensuite |

Conclusion : le code répond à KPI-02..07 de bout en bout ; la phase n'est pas déclarable terminée tant que 018 n'est pas appliquée et que KPI-08 n'est pas close.
