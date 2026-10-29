# Phase 6 — Actions humaines (propriétaire) — 2026-10-29

Rien n'a été publié, envoyé, déployé ni modifié sur une plateforme externe par cette exécution.

## Bloquants (plans non clos)

### 06-10 — NAP / TripAdvisor (OPS-04, OPS-05)
Relevé en lecture seule fait (docs/ph6/nap-audit.md). Chaque correction attend un OK explicite avant le clic :
1. Google Business Profile : mercredi 12:00-22:00 (affiché 17:00), adresse alignée (« Maharat Road », « Ruamjit »), catégorie principale « French restaurant ».
2. Facebook : publication du 1 oct. (mercredi 17:00), adresse avec code postal 81000.
3. TripAdvisor : retirer le suffixe « @krabi » si accepté, lien Website = https://geckocabanerestaurant.com, description, photos (à choisir par vous), horaires.
4. Trip.com : fiche « Temporarily closed » à rouvrir, ajouter le site.
5. Instagram : bio à relever (connecté).
6. Décision sur les cinq étoiles statiques de la carte TripAdvisor de l'accueil (par défaut : phase 5).
Mode retenu : Chrome piloté par Claude, vous connecté, un OK par clic. À relancer pour terminer la Task 3.

### 06-15 — Suédois (I18N-02)
Tout /sv reste noindex, absent du sitemap et des hreflang. À faire : envoyer docs/ph6/review/sv/*.md (8 fichiers) à un relecteur suédois, reporter ses corrections, cocher la ligne « Validé par écrit » de chaque document. Puis exécuter la Task 2 (ajout de 'sv' à PUBLISHED_PAGES, REVIEW_LOCALES, EMAIL_LOCALES).

## À relire / vérifier
- Textes DE : la validation enregistrée (2026-10-18) est votre message « approved », pas une relecture par un germanophone natif identifié. Recommandé : faire relire par un natif (pages, emails DE, page d'avis DE, QR) ; aucune garantie de qualité linguistique de mon côté.
- Textes SV : brouillons générés, NON validés.
- Posts Google : semaines 3 (offre basse saison) et la soirée (date) à compléter ; non publiables en l'état.
- Page /en/getting-here-from-ao-nang : chiffres de transport confirmés par vous (06-12) ; Grab recommandé sans tarif inventé.
- Page vin/bière belge : publiée après votre accord (06-12). Elle est EN uniquement (hreflang en + x-default).

## Envois à déclencher par vous (rien n'est parti)
- docs/ph6/outreach-targets.md et outreach-messages.md (blogs/guides ; DE à relire).
- docs/ph6/concierge-dossier.md / .pdf (hôtels Krabi Town et Ao Nang).
- Modèles de réponse aux avis : docs/ph6/review-replies.md (modèles DE à faire relire).
- Posts Google hebdomadaires : publication manuelle ou avec OK explicite.

## Après déploiement (hors périmètre, non fait)
- Déploiement de ws/seo-pages (aucun déploiement ni push effectué).
- Soumettre le sitemap à Google Search Console une fois en ligne.
- Migrations : aucune nouvelle ici ; rien appliqué en base.
