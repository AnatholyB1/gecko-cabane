# Requirements: Gecko Cabane — SEO, conversion et réputation

**Defined:** 2026-10-16
**Core Value:** geckocabanerestaurant.com doit devenir la première source de réservations des touristes européens de Krabi : être trouvé (SEO FR/EN/DE) et réserver en moins de 60 secondes.
**Source:** `Specs site Gecko Cabane – SEO et conversion.md` (ID d'origine entre parenthèses) + cartographie `.planning/codebase/CONCERNS.md`

**Échéance P1 : 1er novembre 2026** (début de la haute saison). Marqueur **[P1]** = avant cette date.

**Légende (synchronisation 2026-10-30)** : `[x]` fait et vérifié ; `[~]` code livré et testé, mais vérification en production ou action du propriétaire en attente (compte pour non terminé) ; `[ ]` non fait ou bloqué. Preuves : workstreams `.planning/workstreams/*`, rapports de phase, git log. Actions restantes : `.planning/DEPLOY-CHECKLIST-v1.0.md`.

## v1 Requirements

### Sécurité et fiabilité (SEC)

- [x] **SEC-01** [P1]: Un visiteur anonyme ne peut plus obtenir les données d'une réservation via `GET /api/reservations?phone=` (accès réservé à l'admin ou à une preuve de possession)
- [x] **SEC-02** [P1]: Les endpoints d'envoi de code SMS et de création de réservation limitent le nombre de requêtes par IP et par numéro/email
- [x] **SEC-03** [P1]: Les routes API admin refusent tout utilisateur connecté qui n'est pas admin Gecko (`gecko_is_admin`)
- [x] **SEC-04**: Les migrations du dépôt reproduisent le schéma réel (tables `gecko_*`, RLS, fonction `gecko_is_admin`) et s'appliquent sur une base vierge
- [x] **SEC-05** [P1]: Les URLs de webhook de réservation ne sont plus exposées au navigateur (variables serveur, sans `NEXT_PUBLIC_`)
- [x] **SEC-06**: `zod` est déclaré dans `package.json` et aucune dépendance importée n'est seulement transitive

### SEO technique (SEO)

- [x] **SEO-01** (T1) [P1]: Chaque page a un canonical auto-référent sur `https://geckocabanerestaurant.com/{locale}/…` ; `gecko-cabane.com` redirige en 301 vers le domaine principal *(partie 301 impossible : domaine non possédé, références retirées — D-01)*
- [x] **SEO-02** (T2) [P1]: Le schema contient `geo` (lat 8.0615, lon 98.9157) et des `url`/`image` sur le domaine principal ; Rich Results Test sans erreur
- [x] **SEO-03** (T3) [P1]: Le schema Restaurant inclut `hasMenu`, `acceptsReservations: true`, `sameAs` (Google Maps, TripAdvisor, Facebook, Instagram), `paymentAccepted`, `currenciesAccepted: THB`, `priceRange: ฿฿` ; `aggregateRating` seulement si de vrais avis sont affichés sur la page *(`hasMenu` reporté à la phase 3 — D-08)*
- [x] **SEO-04** (T4) [P1]: `/en` est 100 % anglais (title, meta description, `og:locale` `en_US`, schema `description`, titres « Notre Histoire », « La Carte », « Nos Créations »), hors noms de plats
- [x] **SEO-05** (T5) [P1]: Chaque page déclare des liens `hreflang` vers ses équivalents publiés (fr, en et `x-default` dès maintenant) ; `de` puis `sv` s'ajoutent à la publication de chaque langue (I18N-01, I18N-02), jamais vers une page inexistante
- [x] **SEO-06** (T6) [P1]: `sitemap.xml` liste toutes les pages de toutes les langues ; `robots.txt` le déclare
- [x] **SEO-07** (T6) [P1]: Le domaine est vérifié dans Google Search Console et Bing Webmaster, sitemap soumis *(GSC vérifié par TXT DNS, sitemap soumis ; Bing importé depuis GSC, sitemap soumis — 2026-10-17)*
- [ ] **SEO-08** (T7): Images hero en WebP/AVIF, `loading="lazy"` hors écran, LCP < 2,5 s en 4G, PageSpeed mobile ≥ 85 *(workstream conversion : meilleur score mesuré 79, LCP 4,4 s sur preview, cible 85 / 2,5 s non atteinte)*

### Carte (MENU)

- [x] **MENU-01** (C1) [P1]: La page `/menu` affiche la carte en HTML (texte sélectionnable) : plats, prix en bahts, pictos végétarien / sans gluten / épicé, allergènes
- [x] **MENU-02** (C1) [P1]: La carte comprend une section vins et bières belges
- [x] **MENU-03** (R2): La mention « espèces, cartes, PromptPay » et les éventuels frais carte (5 %) sont visibles sur la carte et la page réservation

### Réservation (RESA)

- [x] **RESA-01** (R1) [P1]: Le code SMS est facultatif ; la réservation se confirme par email
- [x] **RESA-02** (N1) [P1]: L'email est obligatoire pour réserver en ligne ; une case non pré-cochée « Recevoir nos actualités et offres » enregistre le consentement avec date et source
- [x] **RESA-03** (R1) [P1]: Un touriste avec un numéro étranger réserve en moins de 60 secondes
- [x] **RESA-04** (R1) [P1]: Un bouton WhatsApp flottant est présent sur toutes les pages publiques
- [~] **RESA-05** (R1): Un bouton LINE est présent pour les Thaïlandais *(code livré ; le bouton ne s'affiche que si NEXT_PUBLIC_LINE_URL est fournie par le propriétaire)*
- [~] **RESA-06**: Chaque réservation porte un champ « source » (site, WhatsApp, téléphone, sans réservation) ; les événements « réservation envoyée » et « clic WhatsApp » sont mesurés *(code livré ; migration 015 et objectifs Plausible non vérifiés en production)*

### Pages et contenu SEO (PAGE)

- [x] **PAGE-01** [P1]: L'accueil `/{locale}` est enrichi (avis, histoire, accès) avec title « Gecko Cabane – French-Thai Restaurant in Krabi Town » (EN)
- [x] **PAGE-02** [P1]: `/en/french-restaurant-krabi` cible « french restaurant krabi » (plats français signatures, cave, couple franco-thaï, photos)
- [x] **PAGE-03**: `/en/romantic-dinner-krabi` cible « romantic dinner krabi » (ambiance, menu dégustation pour deux, réservation « occasion »)
- [x] **PAGE-04**: `/en/where-to-eat-krabi-town` est un guide honnête du quartier (marchés de nuit, Walking Street, adresses, Gecko pour le dîner)
- [x] **PAGE-05**: `/en/getting-here-from-ao-nang` détaille taxi, songthaew, horaires, prix, carte
- [x] **PAGE-06**: `/en/wine-belgian-beer-krabi` liste vins et bières belges avec accords mets-vins
- [x] **PAGE-07**: Chaque page a son title, sa meta, son H1, un lien vers la réservation, le menu de navigation et des liens contextuels vers les autres pages
- [x] **PAGE-08**: Les pages PAGE-01 à PAGE-04 et `/menu` existent en FR avec un contenu écrit pour la langue (pas une traduction mot à mot)

### Conversion (CONV)

- [x] **CONV-01** (C2): Un bloc de preuve sociale (note Google 4,7 pour 1 062 avis, badge Travellers' Choice TripAdvisor, 3 à 4 avis réels avec prénom et pays, lien « Laisser un avis ») est visible au-dessus de la réservation *(3 avis TripAdvisor repris mot pour mot, accord de publication à confirmer)*
- [ ] **CONV-02** (C3): Une section « Qui sommes-nous » présente la cheffe Jariya, le propriétaire, la photo du couple et l'origine du lieu, en FR/EN/DE *(photo du couple absente (COUPLE_PHOTO = null), année d'ouverture et histoire à compléter ; prénom du propriétaire et textes DE/SV déjà publiés)*
- [x] **CONV-03** (C4): Un bloc « Comment venir » (depuis Ao Nang 20 min en taxi, songthaew 50 bahts, 3 min du Walking Street, 15 min de Chao Fah Pier) affiche une carte intégrée et un bouton d'itinéraire Google Maps

### Tunnel d'avis (REV)

- [x] **REV-01** (A1) [P1]: `/review` (EN), `/avis` (FR), `/bewertung` (DE) redirigent selon la langue et montrent deux boutons, Google en premier puis TripAdvisor ; un clic depuis le mobile ouvre la fenêtre d'avis
- [x] **REV-02** (A2) [P1]: L'admin permet de marquer une réservation « honorée » ou « no-show » ; sans annulation elle est « honorée » par défaut
- [x] **REV-03** (A3) [P1]: Un email J+1 à 11h (heure de Krabi) part via Resend, dans la langue de la réservation, avec lien `/review?rid=…&src=email`, uniquement pour les réservations honorées ; un seul rappel à J+5 si le lien n'a pas été cliqué
- [x] **REV-04** (A4) [P1]: Un QR code vers `/review?src=qr` est prêt à imprimer pour l'addition et le chevalet de table, textes courts FR/EN/DE
- [x] **REV-05** (A5): L'admin fournit un modèle de message WhatsApp avec lien `/review?src=wa` *(modèle DE à faire relire)*
- [~] **REV-06** (A6): Les clics sur `/review` sont comptés par source (email, QR, WhatsApp) et un tableau de suivi mensuel compare avis Google et TripAdvisor *(code livré ; migration 016 non vérifiée en production)*
- [~] **REV-07**: Le champ « Un souci ? » de `/review` envoie un email au propriétaire dès réception, affiché en même temps que les boutons d'avis, sans filtrage *(code livré ; réception de l'email au propriétaire non vérifiée)*

### Newsletter (NEWS)

- [~] **NEWS-01**: Les contacts sont synchronisés avec Resend (contacts en miroir du registre, décision phase 7 du 2026-10-29) avec double opt-in, lien de désinscription et consentement horodaté (PDPA, RGPD) *(code livré ; migration 017 et webhook Resend non vérifiés en production)*
- [~] **NEWS-02** (N4): Un formulaire en pied de page et un pop-up de sortie (une fois par visiteur, pas en plein écran sur mobile) collectent email et langue ; le taux d'inscription est mesuré *(code livré ; non vérifié sur appareil ni en production)*
- [~] **NEWS-03** (N2): Un portail captif WiFi propose email + consentement, ou un accès sans inscription *(page /wifi livrée ; carte WiFi imprimée et identifiants WiFi du propriétaire manquants)*
- [~] **NEWS-04** (N3): Un QR sur l'addition mène à une inscription (recette du curry de crabe) séparée du lien d'avis Google *(page /newsletter livrée ; insert d'addition et recette à valider par le propriétaire)*
- [~] **NEWS-05** (N5): Le « Guide gourmand de Krabi Town » (PDF) est envoyé par email après confirmation *(guide et PDF générés depuis le web, à relire ; envoi réel non vérifié)*
- [~] **NEWS-06**: Les séquences bienvenue, après-visite J+1, pendant séjour J+3, retour en octobre et saison verte (mai à octobre) fonctionnent, 1 email/mois maximum hors séquences *(séquences envoyées par l'application (Resend), désactivées par défaut ; activation après contrôle à blanc (07-11))*
- [~] **NEWS-07**: Les contacts sont segmentés par langue (FR/EN/DE/SV), pays, résident ou touriste, date de dernière visite *(code livré ; segments non vérifiés en production)*

### KPI et reporting (KPI)

- [~] **KPI-01**: GA4 ou Plausible est installé avec les événements « réservation envoyée » et « clic WhatsApp » *(code livré ; script Plausible redéployé le 2026-10-29, objectifs et événements non vérifiés)*
- [ ] **KPI-02**: Chaque lundi 7h (Krabi), un job cron de l'application (Vercel Cron, `/api/cron/weekly-kpi`) collecte réservations, no-show, Search Console, rang TripAdvisor (Bright Data), clics `/review`, newsletter (Resend) et la saisie manuelle des avis Google, et écrit dans `gecko_weekly_kpis` (Supabase) *(réinterprété le 2026-10-30, D-01 : l'ancien workflow externe est remplacé par un cron dans l'application ; Google Business Profile automatique hors v1, D-03)*
- [ ] **KPI-03**: Le calcul compare à S-1 (et N-1 dès la 2e saison) et détecte les seuils d'alerte de la spec
- [ ] **KPI-04**: L'API Claude rédige 3 phrases de lecture et 3 actions recommandées, en français
- [ ] **KPI-05**: Le rapport arrive le lundi à 8h par email au propriétaire et à l'équipe *(D-04 : résumé WhatsApp reporté, hors v1)*
- [ ] **KPI-06**: Un tableau de bord en ligne garde l'historique des KPI
- [ ] **KPI-07**: Un avis ≤ 3 étoiles ou un retour privé de `/review` déclenche une alerte immédiate
- [ ] **KPI-08**: Le rapport est testé 2 semaines avant d'être déclaré fiable *(mode TEST, clôture au plus tôt mi-novembre 2026, D-09)*

### Internationalisation (I18N)

- [x] **I18N-01** (L1): `/de` existe pour les pages PAGE-01 à PAGE-04, `/menu` et les pages d'avis, rédigé par Claude et relu par un humain avant publication *(DE publié après validation écrite du propriétaire ; relecture par un germanophone natif recommandée)*
- [x] **I18N-02** (L1): `/sv` existe ensuite, avec le même processus de relecture, et est relié par hreflang *(SV publié le 2026-10-29 après validation écrite du propriétaire ; aucun relecteur natif identifié)*

### Actions externes (OPS)

Chaque action publique est préparée par Claude et exécutée après accord du propriétaire.

- [ ] **OPS-01** [P1]: La fiche Google Business Profile est à jour (catégorie principale « French restaurant », secondaires « Thai », « Fusion », « Wine bar », attributs, lien de réservation, carte importée, 20 photos récentes) *(reporté par le propriétaire (accès au compte GBP) ; dossier 04-GBP-DOSSIER.md prêt, rien appliqué)*
- [~] **OPS-02**: Des posts Google hebdomadaires sont préparés (plat de la semaine, soirée, offre basse saison) *(posts préparés ; semaine 3 (offre basse saison) et soirée (date) à compléter, rien publié)*
- [x] **OPS-03**: Des modèles de réponse aux avis (sous 48 h, avec « French restaurant in Krabi Town ») sont fournis
- [ ] **OPS-04**: TripAdvisor est mis à jour (description, photos, horaires) et le lien du site pointe vers `.com` au lieu de `tripadvisor.be` *(plan 06-10 task 3 bloquée : aucune correction externe sans accord du propriétaire)*
- [ ] **OPS-05**: Nom, adresse et téléphone sont identiques sur le site, Google, TripAdvisor, Facebook, Trip.com et Wanderlog *(plan 06-10 task 3 bloquée : relevé en lecture seule fait (docs/ph6/nap-audit.md), corrections en attente)*
- [x] **OPS-06**: Une liste de blogs et guides (Petit Futé, Travelfish, Faszination Südostasien, Marco Polo) avec messages de prise de contact est prête à envoyer *(prête, rien envoyé)*
- [x] **OPS-07**: Un dossier de partenariat concierge (carte de recommandation, commission) est prêt pour les hôtels de Krabi Town et Ao Nang *(prêt, rien envoyé)*

## v2 Requirements

### Contenu récurrent

- **CONT-01**: 1 article par mois (plat signature, saison verte, soirée Walking Street, accord vin + curry), repris sur Instagram et Facebook
- **CONT-02**: Page brunch / offres pour les résidents en préparation de la saison verte (avril 2027)
- **CONT-03**: Collecte de 15 avis Google par mois en haute saison (processus d'exploitation, pas de développement)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Review gating | Interdit par Google et TripAdvisor, risque de suppression des avis |
| Contrepartie contre un avis | Interdit ; la recette de N3 récompense l'inscription newsletter, pas l'avis |
| Avis payés ou incités, faux avis | Interdit ; `aggregateRating` seulement avec de vrais avis affichés |
| Traduction automatique brute DE/SV | La spec exige une traduction relue |
| Publication ou envoi à des tiers sans accord du propriétaire | Règle de projet |
| Migration hors Next.js/Supabase | Aucun besoin ; hors périmètre SEO/conversion |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Complete |
| SEC-02 | Phase 1 | Complete |
| SEC-03 | Phase 1 | Complete |
| SEC-04 | Phase 1 | Complete |
| SEC-05 | Phase 1 | Complete |
| SEC-06 | Phase 1 | Complete |
| RESA-01 | Phase 1 | Complete |
| RESA-02 | Phase 1 | Complete |
| RESA-03 | Phase 1 | Complete |
| RESA-04 | Phase 1 | Complete |
| SEO-01 | Phase 2 | Complete |
| SEO-02 | Phase 2 | Complete |
| SEO-03 | Phase 2 | Complete (hasMenu livré en phase 3) |
| SEO-04 | Phase 2 | Complete |
| SEO-05 | Phase 2 | Complete |
| SEO-06 | Phase 2 | Complete |
| SEO-07 | Phase 2 | Complete |
| MENU-01 | Phase 3 | Complete |
| MENU-02 | Phase 3 | Complete |
| PAGE-01 | Phase 3 | Complete |
| PAGE-02 | Phase 3 | Complete |
| REV-01 | Phase 4 | Complete |
| REV-02 | Phase 4 | Complete |
| REV-03 | Phase 4 | Complete |
| REV-04 | Phase 4 | Complete |
| OPS-01 | Phase 4 | Pending (reporté propriétaire) |
| SEO-08 | Phase 5 | Pending (79 / LCP 4,4 s) |
| MENU-03 | Phase 5 | Complete |
| RESA-05 | Phase 5 | Code livré, URL LINE attendue |
| RESA-06 | Phase 5 | Code livré, vérif. production |
| CONV-01 | Phase 5 | Complete |
| CONV-02 | Phase 5 | Pending (photo du couple) |
| CONV-03 | Phase 5 | Complete |
| REV-05 | Phase 5 | Complete |
| REV-06 | Phase 5 | Code livré, migration 016 |
| REV-07 | Phase 5 | Code livré, email non vérifié |
| KPI-01 | Phase 5 | Code livré, Plausible à vérifier |
| PAGE-03 | Phase 6 | Complete |
| PAGE-04 | Phase 6 | Complete |
| PAGE-05 | Phase 6 | Complete |
| PAGE-06 | Phase 6 | Complete |
| PAGE-07 | Phase 6 | Complete |
| PAGE-08 | Phase 6 | Complete |
| I18N-01 | Phase 6 | Complete |
| I18N-02 | Phase 6 | Complete |
| OPS-02 | Phase 6 | Préparé, à compléter |
| OPS-03 | Phase 6 | Complete |
| OPS-04 | Phase 6 | Blocked (owner) |
| OPS-05 | Phase 6 | Blocked (owner) |
| OPS-06 | Phase 6 | Complete |
| OPS-07 | Phase 6 | Complete |
| NEWS-01 | Phase 7 | Code livré, lancement bloqué (owner) |
| NEWS-02 | Phase 7 | Code livré, lancement bloqué (owner) |
| NEWS-03 | Phase 7 | Code livré, lancement bloqué (owner) |
| NEWS-04 | Phase 7 | Code livré, lancement bloqué (owner) |
| NEWS-05 | Phase 7 | Code livré, lancement bloqué (owner) |
| NEWS-06 | Phase 7 | Code livré, lancement bloqué (owner) |
| NEWS-07 | Phase 7 | Code livré, lancement bloqué (owner) |
| KPI-02 | Phase 8 | Code livré (en attente de l activation : migration 018, accès propriétaire) |
| KPI-03 | Phase 8 | Code livré (en attente de l activation : migration 018, accès propriétaire) |
| KPI-04 | Phase 8 | Code livré (en attente de l activation : migration 018, accès propriétaire) |
| KPI-05 | Phase 8 | Code livré (en attente de l activation : migration 018, accès propriétaire) |
| KPI-06 | Phase 8 | Code livré (en attente de l activation : migration 018, accès propriétaire) |
| KPI-07 | Phase 8 | Code livré (en attente de l activation : migration 018, accès propriétaire) |
| KPI-08 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 65 total (24 marquées [P1]) ; le décompte initial de 62 était erroné
- Mapped to phases: 65
- Unmapped: 0
- Etat au 2026-10-30 : 40 faites et vérifiées, 13 code livré en attente de vérification/propriétaire, 12 ouvertes (dont KPI-02 à KPI-07 : code livré le 2026-10-30, activation en attente (018) ; KPI-08 ouverte jusqu'à mi-novembre)

---
*Requirements defined: 2026-10-16*
*Last updated: 2026-10-30 après synchronisation des workstreams (phases 5 à 7)*
