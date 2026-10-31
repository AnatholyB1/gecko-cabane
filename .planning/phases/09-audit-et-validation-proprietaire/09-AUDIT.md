# Phase 9 : Audit d'utilité de l'admin (AUDIT-01)

**Date :** 2026-10-31 · **Statut :** PROPOSITION, en attente de validation écrite du propriétaire (voir `09-OWNER-VALIDATION.md`)
**Méthode :** lecture du code de chaque page `src/app/admin/**`, des routes `src/app/api/**` qu'elle appelle, de `src/middleware.ts` et des tests qui lisent leur source. Aucun accès à la base de production, aucune lecture de `.env.local`. Il n'existe aucune télémétrie d'usage : la colonne « Qui s'en sert » est une **hypothèse** à confirmer par le questionnaire (`09-USAGE-QUESTIONNAIRE.md`).

Légende des verdicts : GARDER (on ne change que l'habillage), SIMPLIFIER (on retire des fonctions), FUSIONNER (la page devient une section d'une autre), SUPPRIMER.

## 1. Vue d'ensemble

| # | Page (URL) | Lignes | Verdict proposé | Devient |
|---|-----------|-------:|-----------------|---------|
| 1 | Accueil `/admin` | 216 | SIMPLIFIER (remplacée) | « Aujourd'hui » |
| 2 | Réservations `/admin/reservations` | 874 + 105 | SIMPLIFIER | « Réservations » (liste dense) |
| 3 | Tables `/admin/tables` | 809 | **SUPPRIMER** (décision propriétaire) | rien |
| 4 | Carte, liste `/admin/menu` | 370 | FUSIONNER | « Carte » (un écran) |
| 5 | Carte, page `/admin/menu/[pageId]` | 748 | FUSIONNER + SIMPLIFIER | « Carte » (un écran) |
| 6 | Horaires `/admin/hours` | 438 | FUSIONNER | « Site public » > Horaires |
| 7 | Annonce `/admin/announcement` | 293 | FUSIONNER | « Site public » > Annonces |
| 8 | Paramètres `/admin/settings` | 173 | FUSIONNER + renommer | « Site public » > Capacité |
| 9 | Avis `/admin/avis` | 307 | SIMPLIFIER (+ décision sur les totaux) | « Réputation » > Avis |
| 10 | KPI `/admin/kpi` | 404 | GARDER (isolée) | « Réputation » > KPI |
| 11 | Connexion `/admin/login` | 91 | GARDER | hors shell |
| 12 | Inscription `/admin/signup` | 41 | **SUPPRIMER après invitation** | `/admin/login` |

Constat transversal (vrai pour toutes les pages) : aucun shell ni composant partagé ; chaque page recopie son en-tête, son bandeau de message, sa pastille de chargement ; seul le tableau de bord relie les pages entre elles (les sous-pages n'ont qu'un lien « Retour ») ; trois pages (`hours`, `announcement`, `menu`) ont leur propre formulaire de déconnexion vers `/api/auth/logout` ; les `confirm()` natifs et les `console.error` sont partout ; les anciens tokens (`var(--primary)`, `--warm-gray`) sont ceux du site public.

## 2. Fiches par page

### 2.1 Accueil `/admin` : SIMPLIFIER (remplacée par « Aujourd'hui »)

- **Ce qu'elle fait :** Server Component. Vérifie la session, affiche 8 cartes vers les pages, puis les **mêmes 8 liens une seconde fois** en « Actions rapides », puis un bloc d'informations du restaurant écrites en dur (adresse, téléphone, « 40 places maximum », « 12h - 22h ») et un lien « Retour au site public ». Aucune donnée du jour.
- **Qui s'en sert :** hypothèse : tout le monde pour atterrir, personne pour y rester. La cheffe veut voir « qui vient ce soir » ; elle doit aujourd'hui cliquer vers Réservations.
- **Justification :** les cartes et actions rapides sont redondantes (deux fois les mêmes liens) et seront remplacées par la navigation du shell. Les informations en dur sont une seconde source de vérité qui peut diverger de `max_covers` et des horaires. La carte « Plan de salle » et son action rapide mènent à une page supprimée : sans correction, lien mort.
- **Ce qui est gardé :** la fonction d'atterrissage, avec du contenu utile : arrivées du jour par heure, couverts réservés sur `max_covers`, réservations à confirmer (TDY-01, TDY-02).
- **Risques :** `tests/kpi-admin-wiring.test.ts` compte exactement 2 occurrences de `href="/admin/kpi"` dans `src/app/admin/page.tsx` ; cette assertion cassera dès que la page est réécrite (phase 12). Calcul de capacité par créneau : doit reprendre la logique de disponibilité existante, pas une seconde formule.

### 2.2 Réservations `/admin/reservations` : SIMPLIFIER

- **Ce qu'elle fait :** liste des réservations avec filtre date / statut, vue jour / semaine / toutes, 3 compteurs (réservations, en attente, couverts), changement de statut (confirmer, annuler, terminée, absent), choix de la source, notes admin, suppression définitive, saisie manuelle (`ManualReservationForm`), badges de suivi d'invitation d'avis (`getReviewBadges`), **placement sur le plan de salle** (modal de 200 lignes, appels à `/api/tables` et `/api/tables/assignments`, bloc d'affichage « 🪑 configuration · tables · → heure »).
- **Qui s'en sert :** cheffe (téléphone) pour confirmer, serveurs (tablette) pendant le service, propriétaire pour les notes. C'est la page la plus utilisée (hypothèse).
- **Justification :** on retire le placement (TAB-02). On garde tout le reste, mais on le rend utilisable en un tap : actions de statut visibles, `tel:` et WhatsApp, navigation par date, recherche. Le gain de place libéré par le plan de salle sert à densifier la liste.
- **Anomalies relevées dans le code actuel (à corriger dans la refonte, sans toucher l'API) :**
  1. La date par défaut est `new Date().toISOString().split('T')[0]` : c'est la date **UTC**. À Krabi (UTC+7), entre minuit et 7h du matin la page ouvre la veille. À remplacer par la date de Krabi (le projet a déjà `bangkokNow` dans `reservation-rules.ts` et `todayKrabi` pour les badges).
  2. La vue « semaine » additionne 7 jours avec `Date#setDate` en UTC : mêmes réserves.
  3. `Supprimer définitivement` s'appuie sur `confirm()` natif et supprime la ligne de la base : à garder derrière un dialogue de confirmation ; à décider si l'on préfère « Annuler » seul (voir 5.4).
  4. Les statuts n'ont pas de protection contre le double clic.
- **Risques :** zone sensible (emails de confirmation et d'annulation, cron d'avis J+1, couverts KPI dépendent des statuts). `PUT /api/reservations` et l'énumération des statuts sont **figés**. `tests/review-badges.test.ts` fige des classes Tailwind (voir `09-TEST-IMPACT.md`). Livraison hors service (12h-22h Krabi).

### 2.3 Tables `/admin/tables` : SUPPRIMER (imposé)

- **Ce qu'elle fait :** éditeur de plan de salle (glisser-déposer de tables, formes, places), onglet des configurations (combinaisons de tables avec capacité min/max). Alimente `/api/tables/*` (5 fichiers) et le modal de placement des réservations.
- **Qui s'en sert :** hypothèse : personne en routine ; décision du propriétaire : sans intérêt pour 40 couverts.
- **Justification :** confirmée par le code : `gecko_create_reservation` (migration 008), `reservation-rules.ts` et le calcul de disponibilité ne lisent que `gecko_reservations`, `max_covers` et `table_block_duration_minutes`. Les seules références à `gecko_table*` dans `src/` sont les 5 routes `/api/tables/*` ; dans `supabase/migrations/` seule la baseline 007 les crée. Supprimer la page et les routes ne change ni la prise de réservation ni la capacité.
- **À conserver absolument :** les tables SQL `gecko_table*` (aucune migration destructive), les clés `max_covers` et `table_block_duration_minutes` (seuls les libellés perdent le mot « table »).
- **Risques :** ordre de suppression (appelants avant appelés, un commit vert à la fois, voir `09-TEST-IMPACT.md`) ; `/api/tables/assignments` GET renvoie des données de réservation ; lecture publique `using (true)` encore active sur les 4 tables (ACC-01, phase 17, accord requis) ; le serveur qui aurait mis `/admin/tables` en favori tombe sur une 404 : voir décision 5.5.

### 2.4 et 2.5 Carte : `/admin/menu` et `/admin/menu/[pageId]` : FUSIONNER + SIMPLIFIER

- **Ce qu'elles font :** `/admin/menu` liste les pages de carte (Déjeuner, Dîner, etc.), crée / renomme / supprime une page, réordonne les pages par glisser-déposer. `/admin/menu/[pageId]` gère catégories et plats : création, édition, suppression (3 `confirm()`), prix, drapeaux végétarien / épicé / **sans gluten (confirmé par la cheffe)**, téléversement d'image, réordonnancement des catégories et des plats par glisser-déposer HTML5.
- **Qui s'en sert :** la cheffe, pour changer un prix ou rendre un plat indisponible ; peu fréquent mais à chaque changement de saison.
- **Justification :** deux niveaux de navigation pour modifier un prix, c'est trop. Un écran : pages en onglets, catégories en sections repliables, modification de prix et de disponibilité en ligne, ajout rapide de plat (MENU-01).
- **Points d'attention :**
  - Le glisser-déposer HTML5 natif **ne fonctionne pas au toucher** : sur le téléphone de la cheffe, le réordonnancement est sans doute inutilisable aujourd'hui. Proposition : boutons « monter / descendre » (même API `/api/menu/reorder`, aucune nouvelle dépendance). Le glisser-déposer reste hors périmètre (REQUIREMENTS).
  - Le libellé « Sans gluten (confirmé par la cheffe) » et les noms `itemForm.is_gluten_free` / `item.is_gluten_free ?? false` sont **lus par `tests/menu-admin-wiring.test.ts`** (voir impact).
  - `revalidateTag(MENU_TAG, 'max')` dans les routes API (3 + 3 + 3 + 1 appels comptés par le test) : ne pas toucher aux routes.
  - La disponibilité d'un plat existe déjà (`is_available`, basculée par un `PUT /api/menu/items` avec `{ id, is_available }`) : « rendre indisponible » n'exige aucun changement d'API. Les trois niveaux (pages, catégories, plats) ont chacun un glisser-déposer `draggable`.
- **Risques :** régression de la carte publique `/menu` (cache) ; téléversement d'image (route `/api/menu/upload`) inchangé.

### 2.6 Horaires `/admin/hours` : FUSIONNER (« Site public » > Horaires)

- **Ce qu'elle fait :** horaires par jour de la semaine (0 = dimanche) et horaires exceptionnels par date (fermé / ouvert avec plages, note). Routes `/api/hours`, `/api/special-hours`.
- **Qui s'en sert :** propriétaire ; occasionnel (jours fériés, fermetures).
- **Justification :** même nature que l'annonce et la capacité (tout ce qui change l'affichage ou la réservation sur le site public). Les trois pages ont chacune leur en-tête, leur déconnexion et leur bandeau : un seul modèle suffit.
- **Risques :** `console.error` silencieux en cas d'échec (l'utilisateur ne voit rien) : à remplacer par un retour lisible (SITE-02). Les horaires pilotent aussi le JSON-LD et le MCP (`tests/seo-jsonld-wiring.test.ts` lit `src/app/api/hours/route.ts` : ne pas modifier la route).

### 2.7 Annonce `/admin/announcement` : FUSIONNER (« Site public » > Annonces)

- **Ce qu'elle fait :** une seule bannière : texte, lien, couleur (amber, green, red, blue, purple), plage de dates, actif / inactif ; aperçu. Route `/api/announcement`.
- **Qui s'en sert :** propriétaire ou cheffe ; occasionnel (fêtes, fermetures).
- **Justification :** fusion avec Horaires et Capacité. Les couleurs ne doivent plus reposer sur la seule teinte (statut aussi en texte).
- **Risques :** faible. Le tableau `BG_COLORS` produit des classes Tailwind : ne pas concaténer de noms de classes dynamiques.

### 2.8 Paramètres `/admin/settings` : FUSIONNER + renommer (« Site public » > Capacité)

- **Ce qu'elle fait :** deux curseurs : `table_block_duration_minutes` (« Durée de blocage d'une table », 30-480 min, pas de 15) et `max_covers` (« Couverts maximum par service », 1-200). Sous le titre « 🗺️ Gestion des tables », avec une note qui parle de « même table » et de « configuration qui partage cette table ». `GET /api/settings` est ouvert au public (pas de garde), `PUT` est gardé.
- **Qui s'en sert :** propriétaire, très rarement.
- **Justification :** TAB-05 : libellés sans « table » (« Durée d'occupation d'un créneau »), clés **inchangées** (elles pilotent `reservation-rules.ts` et la RPC de capacité). Le texte d'aide doit être réécrit : il décrit un comportement par table qui n'existe plus.
- **Risques :** renommer la clé casserait la réservation en production (`tests/reservations-post.test.ts` et `reservation-rules.test.ts` l'utilisent). Test de fumée imposé : réserver jusqu'à 40 couverts, le suivant est refusé.

### 2.9 Avis `/admin/avis` : SIMPLIFIER (« Réputation » > Avis)

- **Ce qu'elle fait :** trois blocs. (1) Tableau mensuel des visites de `/review` et clics Google / TripAdvisor par source (email, QR, WhatsApp, site, inconnue), lu dans `gecko_review_clicks`. (2) **Saisie manuelle des totaux d'avis du mois** (Google, TripAdvisor) avec liste d'évolution mois par mois, dans `gecko_review_monthly_totals`. (3) Modèles WhatsApp d'invitation d'avis par langue (copier, ouvrir WhatsApp), dont un « à relire » (DE).
- **Qui s'en sert :** propriétaire (suivi) et serveurs / cheffe (modèles WhatsApp à envoyer aux clients). Hypothèse.
- **Justification :** tableau de clics et modèles WhatsApp : GARDER. Saisie manuelle des totaux : voir 3.
- **Risques :** les modèles WhatsApp passent par `@/utils/review-whatsapp` (testé) ; le tableau par `@/utils/review-report` (testé) ; `tests/review-click-wiring.test.ts` interdit qu'un fichier `'use client'` contienne la chaîne `review-stats` ou `review-tracking` : ne pas nommer un composant client `review-stats-…`.

### 2.10 KPI `/admin/kpi` : GARDER (« Réputation » > KPI)

- **Ce qu'elle fait :** historique des 12 dernières semaines (15 indicateurs), comparaison à la semaine précédente, alertes, « lecture et actions » (texte du rapport), compteur « Rapports TEST envoyés : N / 2 », **saisie manuelle hebdomadaire** (total, nouveaux avis, note minimale, note libre ; une note ≤ 3 déclenche une alerte immédiate au propriétaire). `GET` et `PUT /api/kpi`.
- **Qui s'en sert :** propriétaire et développeur ; lundi, après réception du rapport. L'URL `/admin/kpi` est **dans les emails** (rapport hebdomadaire et alerte d'avis) : à conserver à l'identique.
- **Justification :** page récente, sensible (libellés TEST / live, aucun envoi live avant le 2026-11-16). On ne la refait pas en profondeur : on change l'habillage et on garde les libellés figés par `tests/kpi-admin-wiring.test.ts` (« Rapports TEST envoyés », « Sources non disponibles », « KPI hebdomadaires », « non disponible » jamais 0).
- **Risques :** le test importe le module de la page et le rend avec `renderToStaticMarkup` : la page doit rester un composant par défaut synchrone, ou le test est réécrit en connaissance de cause.

### 2.11 Connexion `/admin/login` : GARDER

- **Ce qu'elle fait :** formulaire email + mot de passe, Server Action `loginAction` (session Supabase puis contrôle `gecko_is_admin` ; sinon déconnexion et message). Redirection `?redirect=` conservée.
- **Qui s'en sert :** tous.
- **Justification :** fonction essentielle ; restyle seulement, hors shell (NAV-05). Le champ `?redirect=` est transmis tel quel : à valider (chemin relatif commençant par `/admin`) lors de la refonte.
- **Risques :** `/api/auth/login` (route formulaire) est un doublon de la Server Action, **non référencé** et sans contrôle `gecko_is_admin` (le middleware rattrape ensuite). À supprimer avec le signup (voir 2.12).

### 2.12 Inscription `/admin/signup` : SUPPRIMER après définition d'un processus d'invitation

- **Ce qu'elle fait :** la page est déjà un simple message « n'est plus ouvert au public, contactez l'équipe technique ». `signupAction` redirige vers cette page. Aucun formulaire. Le middleware la traite comme une page d'authentification (redirige un utilisateur connecté vers `/admin`).
- **Qui s'en sert :** personne. Aujourd'hui un nouvel admin est ajouté par le développeur : création du compte Supabase Auth puis insertion d'une ligne dans `gecko_admins` (clé de service). À confirmer (questionnaire).
- **Constat de sécurité à traiter tôt :** `POST /api/auth/signup` existe toujours, **n'est appelé par aucune page**, n'a aucune garde, passe le middleware (les routes `/api` sont publiques) et appelle `supabase.auth.signUp`. Selon le réglage « inscriptions » du projet Supabase (non vérifiable ici, pas d'accès prod), n'importe qui peut créer un compte dans le pool d'authentification partagé avec le portfolio. Ce compte n'est pas admin (pas de ligne `gecko_admins`), mais il pollue le pool partagé et peut envoyer des emails de confirmation. Proposition : retirer cette route dès la phase 10 (elle ne dépend d'aucun processus d'invitation), indépendamment de la suppression de la page (phase 17).
- **Observation annexe :** `/auth/callback` redirige vers `${origin}${next}` sans valider `next` ; une valeur du type `@autre-site.example` produit une URL de la forme `https://site@autre-site.example`. À valider (`next` doit commencer par `/` et pas `//`) lors de ACC-02.
- **Justification :** une page morte, une route d'inscription ouverte et une Server Action qui ne fait rien sont de la surface d'attaque sans usage. Le processus d'invitation proposé figure au 5.2.

## 3. Saisie manuelle des totaux d'avis : la source KPI la remplace-t-elle ? QUI la lit ?

Il existe **deux** saisies manuelles distinctes, qu'il ne faut pas confondre :

| | Totaux **mensuels** (page Avis) | Saisie **hebdomadaire** (page KPI) |
|---|---|---|
| Table | `gecko_review_monthly_totals` (migration 016) | colonnes `google_*` et `manual_note` de `gecko_kpi_weekly` (migration 018) |
| Contenu | total d'avis Google et TripAdvisor du mois | total / nouveaux avis Google, note minimale, note libre |
| Écrite par | `PUT /api/review/stats` ← formulaire de `/admin/avis` | `PUT /api/kpi` ← formulaire de `/admin/kpi` |
| Alerte | non | oui (note ≤ 3 : email immédiat) |

**Qui lit les totaux mensuels ?** (grep sur `src/`, `tests/`, `supabase/`, `scripts/`)

- Code applicatif : **uniquement** `GET /api/review/stats` (`src/app/api/review/stats/route.ts`), consommé par `/admin/avis` pour l'affichage de la liste d'évolution (`totalsEvolution` dans `src/utils/review-report.ts`). Le rapport KPI (`kpi-collect.ts`, `kpi-sources.ts`, `kpi-report-email.ts`, `kpi-narrative.ts`, cron `weekly-kpi`) **ne lit pas** cette table.
- Tests : `tests/review-report.test.ts` (helpers `totalsEvolution`, `isValidTotal`, et `GET` / `PUT` de la route, avec le nom de la table dans les données simulées), `tests/migrations.test.ts` ligne 165 (le fichier 016 contient la création de la table : reste vrai tant qu'on ne touche pas aux migrations).
- Documentation : `.planning` des phases 5 et 8 (historique).
- Hors dépôt : **non vérifiable** sans accès à la base de production (un export, un tableau de bord ou un autre service qui interrogerait la table). Le webhook n8n a été retiré du code (`tests/no-public-secrets.test.ts` l'interdit), mais cela ne prouve rien pour un lecteur externe : à demander au propriétaire.

**La source KPI la remplace-t-elle ?**

- **Google : oui, pour le total.** Le collecteur hebdomadaire alimente `google_reviews_total` et `google_new_reviews` automatiquement (Places API via le compte de service Search Console, commit `53c5731`), avec état de source `google_reviews`. La saisie hebdomadaire de la page KPI reste en secours (`manual_reviews`).
- **TripAdvisor : non.** Le collecteur ne récupère que le **rang** (`tripadvisor_rank` et `tripadvisor_total`, où le total est le nombre de restaurants classés, pas le nombre d'avis). Le **nombre d'avis TripAdvisor** n'est collecté nulle part automatiquement.
- **Réserve :** la collecte Google est récente et le rapport est encore en TEST (0 / 2 rapports TEST vérifiés ; passage en live au plus tôt le 2026-11-16). Aucune preuve de stabilité sur plusieurs semaines.

**Conclusion pour REP-03 :** la condition « la source KPI la remplace et rien d'autre ne la lit » est **remplie pour Google, non remplie pour TripAdvisor**, et la lecture externe est **inconnue**. Options :

- **A (recommandée si la cheffe et le propriétaire ne saisissent plus rien) :** retirer le formulaire, la liste d'évolution et le `PUT /api/review/stats` ; garder le tableau de clics ; la table reste en base. Perte : suivi du nombre d'avis TripAdvisor (le rang reste suivi).
- **B :** garder uniquement le total TripAdvisor (champ unique, mensuel), retirer Google.
- **C :** tout garder, redessiné.

Aucune suppression avant la phase 16, et pas avant réponse du questionnaire (qui saisit, à quelle fréquence, depuis quand la dernière saisie). Décision attendue du propriétaire : voir `09-OWNER-VALIDATION.md`, ligne « Totaux d'avis ».

## 4. Risques transversaux

1. **Tests qui lisent le source :** 4 tests cassent au moindre déplacement (liste complète et changements requis dans `09-TEST-IMPACT.md`). Un 5e piège n'est pas dans la liste du roadmap : `tests/i18n-hardcoded.test.ts` interdit tout caractère accentué dans `src/components/**` ; les composants d'admin prévus en `src/components/admin/` le feraient échouer.
2. **Production en haute saison :** Vercel déploie au push ; livrer hors service (12h-22h Krabi), une PR par page, validation sur preview.
3. **Zones figées :** `POST/PUT/DELETE /api/reservations`, énumération des statuts, `/api/review/*`, `/api/kpi`, `revalidateTag` des routes menu.
4. **Base partagée avec le portfolio :** toute migration (ACC-01 révocation de la lecture publique sur `gecko_table*`) exige l'accord du propriétaire et la vérification qu'aucune autre application ne lit ces tables.
5. **Aucun envoi à un tiers :** pas d'envoi KPI live avant le 2026-11-16 ; le questionnaire est rédigé mais **non envoyé**.

## 5. Questions ouvertes pour le propriétaire

1. **Totaux d'avis :** option A, B ou C (section 3).
2. **Invitation d'un nouvel admin :** quel processus retenir (proposition : le développeur crée le compte dans Supabase Auth via une invitation par email, puis insère la ligne dans `gecko_admins` ; sans interface dans l'admin pour l'instant). Un écran « Inviter un admin » dans l'admin serait de la gestion de rôles, hors périmètre.
3. **Retrait de `/api/auth/signup` dès la phase 10** (route non utilisée, appel direct à `signUp`) : accord ?
4. **Suppression d'une réservation :** garder « Supprimer définitivement » derrière un dialogue, ou ne proposer que « Annuler » (qui déclenche l'email d'annulation) ? Une suppression efface aussi l'historique de no-show et de couverts du KPI.
5. **Ancienne adresse `/admin/tables` :** laisser une 404 franche, ou rediriger vers `/admin/reservations` ?
6. **Vue « semaine » et « toutes » des réservations :** elles existent aujourd'hui ; la recherche (nom, téléphone) et la navigation par date les remplacent-elles ? Proposition : garder « jour » par défaut et une recherche sur tout l'historique, retirer « semaine ».
7. **« Complet ce soir » (ACC-03) :** fermer la réservation en un tap ; modèle à décider (exception d'horaires spéciaux ou plafond ponctuel) ; hors MVP, ne bloque pas les phases 10 à 16.
8. **Palette :** « luxe discret » (ivoire, vert jungle, laiton rare) proposé dans `09-BRIEF-DESIGN.md` ; à valider avant la phase 11.
