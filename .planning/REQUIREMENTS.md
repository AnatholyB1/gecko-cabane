# Requirements: Gecko Cabane — SEO, conversion et réputation

**Defined:** 2026-10-16
**Core Value:** geckocabanerestaurant.com doit devenir la première source de réservations des touristes européens de Krabi : être trouvé (SEO FR/EN/DE) et réserver en moins de 60 secondes.
**Source:** `Specs site Gecko Cabane – SEO et conversion.md` (ID d'origine entre parenthèses) + cartographie `.planning/codebase/CONCERNS.md`

**Échéance P1 : 1er novembre 2026** (début de la haute saison). Marqueur **[P1]** = avant cette date.

## v1 Requirements

### Sécurité et fiabilité (SEC)

- [x] **SEC-01** [P1]: Un visiteur anonyme ne peut plus obtenir les données d'une réservation via `GET /api/reservations?phone=` (accès réservé à l'admin ou à une preuve de possession)
- [x] **SEC-02** [P1]: Les endpoints d'envoi de code SMS et de création de réservation limitent le nombre de requêtes par IP et par numéro/email
- [x] **SEC-03** [P1]: Les routes API admin refusent tout utilisateur connecté qui n'est pas admin Gecko (`gecko_is_admin`)
- [x] **SEC-04**: Les migrations du dépôt reproduisent le schéma réel (tables `gecko_*`, RLS, fonction `gecko_is_admin`) et s'appliquent sur une base vierge
- [x] **SEC-05** [P1]: Les URLs de webhook de réservation ne sont plus exposées au navigateur (variables serveur, sans `NEXT_PUBLIC_`)
- [x] **SEC-06**: `zod` est déclaré dans `package.json` et aucune dépendance importée n'est seulement transitive

### SEO technique (SEO)

- [x] **SEO-01** (T1) [P1]: Chaque page a un canonical auto-référent sur `https://geckocabanerestaurant.com/{locale}/…` ; `gecko-cabane.com` redirige en 301 vers le domaine principal
- [x] **SEO-02** (T2) [P1]: Le schema contient `geo` (lat 8.0615, lon 98.9157) et des `url`/`image` sur le domaine principal ; Rich Results Test sans erreur
- [x] **SEO-03** (T3) [P1]: Le schema Restaurant inclut `hasMenu`, `acceptsReservations: true`, `sameAs` (Google Maps, TripAdvisor, Facebook, Instagram), `paymentAccepted`, `currenciesAccepted: THB`, `priceRange: ฿฿` ; `aggregateRating` seulement si de vrais avis sont affichés sur la page
- [x] **SEO-04** (T4) [P1]: `/en` est 100 % anglais (title, meta description, `og:locale` `en_US`, schema `description`, titres « Notre Histoire », « La Carte », « Nos Créations »), hors noms de plats
- [x] **SEO-05** (T5) [P1]: Chaque page déclare des liens `hreflang` vers ses équivalents publiés (fr, en et `x-default` dès maintenant) ; `de` puis `sv` s'ajoutent à la publication de chaque langue (I18N-01, I18N-02), jamais vers une page inexistante
- [x] **SEO-06** (T6) [P1]: `sitemap.xml` liste toutes les pages de toutes les langues ; `robots.txt` le déclare
- [ ] **SEO-07** (T6) [P1]: Le domaine est vérifié dans Google Search Console et Bing Webmaster, sitemap soumis
- [ ] **SEO-08** (T7): Images hero en WebP/AVIF, `loading="lazy"` hors écran, LCP < 2,5 s en 4G, PageSpeed mobile ≥ 85

### Carte (MENU)

- [ ] **MENU-01** (C1) [P1]: La page `/menu` affiche la carte en HTML (texte sélectionnable) : plats, prix en bahts, pictos végétarien / sans gluten / épicé, allergènes
- [ ] **MENU-02** (C1) [P1]: La carte comprend une section vins et bières belges
- [ ] **MENU-03** (R2): La mention « espèces, cartes, PromptPay » et les éventuels frais carte (5 %) sont visibles sur la carte et la page réservation

### Réservation (RESA)

- [x] **RESA-01** (R1) [P1]: Le code SMS est facultatif ; la réservation se confirme par email
- [x] **RESA-02** (N1) [P1]: L'email est obligatoire pour réserver en ligne ; une case non pré-cochée « Recevoir nos actualités et offres » enregistre le consentement avec date et source
- [x] **RESA-03** (R1) [P1]: Un touriste avec un numéro étranger réserve en moins de 60 secondes
- [x] **RESA-04** (R1) [P1]: Un bouton WhatsApp flottant est présent sur toutes les pages publiques
- [ ] **RESA-05** (R1): Un bouton LINE est présent pour les Thaïlandais
- [ ] **RESA-06**: Chaque réservation porte un champ « source » (site, WhatsApp, téléphone, sans réservation) ; les événements « réservation envoyée » et « clic WhatsApp » sont mesurés

### Pages et contenu SEO (PAGE)

- [ ] **PAGE-01** [P1]: L'accueil `/{locale}` est enrichi (avis, histoire, accès) avec title « Gecko Cabane – French-Thai Restaurant in Krabi Town » (EN)
- [ ] **PAGE-02** [P1]: `/en/french-restaurant-krabi` cible « french restaurant krabi » (plats français signatures, cave, couple franco-thaï, photos)
- [ ] **PAGE-03**: `/en/romantic-dinner-krabi` cible « romantic dinner krabi » (ambiance, menu dégustation pour deux, réservation « occasion »)
- [ ] **PAGE-04**: `/en/where-to-eat-krabi-town` est un guide honnête du quartier (marchés de nuit, Walking Street, adresses, Gecko pour le dîner)
- [ ] **PAGE-05**: `/en/getting-here-from-ao-nang` détaille taxi, songthaew, horaires, prix, carte
- [ ] **PAGE-06**: `/en/wine-belgian-beer-krabi` liste vins et bières belges avec accords mets-vins
- [ ] **PAGE-07**: Chaque page a son title, sa meta, son H1, un lien vers la réservation, le menu de navigation et des liens contextuels vers les autres pages
- [ ] **PAGE-08**: Les pages PAGE-01 à PAGE-04 et `/menu` existent en FR avec un contenu écrit pour la langue (pas une traduction mot à mot)

### Conversion (CONV)

- [ ] **CONV-01** (C2): Un bloc de preuve sociale (note Google 4,7 pour 1 062 avis, badge Travellers' Choice TripAdvisor, 3 à 4 avis réels avec prénom et pays, lien « Laisser un avis ») est visible au-dessus de la réservation
- [ ] **CONV-02** (C3): Une section « Qui sommes-nous » présente la cheffe Jariya, le propriétaire, la photo du couple et l'origine du lieu, en FR/EN/DE
- [ ] **CONV-03** (C4): Un bloc « Comment venir » (depuis Ao Nang 20 min en taxi, songthaew 50 bahts, 3 min du Walking Street, 15 min de Chao Fah Pier) affiche une carte intégrée et un bouton d'itinéraire Google Maps

### Tunnel d'avis (REV)

- [ ] **REV-01** (A1) [P1]: `/review` (EN), `/avis` (FR), `/bewertung` (DE) redirigent selon la langue et montrent deux boutons, Google en premier puis TripAdvisor ; un clic depuis le mobile ouvre la fenêtre d'avis
- [ ] **REV-02** (A2) [P1]: L'admin permet de marquer une réservation « honorée » ou « no-show » ; sans annulation elle est « honorée » par défaut
- [ ] **REV-03** (A3) [P1]: Un email J+1 à 11h (heure de Krabi) part via Resend, dans la langue de la réservation, avec lien `/review?rid=…&src=email`, uniquement pour les réservations honorées ; un seul rappel à J+5 si le lien n'a pas été cliqué
- [ ] **REV-04** (A4) [P1]: Un QR code vers `/review?src=qr` est prêt à imprimer pour l'addition et le chevalet de table, textes courts FR/EN/DE
- [ ] **REV-05** (A5): L'admin fournit un modèle de message WhatsApp avec lien `/review?src=wa`
- [ ] **REV-06** (A6): Les clics sur `/review` sont comptés par source (email, QR, WhatsApp) et un tableau de suivi mensuel compare avis Google et TripAdvisor
- [ ] **REV-07**: Le champ « Un souci ? » de `/review` envoie un email au propriétaire dès réception, affiché en même temps que les boutons d'avis, sans filtrage

### Newsletter (NEWS)

- [ ] **NEWS-01**: Les contacts sont synchronisés avec Brevo avec double opt-in, lien de désinscription et consentement horodaté (PDPA, RGPD)
- [ ] **NEWS-02** (N4): Un formulaire en pied de page et un pop-up de sortie (une fois par visiteur, pas en plein écran sur mobile) collectent email et langue ; le taux d'inscription est mesuré
- [ ] **NEWS-03** (N2): Un portail captif WiFi propose email + consentement, ou un accès sans inscription
- [ ] **NEWS-04** (N3): Un QR sur l'addition mène à une inscription (recette du curry de crabe) séparée du lien d'avis Google
- [ ] **NEWS-05** (N5): Le « Guide gourmand de Krabi Town » (PDF) est envoyé par email après confirmation
- [ ] **NEWS-06**: Les séquences bienvenue, après-visite J+1, pendant séjour J+3, retour en octobre et saison verte (mai à octobre) fonctionnent, 1 email/mois maximum hors séquences
- [ ] **NEWS-07**: Les contacts sont segmentés par langue (FR/EN/DE/SV), pays, résident ou touriste, date de dernière visite

### KPI et reporting (KPI)

- [ ] **KPI-01**: GA4 ou Plausible est installé avec les événements « réservation envoyée » et « clic WhatsApp »
- [ ] **KPI-02**: Chaque lundi 7h (Krabi), un workflow n8n collecte réservations, no-show, Search Console, Google Business Profile, avis, rang TripAdvisor (Bright Data), clics `/review`, Brevo, et écrit dans `weekly_kpis` (Supabase)
- [ ] **KPI-03**: Le calcul compare à S-1 (et N-1 dès la 2e saison) et détecte les seuils d'alerte de la spec
- [ ] **KPI-04**: L'API Claude rédige 3 phrases de lecture et 3 actions recommandées, en français
- [ ] **KPI-05**: Le rapport arrive le lundi à 8h par email et résumé WhatsApp au propriétaire et à l'équipe
- [ ] **KPI-06**: Un tableau de bord en ligne garde l'historique des KPI
- [ ] **KPI-07**: Un avis ≤ 3 étoiles ou un retour privé de `/review` déclenche une alerte immédiate
- [ ] **KPI-08**: Le rapport est testé 2 semaines avant d'être déclaré fiable

### Internationalisation (I18N)

- [ ] **I18N-01** (L1): `/de` existe pour les pages PAGE-01 à PAGE-04, `/menu` et les pages d'avis, rédigé par Claude et relu par un humain avant publication
- [ ] **I18N-02** (L1): `/sv` existe ensuite, avec le même processus de relecture, et est relié par hreflang

### Actions externes (OPS)

Chaque action publique est préparée par Claude et exécutée après accord du propriétaire.

- [ ] **OPS-01** [P1]: La fiche Google Business Profile est à jour (catégorie principale « French restaurant », secondaires « Thai », « Fusion », « Wine bar », attributs, lien de réservation, carte importée, 20 photos récentes)
- [ ] **OPS-02**: Des posts Google hebdomadaires sont préparés (plat de la semaine, soirée, offre basse saison)
- [ ] **OPS-03**: Des modèles de réponse aux avis (sous 48 h, avec « French restaurant in Krabi Town ») sont fournis
- [ ] **OPS-04**: TripAdvisor est mis à jour (description, photos, horaires) et le lien du site pointe vers `.com` au lieu de `tripadvisor.be`
- [ ] **OPS-05**: Nom, adresse et téléphone sont identiques sur le site, Google, TripAdvisor, Facebook, Trip.com et Wanderlog
- [ ] **OPS-06**: Une liste de blogs et guides (Petit Futé, Travelfish, Faszination Südostasien, Marco Polo) avec messages de prise de contact est prête à envoyer
- [ ] **OPS-07**: Un dossier de partenariat concierge (carte de recommandation, commission) est prêt pour les hôtels de Krabi Town et Ao Nang

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
| SEO-03 | Phase 2 | Complete |
| SEO-04 | Phase 2 | Complete |
| SEO-05 | Phase 2 | Complete |
| SEO-06 | Phase 2 | Complete |
| SEO-07 | Phase 2 | Pending |
| MENU-01 | Phase 3 | Pending |
| MENU-02 | Phase 3 | Pending |
| PAGE-01 | Phase 3 | Pending |
| PAGE-02 | Phase 3 | Pending |
| REV-01 | Phase 4 | Pending |
| REV-02 | Phase 4 | Pending |
| REV-03 | Phase 4 | Pending |
| REV-04 | Phase 4 | Pending |
| OPS-01 | Phase 4 | Pending |
| SEO-08 | Phase 5 | Pending |
| MENU-03 | Phase 5 | Pending |
| RESA-05 | Phase 5 | Pending |
| RESA-06 | Phase 5 | Pending |
| CONV-01 | Phase 5 | Pending |
| CONV-02 | Phase 5 | Pending |
| CONV-03 | Phase 5 | Pending |
| REV-05 | Phase 5 | Pending |
| REV-06 | Phase 5 | Pending |
| REV-07 | Phase 5 | Pending |
| KPI-01 | Phase 5 | Pending |
| PAGE-03 | Phase 6 | Pending |
| PAGE-04 | Phase 6 | Pending |
| PAGE-05 | Phase 6 | Pending |
| PAGE-06 | Phase 6 | Pending |
| PAGE-07 | Phase 6 | Pending |
| PAGE-08 | Phase 6 | Pending |
| I18N-01 | Phase 6 | Pending |
| I18N-02 | Phase 6 | Pending |
| OPS-02 | Phase 6 | Pending |
| OPS-03 | Phase 6 | Pending |
| OPS-04 | Phase 6 | Pending |
| OPS-05 | Phase 6 | Pending |
| OPS-06 | Phase 6 | Pending |
| OPS-07 | Phase 6 | Pending |
| NEWS-01 | Phase 7 | Pending |
| NEWS-02 | Phase 7 | Pending |
| NEWS-03 | Phase 7 | Pending |
| NEWS-04 | Phase 7 | Pending |
| NEWS-05 | Phase 7 | Pending |
| NEWS-06 | Phase 7 | Pending |
| NEWS-07 | Phase 7 | Pending |
| KPI-02 | Phase 8 | Pending |
| KPI-03 | Phase 8 | Pending |
| KPI-04 | Phase 8 | Pending |
| KPI-05 | Phase 8 | Pending |
| KPI-06 | Phase 8 | Pending |
| KPI-07 | Phase 8 | Pending |
| KPI-08 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 65 total (24 marquées [P1]) ; le décompte initial de 62 était erroné
- Mapped to phases: 65
- Unmapped: 0

---
*Requirements defined: 2026-10-16*
*Last updated: 2026-10-16 after initial definition*
