# D3 : contrat de design « Site public » + « Carte » (phases 13 et 14)

Milestone v1.1 « Refonte de l'admin ». Direction : **luxe discret** (ivoire chaud, vert jungle, laiton en touche rare, filets fins, air, chiffres tabulaires) tenue dans un **outil de travail sobre**. Admin en français fixe, sans i18n.
Maquettes : `site-public-*.html`, `carte*.html` (ouvrir avec `tokens.css` + `d3.css`). Captures : `screens/<page>__390|768|1440.png`. Les zones « Navigation / Menu (D1) » en pointillés sont des réservations pour le shell D1, pas du design D3.

## 1. Direction et jetons

Jetons partagés exacts dans `tokens.css` (`--adm-*`). Dérivés locaux D3 (préfixe `--d3-`, à promouvoir en `--adm-*` si D1 valide) :

| Jeton local | Valeur | Rôle |
|---|---|---|
| `--d3-field` | `#7A867D` | bordure de champ, interrupteur, case (3,79:1 sur blanc, WCAG 1.4.11) |
| `--d3-ok-bg / err-bg / warn-bg / info-bg` | `#E6F1E9 / #F8E7E3 / #F8EBD2 / #E3EDF2` | fonds de badges et alertes |
| `--d3-ease` | `cubic-bezier(.25,1,.5,1)` | ease-out-quart, seule courbe utilisée |

Règles de direction :
- **Laiton** (`--adm-accent`) : uniquement le filet 1 px de 40 px sous chaque titre de page. Jamais de texte (`--adm-accent-text` si du texte laiton est un jour nécessaire : 5,67:1).
- **Aucune ombre** : séparation par filets 1 px `--adm-line`, rayons 8 (champs, boutons, lignes) et 12 (cartes, feuilles, dialogues, onglets).
- Titres de page et de section : `Cormorant Garamond` (déjà chargée par `next/font`, variable `--font-cormorant`), repli Georgia. Tout le reste : sans-serif système, `font-variant-numeric: tabular-nums` sur toute l'admin (prix, heures, couverts alignés).
- Échelle : 14 (méta, badges, aides) / 15 (libellés compacts) / 16 (corps, champs) / 17 (noms de plats, jours) / 22 (titres de section) / 30-36 (titre de page). Plancher absolu 14 px.
- Icônes : `lucide-react`, trait 1,75, 20 px (16 dans badges). Aucun emoji. Dans les maquettes les icônes sont des SVG Lucide inline.
- Le statut n'est jamais porté par la couleur seule : chaque état a icône + mot (Disponible / Indisponible, Modifié, Fermé, Programmée, Enregistré, etc.).
- **Devise** : la carte s'affiche en **bahts (฿)** côté public (`src/utils/menu.ts`) alors que l'admin actuel affiche « € ». Le contrat impose ฿ partout dans l'admin carte.

### Primitives consommées (D1) et variantes demandées
| Primitive | Variantes utilisées par D3 |
|---|---|
| Button | `primary` (vert jungle), `secondary` (contour vert), `ghost`, `danger` (plein, dialogues), `quiet-danger` (contour rouge, actions destructives secondaires) ; tailles `md` 48 px, `sm` 44 px, `icon` 44x44 (jamais en dessous) ; états `disabled`, `busy` (spinner + libellé « Enregistrement… », `aria-busy`) |
| Field | libellé au-dessus, aide 14 px sous le champ, `(facultatif)` en gris dans le libellé, erreur `aria-invalid` + `aria-describedby` vers un message icône + texte rouge ; champ 48 px, bordure `--d3-field` ; variante `price` (suffixe ฿ dans la bordure, valeur à droite, 18 px gras) ; variante `stepper` (− / valeur / +, boutons 56 px) |
| Switch | `role="switch"`, piste 52x30, pouce avec coche (actif) ou tiret (inactif), **libellé texte obligatoire à côté** (« Ouvert / Fermé », « Disponible / Indisponible », « Bannière affichée / masquée ») ; zone cliquable 44 px |
| Badge | `ok`, `warn`, `err`, `info`, `mute`, toujours icône + texte |
| Dialog | `alertdialog` (suppression, abandon) ; feuille latérale `sheet` (bas d'écran < 768, panneau droit 460 px >= 768) pour « Ajouter un plat » et « Détails » |
| Toast | `success` (`role="status"`, auto 4 s) et `error` (`role="alert"`, **persistant**, bouton « Réessayer » + fermer), 52 px min, 520 px max |
| Tabs/segments | `role="tablist"`, segment actif = fond blanc + contour vert 1 px + texte vert (pas de couleur seule) |
| Alert en ligne | `err`, `ok`, `info` (bordure complète + fond teinté + icône, jamais de liseré latéral) |

## 2. Architecture des écrans

### 2.1 Site public (une entrée, 4 onglets)
`/admin/site-public`, onglets : **Horaires · Exceptions · Annonces · Capacité** (segmented, 4 x ~84 px à 390 px, icônes masquées sous 768). Un en-tête commun (titre, filet laiton, phrase d'usage). Une carte de formulaire + un **panneau « Aperçu »** : à droite et collant >= 1180 px, sous le formulaire en dessous (aperçu toujours visible, jamais replié).

| Onglet | Contenu (champs réels) | Enregistrement | Aperçu |
|---|---|---|---|
| Horaires | 7 jours (affichage lundi → dimanche, données inchangées 0 = dimanche) : interrupteur Ouvert/Fermé, heure d'ouverture, heure de fermeture. Badge « Modifié » sur toute ligne changée. | barre collante : « Enregistrer les horaires » (PUT `/api/hours`, tout d'un coup comme aujourd'hui) | liste des 7 jours, jour courant en gras « (aujourd'hui) », se met à jour en direct |
| Exceptions | formulaire « Nouvelle exception » : Date, Titre (facultatif), Ouvert, heures, Note (facultatif) ; liste « Dates à venir » avec badge Ouvert HH:MM – HH:MM / Fermé et bouton supprimer 44 px | « Ajouter l'exception » (action immédiate) ; suppression avec dialogue | prochaines exceptions telles que visibles |
| Annonces | Bannière affichée (interrupteur), Titre (facultatif), Message, Couleur (5 : Orange, Vert, Rouge, Bleu, Violet ; coche + nom), Début / Fin (facultatifs) | « Enregistrer l'annonce » | bannière rendue dans la couleur choisie + badge d'état : Aucune bannière / Programmée du… au… / Affichée maintenant / Terminée / Masquée |
| Capacité | « Couverts maximum par service » (`max_covers`, 1-200, stepper) ; « Durée d'occupation d'un créneau » (`table_block_duration_minutes`, 30-480 par pas de 15, stepper + puces 1 h 00 / 1 h 30 / 2 h 00 / 2 h 30 / 3 h 00) | « Enregistrer la capacité » (PUT `/api/settings`, 2 valeurs) | phrase + frise 12h-22h : une réservation à 19:00 occupe la durée choisie |

**Aucun mot « table » dans l'UI** : on parle de couverts, de créneau, de « durée d'occupation ». Texte d'aide : « Temps pendant lequel une réservation compte dans les couverts après son heure d'arrivée : repas et marge de service. »

### 2.2 Carte (un seul écran)
`/admin/carte`. Ordre vertical à 390 px : titre → pages (Déjeuner (n) · Dîner (n)) → recherche « Rechercher un plat » → résumé (« 9 plats », badge « 1 indisponible ») → catégories repliables → barre collante « Ajouter un plat » (< 768 ; >= 768 le bouton est dans l'en-tête avec « Réorganiser »).

Ligne de plat (la même à toutes les tailles) :
- nom (17 px gras) + description tronquée 1 ligne ; indisponible = nom grisé + fond `--adm-surface-2` + libellé d'interrupteur « Indisponible » ;
- **prix** : champ numérique 48 px, suffixe ฿, enregistré à la validation du clavier (Entrée/OK) ou au bouton « Valider » ; champ modifié = bordure verte 2 px + boutons « Valider » / « Annuler » ;
- **interrupteur Disponible / Indisponible** : enregistré immédiatement (optimiste), annulé et toast d'erreur en cas d'échec ;
- drapeaux **lecture seule** en ligne : Végétarien (feuille), Épicé (flamme), Sans gluten (coche) + ligne « Allergènes : … » ; modification dans « Détails » ;
- bouton **Détails** (crayon + mot, 44 px) → feuille « Modifier le plat ».

Feuille « Ajouter un plat » (ajout rapide) : Catégorie (pré-sélectionnée sur la dernière utilisée), Nom du plat, Prix (฿), Disponible ; deux boutons : « Ajouter le plat » et « Ajouter et en saisir un autre » (la feuille reste ouverte, nom vidé, catégorie et focus conservés).
Feuille « Modifier le plat » : Nom, Description, Prix, Libellé de prix (remplace le prix), Photo (cadre étiqueté « Emplacement photo : aucune photo enregistrée » + « Téléverser une image » + adresse), Allergènes, cases Disponible / Végétarien / Épicé / **Sans gluten (confirmé par la cheffe)**, bouton quiet-danger « Supprimer ce plat ».
En-tête de catégorie : bouton chevron + nom + « n plats · m indisponible(s) » (`aria-expanded`), menu « Options de la catégorie » (Renommer, Supprimer → dialogue). Gestion des pages (créer, renommer, désactiver, slug) : hors écran quotidien, accessible depuis le menu de l'onglet de page (non maquetté, voir D3-CRITIQUE Q4).
**Réorganiser** : remplace le glisser-déposer par des flèches haut/bas 44 px sur plats et catégories (`/api/menu/reorder`).

## 3. États (tous maquettés)

| État | Site public | Carte |
|---|---|---|
| Chargement | squelettes 52 px, `aria-busy`, texte masqué « Chargement… » (`role="status"`) | squelettes de 2 catégories |
| Vide | Exceptions : « Aucun horaire exceptionnel » ; Annonces : formulaire vierge + « Aucune bannière n'est affichée sur le site. » | « Cette page de carte est vide » + « Ajouter une catégorie » ; recherche : « Aucun plat ne correspond » + « Effacer la recherche » |
| Erreur de chargement | icône + « Impossible de charger … » + « Rien n'a été modifié. » + Réessayer | idem |
| Modifications non enregistrées | barre collante « Modifications non enregistrées » (point + texte ambre) + Annuler + Enregistrer ; badge « Modifié » par ligne (horaires) ; dialogue « Quitter sans enregistrer ? » (Rester ici / Quitter sans enregistrer) au changement d'onglet ou de page | prix : bordure verte + Valider/Annuler ; feuille Détails : dialogue « Fermer sans enregistrer ? » |
| Enregistrement en cours | bouton « Enregistrement… » (spinner, `aria-busy`), champs en lecture seule (pas `disabled`, le texte reste lisible), Annuler désactivé | prix : « Enregistrement… » sous le champ ; interrupteur : spinner à la place de la coche |
| Succès | toast « Horaires enregistrés. », « Exception ajoutée. », « Annonce enregistrée. », « Capacité enregistrée. » ; barre → « Tout est enregistré » | ligne : « Enregistré » + coche (3 s) **et** toast « Prix de « Tom Kha Gai » enregistré : 395 ฿. » ; « « Curry vert de canard » est indisponible sur le site. » |
| Échec, saisie conservée | alerte en ligne en haut du formulaire (titre « … n'a(ont) pas été enregistré(e)(s). » + « Vos modifications sont toujours affichées ci-dessous : rien n'est perdu. ») + toast d'erreur persistant avec Réessayer ; **aucun champ réinitialisé** | champ prix en bordure rouge 2 px + « Le prix n'a pas été enregistré. 395 ฿ saisi, rien n'est perdu. » + Réessayer / Annuler + toast ; échec d'ajout : feuille ouverte, champs conservés |
| Validation | Capacité : « Entrez une durée entre 30 et 480 minutes. Vous avez saisi 20. » (icône + texte, `aria-invalid`) | |
| Suppression | dialogue `alertdialog` « Supprimer cette exception ? » : conséquence, « Cette action est définitive. », Annuler (focus initial) / Supprimer l'exception | « Supprimer ce plat ? » (suggère « indisponible » comme alternative), « Supprimer la catégorie « Desserts » ? » (« Ses 2 plats seront supprimés avec elle. ») |

Règle d'erreur : le message nomme **ce qui a échoué**, **ce qui est conservé**, **ce qu'on peut faire** (Réessayer). Jamais de code HTTP ni de stack trace (cohérent avec la règle API du projet).

## 4. Microcopy FR (extraits normatifs)
Tutoiement exclu, vouvoiement sobre. Boutons = verbe + objet : « Enregistrer les horaires », « Ajouter l'exception », « Ajouter le plat », « Ajouter et en saisir un autre », « Supprimer le plat », « Réessayer ». Pas de point d'exclamation, pas d'emoji, pas de tiret cadratin. Heures `HH:MM` (24 h), dates longues en liste (« jeudi 24 décembre 2026 »), numériques dans les champs. Toasts : phrase courte avec point.

### Libellés figés par `tests/menu-admin-wiring.test.ts` (à ne pas modifier)
- Case à cocher : **`Sans gluten (confirmé par la cheffe)`** (feuille « Modifier le plat »). Le badge de ligne « Sans gluten » est un affichage, pas ce libellé.
- Chaînes de source lues par le test dans **`src/app/admin/menu/[pageId]/page.tsx`** : `is_gluten_free: itemForm.is_gluten_free` et `item.is_gluten_free ?? false`. **Contrainte d'implémentation** : si l'écran unique remplace cette route, soit ces trois chaînes restent dans ce fichier (composant de la feuille Détails), soit le test est mis à jour pour pointer le nouveau fichier avec **les mêmes assertions** (pas de suppression de garde-fou).
- Routes API : `revalidateTag(MENU_TAG, 'max')` x3 (items, pages, categories) et x1 (reorder), importés depuis `next/cache` et `@/utils/menu`. L'écran n'ajoute **aucune** écriture hors de ces routes (prix = PUT items, disponibilité = PUT items, ajout = POST items, réordonner = reorder).
- `is_gluten_free` reste booléen validé côté API (400 sinon).

## 5. Breakpoints
| Largeur | Disposition |
|---|---|
| < 768 (cible 390) | colonne unique, barre d'ajout collante en bas (carte), barre d'enregistrement collante (site), feuilles en bas d'écran, onglets sans icônes, lignes de plat sur 2 rangées (nom + interrupteur / prix + Détails), lignes d'horaires sur 2 lignes |
| 768-1179 | colonne unique élargie (marges 40), onglets avec icônes, feuilles = panneau droit 460 px, lignes de plat sur 1 rangée (nom / prix 170 / interrupteur 190 / Détails 120), lignes d'horaires sur 1 ligne, aperçu sous le formulaire |
| >= 1024 | le rail de navigation D1 (232 px) apparaît ; sinon barre haute D1 56 px |
| >= 1180 | aperçu à droite (360 px, `position: sticky`) |
Variable `--adm-bottomnav-h` (0 par défaut) : à renseigner par D1 si une navigation basse existe ; barres collantes et toasts s'y ajoutent.

## 6. Mouvement et `prefers-reduced-motion`
- Uniquement `transform` et `opacity` (+ couleurs/bordures 180 ms), courbe `--d3-ease` (ease-out-quart). Pas de rebond, pas d'animation de layout.
- Toast : montée 12 px + fondu, 240 ms. Feuille : montée 24 px + fondu, 280 ms. Scrim : fondu 200 ms. Interrupteur : glissement 180 ms. Bouton pressé : `scale(.98)`. « Enregistré » : reste 3 s puis fondu. Squelettes : pulsation d'opacité.
- Tout est enveloppé dans `@media (prefers-reduced-motion: no-preference)`. En mouvement réduit : apparitions instantanées, **pas de rotation** du spinner (le texte « Enregistrement… » porte l'information), squelettes statiques.

## 7. Accessibilité
- Cibles >= 44x44 px partout (champ prix mesuré sur son cadre, cases mesurées sur la ligne cliquable). Texte >= 14 px. Contrastes AA mesurés (section 9).
- Onglets : `role="tablist"`, flèches gauche/droite, `aria-selected`, panneau `aria-labelledby`. Interrupteurs `role="switch"` + `aria-checked` + nom accessible explicite (« Disponibilité de Tom Kha Gai »). Puces de durée et couleurs : `role="radiogroup"` / `radio`. Cases : `role="checkbox"`.
- Catégories : bouton `aria-expanded`, contrôle la liste. Prix : `<label class="sr-only">Prix de … en bahts</label>`, `inputmode="decimal"`, erreurs liées par `aria-describedby`.
- Dialogue : `alertdialog`, `aria-modal`, piège de focus, **focus initial sur Annuler**, Échap = Annuler, retour du focus sur le déclencheur. Feuilles : `dialog`, focus sur le premier champ, Échap ferme (avec confirmation si modifié). **Plus aucun `confirm()` natif.**
- Toasts : succès `role="status"` (poli), erreur `role="alert"` (assertif) et jamais auto-fermé ; l'échec est aussi dans l'alerte en ligne pour ne pas dépendre d'un message éphémère.
- Anneau de focus : 3 px `--adm-info`, décalage 2 px, jamais supprimé. Ordre de tabulation = ordre visuel. Champ date/heure natifs (clavier mobile adapté, locale fr).
- Mobile : champs 16 px (pas de zoom iOS), `100dvh`, pas de `confirm`/`alert`.

## 8. Écarts assumés avec l'existant
Ordre des jours lundi → dimanche (affichage seul) ; glisser-déposer remplacé par flèches (le DnD reste possible >= 768 en option) ; la vignette photo en ligne disparaît (photo dans Détails) ; suppression des emojis ; « € » remplacé par « ฿ » ; page `menu/` (liste des pages) et `menu/[pageId]` fusionnées en un écran ; `/admin/hours`, `/admin/announcement`, `/admin/settings` fusionnées en « Site public » (les libellés « Gestion des tables » et « Durée de blocage d'une table » de Settings disparaissent, cohérent avec TAB-*).

## 9. Vérifications mesurables
Exécutées par `verify/run.mjs` (Playwright hors repo, Chromium local) sur **49 pages x 3 viewports = 147 rendus** (390x844 DPR2, 768x1024, 1440x900), chargement et états compris. Script validé par un test négatif (un span 12 px gris clair et un bouton 30 px sont bien détectés).
| Contrôle | Seuil | Résultat |
|---|---|---|
| Débordement horizontal (`scrollWidth > clientWidth`) | 0 | 0 sur 147 rendus |
| Texte visible < 14 px | 0 | 0 |
| Cibles interactives < 44x44 | 0 | 0 |
| Contraste texte (AA : 4,5 ; grand texte 3) | 0 échec | 0 échec ; plus faible : `--adm-muted` sur `--adm-surface-2` 4,74:1 |
| Contraste non-texte des bordures de champ | >= 3:1 | `--d3-field` 3,79:1 |
Ratios clés : encre/fond 13,64 ; muted/fond 5,09 ; blanc/vert 11,89 ; ok/fond ok 5,48 ; warn/fond warn 5,03 ; danger/fond err 5,48 ; info/fond info 5,81 ; bannières 7,9 à 8,9. `--adm-accent` (#B08D3C) sur fond = 2,84:1 : **décor uniquement** (filet), jamais du texte.
Vérifications à refaire sur l'implémentation (mêmes seuils) : script de rendu + axe-core en CI manuelle ; test clavier (tab, flèches onglets, Échap) ; lecteur d'écran sur dialogue et toasts ; mouvement réduit activé ; zoom 200 % sans perte.

## 10. Exigence → écran → vérification
| Exigence | Écran(s) | Vérification |
|---|---|---|
| **SITE-01** horaires, horaires exceptionnels, annonces et capacité/durée réunis dans « Site public » | `site-public-horaires.html`, `-exceptions`, `-annonces`, `-capacite` (4 onglets d'une même entrée) | un seul lien de navigation « Site public » ; les 4 sections atteignables en 1 tap depuis l'en-tête ; `Durée d'occupation d'un créneau` présent, `grep -i "table"` sur l'UI = 0 ; l'aperçu reflète la saisie (horaires, bannière) ; mêmes API (`/api/hours`, `/special-hours`, `/announcement`, `/settings`) : le site public se comporte comme avant |
| **SITE-02** retour (toast) et erreur lisible à chaque modification | états `--succes`, `--echec`, `--enregistrement`, `--non-enregistre`, `--quitter`, `--invalide`, `--suppression`, `--chargement`, `--erreur`, `--vide` de chaque onglet | chaque enregistrement émet un toast `role="status"` ; chaque échec émet alerte en ligne + toast `role="alert"` persistant, **valeurs des champs identiques avant/après l'échec** (test e2e) ; plus de `confirm()` natif (`grep confirm(` = 0 dans les pages admin concernées) |
| **MENU-01** carte sur un seul écran : prix, disponibilité, ajout rapide | `carte.html` + `--prix-edition/-enregistrement/-succes/-echec`, `--dispo-succes/-echec`, `--ajout-rapide/-echec`, `--details`, `--reordonner` | à 390 px, une seule URL : modifier un prix, basculer la disponibilité et ajouter un plat sans changer de page (parcours Playwright mobile) ; prix et interrupteur atteignables sans ouvrir de feuille ; toutes cibles >= 44 px ; aucune barre de défilement horizontale |
| **MENU-02** `revalidateTag` conservé, libellés figés conservés | feuille `--details` (case « Sans gluten (confirmé par la cheffe) ») | `npx vitest run tests/menu-admin-wiring.test.ts` vert ; compteurs `revalidateTag(MENU_TAG, 'max')` 3/3/3/1 inchangés ; chaînes `is_gluten_free…` présentes dans le fichier lu par le test (section 4) ; modification visible sur `/menu` après enregistrement |
