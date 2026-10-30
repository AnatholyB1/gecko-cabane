---
phase: 08-reporting-kpi-hebdomadaire
plan: 08
subsystem: reporting
tags: [kpi, resend, cron, idempotence]
requires: [08-01, 08-05]
provides:
  - src/utils/kpi-mode.ts (resolveReportMode, reportRecipients, reportSubject)
  - src/utils/kpi-report-email.ts (weeklyReportEmail)
  - etape d'envoi idempotente dans /api/cron/weekly-kpi
key-files:
  created: [src/utils/kpi-mode.ts, src/utils/kpi-report-email.ts, tests/kpi-mode.test.ts, tests/kpi-report-email.test.ts]
  modified: [src/app/api/cron/weekly-kpi/route.ts, tests/kpi-cron-route.test.ts]
requirements: [KPI-05, KPI-08]
---

# Phase 8 Plan 08: Envoi du rapport KPI Summary

Rapport KPI hebdomadaire envoye par Resend le lundi a partir de 8h Krabi, mode TEST fail-safe, claim `report_sent_at` + `idempotencyKey` pour un envoi unique, release en cas d'echec.

## Realise
- Mode : `live` uniquement pour la valeur exacte (trim) ; sinon test, destinataire unique, sujet `[TEST]`, bandeau TEST.
- Gabarit HTML + texte : lecture, actions, alertes, tableau Semaine / S-1 / Evolution, clics /review (approximation), GSC partiel, sources indisponibles, note manuelle, lien /admin/kpi ; tout contenu dynamique echappe ; valeurs absentes « non disponible ».
- Route : collecte (sautee si deja collectee dans la fenetre d'envoi), claim, envoi, release + Sentry (`extra: { week_start }` seulement). `?send=1` = rattrapage explicite ; `?dry=1` l'emporte. Pas de config email => 500 « Email non configuré » sans claim.

## Deviations
- Commit GREEN de la tache 1 inclut les tests mode/gabarit ecrits juste apres kpi-mode.ts (RED strict non commite separement pour la tache 1). La tache 2 a bien un commit RED (169b2a0) puis GREEN.
- Interruption par limite d'usage en cours de tache 2 ; reprise sans perte.

## Non prouve
- Aucun envoi reel Resend, aucune ecriture en base reelle (faux client, Resend mocke). Rendu visuel du mail dans de vrais clients mail non verifie.

## Self-Check: PASSED
