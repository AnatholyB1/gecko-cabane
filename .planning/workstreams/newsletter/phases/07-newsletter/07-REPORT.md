# Phase 7 — Rapport de clôture (2026-10-29)

## Plans

| Plan | État | Détail |
|------|------|--------|
| 07-01, 03, 04, 05, 06, 07, 08, 09 | livrés (SUMMARY présents) | code, migration 015 (non appliquée), tests |
| 07-02 | partiel | Tâche 1 faite (CONTENT-REQUEST.md, JSON vides, `scripts/generate-newsletter-print.mjs`, commit ac06ec6). Pourquoi pas de SUMMARY : la tâche 2 est un point d'arrêt `human-action` (reco de Krabi et recette inventables : interdit, D-17). Tâche 3 (PDF, SVG, test d'impression) dépend d'elle. |
| 07-10 | partiel | Tâche 1 faite hors lecture de la prod (07-LAUNCH.md). Tâches 2-3 (approbation, migration, Brevo, Vercel, déploiement) exigent le propriétaire. |
| 07-11 | non démarré | dépend de 07-10 ; activation Brevo, appareils réels, envoi D-03. |

## Gate (branche ws/newsletter)

- `npm test` : 52 fichiers, 587 tests verts.
- `npx tsc --noEmit` : 0 erreur.
- `npm run lint` : 0 erreur, 8 avertissements préexistants (admin).
- `npm run build` (variables Supabase factices) : OK.

Le générateur d'impression a été prouvé avec un contenu factice temporaire (4 PDF + 2 PDF d'impression + 2 SVG produits, en-tête `%PDF`), puis tout a été supprimé. Sans contenu, il sort en code 1. Mise en page non vérifiée visuellement (aucun rendu ouvert), en particulier le dépassement de page du guide et la lisibilité de l'insert 100 x 60 mm.

## Revue code et sécurité (lecture manuelle ciblée, pas de revue multi-agents)

Lu : liens signés, subscribe, confirm, unsubscribe, webhook Brevo, événements, cron legacy, client Brevo, page /wifi, migration 015, usages d'env.

Conforme :
- Double opt-in : subscribe n'écrit qu'une ligne en attente et envoie l'email ; Brevo n'est appelé qu'après `confirmed_at` (POST du bouton, jamais le GET).
- Consentement horodaté avec source et version de texte ; retrait = nouvelle ligne `consent=false` (registre append-only).
- Désinscription : lien signé HMAC sans expiration, POST seulement (anti-scanner), un clic RFC 8058, webhook Brevo à jeton comparé en temps constant, 401 sans jeton.
- Secrets : `BREVO_*`, `NEWSLETTER_SIGNING_SECRET`, `WIFI_*` lus uniquement côté serveur ; aucun `NEXT_PUBLIC_` ; service-role confiné aux routes serveur avec justification.
- Pas d'énumération (réponse uniforme), honeypot, délai de remplissage, limites de débit, échappement des jokers LIKE.
- Migration 015 additive, RLS sans policy sur la table de compteurs, RPC réservé à service_role.
- Cron legacy : fermé sans secret, dry-run par défaut, 50 max par appel.

Restant, non corrigé (aucun correctif de code nécessaire) :
1. Le mot de passe WiFi est lisible par quiconque connaît l'URL `/wifi` (par conception, D-13). Rotation recommandée.
2. `/api/newsletter/event` est anonyme et non limité : les compteurs de pop-up peuvent être gonflés. Impact : statistiques seulement. Accepté.
3. Deux POST /subscribe simultanés pour un même email pourraient créer deux lignes en attente (course théorique, effet : deux emails). Non reproduit.
4. Dérive de documentation : 07-11 dit d'appeler la route legacy « sans dry=1 » ; l'implémentation exige `send=1` (plus sûr). Noté dans 07-LAUNCH.md et OWNER-CHECKLIST.md.
5. REQUIREMENTS.md marquait NEWS-03 à 06 comme faits alors que PDF, supports et séquences n'existent pas : corrigé en `[~]`.

Non prouvé : tout ce qui touche la production, Brevo, Resend, Vercel et les appareils réels (rien n'a été exécuté, par règle). Les tests utilisent des mocks.

## Blocages humains

Voir `OWNER-CHECKLIST.md` : contenu du guide et de la recette, compte et clé Brevo, WiFi, DNS, 13 approbations, automatisations Brevo, vérifications d'appareils, accord pour l'envoi D-03.

Risque calendrier : sans le contenu du propriétaire, les PDF liés dans l'email de bienvenue n'existent pas ; ne pas déployer l'inscription avant.
