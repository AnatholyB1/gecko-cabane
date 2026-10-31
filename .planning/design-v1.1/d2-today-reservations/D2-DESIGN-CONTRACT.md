# D2 — Contrat de design « Aujourd'hui » + « Réservations » (phase 15)

Statut : maquettes statiques + contrat. Aucun code applicatif. Données des maquettes = **exemples fictifs** (bandeau « Maquette D2 · données d'exemple » en tête de chaque page). Heure de référence des maquettes : samedi 31 octobre 2026, 16:10, heure de Krabi.

## 1. Direction « luxe discret » (concilier luxe et outil de travail sobre)

- Le luxe vient de la retenue : ivoire chaud (`--adm-bg`), vert jungle profond en seule couleur d'action (`--adm-brand`), filets de 1 px (`--adm-line`) à la place des ombres (aucune ombre dans les maquettes), air généreux (16/24/32), Cormorant Garamond réservé aux titres H1 et titres de dialogue, tout le reste en sans-serif avec `tabular-nums`.
- Le laiton (`--adm-accent`, 2,84:1 sur ivoire) est **décor seulement** : un seul filet de 28x2 px sous chaque H1. Jamais de texte, jamais de statut. Texte laiton éventuel = `--adm-accent-text`.
- Sobriété : un seul bouton plein par ligne (l'action suivante logique), les autres en contour. Pas de dégradé, pas d'emoji, icônes SVG (jeu lucide : 24 px, trait 2, 20 px par défaut, 16 px dans badges/boutons de ligne).
- Statut jamais porté par la couleur seule : chaque statut = icône + libellé (§4). Capacité par créneau = nombre + hachures + icône.

## 2. Jetons

`tokens.css` contient les jetons partagés EXACTS (`--adm-bg #F7F4EC` ... `--adm-info #2F5F7A`, rayons 8/12 px, cible 44 px, polices). Extensions locales D2 dans `d2.css` (préfixe `--d2-`, à promouvoir en D1 si utiles ailleurs) :

| Jeton D2 | Valeur | Usage |
|---|---|---|
| `--d2-control-line` | `#858270` | bordure de champ/bouton secondaire (3,87:1 sur blanc, 3,52:1 sur ivoire, WCAG 1.4.11) |
| `--d2-ok-bg / -line` | `#E8F1EA / #A9C8B3` | fond et bord du badge ok |
| `--d2-warn-bg / -line` | `#FBF1DC / #E3CB92` | badge warn, bandeau |
| `--d2-danger-bg / -line` | `#F8E7E3 / #E2B1A8` | badge danger, erreurs |
| `--d2-info-bg / -line` | `#E5EEF3 / #A9C4D2` | badge info |
| `--d2-neutral-bg` | `#ECE8DB` | badge neutre (Absent) |
| `--d2-scrim` | `rgba(27,42,34,.5)` | voile des dialogues |
| `--d2-focus` | `var(--adm-info)` | anneau de focus 3 px, offset 2 px |

Contrastes calculés (texte normal >= 4,5:1) : ink/bg 13,64 ; muted/bg 5,09 ; muted/surface-2 4,74 ; brand-ink/brand 11,89 ; ok/ok-bg 5,50 ; warn/warn-bg 5,28 ; danger/danger-bg 5,48 ; info/info-bg 5,88 ; accent-text/blanc 6,23 ; danger/blanc 6,57 ; toast erreur 9,32.

Typographie : Inter (repli Segoe UI/system-ui) 16 px de base ; **plancher 14 px** partout ; H1 Cormorant 600 40 px ; titre dialogue Cormorant 28 px ; heure de ligne 20/22 px 600 ; nom 17 px 600 ; méta 14 px muted ; chiffres de jauge 40 px 600 ; majuscules espacées 14 px pour les titres de carte. Espacement : 4/8/12/16/20/24/32/40.

## 3. Primitives (alignement D1)

Hypothèse de noms D1 : `Button`, `Badge`, `DataTable`, `Dialog`, `Toast`. Variantes que D2 consomme (à confirmer par D1, sinon D2 ajoute celles manquantes) :

- **Button** : `variant` = `primary` (brand), `secondary` (blanc + `--d2-control-line`), `ghost`, `danger` (plein `--adm-danger`, réservé au bouton de confirmation d'annulation), `danger-outline` (Annuler en ligne). `size` unique = 44 px mini ; `icon` = 44x44. États : `disabled` (fond surface-2, texte muted, curseur interdit) et `loading` (spinner 16 px + libellé progressif « Confirmation… », bouton `disabled`). Rendu en `<a>` pour `tel:`/WhatsApp.
- **Badge** : `tone` = `ok | warn | danger | info | neutral`, toujours `icon` + libellé, 14 px, pastille 28 px de haut (non interactive).
- **DataTable** : D2 consomme la variante `layout="rows" density="compact"` : liste d'`<article>` à grille adaptative (cartes empilées < 768, 2 lignes 768-1279, 1 ligne + notes >= 1280 avec en-tête de colonnes `aria-hidden`). Séparateurs `section` (« Déjeuner », « Dîner ») avec sous-total. Si D1 impose un vrai `<table>` >= 1280, garder le même contenu de cellules.
- **Dialog** : `kind="alert"` (confirmation, centré, 440 px max, focus initial sur le bouton sûr, `role="alertdialog"`) et `kind="sheet"` (feuille de saisie : bas d'écran pleine largeur < 768, centré 560 px >= 768, `role="dialog"`). `aria-modal`, reste de la page `inert`, Échap ferme, focus rendu au déclencheur.
- **Toast** : succès `role="status"`, erreur `role="alert"` persistante avec action « Réessayer ». Position : au-dessus de la barre basse (< 1024) ou en bas à gauche du contenu (>= 1024). Succès auto-fermé après 5 s, jamais si le pointeur/focus est dessus.
- **Chip** (filtre) : bouton à bascule `aria-pressed`, coche + fond brand quand actif, compteur tabulaire. **Segmented** (Hier / Aujourd'hui / Demain) : liens, `aria-current="true"`.

## 4. Statuts (RSV-01) : icône + libellé + ton

| Statut (`ReservationStatus`) | Libellé | Icône | Ton | Actions proposées |
|---|---|---|---|---|
| `pending` | À confirmer | horloge | warn | Confirmer (primary), Annuler |
| `confirmed` | Confirmée | cercle coché | ok | Terminer (primary), Absent, Annuler |
| `completed` | Terminée | coche | info | aucune |
| `cancelled` | Annulée | cercle croix | danger | aucune (nom et heure barrés) |
| `no_show` | Absent | utilisateur barré | neutral | aucune |

Transitions inchangées : `pending -> confirmed -> completed / no_show`, `pending|confirmed -> cancelled`. L'énumération et `PUT /api/reservations` ne changent pas. Libellé « Absent » pour `no_show` (bouton et badge) ; l'ancien « Non présenté » disparaît (voir question ouverte 4). Seule l'annulation passe par une confirmation ; Confirmer / Terminer / Absent = un tap, sans dialogue. Les emails de confirmation/annulation et le cron d'avis J+1 sont déclenchés côté serveur comme avant (RSV-06) : le design n'ajoute aucun envoi.

## 5. Écrans

### 5.1 Aujourd'hui (`today.html`)
Ordre mobile (390) : en-tête (date, heure Krabi, pastille « N à confirmer » en lien d'ancre) -> carte « Couverts réservés » (2 jauges Déjeuner 12h-15h / Dîner 18h-22h, valeur = **pic de couverts simultanés du service** sur `max_covers` = 40) -> carte « N à confirmer » avec Confirmer/Annuler en un tap -> carte « Couverts occupés par heure » (12h à 21h, 10 colonnes : nombre, barre, étiquette horaire, icône d'alerte >= 30, icône interdit à 40 ; légende ; bouton « Complet ce soir ») -> « Arrivées du jour » groupées par heure (le service passé est replié dans un `details`). Desktop >= 1024 : colonne principale (à confirmer, arrivées) + colonne latérale 360 px (jauges, capacité par heure).
Règles : seuil « Presque complet » = 30/40 (75 %) ; « Complet » = 40/40. Une réservation occupe sa place `table_block_duration_minutes` (120 min par défaut). **Le calcul doit réutiliser la logique de disponibilité existante (`reservation-rules.ts`), pas une copie** (TDY-02). Équivalent texte du graphique : chaque colonne porte un texte masqué « 31 couverts sur 40 à 20h, presque complet ».
« Complet ce soir » : bouton secondaire sous la capacité -> `Dialog alert` « Fermer les réservations ce soir ? » (rappelle que les réservations existantes sont conservées, réversible) -> état `today-full` : bandeau `role="status"` « Complet ce soir » + bouton « Rouvrir ce soir ». Modèle de données = décision ACC-03 (phase 17), non tranché ici.

### 5.2 Réservations (`reservations.html`)
Contrôles : titre de date avec flèches (jour -1/+1), segment Hier / Aujourd'hui / Demain, sélecteur de date natif (bouton calendrier 44 px), recherche (nom, téléphone, notes, côté client, sans requête), puces de statut avec compteurs (Toutes, À confirmer, Confirmées, Terminées, Annulées, Absents ; défilement horizontal < 768, retour à la ligne >= 768). Ligne de synthèse « 13 réservations · 49 couverts · Heures de Krabi (UTC+7) ». Liste groupée Déjeuner/Dîner avec sous-totaux. Chaque ligne : heure, nom, source · langue, téléphone, couverts, badge de statut, boutons 44 px appel `tel:` et WhatsApp (`https://wa.me/<chiffres>`, nouvel onglet), puis **occasion, allergie, note toujours visibles sans ouvrir**, puis actions. Les heures sont celles de la base (`reservation_time` HH:MM), affichées telles quelles, sans `Date`/fuseau (RSV-05).
Allergies : le modèle n'a pas de champ dédié (`occasion`, `admin_notes` seulement). La maquette affiche une pastille « Allergie » (icône + texte) quand une allergie est connue ; voir question ouverte 2.

### 5.3 Saisie manuelle (`manual-form.html`)
Bouton global « + Réservation » dans la barre supérieure de toute page admin (desktop : haut droite ; mobile/tablette : barre supérieure, 44 px, icône + libellé). Ouvre une feuille (sheet). Champs réels de `ManualReservationForm` repris tels quels : `customer_name` (requis, 100), `customer_phone` (tel, facultatif pour « sans réservation »), `customer_email` (facultatif), `source` (requis : `whatsapp | telephone | sans_reservation`), `reservation_date`, `reservation_time` (requis), `party_size` (1-50, requis), `admin_notes` (2000). Changements de présentation seulement : ordre (source d'abord, email et notes en dernier), source en 3 boutons radio de 48 px (même `name`/valeurs), stepper -/+ autour du champ numérique, date par défaut = jour affiché. POST `/api/reservations/manual` inchangé ; succès = 201, fermeture, toast « Réservation ajoutée », liste rechargée.

### 5.4 États (fichiers)
| État | Fichier | Comportement |
|---|---|---|
| Défaut avec contenu | `today.html`, `reservations.html` | 14 réservations d'exemple, 3 à confirmer, pic dîner 31/40 |
| Après action réussie | `reservations-success.html` | toast `role="status"` « Réservation d'Anna Schmidt confirmée. » |
| Action en cours | `reservations-busy.html` | ligne `aria-busy`, fond surface-2, tous ses boutons `disabled`, bouton pressé « Confirmation… » + spinner ; les autres lignes restent actives |
| Échec d'action | `reservations-actionfail.html` | ligne inchangée (reste « À confirmer »), message en ligne `role="alert"` + « Réessayer », toast d'erreur persistant |
| Annulation | `reservations-cancel.html` | `alertdialog`, rappel client/date/heure/couverts, focus sur « Garder la réservation », bouton danger « Annuler la réservation » |
| Chargement | `*-loading.html` | squelettes, `aria-busy`, texte masqué `role="status"` |
| Vide | `today-empty.html`, `reservations-empty.html` | « Aucune réservation ce jour » + « + Réservation » + « Voir aujourd'hui » |
| Aucun résultat de recherche | `reservations-noresult.html` | « Aucun résultat pour « zzz » » + « Effacer la recherche » |
| Erreur réseau | `*-error.html` | `role="alert"`, « Impossible de charger les réservations », « Aucune réservation n'a été modifiée », « Réessayer » ; la barre de date et les filtres restent utilisables |
| Service complet | `today-confirm-full.html`, `today-full.html` | dialogue de confirmation puis bandeau + « Rouvrir ce soir » |
| Formulaire vide / invalide / en cours / échec | `manual-form*.html` | invalide : bandeau + erreur sous chaque champ (`aria-invalid`, `aria-describedby`, icône + texte) ; en cours : champs `readonly`, bouton « Ajout… » désactivé ; **échec : saisie conservée**, bandeau « Impossible d'ajouter la réservation. Vos informations sont conservées. » |

## 6. Microcopie FR (extrait de référence)

Aujourd'hui / Réservations / + Réservation / Couverts réservés (pic de chaque service) / N à confirmer / Rien à confirmer / Arrivées du jour / Couverts occupés par heure / Libre · Presque complet (30 et plus) · Complet (40) / Complet ce soir / Rouvrir ce soir / Fermer les réservations ce soir ? / « Le site n'acceptera plus de nouvelle réservation pour ce soir. Vous pourrez rouvrir à tout moment. » / Oui, complet ce soir / Confirmer · Terminer · Absent · Annuler / Confirmation… / Annuler cette réservation ? / « Un email d'annulation sera envoyé au client si une adresse est renseignée. Cette action ne peut pas être défaite ici. » / Garder la réservation / Annuler la réservation / Aucune réservation ce jour / Aucun résultat pour « x » / Impossible de charger les réservations / « Vérifiez la connexion, puis réessayez. Aucune réservation n'a été modifiée. » / Réessayer / Heures de Krabi (UTC+7) / Nouvelle réservation / Ajouter la réservation · Ajout… / Réservation ajoutée / Impossible d'ajouter la réservation. Libellés d'accessibilité : « Confirmer la réservation de {nom}, {heure} », « Appeler {nom} », « WhatsApp {nom} (nouvel onglet) », « Jour précédent / suivant », « Choisir une date ».

## 7. Breakpoints

| Plage | Coque | Réservations | Aujourd'hui |
|---|---|---|---|
| < 768 (téléphone, mesuré 390) | barre haute + barre basse 3 entrées | cartes empilées, actions pleine largeur sous la ligne | une colonne ; jauges + « à confirmer » dans les 844 px du premier écran |
| 768-1023 (tablette) | idem | 2 lignes : (heure, nom, couverts, statut, contact) puis (notes, actions à droite) | une colonne, jauges en 2 colonnes larges |
| 1024-1279 | barre latérale 232 px | idem tablette | 2 colonnes (principale + 360 px) |
| >= 1280 | barre latérale | 1 ligne par réservation + notes sous le nom ; en-tête de colonnes | idem |

## 8. Mouvement et `prefers-reduced-motion`

Durées : 100-180 ms (boutons, puces, flèche de `details`), 180-200 ms (voile, dialogue : fondu + 8 px), 260 ms (feuille : 24 px). Courbe `cubic-bezier(.2,.7,.2,1)`. Transformer/opacité uniquement. Spinner 0,9 s et squelettes (pulsation) : seuls mouvements continus, toujours accompagnés d'un libellé. Sous `prefers-reduced-motion: reduce` : toutes les animations et transitions sont désactivées (`animation: none`, `transition: none`) ; le spinner devient une icône fixe, le libellé « Confirmation… » porte l'information ; les dialogues apparaissent sans mouvement.

## 9. Accessibilité (ACC-03, côté UI)

Landmarks `header/nav/main`, lien d'évitement, un H1 par page, `aria-current` sur nav et segment, `aria-pressed` sur puces, `role=meter` sur jauges, `role=status/alert` selon l'urgence, dialogues `aria-modal` avec focus piégé et rendu, `inert` sur l'arrière-plan. Cibles >= 44 px (y compris boutons d'icône, puces, radios 48 px, `summary` 48 px). Focus visible 3 px `--adm-info`. Texte >= 14 px. Ordre de tabulation = ordre visuel. Aucun statut par la couleur seule. Champs : `label` visible (jamais placeholder seul), erreurs en texte + icône, `autocomplete="off"` sur les champs client, `inputmode`.

## 10. Vérifications MESURABLES (script `tools/shoot.js`, Chromium, 19 pages x 3 viewports = 57 mesures)

| Contrôle | Seuil | Résultat sur les maquettes |
|---|---|---|
| Débordement horizontal de page (`scrollWidth - clientWidth`) | 0 | 0 partout |
| Texte visible (hors `.sr-only`) | >= 14 px | 0 violation |
| Cibles interactives (liens, boutons, champs, `summary`, radios via leur `label`) | >= 44 x 44 px | 0 violation |
| Contraste texte (couleur calculée sur fond effectif ; 4,5:1, 3:1 si >= 24 px ou 18,66 px gras) | AA | 0 violation |
| Premier écran 390x844 « Aujourd'hui » : bas de la carte des jauges / bas du premier bouton « Confirmer » | <= 844 px | 578 px / 838 px |
| Viewports | 390x844 DPR2, 768x1024, 1440x900 | captures dans `screenshots/` (57) |

Limite : les captures pleine page montrent la barre basse collée au milieu de la page (artefact de `position: sticky` en capture pleine page, pas un défaut). Mesures brutes : `measures.json`. Reproduire : `node tools/build.js <dossier>` puis `node tools/shoot.js <dossier>` avec `playwright-core` installé HORS du dépôt.

À vérifier à l'implémentation (non mesurable sur des maquettes statiques) : ordre de focus réel, piégeage du focus des dialogues, annonces lecteur d'écran, `prefers-reduced-motion` en navigateur, comportement de `type=date`/`type=time` sur iOS/Android, vraies polices (Inter, Cormorant) chargées via `next/font` à la place du lien Google des maquettes.

## 11. Exigence -> écran -> vérification

| Exigence | Écran / élément | Vérification |
|---|---|---|
| TDY-01 arrivées par heure, couverts sur `max_covers`, à confirmer | `today.html` : jauges, carte « N à confirmer », « Arrivées du jour » groupées par heure | jauges avec `aria-valuemax=40` ; premier écran 390 contient jauges et premier « Confirmer » (<= 844 px) ; test d'implémentation : somme de couverts du jour = somme des lignes ; `max_covers` lu des réglages, pas codé en dur |
| TDY-02 indicateur par créneau 12h-22h, logique de disponibilité existante | `today.html` carte « Couverts occupés par heure » (12h-21h) | 10 colonnes, nombre + hachures + icône >= 30 ; test d'implémentation : valeur de chaque créneau == résultat de `reservation-rules.ts` pour la même date ; texte masqué par colonne |
| RSV-01 statut en un tap via helper testé | boutons de ligne selon statut (§4) ; `reservations-cancel.html` | tableau d'actions du §4 couvert par le test du helper ; un seul tap hors annulation ; `PUT` et énumération inchangés |
| RSV-02 liste dense, date, recherche client | `reservations.html` : segment, flèches, sélecteur, recherche, puces + compteurs | 0 débordement aux 3 viewports ; filtrage sans requête réseau (test d'implémentation) ; états vide/aucun résultat |
| RSV-03 liens `tel:` et WhatsApp | boutons 44 px dans chaque ligne | `href` `tel:+66…` et `https://wa.me/<chiffres>` ; `aria-label` avec le nom ; cibles >= 44 px (mesuré) |
| RSV-04 « + Réservation » global | barre supérieure de toutes les pages ; `manual-form*.html` | présent sur les 19 maquettes ; ouvre la feuille ; champs == `ManualReservationForm` ; saisie conservée en cas d'échec |
| RSV-05 boutons désactivés pendant la requête ; heures de Krabi | `reservations-busy.html` ; mention « Heures de Krabi (UTC+7) » | tous les boutons de la ligne `disabled` + `aria-busy` ; test d'implémentation : l'heure affichée == `reservation_time` brut, sans `Date` |
| RSV-06 emails, cron J+1, KPI inchangés | aucun écran ne change ces comportements | hors périmètre design : UAT preview hors service 12h-22h (phase 15) |
| ACC-03 (UI) « Complet ce soir » en un tap | `today-confirm-full.html`, `today-full.html` | un tap + confirmation ; bandeau + « Rouvrir » ; réversible ; **modèle de données non tranché** (question 1) |
| ACC-03 / ACC-0x accessibilité côté UI | tous les écrans | mesures du §10 ; revue manuelle clavier/lecteur d'écran à l'implémentation |
