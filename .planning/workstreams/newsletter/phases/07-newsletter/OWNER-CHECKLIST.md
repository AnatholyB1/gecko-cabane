# Phase 7 — Checklist propriétaire (actions humaines)

Mise à jour du 2026-10-29 : Resend remplace Brevo (plus de clé, de compte ni de DNS Brevo). Rien de ce qui suit n'a été exécuté. Tout envoi à un tiers, toute écriture en production, toute création chez Resend et tout déploiement exigent votre accord (13 points de `07-LAUNCH.md`).

Échéance : haute saison au 1er novembre 2026.

## A. Relectures de contenu (le contenu vient du web, rien n'est vérifié sur place)

- [ ] 1. Relire `docs/newsletter/guide-content.json` (9 lieux) et `docs/newsletter/SOURCES.md`. Chaque fait extérieur y a sa source ; les horaires, prix et points de départ sont marqués « à vérifier sur place ». Aucun nom de restaurant ni lien Maps n'a été retenu faute de source fiable : ajoutez vos propres adresses si vous le souhaitez, puis `node scripts/generate-newsletter-print.mjs`.
- [ ] 2. Recette : `docs/newsletter/recipe-content.json` est une recette de base rédigée par Claude d'après la technique classique du curry de crabe thaïlandais, **non testée** et **non attribuée à la cheffe Jariya**. Faites-la tester ou remplacer par la cheffe avant de la distribuer. Tant que ce n'est pas fait, ne pas rétablir la mention « de la cheffe Jariya ».
- [ ] 3. Valider les formats d'impression (insert d'addition 100 x 60 mm, carte WiFi A6) et imprimer une épreuve à scanner (iPhone et Android).
- [ ] 4. Photos : les emails utilisent des recadrages des photos du site (bougie, jarret au curry, plat mijoté) hébergés dans `public/email/`. Confirmer que ces images conviennent ; ajouter des photos du guide dans `docs/newsletter/photos/` si vous en avez.

## B. Resend (compte déjà existant)

- [ ] 5. Confirmer dans Resend, Domains, que geckocabanerestaurant.com est Verified (DKIM, SPF) : c'est le domaine d'envoi déjà utilisé pour les réservations, aucun DNS à ajouter.
- [ ] 6. Vérifier le plan Resend et ses limites d'envoi (quotas quotidien et mensuel) avant d'activer les séquences ; la tâche du jour envoie au plus environ 80 requêtes.
- [ ] 7. Créer le webhook dans Resend : URL `https://geckocabanerestaurant.com/api/webhooks/resend`, événements `email.complained`, `email.bounced`, `contact.updated`. Copier le secret `whsec_...` dans Vercel sous `RESEND_WEBHOOK_SECRET` (jamais dans un chat ni dans le dépôt).
- [ ] 8. Accord pour exécuter `node scripts/setup-resend-newsletter.mjs` (crée 6 propriétés de contact dans votre compte Resend, clé lue dans `.env.local`, jamais affichée).

## C. WiFi : à saisir sur place

- [ ] 9. Relever sur place le nom du réseau et le mot de passe, puis les saisir dans `.env.local` et dans Vercel Production : `WIFI_SSID`, `WIFI_PASSWORD`. Aucune valeur n'est dans le dépôt ; tant qu'elles sont vides, la page `/wifi` affiche « Mot de passe indisponible » et propose de le demander à l'équipe. Quiconque connaît l'URL `/wifi` peut lire le mot de passe : rotation périodique (modifier `WIFI_PASSWORD` dans Vercel, sans réimpression).

## D. Approbations avant exécution (07-LAUNCH.md)

- [ ] 10. Migration `supabase/migrations/017_newsletter.sql` en production (additive : colonnes, compteurs, journal d'envois, RPC). Les migrations 015 et 016 de master sont déjà appliquées ; la nôtre a été renumérotée 017 pour éviter la collision. Méthode : psql puis `supabase migration repair --status applied 017`.
- [ ] 11. Variables Vercel Production : `NEWSLETTER_SIGNING_SECRET` (généré), `RESEND_WEBHOOK_SECRET`, `WIFI_SSID`, `WIFI_PASSWORD`, `CRON_SECRET` (doit exister), et plus tard `NEWSLETTER_SEQUENCES_ENABLED=1` puis `NEWSLETTER_CAMPAIGNS_ENABLED=1` (désactivés par défaut).
- [ ] 12. Fusion de ws/newsletter dans master, push, déploiement. Le cron `/api/cron/newsletter-sync` passe à 11:00 UTC (18:00 Krabi).
- [ ] 13. D-03 : une demande de confirmation à chaque ancien consentement de réservation. N à mesurer en lecture seule avant votre accord. Appel manuel avec le secret cron : `/api/cron/newsletter-legacy-confirm?send=1&limit=50`, par lots, après l'aller-retour réussi.

## E. Vérifications réelles (07-11)

- [ ] 14. Aller-retour avec une boîte de test : inscription, confirmation, email de bienvenue avec le guide, désinscription par le lien signé, puis plainte/désinscription Resend pour valider le webhook.
- [ ] 15. Téléphone : bottom sheet une seule fois, WhatsApp utilisable ; bureau : pop-up à l'intention de sortie ; scan de l'insert et de la carte WiFi.
- [ ] 16. Activer `NEWSLETTER_SEQUENCES_ENABLED=1` seulement après contrôle à blanc : `/api/cron/newsletter-sync?dry=1` (secret cron) renvoie les comptes prévus sans rien envoyer. Idem pour les campagnes (`NEWSLETTER_CAMPAIGNS_ENABLED=1`) : le retour d'octobre part en octobre aux touristes avec une visite.

## F. Relectures humaines

- [ ] 17. Textes DE/SV : non produits (D-09). Les contacts de et sv reçoivent la version anglaise des emails ; l'interface du site retombe sur l'anglais pour la newsletter.
- [ ] 18. Politique de confidentialité : la phrase sur les sous-traitants nomme désormais Resend seul (emails transactionnels et newsletter), Brevo n'y figure plus. À valider.
