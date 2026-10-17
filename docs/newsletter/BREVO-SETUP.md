# Configuration Brevo pour la newsletter Gecko Cabane

Runbook pour le propriétaire. Il ne contient aucune valeur de clé : les secrets restent dans les variables d'environnement Vercel (`BREVO_API_KEY`, `BREVO_LIST_ID`, `BREVO_LIST_AFTER_VISIT`, `BREVO_LIST_DURING_STAY`, `NEWSLETTER_SIGNING_SECRET`, `BREVO_WEBHOOK_TOKEN` ou le nom retenu en 07-08).

## 1. Vérifier le plan

Le plan gratuit permet 300 emails par jour. Vérifier dans le compte si les automatisations sont disponibles (hypothèse A7 de la recherche). Si elles ne le sont pas, utiliser des campagnes planifiées à la main pour les séquences J+2 et J+3, ou passer à un plan qui les inclut. Ne rien activer avant l'approbation des brouillons.

## 2. Expéditeur et domaine

1. Ajouter l'expéditeur de geckocabanerestaurant.com.
2. Authentifier le domaine (DKIM et DMARC) dans le DNS. Les enregistrements Brevo cohabitent avec ceux de Resend : ne supprimer aucun enregistrement existant, ajouter seulement ceux de Brevo.
3. Vérifier l'envoi d'un email de test vers une boîte du propriétaire.

## 3. Attributs de contact

Créer exactement ces attributs (mêmes noms que `src/utils/brevo.ts`) :

| Attribut | Type | Valeurs |
|----------|------|---------|
| LANGUAGE | texte | fr, en, de, sv |
| COUNTRY | texte | code pays ISO alpha-2, ou vide |
| RESIDENT | booléen | true pour un résident de Krabi |
| SOURCE | texte | footer, popup, bill_qr, wifi, newsletter_page, reservation_form |
| CONSENT_AT | date | date du consentement |
| LAST_VISIT_DATE | date | date de la dernière visite honorée, format AAAA-MM-JJ (à vérifier au lancement) |

## 4. Liste

Créer la liste principale et noter son identifiant dans `BREVO_LIST_ID`. Le code y ajoute les contacts confirmés.

## 5. Webhook marketing

Dans Brevo, webhooks marketing, ajouter l'URL https://geckocabanerestaurant.com/api/webhooks/brevo avec les événements désinscription (unsubscribed) et signalement spam (spam). Protéger l'appel par un jeton porteur (bearer) identique à celui lu par la route. Les désinscriptions arrivent ainsi dans le registre de consentement.

## 6. Automatisations

Pour chaque séquence (après-visite et pendant le séjour), deux options :

- Option A : déclencheur sur l'attribut date LAST_VISIT_DATE plus N jours dans l'éditeur classique (N = 2 pour après-visite, N = 3 pour pendant le séjour). Si l'éditeur ne propose pas ce déclencheur, utiliser l'option B.
- Option B : déclencheur d'ajout à une liste. Créer `BREVO_LIST_AFTER_VISIT` et `BREVO_LIST_DURING_STAY`. La tâche planifiée quotidienne (04:30 UTC) y ajoute le contact le jour LAST_VISIT_DATE + 2 ou + 3.

Réglages communs : envoi à 18:00 Asia/Bangkok, différent de l'invitation d'avis (11:00 Krabi, J+1). Après-visite : tous les contacts avec LAST_VISIT_DATE. Pendant le séjour : ajouter la condition RESIDENT = false. Langue : une branche par valeur de LANGUAGE (fr, en). Aucune branche pour de ou sv.

## 7. Segments

- Retour en octobre : RESIDENT = false ET LAST_VISIT_DATE renseignée ET LANGUAGE dans fr, en. Campagne envoyée chaque septembre ou octobre.
- Saison verte : (RESIDENT = true OU LAST_VISIT_DATE renseignée) ET LANGUAGE dans fr, en. Flux envoyé entre mai et octobre.

## 8. Plafond de fréquence

Au plus 1 email par mois et par contact hors séquences (bienvenue, après-visite, pendant le séjour). L'application n'applique pas ce plafond. Il est tenu par la discipline de planification des campagnes (une seule campagne ou un seul flux saisonnier par mois) et par la règle de fréquence ou de suppression de Brevo (D-08).

## 9. DE et SV

Ne pas activer d'automatisation, de segment ni de campagne en allemand ou en suédois. Ils restent inactifs jusqu'à la relecture humaine de la phase 6.

## 10. Avant l'activation

Chaque brouillon de `docs/newsletter/sequences/` doit être marqué approuvé dans `SEQUENCES.md`. Chaque email contient le lien de désinscription Brevo `{{ unsubscribe }}`.
