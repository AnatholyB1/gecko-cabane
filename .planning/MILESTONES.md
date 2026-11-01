# Milestones

## v1.1 Refonte de l'admin (Shipped: 2026-11-02, avec dette reportée)

**Phases :** 9 (10 à 17 livrées ; la phase 9 « audit » est partielle : verdicts de page non validés un à un par le propriétaire)
**Exécution :** orchestrée par branches (maquettes, builders, audits, corrections), sans plans GSD ; intégration sur `milestone/v1.1`
**Qualité :** 136 fichiers de tests, 2201 passés, 1 ignoré ; `tsc`, lint (0 erreur) et build verts ; audit de fin de milestone : `.planning/v1.1-MILESTONE-AUDIT.md`
**Production :** migrations 019 à 022 appliquées sur le projet Supabase partagé le 2026-11-01 (020 : lecture publique de `gecko_table*` révoquée, sur accord écrit du propriétaire)

**Réalisations :**

- Suppression de la gestion de salle : plus de page, d'API ni de types « tables » ; réservation et capacité (40 couverts) inchangées, tests de contrat (phase 10).
- Système de design « luxe discret » (jetons `--adm-*`, Base UI, primitives, hook `useAdminQuery`) et shell responsive à navigation unique `nav.ts` : barre du bas, rail, barre latérale (phases 11 et 12).
- Pages refondues : Site public (horaires, exceptions, annonces, capacité), Carte sur un seul écran en bahts, Aujourd'hui et Réservations (heure de Krabi, pic simultané, actions en un tap), Réputation (Avis et KPI, libellés TEST/live conservés) (phases 13 à 16).
- Accès : invitation d'un admin par lien à usage unique, mot de passe oublié, suppression de `/admin/signup` et de l'inscription publique, « Complet ce soir » (dîner d'une date, réversible), accessibilité (44 px, focus, axe) (phase 17).
- API de réservation, emails, cron d'avis J+1 et KPI inchangés (comparaison de contenu avec le commit de départ), sauf le champ `mode` de `GET /api/kpi`.

### Known Gaps

Exigences non cochées à la clôture :

- **AUDIT-01, AUDIT-02** : les verdicts d'audit par page et la navigation ne sont validés que par les décisions de la galerie ; la feuille `09-OWNER-VALIDATION.md` n'est pas cochée page par page.
- **AUDIT-04** : les réponses des blocs A et B ont été données par le propriétaire à la place de la cheffe et des serveurs, pas par eux.
- **RSV-06** : l'UAT des emails de confirmation et d'annulation est passé (2026-11-02) ; le cron d'avis J+1 et les couverts des KPI restent à observer en production (cron de 11h Krabi, cron KPI du lundi).
- **QA-02** : aucun passage lecteur d'écran ni appareil tactile réels.

Dette technique et produit notée : défauts d'API non corrigés (`POST /api/menu/items` prix 0 -> null, `PUT /api/announcement` sans validation, `PUT /api/hours` sans transaction, `DELETE /api/special-hours` renvoie 500 si l'id n'est pas numérique, `PUT /api/reservations` sans `allergies`, `GET /api/auth/logout` par GET) ; réservation ancienne avec une date aberrante (`70902-02-01`) ; ligne « Dîner complet » publique non traduite ; écarts de maquette dans `17c-GAPS.md` ; dette v1.0 inchangée (SEO-08, CONV-02, KPI-08 pas avant le 2026-11-16, OPS-01/04/05, newsletter, relecture native DE/SV).

---

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
