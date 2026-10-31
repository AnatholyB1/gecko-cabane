# Réconciliation D1 à D4 : jetons, composants, cohérence, critique

Milestone v1.1 « Refonte de l'admin ». Revue de cohérence des quatre jeux de maquettes (D1 système et shell, D2 Aujourd'hui et Réservations, D3 Carte et Site public, D4 Réputation et Accès). Aucun code applicatif. Les corrections ont été faites dans les HTML/CSS des maquettes (3 commits `fix(design)`), puis les rendus ont été régénérés (`gallery/renders-fixed/`, hors git).

Méthode : skills `critique`, `audit`, `impeccable`, `shape`, `layout`, `typeset`, `adapt`, `ui-ux-pro-max` et `web-design-guidelines` chargés ; script d'audit Playwright sur **104 pages × 3 largeurs = 312 combinaisons** (390, 768, 1440) avant et après correction ; relecture visuelle de 12 écrans (voir §4). Le détecteur `npx impeccable` n'a pas été relancé (réseau) ; ses règles ont été appliquées à la main.

---

## 1. Jetons : un seul jeu

### 1.1 Écarts trouvés

| Sujet | D1 | D2 | D3 | D4 | Décision |
|---|---|---|---|---|---|
| Jetons imposés (14) | référence | identiques | identiques | identiques | rien à corriger |
| Rayons | `--adm-radius`, `-lg` | `-sm`, `-md` | `--adm-r-sm`, `-md` | `--adm-radius`, `-lg` | noms D1 |
| Cible tactile | `--adm-target` | `--adm-touch` | `--adm-tap` | `--adm-target` | `--adm-target` |
| Police UI | `--adm-font-sans` **Inter Variable (fichier local)** | `--adm-font-ui` Inter (Google, non chargée hors ligne) | `--adm-font` Segoe UI | `--adm-font-ui` system-ui | `--adm-font-sans`, Inter partout |
| Police titre | `--adm-font-display` Cormorant (fichier local) | idem | `--adm-font-serif` (repli Georgia) | idem (repli Georgia) | `--adm-font-display` |
| Contour de champ | `--adm-field-border` **#7D867D** | `--d2-control-line` #858270 (teinte jaune) | `--d3-field` #7A867D | `--adm-line-strong` **#7E877F** | **#7D867D** (3,43:1 sur ivoire, 3,76:1 sur blanc) |
| `--adm-line-strong` | #CFC7B0 (filet décoratif, inutilisé) | non défini | non défini | **#7E877F, redéfini avec un autre sens** (conflit) | reste #CFC7B0 : filet décoratif renforcé, **jamais** un contour de contrôle |
| Fonds de statut | `--adm-*-bg` | `--d2-*-bg` | `--d3-*-bg` (err au lieu de danger) | `--adm-*-tint` | `--adm-ok/warn/danger/info/neutral-bg` |
| Filets de statut | absents | `--d2-*-line` | valeurs en dur | absents | **promus** : `--adm-ok-line`, `-warn-line`, `-danger-line`, `-info-line` |
| Scrim | `--adm-scrim` .45 | `--d2-scrim` .5 | n/a | `rgba(.55)` en dur | `--adm-scrim` |
| Courbe | `--adm-ease` (.25,1,.5,1) | (.2,.7,.2,1) | (.25,1,.5,1) | (.22,1,.36,1) | `--adm-ease` |
| Anneau de focus | **2 px vert `--adm-focus`** | 3 px **bleu** `--adm-info` | 3 px bleu | 3 px bleu | 2 px `--adm-focus` partout |
| Laiton clair | `--adm-accent-on-brand` #DDC078 | #E9D9AE en dur (D4) | n/a | #E9D9AE, #E3CE8F en dur | `--adm-accent-on-brand` pour le logotype ; les deux autres restent des écarts mineurs de la page de connexion (liste §5) |

### 1.2 Jeu réconcilié

Source unique : `d1-system-shell/tokens.css`. `d2/d3/d4 tokens.css` ne contiennent plus que `@import url("../d1-system-shell/tokens.css")` : **plus aucune valeur propre à une tranche**. Les `--d2-*` et `--d3-*` ont été supprimés ; les noms divergents ont été renommés dans les CSS et dans les styles en ligne des HTML.

Jeu final (identique à D1, plus 4 ajouts) :

| Groupe | Jetons |
|---|---|
| Surfaces et texte | `--adm-bg #F7F4EC`, `--adm-surface #FFF`, `--adm-surface-2 #F1ECE0`, `--adm-ink #1B2A22`, `--adm-muted #5E6B62`, `--adm-line #E2DCCB` |
| Marque | `--adm-brand #1F3D2F`, `-hover #173024`, `-tint #E6EDE8`, `-ink #FFF` |
| Laiton | `--adm-accent #B08D3C` (décor), `--adm-accent-text #7A5C16` (texte), `--adm-accent-on-brand #DDC078` (sur vert) |
| Statuts | `--adm-ok #2F6B45`, `--adm-warn #8A5A00`, `--adm-danger #A33A2B`, `--adm-info #2F5F7A`, chacun avec `-bg` et (**nouveau**) `-line` ; `--adm-neutral-bg #ECE7DA` |
| Contrôles | `--adm-field-border #7D867D`, `--adm-line-strong #CFC7B0` (décor), `--adm-focus #1F3D2F`, `--adm-scrim` |
| Forme et rythme | `--adm-radius 8`, `--adm-radius-lg 12`, `--adm-space-1..8`, `--adm-target 44`, `--adm-target-sm 36` (souris >= 1024), `--adm-shadow-float`, `--adm-ease`, `--adm-dur-1/2` |
| Type | `--adm-font-sans` Inter Variable (tabulaire), `--adm-font-display` Cormorant (titre de page et logotype seulement), échelle 14/16/18/22/28/34 |

Exception connue : `--adm-bottomnav-h: 0px` reste local à D3 (le gabarit n'a pas de barre du bas) ; à supprimer quand D3 reçoit le vrai shell.

### 1.3 Contrastes vérifiés (recalculés après réconciliation)

Statuts sur fond : warn 5,05, ok 5,45, danger 5,48, info 5,88, neutre `#4B574F` sur `neutral-bg` 6,13. Contour de champ 3,43 (ivoire) et 3,76 (blanc). Muted sur ivoire 5,09. Laiton texte 5,67. Marque sur ivoire 10,81. Tout passe (>= 4,5 texte, >= 3 non-texte).

---

## 2. Cohérence inter-écrans

### 2.1 Écarts trouvés et corrigés (mécaniques)

| Composant | Écart | Correction |
|---|---|---|
| **Titre de page** | D1 28/34 px ink ; D2 40 px, D3 30/36, D4 34 à 46, tous vert marque ; filet laiton 28, 40 (1 px), 40, 48 px | 28 px < 768 / 34 px >= 768, Cormorant 600, **vert marque** (D1 aligné sur les 3 autres), filet laiton **40 × 2 px** partout |
| **Surtitre** (interdit par D1) | D2 : date au-dessus du titre ; D4 : « GECKO CABANE » au-dessus de chaque titre | D2 : la date passe sous le titre ; D4 : surtitre supprimé |
| **Titres de section / dialogue** | D3 (h2 22 px) et D4 (h2 28 px, titres de dialogue 28 px, chiffres de synthèse 34 à 40 px) en **serif** ; D1 réserve le serif au titre de page | Inter 600 18 px (`--adm-text-lg`) ; chiffres de synthèse en Inter 600 28 px |
| **Button** | hauteur 48 px (D3) ; secondaire : texte vert + contour vert (D3), contour jaune (D2), contour `line-strong` 1,3:1 (D4, **sous le seuil 3:1**) ; survol primaire 3 verts différents ; corps 15 px (D2) | 44 px, 16 px, secondaire = texte ink + contour `field-border`, survol `--adm-brand-hover`. Variante **`danger-outline`** (utilisée par D2 « Annuler ») ajoutée au kit D1 |
| **Badge de statut** | D1 sans bordure ; D2, D3, D4 avec bordure ; D4 en 700 | sans bordure, 600 (les pastilles TEST/LIVE de D4 gardent la bordure et le 700 : garde-fou voulu) |
| **Dialogue** | D2/D4 sans ombre, titre serif 28 ; actions alignées à droite sur mobile (D4) | ombre `--shadow-float`, titre Inter 18, actions en colonne inversée < 768 et alignées à droite >= 768 (D2, D3, D4) |
| **Toast** | D2 : bloc sombre ; D3 : contour de couleur ; positions au centre, +76 px, +96 px | clair, filet + ombre, icône colorée ; position D1 (12 px au-dessus de la barre du bas ; coin bas droit 380 px >= 768) |
| **Onglets niveau 2** | D1 soulignés ; D3 segment pilule contour vert ; D4 segment plein vert | soulignés comme le kit, 16 px (D3, D4) |
| **Barre de navigation** | D2 : 3 entrées (« Plus ») ; D4 : 5 entrées dont « Menu » et « Accès », sans « Site public » ; D3 : aucun ; icônes différentes ; D4 : barre latérale **pleine verte** (D1 : ivoire, seul le lien actif est vert, « seule surface sombre = lead Aujourd'hui ») ; D4 : en-tête mobile vert | 5 entrées D1 (Aujourd'hui, Réservations, Carte, Site public, Réputation) dans D2 et D4, mêmes icônes lucide, mêmes libellés, liens croisés entre tranches ; barre latérale et en-tête D4 ivoire ; libellés de barre du bas à 12 px (exception E1 de D1) |
| **Libellés de statut** | D1 : En attente / Confirmée / Terminée / Annulée / **Non présenté**. D2 : « À confirmer » (45 badges + 13 filtres), « Absent » (63 + 13 filtres). D4 : « No-show », « Taux de no-show » | D2/D4 alignés sur le contrat D1 : **En attente**, **Non présenté(s)**, « Taux de non-présentés ». Le **bouton** d'action reste « Absent » : à 1440 « Non présenté » le fait passer sur deux lignes (décision 5) ; « 3 à confirmer » reste un compteur d'action |
| **Focus** | bleu 3 px (D2, D3, D4) | vert 2 px, décalage 2 px |
| **Polices** | 4 piles différentes, Cormorant remplacée par Georgia dans D3/D4 | Inter Variable + Cormorant Garamond Variable locaux dans les 4 tranches ; Google Fonts retiré de D2 |
| **Débordement** | 3 pages D3 (Annonces, 390) débordaient de 1 px ; passées à 12 à 17 px par la police Inter | `min-width: 0` sur les enfants de grille, onglets défilants dans leur conteneur : **0 débordement** |

### 2.2 Écarts non corrigés (décision ou travail de structure)

1. **Shell provisoire différent dans chaque tranche** : D2 et D4 ont leur propre coque (D1 fait foi), D3 n'a que des cadres « Zone D1 ». « + Réservation » et le menu du compte n'apparaissent que dans D1 et D2. À intégrer en phase 12, pas à dessiner quatre fois.
2. **Titre de sous-page** : D1 titre la page du nom de la sous-entrée (« Horaires »), D3 et D4 gardent le nom de la section + onglets (« Site public », « Réputation »). Recommandation : nom de section + onglets (le titre ne bouge pas quand on change d'onglet) ; D1 est l'exception à aligner.
3. **« Accès » (invitations, D4) n'a plus d'entrée de navigation** : les 5 entrées D1 ne le contiennent pas. Recommandation : dans le menu du compte (décision 8).
4. **Dialogue : bas de page sur mobile (D1) ou centré** : non vérifié en implémentation ; D1 dessine une feuille basse < 768.
5. **Deux laitons clairs en dur** sur la page de connexion D4 (#E9D9AE, #E3CE8F) : à remplacer par `--adm-accent-on-brand` à l'implémentation.
6. **Variantes de tableau** : D1 en cartes < 768 par `data-label`, D2 en lignes riches, D4 défilement horizontal : trois composants « liste », à fusionner en phase 11 en un seul DataTable avec slot de ligne.

---

## 3. Mesures avant / après (312 combinaisons)

| Contrôle | Avant | Après |
|---|---|---|
| Défilement horizontal | 3 pages | **0** |
| Texte < 14 px hors étiquettes de navigation | 0 | **0** |
| Étiquettes de navigation à 12 px | 5 (D1) | 5 par tranche, exception E1 documentée |
| Cibles < 44 px | 54 | 54, **tous expliqués** : cibles souris 36 px à 1440 (D1, exception E2, `pointer: fine`) et 13 pastilles radio D2 dont l'`input` invisible (42 px) est recouvert par une étiquette de 44 px (faux positif) |
| Familles de police | 4 | 1 |
| Jeux de jetons | 4 | 1 |

Score d'audit technique (grille `audit`, estimation après correction) : accessibilité 3, performance 3 (statique : polices variables locales, aucun script), responsive 3, thème 4 (était 2), anti-patterns 3 : **16/20, bon**. Score heuristique d'ensemble (grille `critique`) : **31/40**.

---

## 4. Critique et audit : 12 écrans relus

Écrans relus (avant et, pour la plupart, après correction) : Aujourd'hui 390 et 1440, Réservations 1440, dialogue d'annulation 390, Carte 390, Site public > Horaires 1440, Réputation > KPI 1440, Réputation > Avis 390, Connexion 390, shell D1 accueil 768 et 1440, shell D1 Site public 390.

**Verdict anti-IA** : passe. Pas de dégradé, pas de verre, pas de carte dans une carte, pas d'emoji, pas de côté coloré, aucune ombre sur le contenu, statut jamais par la couleur seule. Un seul tell : la palette ivoire et vert (« crème par réflexe »), imposée et assumée (E3). Le luxe tient à trois gestes : le titre Cormorant, le filet laiton de 40 px, la retenue des surfaces ; il est mince sur mobile (voir D-3).

### Défauts de design restants (non mécaniques)

| # | Sév. | Écran | Défaut | Pourquoi | Piste |
|---|---|---|---|---|---|
| D-1 | P1 | D2 Aujourd'hui, Réservations (390) ; D3 Carte (390) | Lignes de 130 à 200 px : 3 plats ou 3 réservations par écran ; 7 éléments par ligne de plat | La cheffe fait défiler au lieu de décider ; densité mobile = principal risque d'usage | Une ligne = nom, heure, statut, **une** action ; le reste derrière « Détails » ; catégories repliées sauf la dernière utilisée (`/distill`, `/layout`) |
| D-2 | P1 | D2 Aujourd'hui | « 3 à confirmer » dit trois fois (pastille d'en-tête, titre de bloc, trois badges « En attente »), et trois boutons pleins « Confirmer » identiques se concurrencent avec « + Réservation » ; sur mobile les jauges passent avant le bloc d'action | Hiérarchie plate : l'œil ne sait pas où est LA tâche | Supprimer la pastille d'en-tête, un « Tout confirmer » (3) ou ne garder qu'un bouton plein par bloc ; action avant jauges (`/layout`) |
| D-3 | P1 | D4 Réputation > KPI | Page de 2 856 px (1 440) faite de cinq cartes de même poids ; l'alerte critique (note <= 3) est tout en bas, sous la mécanique d'envoi TEST ; le tableau de 9 colonnes défile dès 768 | La donnée qui compte (alerte, tendance) est enterrée sous le garde-fou technique, deux publics (lecture du propriétaire, essai du développeur) dans une seule page | Alertes et synthèse en tête ; envoi TEST et passage en live repliés dans « Envoi du rapport » ; détail de semaine en panneau (`/layout`, `/distill`) |
| D-4 | P2 | D3 Carte | Le toast recouvre la ligne en cours d'édition ; deux contrôles (prix, Détails) à 12 px d'écart | Erreur de cible avec doigts mouillés | Toast en haut ou décalé ; 16 px d'écart minimum |
| D-5 | P2 | D1 Accueil 1440 et 768 | Moitié basse vide ; l'accueil est un menu de cinq cartes qui répète la barre latérale, sans aucun chiffre du jour | Le premier écran ne répond pas à « comment est le service ? » | Soit accueil = Aujourd'hui (décision 1), soit trois chiffres du service dans le lead |
| D-6 | P2 | D3 Horaires | 7 jours × 2 champs : 118 px par jour sur mobile ; bouton « Enregistrer » gris dans l'état « rien à enregistrer » (se lit comme cassé) | Saisie longue pour un horaire qui ne change presque jamais | Résumé « Tous les jours 12:00 à 22:00 » + « Personnaliser » ; bouton masqué ou libellé « Enregistré » |
| D-7 | P2 | D4 Connexion, Invitation | Surtitres (« CONNEXION », « ESPACE DE GESTION ») au-dessus de titres qui disent la même chose ; bandeau vert plein de 180 px avant le premier champ sur mobile | Pousse le formulaire sous la ligne de flottaison du téléphone ; répète le titre | Supprimer « CONNEXION » ; réduire le bandeau < 768 |
| D-8 | P2 | Tous, mobile | Cormorant 600 à 28 px fin sur téléphone en plein soleil ; le filet laiton de 40 px est presque invisible à 390 | Le « luxe » est ce qui s'efface le premier sur l'appareil de la cheffe | Tester 700 sur mobile ; filet 2 px en `--adm-accent` (fait) ; décision 3 |
| D-9 | P3 | D2 | Pas d'annulation après « Absent » ou « Terminer » ; une journée à 40+ réservations non simulée | Un tap raté sur une action qui retire l'avis J+1 | Toast « Annuler » 5 s ou confirmation sur Absent |
| D-10 | P3 | D3, D4 | Pas de mode sombre (hors périmètre) ; photo de plat cachée dans « Détails » | Serveur en salle tamisée | Décision déjà prise (une palette) |

### Constats d'accessibilité (audit)

Pas de P0. Points tenus : contrastes >= 4,5, cibles >= 44 (hors E2), `aria-current` unique, régions défilantes focusables, `role="alert"` sur les erreurs, mouvement réduit, 0 débordement. À surveiller : étiquettes de nav à 12 px (E1, décision 1) ; `aria-label` des boutons « Appeler / WhatsApp » avec nom du client (présents) ; focus visible vert sur fond vert des boutons primaires = anneau décalé de 2 px (lisible, à vérifier à l'implémentation).

---

## 5. Ce qu'il reste à faire avant les phases 11 et 12

1. Valider les 8 questions de `OPEN-QUESTIONS.md`.
2. Phase 11 : créer **un** `tokens` (copie de `d1-system-shell/tokens.css`, `@theme inline` pour Tailwind), **un** Button (variantes primary, secondary, danger, danger-outline, ghost), **un** DataTable à slot de ligne, un seul Dialog et un seul Toast conformes à `kit.css`.
3. Phase 12 : intégrer le vrai shell dans D2, D3, D4 (suppression des coques provisoires), y compris « + Réservation » et le menu du compte.
4. Remplacer les deux laitons clairs de la connexion D4 par `--adm-accent-on-brand`.
