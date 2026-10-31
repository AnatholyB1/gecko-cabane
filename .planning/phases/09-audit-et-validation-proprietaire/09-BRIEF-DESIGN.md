# Brief de design admin : « outil de travail sobre, luxe discret »

**Statut :** PROPOSITION à valider (AUDIT-02). Une page, lue avant la phase 11 (tokens, primitives) et avant chaque refonte de page.
**Direction voulue par l'utilisateur :** luxe discret : ivoire, vert jungle, laiton rare, sans-serif à chiffres tabulaires, cibles tactiles de 44 px. Ce n'est **pas** le décor du site public (Cinzel, Cormorant, fond sombre, dorures) : l'admin est un outil, on y lit des chiffres vite, parfois avec les mains occupées.

## 1. Pour qui, avec quoi

| Qui | Appareil | Moment | Ce qu'il veut |
|-----|----------|--------|---------------|
| Cheffe | téléphone, une main | avant et pendant le service | qui vient ce soir, combien de couverts, changer un prix ou rendre un plat indisponible |
| Serveurs | tablette posée, doigts parfois humides | pendant le service | confirmer, annuler, no-show, ajouter une réservation au téléphone, en un tap |
| Propriétaire / développeur | ordinateur | hors service | horaires, annonces, KPI, réglages |

Priorité de conception : téléphone d'abord (360 px), puis tablette (768), puis ordinateur (1024 et 1440).

## 2. Principes

1. **Les chiffres d'abord.** Un écran = la réponse à une question (« Aujourd'hui : 23 couverts sur 40, 3 à confirmer »). Le décor ne rivalise jamais avec un nombre.
2. **Un tap par action courante.** Pas de modal pour un changement de statut. Confirmation (dialogue accessible, pas `confirm()`) seulement pour ce qui est irréversible (supprimer, annuler une réservation qui envoie un email).
3. **Sobre et dense.** Beaucoup d'air autour des blocs, peu de décoration dedans. Aucune ombre portée lourde, aucun dégradé, aucun emoji comme icône (icônes `lucide-react`, avec libellé).
4. **Le laiton est rare.** Un seul usage par écran (indicateur du lien actif, ou le chiffre-clé de la page). Jamais sur un bouton d'action courante.
5. **Jamais la couleur seule.** Chaque statut a un mot (« En attente », « Confirmée ») et une forme / icône différente.
6. **Honnêteté.** Une valeur absente s'affiche « non disponible », jamais 0 (déjà la règle du KPI). Les libellés TEST / live du rapport KPI ne changent pas.

## 3. Jetons (préfixe `--adm-*`, portée limitée à l'admin)

Valeurs de départ, reprises de la palette du site (`--gc-ivory #FAF0E6`, `--gc-jungle #0C3C2D`, `--gc-brass #B8860B`) mais **assombries ou éclaircies pour l'usage en outil**. Contrastes calculés à la main, à **vérifier avec un outil dans le spike de la phase 11**.

| Jeton | Valeur | Rôle | Contraste indicatif |
|-------|--------|------|---------------------|
| `--adm-bg` | `#FAF6EE` | fond de page (ivoire) | — |
| `--adm-surface` | `#FFFDF8` | cartes, tableaux | — |
| `--adm-line` | `#E4DCCB` | filets, bordures | décoratif |
| `--adm-text` | `#1B2A22` | texte principal | ≈ 14:1 sur `--adm-bg` |
| `--adm-text-muted` | `#55625A` | texte secondaire | ≈ 6:1 |
| `--adm-primary` | `#0C3C2D` | boutons primaires, lien actif, focus | ≈ 11:1 |
| `--adm-primary-hover` | `#124C39` | survol / appui | — |
| `--adm-accent` (laiton, **texte et filets**) | `#7F5F08` | rare : chiffre-clé, indicateur actif | ≈ 5:1 sur ivoire |
| `--adm-accent-bright` (laiton clair, **sur fond jungle seulement**) | `#B8860B` | filet sur barre latérale jungle | ≈ 3,8:1 sur `--adm-primary` |
| `--adm-ok` / `--adm-warn` / `--adm-danger` / `--adm-info` | vert / ambre / rouge / bleu sourds, avec fond pâle associé | statuts (toujours avec libellé + icône) | ≥ 4,5:1 texte sur fond pâle |
| `--adm-focus` | anneau 2 px `--adm-primary` + 2 px d'écart | focus clavier visible | ≥ 3:1 |

Note : le laiton du site (`#B8860B`) sur ivoire ne donne que ≈ 2,9:1 : **interdit comme texte ou filet isolé sur fond clair**, d'où la variante assombrie.
Mode sombre : hors périmètre v1.1 (admin en thème clair, `color-scheme: light` explicite sur l'arbre admin pour neutraliser le `color-scheme: dark` global des champs du site public).

Tailwind v4 : jetons déclarés sur `:root` et exposés par `@theme inline` (les portails de dialogue sortent du wrapper). Syntaxe `bg-(--adm-bg)`, jamais `bg-[var(...)]` (aussi vérifié par `kpi-admin-wiring`). Pas de concaténation dynamique de noms de classes.

## 4. Typographie

- **Sans-serif unique** : Inter (variable, via `next/font/google` dans `src/app/admin/layout.tsx`, chargée uniquement pour l'admin) avec repli `system-ui`. À valider au spike (poids, tabulaires). Ne PAS hériter de `body` du site (Cormorant, `color: ivoire` sur fond sombre).
- `font-variant-numeric: tabular-nums lining-nums` sur tout nombre : heures, couverts, prix, compteurs, colonnes de tableaux.
- Échelle : 14 px corps dense (tableaux de bureau), **16 px corps téléphone** (pas de zoom automatique iOS dans les champs), 20 px titre de section, 28 px chiffre-clé d'« Aujourd'hui ». Interlignage 1,4. Pas de texte en capitales intégrales, pas d'espacement de lettres décoratif.

## 5. Espacement, cibles tactiles, densité

- Grille de 4 px ; gouttière de page 16 px (téléphone), 24 px (tablette), 32 px (ordinateur) ; largeur utile max 1200 px.
- **44 × 44 px minimum** pour toute cible tactile sur téléphone et tablette (boutons, onglets, cases, éléments de navigation), **48 px** pour les actions de service (Confirmer, Annuler, No-show). Espacement d'au moins 8 px entre deux cibles.
- Sur ordinateur (`pointer: fine`) une ligne de tableau peut descendre à 40 px de haut ; la zone cliquable reste de 44 px quand l'écran est tactile (`@media (pointer: coarse)`).
- Rayon 8 px (cartes, boutons) ; pas d'angles très arrondis ; une ombre unique de 1 px.

## 6. Composants (liste fermée, phase 11)

`Button` (primary, secondary, ghost, danger), `Field` / `Input`, `Card`, `Badge` de statut, `DataTable` (tableau au-dessus de 768 px, liste de cartes en dessous), `PageHeader`, `Dialog` de confirmation, `Toast`, `EmptyState`, `Skeleton`, `ErrorState`, `AdminShell` (barre du bas / rail / barre latérale, voir `09-NAVIGATION-CIBLE.md`). Rien d'autre sans besoin démontré.

Chaque page a **trois états obligatoires** : chargement (squelette ou `aria-busy`), vide (phrase utile + action suivante), erreur (message lisible + « Réessayer » ; la saisie n'est pas perdue). Les boutons d'action sont désactivés pendant la requête.

## 7. Accessibilité (non négociable)

- Focus clavier toujours visible ; ordre de tabulation logique ; dialogues : Échap ferme, focus piégé puis restitué à l'élément déclencheur.
- Contraste texte ≥ 4,5:1 ; éléments d'interface ≥ 3:1.
- Statuts : mot + icône + couleur. Libellés de champs liés (`<label for>`), erreurs annoncées (`role="alert"`), succès (`role="status"`).
- Heures : affichées **sans conversion de fuseau** (heure de Krabi), format 24 h (« 19:30 »).
- Respect de `prefers-reduced-motion` ; aucune animation décorative.

## 8. Esquisse : Réservations sur téléphone (360 px)

```
┌────────────────────────────┐
│ Réservations      [+ Résa] │  PageHeader (44 px)
│ ◀  Sam. 31 oct.  ▶  Rech.  │  navigation par date, recherche
├────────────────────────────┤
│ 19:30   Martin  ·  4 pers. │  ligne = carte (min 64 px)
│ ● En attente        [Tél] [WA]
│ [ Confirmer ] [ Annuler ]  │  48 px, désactivés pendant la requête
├────────────────────────────┤
│ 20:00   Schmidt ·  2 pers. │
│ ✓ Confirmée  [Terminée][No-show]
└────────────────────────────┘
 [Aujourd'hui][Résa][Carte][Site][Réput.]   barre du bas, 5 entrées
```

## 9. Interdits

Emoji comme icône · dégradé · dorure ou Cinzel / Cormorant · texte clair sur fond sombre pour du contenu · couleur seule pour un statut · `confirm()` / `alert()` natifs · cibles < 44 px au toucher · `var(--primary)` et autres anciens jetons dans `src/app/admin` en fin de milestone (QA-03) · accents français hors admin (voir `09-TEST-IMPACT.md`, test `i18n-hardcoded`).

## 10. À valider par le propriétaire

1. Palette ivoire + vert jungle + laiton assombri (section 3), laiton rare.
2. Sans-serif Inter + chiffres tabulaires.
3. Thème clair uniquement.
4. Cibles de 44 px (48 px pour les actions de service).
