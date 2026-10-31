# Milestones

## v1.0 SEO, conversion et réputation (Shipped: 2026-10-31, avec dette reportée)

**Phases :** 8 (1 à 3 terminées ; 4 à 8 livrées avec des restes bloqués sur le propriétaire)
**Plans :** 79 SUMMARY sur 85 plans (workstreams `conversion`, `seo-pages`, `newsletter` inclus ; le CLI ne compte que le dossier principal, soit 47)
**Production :** geckocabanerestaurant.com (Vercel), master `973fc47`+, 97 fichiers de tests, 1365 passés, 1 ignoré

**Réalisations :**

- Réservation en une étape (téléphone international, email obligatoire, honeypot, limiteur de débit), suppression complète du backend SMS Twilio, bouton WhatsApp (phase 1).
- SEO technique : canonical et hreflang par page, JSON-LD Restaurant localisé, sitemap, noindex admin, carte HTML indexable avec vins et bières belges, pages d'atterrissage (phases 2 et 3).
- Tunnel d'avis : `/review` `/avis` `/bewertung`, email J+1 et relance J+5, suivi du premier clic, statut honorée/no-show dans l'admin (phase 4).
- Conversion et mesure, plan de pages SEO FR/EN, allemand et suédois publiés après validation écrite du propriétaire (phases 5 et 6).
- Newsletter sur Resend avec double opt-in, journal de consentement, séquences et campagne codées, envois désactivés par défaut (phase 7).
- Rapport KPI hebdomadaire en production : cron Vercel, Search Console, Bright Data (TripAdvisor), avis Google via Places API, rédaction par Claude, email envoyé en mode TEST, tableau de bord `/admin/kpi` (phase 8).

### Known Gaps

Exigences non cochées à la clôture, reportées au milestone suivant :

- **SEO-08** : PageSpeed mobile 79 pour une cible de 85, LCP 4,4 s pour une cible de 2,5 s.
- **CONV-02** : photo du couple, année d'ouverture et histoire à compléter.
- **KPI-02 à KPI-08** : cochées au code mais le rapport reste en mode TEST ; KPI-08 exige 2 semaines de TEST (au plus tôt le 2026-11-16), puis `KPI_REPORT_MODE=live`.
- **OPS-01** : fiche Google Business Profile (04-03), reportée par le propriétaire.
- **OPS-04, OPS-05** : TripAdvisor et cohérence NAP (06-10), bloquées faute d'accord du propriétaire.

Plans sans SUMMARY : 04-03, 06-10, 07-02, 07-10, 07-11, 08-12 (fait en production, voir `08-POST-DEPLOY.md`), 08-13.
Vérifications ouvertes : 02-VERIFICATION (`human_needed`), 04-VERIFICATION et 08-VERIFICATION (`gaps_found`).
Aucun audit de milestone n'a été exécuté avant la clôture (risque accepté).

---
