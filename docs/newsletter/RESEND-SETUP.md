# Configuration Resend pour la newsletter Gecko Cabane

Runbook pour le propriétaire. Il ne contient aucune valeur de clé : les secrets restent dans les variables d'environnement Vercel. Décision du propriétaire (2026-10-29) : Resend remplace Brevo, un seul prestataire.

Variables (noms seulement) : `RESEND_API_KEY` (déjà utilisée par les emails de réservation), `RESEND_FROM_EMAIL`, `RESEND_WEBHOOK_SECRET`, `RESEND_SEGMENT_ID` (facultatif), `NEWSLETTER_SIGNING_SECRET`, `NEWSLETTER_SEQUENCES_ENABLED`, `NEWSLETTER_CAMPAIGNS_ENABLED`, `CRON_SECRET`, `WIFI_SSID`, `WIFI_PASSWORD`.

## 1. Domaine d'envoi

Le domaine geckocabanerestaurant.com est déjà vérifié sur Resend pour les emails de réservation (à confirmer dans Resend, Domains : statut Verified, DKIM et SPF). Aucun DNS à ajouter. La newsletter part de la même adresse expéditrice (`RESEND_FROM_EMAIL`).

## 2. Plan et limites

Vérifier le plan Resend : le plan gratuit limite le volume quotidien et mensuel (à lire dans Resend, Usage). La tâche quotidienne envoie au plus environ 80 requêtes par exécution et reprend le lendemain pour le reste. Au-delà de la limite du plan, passer à un plan payant avant d'activer les séquences.

## 3. Propriétés de contact (une seule fois)

Le code reflète les segments dans les contacts Resend. Créer les propriétés de type texte avec le script d'installation (nécessite l'accord du propriétaire, écrit chez Resend) :

| Propriété | Valeurs |
|-----------|---------|
| language | fr, en, de, sv |
| country | code pays ISO alpha-2, ou vide |
| resident | yes ou no |
| source | footer, popup, bill_qr, wifi, newsletter_page, reservation_form |
| consent_at | AAAA-MM-JJ |
| last_visit | AAAA-MM-JJ de la dernière visite honorée, ou vide |

Commande : `node scripts/setup-resend-newsletter.mjs` (RESEND_API_KEY lue depuis `.env.local`, jamais affichée). Si une propriété manque, la création du contact échoue sans casser l'inscription : le registre Supabase reste la source de vérité, et la tâche quotidienne réessaie.

## 4. Webhook

Dans Resend, Webhooks, ajouter l'URL https://geckocabanerestaurant.com/api/webhooks/resend avec les événements `email.complained`, `email.bounced` et `contact.updated`. Copier le secret de signature (commence par `whsec_`) dans `RESEND_WEBHOOK_SECRET` sur Vercel. La route vérifie la signature Svix sur le corps brut ; une plainte spam, un rebond permanent ou une désinscription faite dans le tableau de bord Resend retire le consentement dans le registre.

## 5. Séquences : envoyées par l'application

Plus d'automatisations à construire dans un outil tiers. La tâche planifiée `/api/cron/newsletter-sync` (tous les jours à 11:00 UTC, soit 18:00 à Krabi) :

- reflète les segments dans les contacts Resend ;
- envoie l'email après-visite à J+2 (fenêtre de rattrapage de 2 jours) et l'email pendant le séjour à J+3 (touristes seulement) ;
- envoie les campagnes saisonnières : la campagne de début de haute saison « Retrouvez la table » (touristes avec une visite, du 1er au 30 novembre ; le type garde son nom historique `october_return`, prévu à l'origine pour octobre, car la contrainte SQL de la migration 017 le liste) et la saison verte (résidents ou contacts avec une visite, de mai à septembre), une fois par an et par contact ;
- applique dans le code le plafond de 1 campagne par 30 jours et par contact (D-08), et consigne chaque envoi dans `gecko_newsletter_sends` pour qu'aucun email ne parte deux fois.

Les envois sont désactivés par défaut. Activer à la main, après approbation : `NEWSLETTER_SEQUENCES_ENABLED=1` (J+2, J+3) et `NEWSLETTER_CAMPAIGNS_ENABLED=1` (retour en octobre, saison verte). Contrôle à blanc : `/api/cron/newsletter-sync?dry=1` avec le secret cron renvoie les comptes sans rien envoyer.

Les textes sont ceux des brouillons approuvés le 2026-10-18 (`docs/newsletter/sequences/`), avec les bandes image du site.

## 6. Segments

Stockés dans le registre (langue, pays, résident ou touriste, dernière visite) et reflétés dans les propriétés Resend. Pour un envoi manuel depuis le tableau de bord Resend (Broadcasts), créer un segment filtré sur les propriétés et renseigner `RESEND_SEGMENT_ID` pour que les nouveaux contacts y entrent. Tout envoi manuel exige le lien de désinscription Resend et l'accord du propriétaire.

## 7. DE et SV

Aucun envoi, segment ni campagne en allemand ou en suédois. Les contacts de et sv reçoivent la version anglaise jusqu'à la relecture humaine de la phase 6.

## 8. Avant l'activation

Chaque brouillon de `docs/newsletter/sequences/` est marqué approuvé dans `SEQUENCES.md`. Chaque email contient le lien de désinscription signé (désinscription par POST) et l'en-tête List-Unsubscribe en un clic.

## 9. Campagne « Retrouvez la table » (novembre 2026)

Email illustré (fr et en ; de et sv reçoivent l'anglais) : grande image d'en-tête, quatre photos réelles du site (jarret au curry Massaman, bourguignon, entrée, enseigne), bouton « Réserver une table » avec `utm_source=newsletter&utm_medium=email&utm_campaign=season-2026`, bouton vers le guide, horaires, adresse, téléphone et WhatsApp, désinscription et mention PDPA/RGPD. Aucune offre, remise, prix ni note. Images dans `public/email/campaign-*.jpg` (générées par `scripts/generate-email-bands.mjs`). Aperçu hors dépôt, sans rien envoyer : `node scripts/preview-newsletter-campaign.mjs --out <dossier>`. Le texte est nouveau : à faire relire au propriétaire avant `NEWSLETTER_CAMPAIGNS_ENABLED=1`.
