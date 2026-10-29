# 07-LAUNCH — Lancement de la newsletter (plan 07-10, tâche 1)

Statut : demande d'approbation rédigée. Rien n'a été appliqué en production, créé chez Resend, défini dans Vercel, fusionné dans master, déployé ni envoyé.

## Vérifications locales (branche ws/newsletter, 2026-10-29)

| Contrôle | Résultat |
|----------|----------|
| `npm test` | 52 fichiers, 587 tests, tous verts |
| `npx tsc --noEmit` | 0 erreur |
| `npm run lint` | 0 erreur, 8 avertissements (préexistants, pages admin, hors newsletter) |
| `npm run build` (variables Supabase factices) | compilé, routes newsletter, wifi, webhook et crons présentes |
| `017_newsletter.sql` (ex-015) | additif et idempotent : aucun drop, delete, truncate ni update |
| ws/newsletter vs master | 44 commits d'avance, 0 de retard au moment du contrôle (à re-vérifier avant fusion) |

## Non vérifié (volontairement, aucune lecture de la base ou des services réels)

- Version max de migration appliquée en production (attendu : 014).
- Taille réelle de l'audience D-03 (requête `count(distinct lower(email))` sur `gecko_marketing_consents` avec `source = 'reservation_form' and consent`). **N est donc inconnu** : à mesurer en lecture seule au moment de 07-10, ou à fixer par le propriétaire.
- Noms des variables Vercel déjà présentes, DNS du domaine (Vercel ou autre) (domaine d envoi Resend à confirmer).

## Approval request

Révisé le 2026-10-29 : Resend remplace Brevo.

1. Appliquer la migration 017 (`supabase/migrations/017_newsletter.sql`, ex-015 renumérotée) en production : colonnes additives, compteurs, journal d'envois, RPC ; aucune donnée modifiée. psql `-v ON_ERROR_STOP=1 -1` puis `supabase migration repair --status applied 017`. Jamais `db push`, jamais `supabase/legacy/`.
2. Resend : confirmer le domaine d'envoi vérifié, le plan et ses quotas.
3. Webhook Resend créé par le propriétaire (`/api/webhooks/resend`, événements email.complained, email.bounced, contact.updated) ; secret `whsec_...` saisi dans Vercel (`RESEND_WEBHOOK_SECRET`).
4. Exécuter `scripts/setup-resend-newsletter.mjs` : crée 6 propriétés de contact chez Resend.
5. Variables Vercel Production : `NEWSLETTER_SIGNING_SECRET` (généré), `RESEND_WEBHOOK_SECRET`, `WIFI_SSID` et `WIFI_PASSWORD` (à saisir sur place), `CRON_SECRET` (doit exister). Aucune valeur affichée.
6. Fusion de ws/newsletter dans master et déploiement (footer, pop-up, /newsletter, /wifi, confirmation, désinscription, webhook Resend, cron 11:00 UTC).
7. Épreuves d'impression (insert d'addition, carte WiFi) validées.
8. Exposition du mot de passe WiFi sur `/wifi` : rotation périodique recommandée.
9. D-06 : garder « J+2/J+3 depuis la date de confirmation » pour bill_qr et wifi, ou passer à la date d'inscription.
10. Politique webhook : toute plainte spam, rebond permanent ou désinscription Resend retire le consentement globalement.
11. D-03, envoi unique : au plus N adresses (N à mesurer en lecture seule) recevront une demande de confirmation, par `/api/cron/newsletter-legacy-confirm?send=1&limit=50`.
12. Boîte mail de test pour l'aller-retour réel.
13. D-14 : le pays géolocalisé n'est pas utilisé pour bill_qr et wifi ; approuver ou demander l'inverse.
14. Activation des envois : `NEWSLETTER_SEQUENCES_ENABLED=1` (J+2, J+3) puis `NEWSLETTER_CAMPAIGNS_ENABLED=1` (retour d'octobre, saison verte), chacun après un contrôle à blanc `?dry=1`.
15. Contenu web : guide (9 lieux) et recette de base non attribuée à la cheffe, à relire (SOURCES.md).

## Owner approval

(vide : en attente de la réponse du propriétaire, item par item)
