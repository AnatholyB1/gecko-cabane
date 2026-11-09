# 20c - Build report (A11Y-01, A11Y-02, A11Y-03)

Branche `phase/20c-a11y` (base milestone/v1.2, fusionnee en retour). Mesures : build prod local, port 3106, Playwright (iPhone 14 390 px + 1440), axe-core (color-contrast, label-content-name-mismatch, target-size, label, button-name, link-name), 14 pages (/fr /en /de /sv, /fr/menu, /fr/review, /fr/privacy, 8 pages SEO), Lighthouse a11y mobile. Captures avant/apres hors git.

## Avant / apres

| Point de l'audit | Avant | Apres |
|---|---|---|
| Lighthouse a11y /fr, /en | 94 / 94 | **100 / 100** |
| axe color-contrast (home) | 22 noeuds par locale | **0** (SEO/menu : 7-13 -> 0) |
| axe label-content-name-mismatch | 5 (fr), 4 (de), 1-3 sur SEO/menu | **0** |
| axe target-size | 1 par page (selecteur de langue) | **0** |
| Cibles non inline < 44 px (home mobile) | 11 | 7 (voir residuels) |
| Cibles hauteur effective < 48 (home mobile) | n/a | 3 (selecteur de langue, largeur seulement) |

A11Y-01 : jeton `--gc-brass-ink #8A6408` (4,64:1 sur parchment) + `--color-gc-brass-ink` ; texte laiton -> ink (surtitres, prix MenuTeaser, liens SocialProof, tel contact, HoursDisplay, pictos sans gluten) ; `--gc-brass` inchange pour ornements/etoiles/icones. Selecteur de langue `/45` -> `/65`. Textes ivoire `/25 /35 /45 /50 /55` -> `/60` dans le footer de la home et SiteFooter (min. 4,99:1 sur jungle). GcDivider : couleurs inchangees ; glyphes emis par `before:content-[...]` (le span est deja `aria-hidden` mais axe le testait quand meme) : ornement purement decoratif, rendu identique.

A11Y-02 : `min-h-11` -> `min-h-12` (32 occurrences, 18 fichiers, hors admin) ; boutons -/+ couverts, fermeture du popup newsletter et de la banniere d'annonce -> 48 px ; logo home `inline-flex min-h-12` (centre, aucun deplacement) ; bouton RESERVER du header home : zone etendue par pseudo-element (`after:-inset-y-[6px]`), mesure `elementFromPoint` = 48 px, aucun changement visuel ; lien "Decouvrez notre cuisine francaise", lien Menu et tel du footer, tel de la section contact et de la liste contact : min-h-12 avec marges negatives pour ne pas deplacer le texte ; bouton "Voir sur Google Maps" +4 px de hauteur (44 -> 48).

A11Y-03 : selecteur de langue `aria-label` = `EN - Changer vers English` (code visible en prefixe, construit dans le composant, cle `switchTo` inchangee) ; `hero.discoverAriaLabel` et `contactSection.viewMapAriaLabel` x4 locales. Revue de tous les aria-label publics : les autres contiennent deja le texte visible (homeAriaLabel, bookTable, SocialProof, etc.) ; admin non concerne.

## Chaines modifiees, a relire (DE/SV)
- de `hero.discoverAriaLabel` : "Unsere Küche entdecken: Speisekarte und Spezialitäten" ; `contactSection.viewMapAriaLabel` : "In Google Maps ansehen (öffnet in neuem Tab)"
- sv `hero.discoverAriaLabel` : "Upptäck vårt kök: meny och specialiteter" ; `viewMapAriaLabel` : "Visa i Google Maps (öppnas i ny flik)"
- fr : "Découvrir notre cuisine : la carte et nos spécialités" / "Voir sur Google Maps (ouvre dans un nouvel onglet)" ; en : "Discover our cuisine: our menu and specialties" / "View on Google Maps (opens in new tab)"

## Ecarts visuels (a valider a l'oeil)
- Selecteur de langue plus lumineux (/45 -> /65) et un peu plus large (+~2 px mobile, +~8 px par lien des 640 px) ; header sub-pages : bouton RESERVER 44 -> 48 px de haut.
- Textes de pied de page de la home plus clairs (/25-/35 -> /60), surtitres et prix un peu plus fonces (#8A6408 vs #B8860B).
- Pages 20 a 190 px plus hautes (lignes de liste/footer a 48 px au lieu de 44).
- Comparaison des captures : haut de page /fr identique a 1-2 px pres (logo recentre).

## Non traite / residuel (a decider)
- Selecteur de langue : largeur 27-33 px sur mobile (hauteur 48). Atteindre 48 de large x 4 langues deborde du header : le header des sous-pages (SiteHeader) **deborde deja avant la phase** (scrollWidth 434-436 px a 390 px sur /fr/menu et /de/anreise..., 490-560 a 412 px) ; ma largeur reste dans la marge (390 inchange pour fr/venir et sv, +8 px sur /fr/menu). Defaut de mise en page pre-existant a traiter a part (hors perimetre).
- Liens en ligne exemptes (WCAG 2.5.8, dans une phrase) non gonfles : "politique de confidentialite" dans les labels de consentement (la ligne du label fait 48 px) et liens createurs selenium-studio / anatholy-bricon.
- Cases a cocher 20 x 20 : la cible est le label (min-h 48), case inchangee.
- Menu-link footer / bouton RESERVER header home : hauteur 48, largeur 32 / 84 (>= 24).
- `src/app/[locale]/page.tsx` : edits classes seulement (logo, RESERVER, liens, ivoire/brass) ; conflit possible avec B19b (fusion `milestone/v1.2` effectuee sans conflit).
- Non prouve : lecteur d'ecran reel (NVDA/VoiceOver), appareil tactile reel, pages /sv /de de toutes les pages SEO non testees une a une, Lighthouse en ligne.
- Mesures dans le scratchpad (hors git) : results.json avant/apres, captures, scripts.
