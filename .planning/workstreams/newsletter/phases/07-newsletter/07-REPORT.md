# Phase 7 — Rapport (révisé le 2026-10-29)

## Ce qui a changé aujourd'hui (décisions du propriétaire)

1. **Merge de master** : conflits résolus (next.config.ts headers + rewrites, middleware matcher gcm + pdf, rate-limit hashKey + deux limiteurs, SiteFooter, layout avec FloatingContact/PlausibleScript/AttributionCapture + NewsletterPopup, page.tsx, review/page.tsx, messages fr/en, migrations.test). Migration newsletter **renumérotée 017** (015 et 016 de master déjà en production), non appliquée.
2. **Resend remplace Brevo** : `src/utils/resend-contacts.ts` (miroir de contacts), webhook `/api/webhooks/resend` (signature Svix sur le corps brut ; complaint, rebond permanent, désinscription du tableau de bord), séquences envoyées par `/api/cron/newsletter-sync` (11:00 UTC), plafond 1 campagne/30 jours codé, journal `gecko_newsletter_sends`, envois désactivés par défaut. `docs/newsletter/RESEND-SETUP.md` remplace le runbook Brevo. Plans 07-10 et 07-11 révisés (dont la route legacy : `send=1`).
3. **Guide et recette** depuis le web : 9 lieux, sources dans `docs/newsletter/SOURCES.md`, éléments incertains marqués « à vérifier sur place », rien d'inventé (aucun nom de restaurant ni lien Maps). La recette est une recette de base rédigée par nos soins, non testée, **non attribuée à la cheffe** (titres du site, des emails et de l'insert changés).
4. **Bandes image** dans tous les emails (bienvenue, confirmation, D-03, 4 séquences) : `public/email/*` (3 photos recadrées du site + 1 séparateur), URLs absolues, alt, texte de secours.
5. **WiFi** : aucune valeur ; message dans la checklist.

## Gate (branche ws/newsletter, après merge)

- `npm test` : 77 fichiers, 986 tests verts (1 ignoré hérité).
- `npx tsc --noEmit` : 0 erreur. `npm run lint` : 0 erreur, 6 avertissements hérités.
- `npm run build` (variables Supabase factices) : OK, routes `/api/webhooks/resend` et `/api/cron/newsletter-sync` présentes.

## Vérifications visuelles réelles

- PDF rendus dans Chromium (pdf.js) : guide FR/EN (3 pages), recette FR/EN (2 pages), insert 100 x 60 mm, carte WiFi A6. Mise en page correcte après deux corrections (page orpheline du guide, noms et adresses non traduits en EN).
- Emails rendus en 390 px (Playwright) : bienvenue, confirmation, après-visite J+2, retour d'octobre. Pas de débordement horizontal. Avec images bloquées, l'en-tête texte « Gecko Cabane » reste visible ; l'alt text a été restylé après ce test (non re-rendu).

## Non prouvé

- Aucun appel réel à Resend : création de contact, propriétés (si elles n'existent pas, la création de contact échoue sans casser l'inscription), webhook Resend réel, envoi des séquences. Le test du webhook prouve la vérification de signature avec une signature Svix calculée localement, pas avec Resend.
- Les noms d'API Resend (contacts.create/update, contactProperties, webhooks.verify) sont ceux du SDK installé (6.28.1) et de la documentation lue le 2026-10-29 ; le comportement exact en cas de contact existant (create en erreur puis update) n'est pas vérifié.
- Les rendus emails n'ont pas été testés dans Gmail, Outlook ou Apple Mail ; images servies depuis localhost pendant le test (pas encore déployées).
- Cohabitation visuelle du pop-up de newsletter avec le nouveau FloatingContact (WhatsApp/LINE) après le merge : non vérifiée dans un navigateur.
- Faits du guide : sources de blogs et sites de voyage, aucune vérification sur place ; quantités de la recette non testées en cuisine.
- Production, DB réelle, DNS, Vercel : rien exécuté (règle). N de l'envoi D-03 inconnu.

## Revue sécurité du nouveau code

- Webhook : 401 sans secret, sans en-têtes Svix, avec signature invalide ou corps modifié (testé) ; écriture seulement pour un abonné actif ; pas de rappel sortant.
- Cron : fermé sans CRON_SECRET, dry-run, envois derrière deux drapeaux, revendication par insertion unique avant envoi, libération en cas d'échec, plafond campagnes testé.
- Aucun secret côté client (test no-public-secrets étendu à Resend).
- Restants : un POST /subscribe simultané pour un même email peut théoriquement créer deux lignes ; `/api/newsletter/event` reste anonyme et non limité (statistiques seulement) ; limite Resend (quota du plan) à vérifier avant activation.

## Blocages humains

Voir `OWNER-CHECKLIST.md`.
