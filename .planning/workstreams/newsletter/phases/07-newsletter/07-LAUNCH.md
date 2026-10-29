# 07-LAUNCH — Lancement de la newsletter (plan 07-10, tâche 1)

Statut : demande d'approbation rédigée. Rien n'a été appliqué en production, créé dans Brevo, défini dans Vercel, fusionné dans master, déployé ni envoyé.

## Vérifications locales (branche ws/newsletter, 2026-10-29)

| Contrôle | Résultat |
|----------|----------|
| `npm test` | 52 fichiers, 587 tests, tous verts |
| `npx tsc --noEmit` | 0 erreur |
| `npm run lint` | 0 erreur, 8 avertissements (préexistants, pages admin, hors newsletter) |
| `npm run build` (variables Supabase factices) | compilé, routes newsletter, wifi, webhook et crons présentes |
| `015_newsletter.sql` | additif et idempotent : aucun drop, delete, truncate ni update |
| ws/newsletter vs master | 44 commits d'avance, 0 de retard au moment du contrôle (à re-vérifier avant fusion) |

## Non vérifié (volontairement, aucune lecture de la base ou des services réels)

- Version max de migration appliquée en production (attendu : 014).
- Taille réelle de l'audience D-03 (requête `count(distinct lower(email))` sur `gecko_marketing_consents` avec `source = 'reservation_form' and consent`). **N est donc inconnu** : à mesurer en lecture seule au moment de 07-10, ou à fixer par le propriétaire.
- Noms des variables Vercel déjà présentes, DNS du domaine (Vercel ou autre) pour l'authentification d'expéditeur Brevo.

## Approval request

1. Appliquer la migration 015 en production (colonnes additives, table de compteurs, RPC ; aucune donnée modifiée). Méthode : psql `-v ON_ERROR_STOP=1 -1` puis `supabase migration repair --status applied 015` (voir 01-DB-ROLLOUT.md). Jamais `supabase db push`, jamais `supabase/legacy/`.
2. Compte Brevo : plan (gratuit = 300 emails/jour ; automatisations disponibles ?), type d'éditeur (option A ou B de BREVO-SETUP.md), clé API saisie par le propriétaire dans `.env.local` sous `BREVO_API_KEY`.
3. Expéditeur Brevo et authentification de domaine (DKIM/SPF/DMARC) coexistant avec Resend ; enregistrements DNS ajoutés par Claude si le domaine est sur Vercel, sinon par le propriétaire.
4. Création dans Brevo par API : 6 attributs (LANGUAGE, COUNTRY, RESIDENT, SOURCE, CONSENT_AT, LAST_VISIT_DATE), la liste, le webhook marketing (événements `unsubscribed` et `spam`, jeton bearer), et les deux listes de repli si option B.
5. Variables Vercel Production : `NEWSLETTER_SIGNING_SECRET` et `BREVO_WEBHOOK_TOKEN` (générés), `BREVO_LIST_ID` (issu de l'étape 4), `BREVO_API_KEY`, `WIFI_SSID`, `WIFI_PASSWORD` (saisis par le propriétaire), et `BREVO_LIST_AFTER_VISIT` / `BREVO_LIST_DURING_STAY` si option B. Aucune valeur n'est affichée.
6. Fusion de ws/newsletter dans master et déploiement (formulaire de pied de page, pop-up, /newsletter, /wifi, confirmation, désinscription, webhook, cron quotidien de synchronisation à 11:30 Krabi).
7. Épreuves d'impression (insert d'addition, carte WiFi) validées pour tirage. **Dépend de 07-02 : les supports n'existent pas encore.**
8. Exposition du mot de passe WiFi : toute personne ayant l'URL `/wifi` le lit. Recommandation : rotation périodique (mettre à jour `WIFI_PASSWORD` dans Vercel, sans réimpression).
9. Raffinement D-06 (RESEARCH Pitfall 5) : garder « J+2/J+3 depuis la date de confirmation » pour bill_qr et wifi (actuel) ou passer à la date d'inscription.
10. Politique webhook (RESEARCH A9) : toute désinscription ou plainte spam Brevo retire le consentement globalement.
11. D-03, envoi unique : au plus N adresses recevront une demande de confirmation après l'aller-retour de 07-11 (N à mesurer, voir plus haut) — approuver, reporter ou refuser. Appel manuel : `/api/cron/newsletter-legacy-confirm?send=1&limit=50` (sans `send=1`, la route est en dry-run ; le plan 07-11 dit « sans dry=1 », l'implémentation exige `send=1`).
12. Boîte mail de test pour l'aller-retour réel.
13. Rétrécissement D-14 : le pays géolocalisé Vercel n'est pas utilisé pour bill_qr et wifi (tout appareil au restaurant géolocalise en TH) ; ces contacts reçoivent le pays du téléphone ou « inconnu » (modifiable dans Brevo) — approuver ou demander d'utiliser la géolocalisation quand même.

## Owner approval

(vide : en attente de la réponse du propriétaire, item par item)
