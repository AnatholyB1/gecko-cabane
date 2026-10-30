# Checklist de mise en production v1.0 (fusion des actions propriétaire)

Date : 2026-10-30. Échéance haute saison : **1er novembre 2026**.
Sources : `OWNER-CHECKLIST.md` des phases 5 (conversion), 6 (seo-pages) et 7 (newsletter), plan `04-03` (fiche Google), `04-VERIFICATION.md`.
Règles : rien de ce document n'a été exécuté. Tout ce qui est publié, envoyé à un tiers, écrit en production ou déployé exige l'accord explicite du propriétaire. Aucune valeur de secret ne figure ici : seuls les noms de variables sont cités, à saisir directement dans Vercel ou `.env.local`, jamais dans un chat ni dans le dépôt.

Légende : **P1** = exigence à livrer avant le 1er novembre. Colonne « Exigence » = identifiant dans `.planning/REQUIREMENTS.md`.

## 0. À vérifier d'abord (contradictions entre documents)

Les documents se contredisent sur l'état de la production. Contrôler en lecture seule avant d'agir.

- [ ] Migrations **015** (source des réservations) et **016** (compteurs d'avis) : la checklist de la phase 5 et `05-13-SUMMARY.md` disent « non appliquées » ; le commit c7a0719 (phase 7) dit « déjà appliquées en production ». Vérifier `schema_migrations` en lecture seule. Phase 5, RESA-06, REV-06.
- [ ] Migration **017** (newsletter) : `07-LAUNCH.md` dit « non appliquée » et la réponse du propriétaire y est vide, alors que des redéploiements « RESEND_WEBHOOK_SECRET » (201a14b) et « NEWSLETTER_CAMPAIGNS_ENABLED » (c12faf4) ont eu lieu. Vérifier l'état réel de 017 et des drapeaux d'envoi avant tout cron. Phase 7, NEWS-01 à NEWS-07.
- [ ] Horaires : le site est maintenant ouvert tous les jours 12h-22h (commit c8fa7d2) ; le plan 04-03 et le relevé NAP (06-10) citent encore une fermeture le mardi ou un mercredi à 17h. Aligner Google, Facebook, TripAdvisor, Trip.com sur 12h-22h tous les jours. Phase 6, OPS-05 ; phase 4, OPS-01.

## 1. Actions du propriétaire (décisions, contenus, relectures, tests)

### Phase 4
- [ ] Obtenir l'accès au compte Google Business Profile, puis choisir le mode d'exécution du dossier `04-GBP-DOSSIER.md` (Chrome guidé avec un « go » par clic, saisie manuelle, ou sections partielles) et la langue du lien de réservation (fr ou en). Phase 4 (plan 04-03), OPS-01 [P1].
- [ ] Fournir environ 13 photos récentes réelles pour atteindre 20 sur la fiche Google (non bloquant pour le 1er novembre). Phase 4, OPS-01.
- [ ] Observer le premier envoi réel du cron d'avis (J+1, 11h Krabi) et le badge « Invitation envoyée » dans `/admin/reservations`. Phase 4, REV-03.
- [ ] Scanner le QR (`/review?src=qr`) avec un iPhone et un Android, sur l'écran et sur l'insert imprimé. Phase 4, REV-04.

### Phase 5
- [ ] SEO-08 : décider des leviers de performance (réduire les polices Cinzel Decorative et poids inutilisés, alléger l'hydratation, Sentry client) ; valider le retrait du Replay et du Profiling Sentry côté client ; remesurer PageSpeed mobile sur la production (score >= 85, LCP < 2,5 s). Phase 5, SEO-08.
- [ ] CONV-02 : fournir la photo du couple avec l'accord de publication (fichier dans `public/`, puis `COUPLE_PHOTO` dans `src/utils/about-content.ts`), l'année d'ouverture et l'histoire du lieu ; valider les trajets (20 min, 50 baht, 3 min, 15 min). Phase 5, CONV-02, CONV-03.
- [ ] Tester le formulaire « Un souci ? » en réel et confirmer la réception de l'email. Phase 5, REV-07.
- [ ] Tester une réservation manuelle admin (WhatsApp, téléphone, sans réservation) avec une source. Phase 5, RESA-06.
- [ ] Faire relire par un germanophone le modèle WhatsApp DE de `/admin/avis`. Phase 5, REV-05.
- [ ] Relire la politique de confidentialité mise à jour (Plausible sans cookies, « Un souci ? » non enregistré, sous-traitants Resend). Phases 5 et 7, KPI-01, REV-07, NEWS-01.
- [ ] Remplacer l'URL d'intégration de la carte par celle de Google Maps > Partager > Intégrer une carte (optionnel). Phase 5, CONV-03.

### Phase 6
- [ ] Faire relire les textes DE par un germanophone natif (validation actuelle = votre « approved ») ; idem SV par un suédophone natif (validé par vous le 2026-10-29, aucun relecteur natif identifié) ; inclut emails, page d'avis, QR, et les lignes DE/SV modifiées par le commit c8fa7d2. Phase 6, I18N-01, I18N-02.
- [ ] Compléter les posts Google : semaine 3 (offre basse saison) et date de la soirée. Phase 6, OPS-02.
- [ ] Décider du sort des cinq étoiles statiques de la carte TripAdvisor de l'accueil (par défaut : phase 5). Phase 6, OPS-04.
- [ ] Déclencher vous-même les envois préparés : `docs/ph6/outreach-targets.md` et `outreach-messages.md` (blogs, guides), `docs/ph6/concierge-dossier.md` et `.pdf` (hôtels), `docs/ph6/review-replies.md` (modèles de réponse, DE à faire relire). Rien n'est parti. Phase 6, OPS-03, OPS-06, OPS-07.

### Phase 7
- [ ] Relire `docs/newsletter/guide-content.json` (9 lieux) et `docs/newsletter/SOURCES.md` ; ajouter vos adresses si souhaité puis `node scripts/generate-newsletter-print.mjs`. Phase 7, NEWS-05.
- [ ] Faire tester ou remplacer la recette de curry de crabe (recette de base, non testée, non attribuée à la cheffe Jariya). Phase 7, NEWS-04.
- [ ] Valider les formats d'impression (insert d'addition 100 x 60 mm, carte WiFi A6) et imprimer une épreuve à scanner. Phase 7, NEWS-03, NEWS-04.
- [ ] Confirmer les photos utilisées dans les emails (`public/email/`). Phase 7, NEWS-06.
- [ ] Relever sur place le nom du réseau WiFi et le mot de passe (rotation périodique recommandée, la page `/wifi` est lisible par quiconque connaît l'URL). Phase 7, NEWS-03.
- [ ] Vérifications réelles (07-11) : aller-retour avec une boîte de test (inscription, confirmation, bienvenue avec guide, désinscription, plainte), téléphone (bottom sheet une seule fois, cohabitation avec le bouton WhatsApp/LINE), bureau (pop-up à l'intention de sortie), scan de l'insert et de la carte WiFi. Phase 7, NEWS-01, NEWS-02, NEWS-03, NEWS-04, NEWS-05.
- [ ] Contrôle à blanc des envois : `/api/cron/newsletter-sync?dry=1` (avec le secret du cron) avant et après chaque activation. Phase 7, NEWS-06.
- [ ] Textes DE/SV de la newsletter : non produits ; les contacts de et sv reçoivent l'anglais. Décider de produire ces versions ou de l'accepter. Phase 7, NEWS-07.

## 2. Approbations (accord explicite avant exécution)

### Phase 4
- [ ] Application de chaque changement sur la fiche Google (un « go » par champ : catégories, lien de réservation, lien carte, site web, description, attributs, photos). Ne jamais changer nom, adresse, téléphone, horaires ni accepter de nouvelles conditions Google sans demande séparée. Phase 4, OPS-01 [P1].

### Phase 5
- [ ] Consentement de publication des 3 avis TripAdvisor repris mot pour mot (David C, Jean-Louis305, Swen S) et confirmation de l'année Travellers' Choice et des chiffres 4,7 / 1 062. Phase 5, CONV-01.
- [ ] Décision aggregateRating (D-14) : Google affiche rarement des étoiles pour des avis tiers repris par l'établissement ; interrupteur `SHOW_AGGREGATE_RATING` dans `src/utils/social-proof.ts` ; surveiller Search Console > Extraits d'avis. Phase 5, CONV-01, SEO-03.
- [ ] Application des migrations 015 puis 016 en production si la section 0 montre qu'elles ne le sont pas (psql, puis `supabase migration repair`, jamais `db push`, jamais `supabase/legacy/`). Phase 5, RESA-06, REV-06.

### Phase 6 (plan 06-10, task 3 : « un OK explicite avant chaque clic »)
- [ ] Google Business Profile : mercredi 12:00-22:00 (affiché 17:00), adresse alignée (« Maharat Road », « Ruamjit »), catégorie principale « French restaurant ». Phase 6, OPS-05.
- [ ] Facebook : publication du 1 oct. (mercredi 17:00), adresse avec code postal 81000. Phase 6, OPS-05.
- [ ] TripAdvisor : retirer le suffixe « @krabi », lien Website = `https://geckocabanerestaurant.com`, description, photos (à choisir par vous), horaires. Phase 6, OPS-04, OPS-05.
- [ ] Trip.com : rouvrir la fiche « Temporarily closed », ajouter le site. Phase 6, OPS-05.
- [ ] Instagram : relever la bio (connecté). Phase 6, OPS-05.
- [ ] Mode retenu : Chrome piloté par Claude, vous connecté, un OK par clic ; relancer le plan 06-10 pour terminer la task 3. Phase 6, OPS-04, OPS-05.
- [ ] Publication des posts Google (manuelle ou avec OK explicite). Phase 6, OPS-02.

### Phase 7 (13 points de `07-LAUNCH.md`, réponse actuellement vide)
- [ ] Migration `supabase/migrations/017_newsletter.sql` en production (additive ; psql `-v ON_ERROR_STOP=1 -1`, puis `supabase migration repair --status applied 017`). Phase 7, NEWS-01 à NEWS-07.
- [ ] Fusion, push et déploiement de la newsletter (déjà fusionnée dans master selon git log : confirmer ce qui est réellement en production) ; le cron `/api/cron/newsletter-sync` passe à 11:00 UTC (18:00 Krabi). Phase 7, NEWS-06.
- [ ] D-03 : demande de confirmation à chaque ancien consentement de réservation. Mesurer N en lecture seule avant l'accord, puis appel manuel `/api/cron/newsletter-legacy-confirm?send=1&limit=50` par lots, après l'aller-retour réussi. Phase 7, NEWS-01.
- [ ] D-06 (J+2/J+3 depuis la date de confirmation ou d'inscription), D-14 (pays géolocalisé non utilisé pour bill_qr et wifi), politique webhook (toute plainte, rebond permanent ou désinscription retire le consentement globalement), exposition du mot de passe WiFi sur `/wifi`. Phase 7, NEWS-06, NEWS-07, NEWS-03.
- [ ] Activation des envois : `NEWSLETTER_SEQUENCES_ENABLED=1` puis `NEWSLETTER_CAMPAIGNS_ENABLED=1`, chacun après contrôle à blanc ; le « retour d'octobre » (campagne « Retrouvez la table ») court du 1er au 30 novembre. 1 email/mois maximum hors séquences. Phase 7, NEWS-06.
- [ ] Contenu web du guide (9 lieux) et recette de base : accord de diffusion. Phase 7, NEWS-04, NEWS-05.

## 3. Comptes externes

- [ ] **Google Business Profile** : accès au compte propriétaire de la fiche. Phase 4, OPS-01 [P1].
- [ ] **Plausible Cloud** (environ 9 EUR/mois) pour `geckocabanerestaurant.com` : créer les objectifs `Reservation Sent`, `WhatsApp Click`, `LINE Click`, déclarer les propriétés `locale` et `src`, contrôler avec « Verify installation » puis le temps réel. Le redéploiement du 2026-10-29 suggère que l'identifiant est en place : le confirmer. Phase 5, KPI-01, RESA-06.
- [ ] **LINE** : compte officiel et URL d'ajout d'ami (`https://lin.ee/...` ou `https://line.me/R/ti/p/@...`). Sans elle, le bouton n'apparaît pas. Phase 5, RESA-05.
- [ ] **Resend** (compte existant) : confirmer que le domaine geckocabanerestaurant.com est Verified (DKIM, SPF, aucun DNS à ajouter), vérifier le plan et les quotas quotidien et mensuel, créer le webhook `https://geckocabanerestaurant.com/api/webhooks/resend` (événements `email.complained`, `email.bounced`, `contact.updated`), accord pour exécuter `node scripts/setup-resend-newsletter.mjs` (crée 6 propriétés de contact). Phase 7, NEWS-01, NEWS-06, NEWS-07.
- [ ] **Vercel** : accès pour saisir les variables et déployer. Phases 4 à 7, toutes.
- [ ] **TripAdvisor, Facebook, Trip.com, Instagram** (accès propriétaire des fiches, Chrome connecté). Phase 6, OPS-04, OPS-05.
- [ ] **Wanderlog** : fiche à aligner sur le NAP (accès non confirmé). Phase 6, OPS-05.
- [ ] **Boîte mail de test** pour l'aller-retour newsletter. Phase 7, NEWS-01.
- [ ] **Google Search Console** : resoumettre le sitemap après le déploiement des pages DE/SV et pages guides (sitemap = fr/en/de ; vérifier l'ajout de sv). Phase 6, I18N-01, I18N-02.

## 4. Secrets et variables d'environnement (noms uniquement, Vercel Production et `.env.local`)

| Variable | Rôle | Phase | Exigence | État connu |
|----------|------|-------|----------|-----------|
| `RESEND_API_KEY` | emails transactionnels et newsletter | 5, 7 | REV-07, NEWS-01 | à vérifier |
| `RESTAURANT_NOTIFICATION_EMAIL` | destinataire de « Un souci ? » | 5 | REV-07 | à vérifier |
| `RATE_LIMIT_SECRET` | hachage des IP pour les limites | 5 | REV-07 | à vérifier |
| `CRON_SECRET` | protège les crons (avis, newsletter) | 4, 7 | REV-03, NEWS-06 | créé en phase 4 selon `04-LAUNCH.md` ; confirmer |
| `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID` | script Plausible (figé au build, redéployer) | 5 | KPI-01 | redéployé le 2026-10-29 selon git log ; confirmer |
| `NEXT_PUBLIC_LINE_URL` | bouton LINE (redéployer) | 5 | RESA-05 | manquante |
| `NEWSLETTER_SIGNING_SECRET` | liens signés (généré) | 7 | NEWS-01 | à vérifier |
| `RESEND_WEBHOOK_SECRET` | signature `whsec_...` du webhook | 7 | NEWS-01 | redéployé le 2026-10-30 selon git log ; confirmer |
| `WIFI_SSID`, `WIFI_PASSWORD` | page `/wifi` (aucune valeur dans le dépôt) | 7 | NEWS-03 | à saisir sur place |
| `NEWSLETTER_SEQUENCES_ENABLED` | active J+2, J+3 (off par défaut) | 7 | NEWS-06 | non activer sans `?dry=1` |
| `NEWSLETTER_CAMPAIGNS_ENABLED` | active retour d'octobre et saison verte (off par défaut) | 7 | NEWS-06 | redéployé le 2026-10-30 selon git log ; confirmer qu'un contrôle à blanc a eu lieu |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` (si utilisée) | numéro du bouton WhatsApp | 1 | RESA-04 | repli 66819585945 dans le code |

Rappels : `SUPABASE_SERVICE_ROLE_KEY` n'est jamais exposée côté client ; les variables `NEXT_PUBLIC_*` sont figées au build.
