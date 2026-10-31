# D1 — Contrat de design : système + shell + navigation

Milestone v1.1 « Refonte de l'admin », phases 11 (fondation du système de design) et 12 (shell et navigation).
Statut : **proposition à valider par le propriétaire** (aucun code applicatif écrit). Les maquettes `kit.html` et `shell.html` sont la référence visuelle ; ce document est la référence normative. En cas d'écart, le contrat gagne et la maquette est corrigée.

Utilisateurs : la cheffe sur téléphone (360 à 390 px), les serveurs sur tablette (768 à 1024 px), le développeur sur ordinateur (1440 px). Admin en français fixe, sans i18n.

---

## 1. Direction : « luxe discret » dans un outil de travail sobre

La roadmap demande un « outil de travail sobre » ; le propriétaire veut du luxe. Conciliation : le luxe vient de la **retenue**, pas de l'ornement.

| Levier | Choix | Ce que ça évite |
|---|---|---|
| Surface | ivoire chaud `--adm-bg`, blanc pour ce qui porte la saisie | fond blanc clinique ; fond sombre du site public |
| Couleur | un seul vert jungle profond (`--adm-brand`) pour l'action et l'état actif | arc-en-ciel de statuts, dégradés |
| Laiton | 3 emplois seulement : filet de 40 px sous le titre de page, filet sous le logotype, lettre du logotype (en `--adm-accent-on-brand`) | laiton en texte ou en fond |
| Profondeur | filets de 1 px `--adm-line` ; ombre uniquement pour ce qui flotte (menu, dialogue, toast) | ombres sur toutes les cartes |
| Typographie | titres de page en serif (Cormorant), tout le reste en sans-serif, chiffres tabulaires | serif sur des données denses |
| Air | marges latérales 16 / 32 px, rythme vertical 24 à 48 px, une seule carte par bloc (jamais de carte dans une carte) | densité écrasée, « cartes dans des cartes » |
| Icônes | lucide-react, trait 1,75, toujours avec libellé ou `aria-label` | emoji (l'admin actuel en utilise partout) |

Phrase de scène (thème clair, non défaut) : la cheffe, debout dans la cuisine, le téléphone d'une main, en plein jour ou sous un néon : il faut un fond clair mat, un contraste élevé (texte 13,6:1), de grandes cibles. Le serveur sur tablette en salle lumineuse, en passant. Le développeur à son bureau, le soir : pas de mode sombre en v1.1 (une palette, pas deux).

Écart assumé avec les skills « luxe » génériques : ils bannissent Inter, Lucide et les bordures de 1 px, et poussent vers des sites vitrine (verre, grain, entrées animées). Ici c'est un outil de travail utilisé en service : Inter (chiffres tabulaires fiables), lucide (imposé par la stack), filets de 1 px (économiques et nets). Aucun effet décoratif.

## 2. Jetons

Source : `tokens.css`. Les 14 jetons imposés sont repris tels quels ; les ajouts ont le même préfixe.

### 2.1 Couleurs (contrastes mesurés)

| Jeton | Valeur | Emploi | Contraste |
|---|---|---|---|
| `--adm-bg` | `#F7F4EC` | fond de page | — |
| `--adm-surface` | `#FFFFFF` | cartes, champs, tableau | — |
| `--adm-surface-2` | `#F1ECE0` | en-tête de tableau, survol discret, squelette | — |
| `--adm-ink` | `#1B2A22` | texte | 13,64:1 sur bg ; 14,99:1 sur surface |
| `--adm-muted` | `#5E6B62` | texte secondaire (aide, méta) | 5,09:1 sur bg ; 5,59:1 sur surface ; 4,74:1 sur surface-2 |
| `--adm-line` | `#E2DCCB` | filets décoratifs (séparent, ne délimitent pas un contrôle) | 1,25:1 : jamais seul pour un contrôle |
| `--adm-brand` | `#1F3D2F` | action primaire, lien actif, focus | 11,89:1 avec `--adm-brand-ink` ; 10,81:1 sur bg |
| `--adm-accent` | `#B08D3C` | **décor seulement** (filets) | 2,84:1 : jamais du texte |
| `--adm-accent-text` | `#7A5C16` | surtitre/sous-libellé laiton lisible | 5,67:1 sur bg |
| `--adm-ok` / `-bg` | `#2F6B45` / `#E7F0EA` | statut Confirmée, succès | 5,45:1 |
| `--adm-warn` / `-bg` | `#8A5A00` / `#F7ECD3` | En attente | 5,05:1 |
| `--adm-danger` / `-bg` | `#A33A2B` / `#F8E7E3` | Annulée, erreur, suppression | 5,48:1 ; bouton danger blanc 6,57:1 |
| `--adm-info` / `-bg` | `#2F5F7A` / `#E5EEF3` | Terminée, information | 5,88:1 |

Ajouts (même préfixe) : `--adm-brand-hover #173024`, `--adm-brand-tint #E6EDE8` (fond actif/survol), `--adm-field-border #7D867D` (contour des champs et boutons secondaires, **3,43:1 sur ivoire, 3,76:1 sur blanc**, exigence non-texte 3:1), `--adm-line-strong`, `--adm-neutral-bg`, `--adm-scrim`, `--adm-focus`, `--adm-accent-on-brand #DDC078` (laiton sur vert, 6,73:1), ombre `--adm-shadow-float`, rayons, espacements, durées.

**Règle statut** : un statut = icône + libellé + teinte. Jamais la couleur seule (daltonisme, soleil direct sur écran).

| Statut réservation | Icône lucide | Libellé | Teinte |
|---|---|---|---|
| `pending` | `clock` | En attente | warn |
| `confirmed` | `circle-check` | Confirmée | ok |
| `completed` | `check-check` | Terminée | info |
| `cancelled` | `circle-x` | Annulée | danger |
| `no_show` | `user-x` | Non présenté | neutre |

### 2.2 Intégration Tailwind v4 (phase 11)

- Déclarer les jetons sur `:root` (pas sur un wrapper : les portails Dialog/Toast/Select sortent du wrapper).
- Les exposer par `@theme inline { --color-adm-bg: var(--adm-bg); … }` pour obtenir `bg-adm-bg`, `text-adm-muted`. Les classes arbitraires `bg-(--adm-brand)` restent valides.
- Neutralisation du site public (DSN-02) : classe `.adm-root` (voir fin de `tokens.css`) posée sur le wrapper du shell **et** sur chaque portail. Elle remet : police, couleur, fond clair, `color-scheme: light` sur select/date/time, scrollbar d'origine, focus 2 px vert au lieu du focus doré des boutons.
- Gate de migration : grep interdisant `--primary`, `--warm-*`, `--jungle-dark`, etc. dans `src/app/admin` et `src/components/admin` une fois la dernière page migrée.

## 3. Typographie

| Rôle | Police | Taille / graisse | Notes |
|---|---|---|---|
| Titre de page (`PageHeader`) | **Cormorant Garamond 600** (déjà chargée par le site) | 28 px < 768, 34 px >= 768 ; interligne 1,2 | Seul emploi du serif. Jamais dans un tableau, un bouton, une carte. |
| Logotype | Cormorant Garamond 700, 24 à 26 px | | |
| Section / carte | Inter 600 | 18 px | |
| Corps, champs | Inter 400 | 16 px | 16 px sur champs = pas de zoom iOS |
| Aide, méta, tableau dense, badges | Inter 400 à 600 | 14 px (plancher) | |
| Étiquettes de navigation mobile/tablette | Inter 600 | **12 px (exception E1)** | voir §13 |

Décision Inter plutôt que Raleway (déjà chargée) ou la police système : chiffres tabulaires (`tnum`) fiables pour heures, couverts, prix ; diacritiques français complets ; lisible à 14 px. Raleway a des chiffres elzéviriens, mauvais pour des colonnes. Chargement : `next/font/google` `Inter({ subsets: ['latin','latin-ext'], variable: '--font-adm-sans' })` dans `src/app/admin/layout.tsx` uniquement (le site public ne paie pas la police) ; Cormorant réutilise la variable existante `--font-cormorant`. Le prototype embarque les fichiers woff2 (`fonts/`) pour un rendu hors ligne ; en production c'est `next/font` qui les héberge.

`font-variant-numeric: tabular-nums` et `font-feature-settings: "tnum"` posés sur `.adm-root` (donc partout dans l'admin), pas seulement sur les tableaux.

Échelle : 14 / 16 / 18 / 22 / 28 / 34. Rapport mini 1,14 entre pas voisins du corps, >= 1,25 entre corps (16) et titres (28 à 34). Longueur de ligne des descriptions : `max-width: 60ch`.

## 4. Espacement, rayons, élévation

- Espacement base 4 : 4, 8, 12, 16, 24, 32, 48, 64. Marge latérale : 16 px < 768, 32 px >= 768. Largeur de contenu max 1120 px.
- Rayons : 8 px (boutons, champs, badges, lignes, entrées de nav), 12 px (cartes, dialogues, menu, toasts). Pastilles de statut : 999 px.
- Élévation : aucune ombre sur le contenu. `--adm-shadow-float` uniquement pour menu compte, dialogue, toast.

## 5. Points de rupture et mise en page

| Largeur | Navigation | En-tête | Contenu |
|---|---|---|---|
| < 768 (téléphone) | barre du bas fixe, 5 entrées, 64 px | logotype réduit à la lettre « G » (+ nom entre 480 et 767), « + Réservation », avatar | 1 colonne, marge 16 px, onglets de niveau 2 sous le titre |
| 768 à 1023 (tablette) | rail d'icônes 88 px avec libellé dessous | date du jour, « + Réservation », avatar | marge 32 px, 2 colonnes pour l'accueil |
| >= 1024 (ordinateur) | barre latérale 256 px, sous-entrées visibles pour la section active | idem | accueil en grille de 6 colonnes (lead pleine largeur, 4+2, 3+3) ; onglets masqués (remplacés par la sous-navigation latérale) |

Le tableau de données bascule à 768 : en dessous, même balisage affiché en cartes empilées (heure, statut, nom, couverts, actions).
Cibles : 44 px partout ; la taille `sm` (36 px) n'existe que si `min-width: 1024px` **et** `pointer: fine`. Une tablette à 1024 px tactile garde 44 px.
Hauteur de contenu mobile : `padding-bottom` = barre du bas + 32 px + `env(safe-area-inset-bottom)` ; unité `100dvh`.

## 6. Composants (DSN-03) : variantes et états

Chaque composant vit dans `src/components/admin/`, balisage et classes identiques à `kit.css` (préfixe `adm-`). Présentationnels sans hook = composants serveur ; interactifs = `'use client'`.

| Composant | Variantes / props | États exigés | Accessibilité |
|---|---|---|---|
| `Button` | `variant` primary / secondary / danger / ghost ; `size` md (44) / sm ; `loading` ; `iconOnly` | repos, survol, pression (1 px), focus, **chargement** (`aria-busy="true"`, spinner + libellé « Enregistrement… », non cliquable, reste lisible), **désactivé** (`disabled`, pas de survol) | bouton icône = `aria-label` obligatoire ; jamais `title` seul |
| `Field` | `label`, `hint`, `error`, `optional` | repos, survol, focus (anneau 2 px), **erreur** (`aria-invalid`, icône + texte, `role="alert"`), désactivé | `label for`, `aria-describedby` vers aide et erreur |
| `Input` / `Select` / `Textarea` | tailles champ 44 px ; date/heure **natives** | idem Field | police 16 px ; `type="time"` en tabulaire |
| `Card` | `flush` | — ; jamais imbriquée | `section` + titre |
| `Badge` (statut) | `tone` ok / warn / danger / info / neutral ; icône obligatoire | — | texte + icône `aria-hidden` |
| `DataTable` | colonnes, `caption`, actions de ligne ; nombres alignés à droite | chargement (squelette), vide, erreur, ligne survolée | `<table>`, `caption`, `th scope="col"`, colonne d'actions avec en-tête masqué ; < 768 : cartes (valeurs libellées par `data-label`) |
| `PageHeader` | `title`, `description`, `actions` | — | un seul `h1` par page ; pas de surtitre (la navigation active suffit) |
| `ConfirmDialog` | `title`, `description`, `confirmLabel`, `tone` | ouvert, fermeture Échap / clic scrim / « Garder » | `role="alertdialog"`, focus piégé, focus initial sur l'action **non destructrice**, focus rendu au déclencheur |
| `Toast` | `ok` / `error` ; titre + message | apparition, fermeture, survol = pause | région `aria-live` ; succès `polite` 5 s ; erreur `assertive`, reste jusqu'à fermeture |
| `Skeleton` / `EmptyState` / `ErrorState` | `icon`, `title`, `description`, `action` | — | squelette `role="status" aria-busy`, `sr-only` « Chargement… » ; erreur `role="alert"` |
| `AdminShell` | voir §10 | — | landmarks `nav`, `header`, `main` ; lien d'évitement |

DSN-01 (spike Base UI) : les maquettes n'en dépendent pas. Le dialogue est rendu avec le `<dialog>` natif : si le spike échoue, le repli décrit à la roadmap (`<dialog>` + `sonner`) est déjà visuellement conforme. Si le spike réussit, Base UI porte le même balisage/jetons.

États de page (DSN-04) : chaque page rend exactement un de ces quatre : chargement (squelette de la forme finale, pas de saut de mise en page), vide (icône, titre, une phrase utile, une action), erreur (icône, ce qui s'est passé, « Réessayer », rien n'a été perdu), contenu. Les trois premiers viennent de composants communs ; la page ne dessine jamais son propre message.

`useAdminQuery` / `adminFetch` (DSN-05) : hors périmètre visuel ; contrat d'interface uniquement : `{ data, error, status: 'loading'|'error'|'ready', refetch }`, annulation par `AbortController` au démontage et au changement de clé, erreurs mappées vers le texte d'`ErrorState`.

## 7. Microcopie (français, tutoiement exclu, vouvoiement)

Principes : verbe d'action à l'infinitif sur les boutons, sujet concret, pas de point d'exclamation, pas de « Oups », ce qui est conservé est dit.

| Contexte | Texte |
|---|---|
| Bouton global | « + Réservation » (étiquette d'accessibilité : « Nouvelle réservation ») |
| Enregistrer / annuler | « Enregistrer » / « Annuler » ; en cours : « Enregistrement… » |
| Succès (titre / message) | « Horaires enregistrés » / « Visibles sur le site public. » |
| Erreur d'enregistrement | « Enregistrement impossible » / « Connexion perdue. Votre saisie est conservée, réessayez. » |
| Suppression plat | titre « Supprimer ce plat ? », corps « « {nom} » sera retiré de la carte publique. Cette action est définitive. », boutons « Garder le plat » / « Supprimer » |
| Annulation réservation | titre « Annuler cette réservation ? », corps « {client}, {n} couverts à {heure}. Le client recevra un e-mail d'annulation. », boutons « Garder » / « Annuler la réservation » |
| Chargement | « Chargement… » (lecteur d'écran seulement ; le squelette est visuel) |
| Vide (réservations) | « Aucune réservation ce jour » / « Les nouvelles réservations du site apparaîtront ici. » + « + Réservation » |
| Vide (annonces) | « Aucune annonce programmée » / « Créez une annonce pour informer les visiteurs : fermeture exceptionnelle, menu de saison. » |
| Erreur de chargement | « Impossible de charger la liste » / « Vérifiez la connexion, puis réessayez. Rien n'a été modifié. » + « Réessayer » |
| Champ invalide | « Numéro incomplet. Exemple : +66 81 958 5945. » (dit quoi faire, donne un exemple) |
| Accueil | « Bonjour » / « {jour} {n} {mois}. Où souhaitez-vous aller ? » |
| Compte | « Connecté », e-mail, « Voir le site public », « Déconnexion » |
| Fuseau | toute heure affichée est l'heure de Krabi (UTC+7), le dire une fois par écran (« Heure de Krabi. ») |

## 8. Mouvement (et `prefers-reduced-motion`)

Un seul tempo, ease-out-quart (`cubic-bezier(0.25, 1, 0.5, 1)`), jamais de rebond.

| Élément | Mouvement | Durée |
|---|---|---|
| Survol / pression bouton, lien de nav | couleur de fond, `translateY(1px)` à la pression | 120 ms |
| Menu compte, dialogue, toast | `opacity` 0 à 1 + `translateY(8px)` à 0 | 200 ms |
| Squelette | balayage de dégradé neutre | 1,4 s en boucle |
| Spinner | rotation | 0,9 s en boucle |

Règles : on n'anime ni `width`, `height`, `top` ni `left` ; pas de mouvement à l'entrée de page. Sous `prefers-reduced-motion: reduce` (`.adm-root *` en `!important`, 0,001 ms) : toutes les transitions et animations sont neutralisées, le squelette devient un aplat `--adm-surface-2` (animation `none`, vérifié), le spinner reste un indicateur statique avec le libellé « Enregistrement… », les toasts apparaissent sans glissement.

## 9. Accessibilité

- Contraste texte >= 4,5:1 (>= 3:1 pour les grands textes), non-texte >= 3:1 (contour des champs 3,43:1 minimum). Mesuré par script (§12).
- Focus visible partout : anneau 2 px `--adm-focus`, décalage 2 px, jamais supprimé ; sur champ : 2 px décalés de 1 px.
- Clavier : ordre DOM = ordre visuel ; lien d'évitement « Aller au contenu » en premier ; menu compte : Échap ferme et rend le focus à l'avatar (vérifié) ; dialogue : Échap ferme, focus piégé puis rendu au déclencheur (vérifié sur `<dialog>` natif).
- Navigation : `<nav aria-label="Navigation principale">` ; page courante `aria-current="page"` ; section parente d'une sous-page `aria-current="true"` ; onglets de niveau 2 dans `<nav aria-label="Sections de {section}">`. L'état actif n'est jamais porté par la couleur seule : pastille pleine (mobile/tablette) ou fond plein + graisse (ordinateur).
- Boutons icône (téléphone, WhatsApp, fermer) : `aria-label` avec le nom du client (« Appeler Martin L. »).
- Zoom 200 % et texte agrandi : mise en page en `rem`/`dvh`, aucune hauteur fixe sur du texte ; pas de défilement horizontal (mesuré).
- Statuts : icône + libellé (§2.1). Erreurs : texte + icône, annoncées par `role="alert"`.
- `lang="fr"`, un seul `h1` par page, titres sans saut de niveau.

## 10. Shell et navigation (NAV-02, NAV-03)

Une seule source, `src/components/admin/nav.ts` (la maquette en simule une dans `shell.html`) :

```ts
type NavItem = { id: string; label: string; href: string; icon: LucideIcon; description: string; children?: { id: string; label: string; href: string }[] }
export const NAV: NavItem[] = [ aujourdhui, reservations, carte, sitePublic, reputation ]
```

Elle alimente : barre du bas, rail, barre latérale (+ sous-entrées), onglets de niveau 2 et cartes d'accueil. Ajouter ou retirer une entrée = une édition de ce fichier (critère de la phase 12).

| Entrée | Icône | Niveau 2 | Description (carte d'accueil) |
|---|---|---|---|
| Aujourd'hui | `calendar-check` | | Arrivées par heure, couverts sur 40, réservations à confirmer. |
| Réservations | `clipboard-list` | | Liste du jour : confirmer, terminer ou annuler en un tap. |
| Carte | `utensils` | | Prix et disponibilité des plats, ajout rapide. |
| Site public | `globe` | Horaires, Annonces, Capacité | Ce que voient les visiteurs du site. |
| Réputation | `star` | Avis, KPI | Avis des clients et indicateurs de suivi. |

Profondeur maximale : 2 niveaux. Le niveau 2 est une sous-navigation latérale >= 1024, des onglets en dessous. L'accueil est en cartes : « Aujourd'hui » en lead plein vert (seule surface sombre de l'écran), puis 4+2 et 3+3 colonnes ; une carte est un seul lien (aucun lien imbriqué), les sous-sections sont en texte.

En-tête global : « + Réservation » (action primaire, présente sur toutes les pages hors connexion, ouvre la saisie manuelle, phase 15) ; menu compte (e-mail, « Voir le site public », « Déconnexion » = formulaire `logoutAction`). Connexion et inscription : hors shell (route group), non maquettées ici.

## 11. Alternatives de navigation écartées

Barre du bas à 4 entrées + « Plus » (libellés 14 px possibles, mais Réputation cachée) ; menu hamburger (découvrabilité faible pour la cheffe) ; barre du haut horizontale à 5 libellés (ne tient pas à 390 px). Voir D1-CRITIQUE Q1.

---

## 12. Vérifications d'acceptation mesurables

Script reproductible : `tools/measure-and-render.mjs` (Playwright, installé hors du repo). Matrice : 8 pages (kit + 7 variantes du shell) × 5 largeurs (360, 390, 768, 1024 tactile, 1440 souris) = 40 combinaisons ; 155 nœuds de texte et 40 cibles mesurés sur le kit à 1440.

| Id | Critère | Méthode | Seuil | Résultat |
|---|---|---|---|---|
| V-01 | Pas de défilement horizontal | `scrollWidth <= innerWidth` | 0 px | **40/40 conformes** |
| V-02 | Taille de texte | `font-size` calculée de tout nœud texte visible | >= 14 px | **conforme**, sauf 5 étiquettes de navigation à 12 px (exception E1, comptées à part) |
| V-03 | Cibles interactives | rect de chaque `a, button, input, select, textarea, [role=menuitem]` (case à cocher : son `label`) | >= 44 × 44 ; >= 36 si >= 1024 px et pointeur fin | **40/40 conformes** (après correction du lien de marque 32 à 44 px) |
| V-04 | Contraste texte | rapport fg/bg effectif, fonds empilés | >= 4,5 (3 si >= 24 px ou >= 18,66 px gras) | **conforme**, minimum mesuré 4,74 (muted sur surface-2) |
| V-05 | Contraste non-texte | contour de champ vs fond | >= 3 | 3,43 (ivoire), 3,76 (blanc) |
| V-06 | Dialogue | ouverture, focus dans le dialogue, Échap ferme, focus rendu au déclencheur | 4/4 | **4/4** |
| V-07 | Menu compte | ouvre, Échap ferme, focus rendu à l'avatar | 3/3 | **3/3** |
| V-08 | Mouvement réduit | `animation-name` du squelette sous `reducedMotion: reduce` | `none` | **none** |
| V-09 | Détecteur d'anti-patterns | `npx impeccable` sur `kit.html`, `shell.html` | 0 « slop » | 2 alertes résiduelles : `cream-palette` (fond ivoire imposé par le propriétaire, acceptée), `cramped-padding` sur le tableau (faux positif : la `caption` et les cellules ont leur marge) ; surtitre et rayures supprimés |
| V-10 | Pas d'emoji, pas de dégradé de décor, pas d'ombre sur le contenu | revue + grep des maquettes | 0 | conforme (seul dégradé : le squelette neutre, stoppé sous mouvement réduit) |

Critères à rejouer **sur l'implémentation** (même script, URL de la page kit réelle) : V-01 à V-08 à 360, 390, 768, 1024, 1440 ; plus `tsc`, lint, `vitest` verts, build React Compiler propre.

### Tableau exigence → écran → vérification

| Exigence | Écran / zone de maquette | Vérification |
|---|---|---|
| **DSN-02** tokens `--adm-*`, sans-serif, `tabular-nums`, neutralisation du site public | `tokens.css` ; `kit.html` §Couleurs et §Typographie ; classe `.adm-root` | V-04, V-05 ; revue : `getComputedStyle(body).fontFamily` commence par Inter ; `fontVariantNumeric` = `tabular-nums` ; `color-scheme: light` sur `select` et `input[type=time]` ; aucune classe `--primary`/`--warm-*` dans `src/app/admin` (grep) |
| **DSN-03** primitives Button, Field, Input, Card, Badge, DataTable, PageHeader, Dialog, Toast | `kit.html` §Button, §Field, §Card et Badge, §DataTable, §PageHeader, §Dialogue, §Toast | une page kit rend les neuf ; V-01, V-02, V-03, V-04 à 360, 768, 1024, 1440 ; les cinq états de Button (repos, chargement, désactivé, focus, danger) présents |
| **DSN-04** états chargement / vide / erreur communs | `kit.html` §Chargement, vide, erreur ; `shell.html?v=loading|empty|error` | chaque page n'utilise que `Skeleton`/`EmptyState`/`ErrorState` (grep de messages d'état « maison ») ; V-08 |
| **DSN-05** `useAdminQuery` / `adminFetch` | aucun (interface seulement, §6) | test Vitest : annulation au démontage et au changement de clé, mappage d'erreur (hors maquette) |
| **DSN-06** dialogue accessible à la place de `confirm()` | `kit.html` §Dialogue de confirmation (statique + réel) | V-06 ; grep `confirm(` dans `src/app/admin` = 0 |
| **DSN-07** page kit à 360, 768, 1024, 1440 | `kit.html` (indicateur de largeur en tête) ; rendus `renders/kit-390|768|1440.png` | V-01 à V-04 sur la page kit réelle aux quatre largeurs |
| **NAV-02** barre du bas / rail / barre latérale + lien actif visible | `shell.html` aux trois largeurs ; rendus `shell-*-390|768|1440.png` | à 390 : `.adm-nav` en `position: fixed; bottom: 0`, 5 entrées ; à 768 : largeur 88 px, `left: 0` ; à 1440 : 256 px ; une seule entrée avec `aria-current` ; son contraste de pastille/fond >= 3:1 (vert 10,81:1) ; V-03 sur les entrées |
| **NAV-03** un seul `nav.ts` | `shell.html` (tableau `NAV` rendu 4 fois : barre, sous-navigation/onglets, cartes) ; §10 | test Vitest : chaque `href` de `NAV` correspond à une route existante ; test de contrat : aucun composant de nav ne contient de libellé ou de `href` en dur (grep) ; ajouter une entrée de test dans `nav.ts` la fait apparaître dans les quatre surfaces |

## 13. Exceptions documentées

- **E1 : étiquettes de la barre du bas et du rail à 12 px** (écart au plancher de 14 px). Cinq libellés dont « Réservations » (13 caractères) et « Aujourd'hui » ne tiennent pas à 14 px dans 72 px (360 px / 5). Atténuations : icône + libellé toujours ensemble, graisse 600, couleur `--adm-ink` (13,6:1), cible 64 × 78 px. Alternative sans exception : voir D1-CRITIQUE Q1.
- **E2 : cibles de 36 px** pour la taille `sm` uniquement >= 1024 px avec pointeur fin.
- **E3 : fond ivoire** signalé « cream-palette » par le détecteur : décision imposée (`--adm-bg #F7F4EC`), conservée.
- **E4 : texte désactivé** (`:disabled`) non soumis au contraste (WCAG) ; l'état chargement n'est pas « désactivé » visuellement et reste >= 4,5:1.

## 14. Hors périmètre de D1

Contenu réel d'« Aujourd'hui » (D3), liste dense de réservations (D3), formulaires de pages (D2), page de connexion, mode sombre, KPI refondus. Les images de plats n'existent pas : un emplacement honnête est prévu (« Aucune photo : emplacement réservé »), jamais de fausse photo.
