# D4 : contrat de design « Réputation » et « Accès »

Slice D4 du milestone v1.1. Phase 16 (REP-01..03) et partie design de la phase 17 (ACC-02, QA-01, QA-02). Aucun code applicatif : ce contrat s'applique aux maquettes statiques de ce dossier et sert de cahier des charges aux plans d'exécution.

Direction : « luxe discret ». Ivoire chaud, vert jungle profond, laiton en touche rare, filets fins plutôt qu'ombres, air généreux, chiffres tabulaires. Aucune ombre portée, aucun dégradé, aucune icône emoji. Le laiton `--adm-accent` n'est jamais du texte : filet de 48 px sous le titre, anneau des monogrammes, pastilles numérotées. Le texte laiton utilise `--adm-accent-text`.

## 1. Tokens

Fichier : `tokens.css`. Valeurs partagées exactes : `--adm-bg #F7F4EC`, `--adm-surface #FFFFFF`, `--adm-surface-2 #F1ECE0`, `--adm-ink #1B2A22`, `--adm-muted #5E6B62`, `--adm-line #E2DCCB`, `--adm-brand #1F3D2F`, `--adm-brand-ink #FFFFFF`, `--adm-accent #B08D3C`, `--adm-accent-text #7A5C16`, `--adm-ok #2F6B45`, `--adm-warn #8A5A00`, `--adm-danger #A33A2B`, `--adm-info #2F5F7A`, rayons 8 / 12 px, cible 44 px.

Extensions proposées par D4, à valider avec D1 (sinon D4 les définit localement) :

| Token | Valeur | Raison |
|---|---|---|
| `--adm-line-strong` | `#7E877F` | Bordure de champ et de bouton secondaire : 3,71:1 sur blanc (WCAG 1.4.11). `--adm-line` (1,3:1) ne suffit pas pour un champ. |
| `--adm-ok-tint` `--adm-warn-tint` `--adm-danger-tint` `--adm-info-tint` | `#E6F0E9` `#FBF1DC` `#F7E4E0` `#E3EEF3` | Fonds de pastilles et d'avis. Le texte coloré y reste à 5,3:1 minimum. |
| `--adm-font-ui` / `--adm-font-display` | sans-serif système ; Cormorant Garamond | Titres de page, titres de section, chiffres de synthèse uniquement. Tout le reste en sans-serif. |

Typographie : corps 16 px, aide et pastilles 14 px (plancher absolu : rien sous 14 px), titre de page 34 à 46 px (display), titre de section 28 px, chiffres de synthèse 40 px, `font-variant-numeric: tabular-nums` sur tout le corps. Longueur de ligne plafonnée à 62 à 64 ch pour les paragraphes.

Surfaces : carte = `--adm-surface` + filet 1 px `--adm-line` + rayon 12, sans ombre. Pas de carte dans une carte : les sous-blocs sont séparés par un filet.

## 2. Variantes de primitives utilisées (à aligner avec D1)

| Primitive | Variantes D4 |
|---|---|
| Bouton | primary (vert, texte blanc), secondary (blanc, bordure `line-strong`), danger (rouge, texte blanc), quiet ; disabled = fond `surface-2`, texte `muted`, `disabled` natif plus phrase d'explication reliée par `aria-describedby`. Hauteur 44, rayon 8. |
| Champ | input, select, textarea : 44 px min, bordure `line-strong`, focus = anneau 3 px `--adm-info`, invalide = bordure 2 px `danger` plus message avec icône (`field-err`). Libellé toujours visible (jamais un placeholder seul). |
| Pastille (badge) | `test` (warn), `live` (ok), `partial`, `neutral`, `ok`, `danger`, `info`. Toujours icône + mot + bordure : jamais la couleur seule. |
| Avis (notice) | `err`, `ok`, `warn`, `info` : icône + titre court en gras + phrase. `role="alert"` pour une erreur qui apparaît, `role="status"` pour un succès, `role="note"` pour un contenu statique. |
| Segments | `nav.seg` (liens, pas des onglets : deux routes), actif = `aria-current="page"` + fond vert. |
| Dialogue | `<dialog>` natif, `showModal()` : focus piégé, Échap ferme. Titre `aria-labelledby`, description `aria-describedby`. Le focus initial est sur « Annuler » (action sûre). Récapitulatif en liste de définitions (mode, destinataire, sujet). Sur mobile les boutons s'empilent, l'action principale en haut. |
| Bande de synthèse | `dl` 4 colonnes (2 sur mobile), filets internes, aucune carte. |
| Tableau | `tscroll` focusable (`tabindex=0`, `role=region`, `aria-label` unique), en-têtes `scope`, première colonne à gauche, chiffres à droite. Sous 768 px les semaines KPI deviennent des cartes-liste (voir 4). |
| Squelette | `skel` (pulsation d'opacité 1,6 s) + ligne « Chargement… » visible + `aria-busy="true"`. |

## 3. Écrans et états

Chaque écran existe en défaut + chargement + vide + erreur (ou l'équivalent), à 390, 768 et 1440. Fichiers dans `INDEX.md`.

### 3.1 Réputation (REP-01)

Entrée unique « Réputation » (route proposée `/admin/reputation`, segments `avis` et `kpi`). Titre `h1` « Réputation », segments « Avis » et « Rapport KPI ». Les anciennes routes `/admin/avis` et `/admin/kpi` redirigent vers les segments. Un seul `h1` ; les sections sont des `h2`.

**Avis** : bande de synthèse (note moyenne, total Google, total TripAdvisor, nouveaux avis du mois), répartition des notes (barre + nombre + pourcentage en texte), Suivi mensuel (sélecteur de mois, tableau par source), Totaux du mois (saisie manuelle, conservée et redessinée), évolution des totaux, messages WhatsApp repliés par défaut.

**Rapport KPI** : bandeau garde-fou, panneau « Envoi du rapport », historique 12 semaines, détail de la semaine sélectionnée (comparaison, alertes, lecture et actions, saisie manuelle).

Décisions de conception :
- Note moyenne et répartition : ces données n'existent pas aujourd'hui (le code ne connaît que le total d'avis et la note minimale). Les maquettes les montrent étiquetées « exemple ». Question ouverte Q1 : source à confirmer (collecte Places, saisie, ou retrait de la zone). Sans source, la zone est masquée, pas remplacée par des zéros.
- Saisie manuelle des totaux (REP-03) : gardée, redessinée en un formulaire de deux champs. Son retrait relève de l'audit ; le design n'en dépend pas. Si elle disparaît, le panneau « Totaux du mois » et l'évolution tombent sans autre impact sur la page.
- Tableau KPI : la table desktop montre 7 indicateurs clés au lieu des 15 d'origine ; les 15 indicateurs restent dans le détail de la semaine. Changement visible à valider par la phase 16.

### 3.2 Garde-fou d'envoi (REP-02)

Principes, non négociables :
1. Aucun envoi par simple affichage, rechargement ou changement de sélection. Un envoi n'existe que derrière un bouton nommé, puis un dialogue de confirmation.
2. Le bandeau en tête du rapport KPI affiche toujours le mode (pastille `TEST` ou `live`), le compteur et la phrase : « Aucun envoi live avant le 2026-11-16 et sans accord du propriétaire. »
3. Le mode live n'est jamais activable depuis l'admin. Il reste un réglage serveur (`KPI_REPORT_MODE`). Le panneau « Passage en live » est une liste de trois conditions (2 rapports TEST vérifiés, date au plus tôt le 2026-11-16, accord du propriétaire) avec la pastille « live verrouillé ». Aucun bouton « Passer en live » n'existe, même après le 2026-11-16 (question Q2).
4. Actions d'envoi proposées par l'interface :
   - « Envoyer un rapport TEST » (propriétaire seul, sujet `[TEST]`) : dialogue « Envoyer un rapport TEST ? ».
   - Enregistrer la saisie manuelle avec une note minimale de 3 ou moins : le code envoie une alerte email immédiate au propriétaire. Le design impose d'avertir en ligne (avis « Une note de 3 ou moins déclenche un email d'alerte immédiat au propriétaire. ») puis de confirmer : dialogue « Enregistrer et envoyer l'alerte ? ». Aujourd'hui l'envoi part sans confirmation : c'est un changement de comportement à porter au plan de la phase 16.
5. En erreur de chargement ou sans semaine, le bouton d'envoi est désactivé avec une phrase d'explication.

### 3.3 Connexion

Deux volets sur grand écran (marque à gauche : monogramme laiton, « Gecko Cabane », filet laiton, une phrase ; formulaire à droite), bandeau vert compact sur mobile. Champs : adresse email, mot de passe avec bouton « Afficher » / « Masquer » (`aria-pressed`, 44 px). Liens : « Mot de passe oublié ? » (Q3), « Retour au site ». États : défaut, identifiants incorrects, compte sans accès admin, envoi en cours, déconnecté. L'erreur est un `role="alert"` ; l'email est `aria-invalid` en cas d'identifiants incorrects. Les messages bruts de Supabase (en anglais) ne sont jamais affichés : le serveur les traduit en phrases FR ci-dessous. Le message « Ce compte n'a pas accès à l'administration Gecko Cabane. » est conservé tel quel (il vient de `loginAction`).

### 3.4 Invitation d'un administrateur (ACC-02)

Parcours proposé (remplace `/admin/signup`, qui est supprimé) :
1. Un admin ouvre « Accès », saisit l'email de la personne, confirme l'envoi (dialogue : destinataire, validité 7 jours, droits).
2. La personne reçoit un email avec un lien à usage unique, valable 7 jours.
3. Le lien ouvre une page publique `/admin/invitation?token=…` : email en lecture seule, mot de passe, confirmation, critères visibles (12 caractères, une lettre et un chiffre, saisies identiques ; chaque critère dit « rempli » ou « à remplir » en texte).
4. À la validation, le compte est créé et la ligne est ajoutée à `gecko_admins`, puis la personne arrive sur la connexion. Aucun compte n'existe avant l'acceptation.

Écran de gestion « Accès » : formulaire d'invitation, liste des administrateurs et invitations (statut Actif, Invitation en attente, Invitation expirée, avec dates), actions Renvoyer et Révoquer/Retirer (dialogue de confirmation), explication en trois étapes. États : défaut, chargement, vide (seul administrateur), erreur de chargement, invitation envoyée, échec d'envoi, email invalide. Page d'acceptation : défaut, mot de passe refusé, création en cours, succès, lien expiré ou déjà utilisé.

Garde-fous : seul un admin existant (`gecko_is_admin()`) invite ; le jeton est à usage unique et stocké haché ; l'envoi passe par Resend côté serveur ; l'invitation expirée ne révèle pas si l'email existe.

### 3.5 Erreurs de l'admin

Dans la coquille admin : 404 « Cette page n'existe pas », 500 « Une erreur est survenue » (avec « Réessayer » et une référence courte, jamais de trace), 403 « Ce compte n'a pas accès à cette zone », « Connexion perdue ». Chaque écran offre une sortie claire (retour à Aujourd'hui, Réessayer). Le gros code (404) est décoratif (`aria-hidden`), le `h1` porte le sens.

## 4. Responsive

| Plage | Comportement |
|---|---|
| < 768 (390 testé) | Barre haute + barre d'onglets basse 56 px ; marges 16 ; bande de synthèse 2 colonnes ; semaines KPI en cartes-liste ; dialogue en boutons empilés pleine largeur ; auth : bandeau vert compact puis formulaire. |
| 768 à 1023 | Même coquille mobile, marges 32 ; tableaux complets avec défilement horizontal focusable ; synthèse 4 colonnes. |
| >= 1024 (1440 testé) | Barre latérale 248 px ; contenu max 1120 ; auth en deux volets à partir de 900. |

La coquille de ces maquettes est indicative : D1 fait foi pour la navigation. En production, une seule liste de semaines suffit (cartes sous 768, tableau au-dessus) ; le prototype duplique le balisage pour montrer les deux.

## 5. Mouvement et reduced-motion

Mouvement utilitaire seulement : transitions 150 à 200 ms, courbe `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out expo), sur couleur de fond, transformation 1 px au clic, rotation du chevron. Squelette : pulsation d'opacité. Chargement du bouton : disque rotatif 0,9 s. Jamais d'animation de propriétés de mise en page, ni rebond.
`@media (prefers-reduced-motion: reduce)` : toutes animations et transitions coupées ; le squelette devient statique (opacité fixe) ; le disque rotatif devient un disque fixe (la ligne « Chargement… » ou « Connexion… » porte le sens).

## 6. Accessibilité (QA-01, QA-02)

- Cibles >= 44 x 44 px : boutons, champs, liens de navigation, bascule mot de passe, résumés repliables. Exception : liens inline dans un paragraphe (WCAG 2.5.8).
- Statut jamais par la couleur seule : chaque pastille et avis porte icône + mot (`TEST`, `live verrouillé`, `partiel`, `Critique`, `À surveiller`, `à remplir`/`rempli`). Les écarts KPI portent flèche + signe + valeur ; le caractère favorable est répété en `sr-only` (« favorable » / « défavorable »). Les barres de répartition sont doublées par « 132 avis · 71 % ».
- Focus visible : anneau 3 px `--adm-info`, décalage 2 px, sur tout élément interactif. Lien d'évitement « Aller au contenu ».
- Dialogues natifs `<dialog>` : titre, description, focus piégé, Échap, retour du focus au déclencheur (comportement natif).
- Formulaires : libellés `for`/`id`, `autocomplete` (`username`, `current-password`, `new-password`), `inputmode`, erreurs reliées par `aria-describedby`, `aria-invalid`.
- Landmarks : `header`/`main`/`nav` nommés, un seul `h1` par page, tableaux avec `caption` (sr-only) et `scope`.
- Contrastes mesurés (voir 7) : tous les couples de texte >= 4,5:1 ; le laiton décoratif (2,84:1) ne porte jamais de texte.

## 7. Vérifications mesurables

Script : `tools-measure.mjs` (Playwright hors dépôt, Chromium local, axe-core). Il tourne sur chaque page aux trois largeurs (102 combinaisons) et vérifie :

| Contrôle | Seuil | Résultat du dernier passage |
|---|---|---|
| Débordement horizontal de page | scrollWidth <= largeur de fenêtre | 0 anomalie |
| Taille de texte | >= 14 px sur tout nœud texte visible | 0 anomalie |
| Cibles tactiles | >= 44 x 44 px (liens inline exemptés) | 0 anomalie |
| Contraste de texte (calculé, fonds composés) | >= 4,5:1 (3:1 si >= 24 px ou >= 18,66 px gras) | 0 anomalie |
| axe-core (violations) | 0 | 0 anomalie |

Couples de contraste (calculés) : ink/bg 13,64 ; ink/blanc 14,99 ; muted/bg 5,09 ; muted/surface-2 4,74 ; muted/blanc 5,59 ; blanc/brand 11,89 ; accent-text/bg 5,67 ; ok/ok-tint 5,44 ; warn/warn-tint 5,28 ; danger/danger-tint 5,36 ; info/info-tint 5,85 ; blanc/danger 6,57 ; line-strong/blanc 3,71 (bordure, seuil 3) ; accent décoratif/bg 2,84 (aucun texte).

Vérifications manuelles à refaire sur l'application réelle (non mesurables en statique) : navigation clavier complète de chaque page, retour du focus après fermeture des dialogues, annonce `role=alert`/`status` au lecteur d'écran, zoom 200 %, `prefers-reduced-motion` réel.

## 8. Exigence, écran, vérification

| Exigence | Écrans (fichiers) | Vérification |
|---|---|---|
| REP-01 Avis et KPI sous « Réputation », design system, états | `reputation-avis*.html`, `reputation-kpi*.html` | Un seul `h1` « Réputation » ; segments `aria-current` ; chaque écran existe en chargement, vide, erreur ; script de mesure à 0 anomalie ; aucun ancien token (`var(--primary)`) dans le CSS. |
| REP-02 Libellés TEST/live conservés ; aucun envoi live avant 2026-11-16 sans accord | `reputation-kpi.html`, `-dialogue-test`, `-dialogue-alerte` | Les chaînes de la section 9 sont présentes à l'identique ; pas de bouton « Passer en live » ; tout envoi derrière un dialogue ; un test de rendu initial ne déclenche aucun appel `PUT`/`POST` (à écrire en phase 16) ; `tests/kpi-admin-wiring.test.ts` reste vert. |
| REP-03 Saisie manuelle des totaux gardée, redessinée, retrait conditionné à l'audit | `reputation-avis.html` (panneau Totaux), `-enregistre`, `-invalide`, `-vide` | Libellés « Totaux du mois (saisie manuelle) » et « Enregistrer les totaux » conservés ; décision de retrait consignée dans le plan 16 après l'audit (phase 9). |
| ACC-02 Processus d'invitation défini ; `/admin/signup` supprimé | `invitation*.html`, `invitation-accepter*.html`, `invitation-expiree.html` | Parcours en 4 étapes documenté (3.4) ; test que `/admin/signup` répond 404 ; jeton à usage unique, expiré après 7 jours (test). |
| QA-01 Cibles >= 44 px, statut jamais par la couleur seule | toutes | Mesure scriptée (7) ; revue : chaque pastille et avis a icône + mot. |
| QA-02 Clavier, focus visible, dialogues, contraste | toutes, dialogues inclus | axe-core 0 ; contrastes (7) ; parcours clavier manuel sur l'application réelle. |

## 9. Libellés TEST / live conservés à l'identique

Source : `src/app/admin/kpi/page.tsx`, `tests/kpi-admin-wiring.test.ts`, `src/utils/kpi-mode.ts`, `src/utils/kpi-report-email.ts`, `docs/kpi/KPI-SETUP.md`. Aucune de ces chaînes ne change de texte.

Page KPI (testées par `kpi-admin-wiring.test.ts`) :
- `Rapports TEST envoyés` (et le format `Rapports TEST envoyés : N / 2`)
- `Sources non disponibles`
- `KPI hebdomadaires` (devient le `h2` de l'historique ; le `h1` devient « Réputation »)
- `non disponible` (valeur absente, jamais 0)
- `Chargement…` (état initial : doit s'afficher et `Aucune semaine enregistrée` ne doit pas apparaître pendant le chargement)
- `Aucune semaine enregistrée`, `Le premier relevé apparaîtra ici après la collecte du lundi.`
- `Passage en live : décision du propriétaire après 2 rapports TEST vérifiés (au plus tôt mi-novembre 2026).`
- `partiel` (données Search Console partielles), `texte de repli sans IA`
- `Impossible de charger les KPI. Réessayez ou rechargez la page.`
- `Saisie enregistrée`, `Saisie enregistrée, alerte envoyée au propriétaire` (le code actuel utilise un tiret long : à reprendre tel quel dans le code, pas à copier dans les maquettes)
- Titres de zone : `Comparaison à la semaine précédente`, `Alertes`, `Lecture et actions`, `Lecture`, `Actions recommandées`, `Saisie manuelle de la semaine`, `Enregistrer la saisie`

Pastilles : `TEST` et `live` (casse exacte), `live verrouillé` est un ajout D4.

Email et serveur (hors maquettes, à ne pas toucher) : préfixe de sujet `[TEST]`, bandeau `MODE TEST : ce rapport n'est envoyé qu'au propriétaire.`, mode TEST par défaut hors `live` exact.

Avis : `Suivi mensuel`, `Totaux du mois (saisie manuelle)`, `Enregistrer les totaux`, `Aucune donnée pour ce mois`, `Impossible de charger les statistiques. Réessayez ou rechargez la page.`, `Totaux enregistrés.`, `Valeur invalide : entrez un nombre entier.`, `à relire`, `Copier`, `Ouvrir WhatsApp`, `Message WhatsApp (invitation d'avis)`.

Phrase de garde-fou ajoutée par D4 : `Aucun envoi live avant le 2026-11-16 et sans accord du propriétaire.`

## 10. Microcopie FR (nouvelle ou modifiée)

| Contexte | Texte |
|---|---|
| Titre de page | Réputation |
| Segments | Avis ; Rapport KPI |
| Envoi, intro | Rien n'est envoyé en ouvrant cette page. Chaque envoi demande une action et une confirmation. |
| Bouton TEST | Envoyer un rapport TEST |
| Dialogue TEST, titre | Envoyer un rapport TEST ? |
| Dialogue TEST, corps | Le rapport de la semaine du {début} au {fin} sera envoyé une seule fois, au propriétaire uniquement. Aucun client ni destinataire live ne le reçoit. |
| Dialogue TEST, boutons | Annuler ; Envoyer le rapport TEST |
| Alerte, avis en ligne | Une note de 3 ou moins déclenche un email d'alerte immédiat au propriétaire. / Vous devrez le confirmer avant l'enregistrement. |
| Dialogue alerte | Enregistrer et envoyer l'alerte ? / Annuler ; Enregistrer et envoyer l'alerte |
| Passage en live | Le mode live n'est jamais activable depuis cette page : il se règle côté serveur, après accord du propriétaire. |
| Bouton désactivé (erreur) | Indisponible tant que les KPI ne sont pas chargés. |
| Bouton désactivé (vide) | Aucune semaine à envoyer pour l'instant. |
| Avis vide | Pas encore d'avis enregistrés / Saisissez les totaux Google et TripAdvisor du mois pour suivre leur évolution. / Saisir les totaux du mois |
| Connexion | Bienvenue ; Connectez-vous pour accéder à l'administration. ; Adresse email ; Mot de passe ; Afficher / Masquer ; Se connecter ; Connexion… ; Mot de passe oublié ? ; Retour au site |
| Erreur identifiants | Email ou mot de passe incorrect. / Vérifiez votre saisie, puis réessayez. |
| Erreur accès | Ce compte n'a pas accès à l'administration Gecko Cabane. / Si vous devriez y avoir accès, demandez une invitation à un administrateur. |
| Déconnecté | Vous êtes déconnecté. |
| Invitation, titre | Inviter un administrateur |
| Invitation, aide | La personne reçoit un email avec un lien valable 7 jours. Elle choisit elle-même son mot de passe. Aucun compte n'est créé avant qu'elle accepte. |
| Invitation, boutons | Envoyer l'invitation ; Renvoyer ; Révoquer ; Retirer |
| Invitation envoyée | Invitation envoyée à {email}. / Le lien est valable jusqu'au {date}. Rien d'autre n'a été créé. |
| Échec d'envoi | L'invitation n'a pas pu être envoyée. / Aucun email n'est parti. Réessayez dans un instant ; si cela persiste, contactez l'équipe technique. |
| Email invalide | Adresse email invalide : vérifiez qu'elle contient un « @ » et un domaine. |
| Seul admin | Vous êtes le seul administrateur / Invitez un proche collaborateur pour qu'il puisse gérer les réservations en votre absence. |
| Acceptation | Choisissez votre mot de passe ; Créer mon accès ; Création… ; Votre accès est prêt ; Aller à l'administration |
| Lien expiré | Ce lien n'est plus valable / L'invitation a expiré ou a déjà été utilisée. / Demandez à un administrateur de vous en envoyer une nouvelle. |
| 404 | Cette page n'existe pas / L'adresse est peut-être incorrecte, ou la page a été déplacée. Rien n'a été modifié. |
| 500 | Une erreur est survenue / Votre travail n'a pas été perdu : ce qui était déjà enregistré l'est toujours. Réessayez ; si le problème continue, transmettez la référence ci-dessous à l'équipe technique. |
| 403 | Ce compte n'a pas accès à cette zone / Vous êtes connecté, mais votre compte n'est pas administrateur du Gecko Cabane. Demandez une invitation à un administrateur. |
| Hors connexion | Connexion perdue / Les données affichées peuvent ne pas être à jour. Aucune action n'a été envoyée. Reconnectez-vous puis réessayez. |

Règle : aucun tiret long dans la microcopie nouvelle. Les exemples chiffrés portent « exemple » ; la pastille « Chiffres d'exemple » et la note de maquette en tête de page le rappellent.

## 11. Hors périmètre

Coquille de navigation (D1), « Complet ce soir » (ACC-03), migration de révocation des lectures publiques (ACC-01). Les maquettes n'envoient rien : aucun appel réseau, aucun formulaire ne soumet.
