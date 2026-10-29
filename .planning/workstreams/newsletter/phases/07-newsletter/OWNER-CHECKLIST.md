# Phase 7 — Checklist propriétaire (actions humaines)

Rien de ce qui suit n'a été exécuté. Tout envoi à un tiers, toute écriture en production et tout déploiement exigent votre accord (voir 07-LAUNCH.md, « Approval request »).

Échéance : haute saison au 1er novembre 2026. Les étapes 1 à 6 bloquent la mise en ligne.

## A. Contenu (bloque 07-02, donc les PDF liés dans l'email de bienvenue)

- [ ] 1. Répondre à `docs/newsletter/CONTENT-REQUEST.md` : 8 à 12 adresses de Krabi Town (nom, catégorie, adresse, raison en une phrase, photo optionnelle), la recette du curry de crabe (ingrédients, étapes, conseils), et si Gecko Cabane figure dans le guide.
- [ ] 2. Valider les formats d'impression : insert d'addition 100 x 60 mm, carte WiFi A6 portrait.
- Tant que ce n'est pas fait, `/guide-gourmand-krabi-town-{fr,en}.pdf` et `/recette-curry-crabe-{fr,en}.pdf` n'existent pas : le bouton du guide dans l'email de bienvenue mènerait à une 404. Ne pas déployer l'inscription sans ces PDF.

## B. Comptes et secrets (vous seul·e)

- [ ] 3. Brevo : créer ou confirmer le compte, noter le plan (300 emails/jour en gratuit), créer une clé API.
- [ ] 4. Saisir dans `.env.local` (jamais dans un chat) : `BREVO_API_KEY`, `WIFI_SSID`, `WIFI_PASSWORD`.
- [ ] 5. Resend : la clé `RESEND_API_KEY` doit déjà être présente en production (confirmation, bienvenue, J+1). À vérifier.
- [ ] 6. Domaine d'envoi : authentifier l'expéditeur dans Brevo (DKIM/SPF/DMARC). DNS sur Vercel : Claude ajoute les enregistrements après votre accord ; sinon vous les ajoutez chez votre registrar. Doit coexister avec les enregistrements Resend.

## C. Approbations explicites avant exécution (13 points de 07-LAUNCH.md)

- [ ] 7. Répondre point par point (approve-all / approve-with-changes / hold).
- Migration 015 à appliquer en production (`supabase/migrations/015_newsletter.sql`, additive). Appliquée par psql + `supabase migration repair --status applied 015`, jamais `db push`.
- Création dans Brevo : 6 attributs, liste, webhook marketing (unsubscribed + spam, bearer).
- Variables Vercel Production : `NEWSLETTER_SIGNING_SECRET`, `BREVO_WEBHOOK_TOKEN`, `BREVO_LIST_ID`, `BREVO_API_KEY`, `WIFI_SSID`, `WIFI_PASSWORD` (+ `BREVO_LIST_AFTER_VISIT`, `BREVO_LIST_DURING_STAY` si option B). `CRON_SECRET` doit exister (déjà utilisé par le cron d'avis).
- Fusion de ws/newsletter dans master, push, déploiement.

## D. Brevo UI (aucune API pour les workflows)

- [ ] 8. Créer les automatisations J+2 et J+3 (branches FR et EN sur LANGUAGE ; DE/SV suivent la branche EN, aucun contenu DE/SV actif), la campagne de retour d'octobre, le flux saison verte, envoi à 18:00 Asia/Bangkok, plafond d'une campagne par mois et par contact. Voir `docs/newsletter/BREVO-SETUP.md`.
- [ ] 9. Envoyer un test de chaque séquence à votre boîte.

## E. Vérifications sur appareils réels (07-11)

- [ ] 10. Téléphone : bottom sheet une seule fois, WhatsApp utilisable, jamais réaffiché ; bureau : pop-up à l'intention de sortie, Échap ferme.
- [ ] 11. Scan de l'insert d'addition et de la carte WiFi (après impression d'une épreuve).
- [ ] 12. Aller-retour réel avec une boîte de test : confirmation, accueil avec lien du guide, attributs Brevo, désinscription par le lien Resend puis par Brevo (valide l'hypothèse A1 du webhook).

## F. Envois à des tiers (accord requis, un par un)

- [ ] 13. D-03 : une demande de confirmation à chaque ancien consentement de réservation. N à mesurer en lecture seule avant votre accord. Appel manuel : `/api/cron/newsletter-legacy-confirm?send=1&limit=50` avec le secret cron, par lots, seulement après l'aller-retour réussi.
- [ ] 14. Tout envoi de campagne Brevo : validation du contenu par vous.

## G. Relectures humaines

- [ ] 15. Textes DE/SV : non produits dans cette phase (D-09, D-17). À relire par un humain avant toute activation.
- [ ] 16. Mot de passe WiFi : lisible par quiconque ouvre `/wifi`. Prévoir une rotation périodique (modifier `WIFI_PASSWORD` dans Vercel, sans réimpression).
- [ ] 17. Page de confidentialité : texte mis à jour en 07-07 (relu et approuvé le 2026-10-18) ; vérifier qu'il correspond aux sources et à la durée de conservation réellement en place au lancement.
