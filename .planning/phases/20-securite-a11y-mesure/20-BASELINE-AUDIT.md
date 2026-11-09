# Phase 20 - Audit de base (A11Y-01..03, PERF-07)

Base : `milestone/v1.2` @ 4c52cfc, build prod local, `next start` port 3110, Chrome headless.
Outils : Lighthouse CLI (mobile par defaut, simulated throttling, 3 passes, mediane) ; axe-core 4 (color-contrast, label-content-name-mismatch, label, button-name, link-name) + mesure des cibles tactiles via Playwright (viewport 412x823, mobile, tactile). Pages : /fr /en /de /sv, /menu, /review (4 locales), /newsletter /wifi /privacy, 3 pages SEO (fr+en), 2 pages SEO en/ seulement (getting-here, wine-belgian: les slugs fr/de/sv n'ont pas ete testes, 404 sur le slug anglais en /fr).
Aucun fichier de code modifie.

## 1. Lighthouse mobile (local)

| Page | Perf (3 passes) | Mediane Perf | LCP median | TBT median | CLS | A11y |
|------|-----------------|--------------|-----------|-----------|-----|------|
| /fr | 96 / 98 / 99 | **98** | 1254 ms | 154 ms | 0 | 94 |
| /en | 96 / 96 / 95 | **96** | 1225 ms | 222 ms | 0 | 94 |

PERF-07 (>= 90) est deja atteint en local sur le build v1.2 (base initiale 72 / LCP 3,8 s / TBT 680 ms). A re-mesurer sur le build final. Marge TBT /en (222 ms) a surveiller si Phase 20 ajoute du JS. Les mesures en ligne (reseau reel) restent a faire apres deploiement.

Score A11y 94 : audits en echec = `color-contrast`, `label-content-name-mismatch`, `target-size` (seul le selecteur de langue echoue sur target-size, 23-25 px de large).

## 2. Contrastes (A11Y-01)

Jetons : `--gc-brass #B8860B`, `--gc-gold #C69B3C`, `--gc-ivory #FAF0E6` (opacites Tailwind /45 /50 /55 /60), fonds `--gc-parchment #F5EEDA`, `--gc-jungle #0C3C2D`, `--gc-void #0D1F17`.
Ratios de correction calcules (WCAG, texte normal 4,5:1) :
- brass sur parchment : #B8860B = 2,81 ; **#8A6408 = 4,64** (4,78 sur ivory) ; #855F07 = 4,98.
- ivory sur jungle : /50 = 3,94 ; /55 = 4,44 ; **/60 = 4,99** ; /65 = 5,57. Sur void : /45 = 4,07 ; /50 = 4,74 ; /60 = 6,18.
- gold #C69B3C sur jungle = 4,80 (OK) ; sur parchment = 2,22 (KO).

Recommandation unique pour le brass : ajouter un jeton `--gc-brass-ink: #8A6408` (+ `--color-gc-brass-ink` dans `@theme inline`) pour le texte sur fond clair, sans toucher `--gc-brass` (utilise aussi en pictos/or decoratif). Teinte quasi identique, plus sombre de ~20 %.

| SEV | fichier:ligne | probleme (selecteur, couleurs, ratio) | correction |
|-----|---------------|----------------------------------------|-----------|
| HIGH | src/components/LanguageSwitcher.tsx:43 | `nav > a` langues inactives, `text-gc-ivory/45` : #787d74 sur void 4,06 (home) ; #778d80 sur jungle 3,47 (sous-pages), 11 px. Present sur toutes les pages x 4 locales | `text-gc-ivory/45` -> `text-gc-ivory/65` (5,57 sur jungle, 7,07 sur void) |
| HIGH | src/app/[locale]/page.tsx:222,418,554,604 ; src/components/SocialProof.tsx:53,74 | Surtitres de section `p.font-raleway text-[11px] text-gc-brass` ("Notre Histoire", "La Carte", "Horaires", "Ils nous recommandent", "Nous trouver", labels Google/TripAdvisor) : #B8860B sur #F5EEDA = 2,80 | `text-gc-brass` -> `text-gc-brass-ink` (4,64). 4 locales identiques |
| HIGH | src/components/MenuTeaser.tsx:25 | Prix `span.font-cinzel text-[18px] text-gc-brass` (380/450/850 THB) : 2,80 | `text-gc-brass-ink` |
| HIGH | src/components/SocialProof.tsx:22 | Liens "Lire les avis sur Google/TripAdvisor", "Suivre sur Facebook" `text-gc-brass underline` 12 px : 2,80 | `text-gc-brass-ink` |
| HIGH | src/app/[locale]/page.tsx:677 | Lien telephone `a.font-cormorant text-[22px] text-gc-brass` : 2,80 (22 px non "large" car non gras) | `text-gc-brass-ink` |
| MED | src/components/ui/GcDivider.tsx:12-13 | Ornement `span text-[14px] aria-hidden` : variante claire `text-gc-gold/60` = 1,58-1,60 (sur parchment/ivory) ; `text-gc-brass/70` = 2,01 ; sur jungle `gc-gold/60` = 2,62. 12 occurrences par page SEO/menu. Texte decoratif mais compte pour Lighthouse | Fond clair : `text-gc-brass-ink` ; fond sombre : `text-gc-gold` (4,80 sur jungle). Ou rendre l'ornement en SVG/pseudo-element (sort du test) |
| MED | src/components/SiteFooter.tsx:56-60 ; src/app/[locale]/page.tsx:846,849 | Ligne "cree par" `text-[12px] text-gc-ivory/50` et liens selenium-studio.com / anatholy-bricon.com : #839689 sur jungle 3,93 | `/50` -> `/60` (4,99) |
| LOW | src/app/[locale]/page.tsx:784,816 ; SiteFooter.tsx:12 (/60) ; page.tsx:387,405 | `text-gc-ivory/55-60` sur jungle : 4,44 / 4,99, non signales par axe mais a la limite ; /55 echoue de peu | harmoniser a `/60` minimum |
| LOW | src/components/HoursDisplay.tsx:123,142 | `text-gc-brass` sur parchment (titre h4 13 px, italique 15 px) : non signale (rendu conditionnel/API), meme 2,80 attendu | `text-gc-brass-ink` |

## 3. Zones cliquables < 48 px (A11Y-02)

Constat structurant : presque tout le site est cale sur `min-h-11` = **44 px** (32 occurrences dans 17 fichiers). L'exigence A11Y-02 (48 px) impose le passage `min-h-11` -> `min-h-12` (hauteur) ; reste a traiter les cas nettement plus petits.

| SEV | fichier:ligne | element, taille mesuree | correction |
|-----|---------------|--------------------------|-----------|
| HIGH | src/components/LanguageSwitcher.tsx:9 | liens FR/EN/DE/SV : **23-25 x 44 px** (echec Lighthouse target-size, voisins a < 24 px) | `px-1 sm:px-1.5` -> `px-3` (>= 48 de large), `min-h-11` -> `min-h-12` ; gap-0 reste |
| HIGH | src/app/[locale]/page.tsx:99-106 | logo header home `a` **164 x 26 px** | ajouter `inline-flex items-center min-h-12` (la barre h-16 = 64 px suffit) |
| HIGH | src/app/[locale]/page.tsx:106 | bouton RESERVER/BOOK header home **92 x 39 / 66 x 39 px** (`py-2.5`) | `py-2.5` -> `min-h-12 inline-flex items-center` ; elargir `px-` si BOOK < 48 de large (66 OK) |
| HIGH | src/components/ReservationForm.tsx:556 ; NewsletterForm.tsx:165 ; page.tsx (consent) | lien "politique de confidentialite" dans le label de consentement : **149 x 17 / 76 x 17 px** | `inline-block py-3` (ou `-my-3 py-3`) ; conserver le soulignement |
| HIGH | src/app/[locale]/page.tsx:252 | lien texte "Decouvrez notre cuisine francaise a Krabi..." **357 x 38 px** | `inline-flex items-center min-h-12` |
| MED | src/app/[locale]/page.tsx:784 | lien footer "Menu" **32 x 21 px** (`inline-block mt-2`) | `inline-flex items-center min-h-12` |
| MED | src/app/[locale]/page.tsx:816 | lien tel footer (texte 14 px, ~17-21 px haut) | idem `min-h-12` |
| MED | src/app/[locale]/page.tsx:846,849 ; SiteFooter.tsx (liens createurs) | selenium-studio.com / anatholy-bricon.com **97 x 14 px** | `inline-flex min-h-12 items-center` (ou padding vertical) |
| MED | src/components/ReservationForm.tsx:491,502 | boutons -/+ couverts **44 x 44 px** (`w-11 h-11`) | `w-12 h-12` |
| MED | src/components/ReservationForm.tsx:57,60,396 + selects (#res-name/-email/-date/-country/-phone/-time/-occasion) | champs **298 x 44 px** (`min-h-11`) | `min-h-12` |
| MED | src/components/ReservationForm.tsx:546 ; NewsletterForm.tsx:157,192 ; footer newsletter | cases a cocher `w-5 h-5` **20 x 20 px** ; label min-h-11 (44) | label `min-h-12`; garder la case a 20 px (le label est la cible) ou `w-6 h-6` |
| MED | `min-h-11` dans : SiteHeader:29,37 ; GuidesMenu:64,85 ; SiteFooter:12 ; SocialProof:22 et boutons avis ; MenuTeaser ; MapEmbed:49 ; MenuAnchorNav ; RelatedGuides ; WifiCopyButton ; menu/review/privacy pages ; ReviewFeedbackForm ; page.tsx (CTA "Voir la carte", "Laisser un avis", itineraire, afficher la carte, 3 liens avis, etc.) | tous mesures **44 px** de haut (ex. 201x44, 316x44, 364x44) | remplacement mecanique `min-h-11` -> `min-h-12`, verifier visuellement les zones de 64 px (header h-16) et les listes footer (espacement vertical +4 px par ligne) |
| LOW | `a.sr-only` "Aller au contenu" | 1x1 hors focus | ignorer (visible au focus) |
| LOW | ReservationForm.tsx:534-545 | honeypot `-left-[9999px]` aria-hidden : 20 x 20 / 159 x 24 inputs hors ecran (24 occurrences dans les mesures) | faux positif, aucune action |

Total distinct mesures < 48 px : environ 40 elements uniques sur la home, dont 8 < 44 px (listes ci-dessus), le reste a 44 px.

## 4. aria-label vs texte visible (A11Y-03, WCAG 2.5.3)

Echecs `label-content-name-mismatch` Lighthouse/axe sur controles interactifs (5 sur /fr, 4 sur /de) + cas non signes par axe.

| SEV | fichier:ligne | probleme | correction |
|-----|---------------|----------|-----------|
| HIGH | src/components/LanguageSwitcher.tsx:31,42 + messages `*.json` `switchTo` ("Changer vers {language}", "Switch to ...", "Zu ... wechseln", "Byt till ...") | texte visible "EN"/"DE"/"SV"/"FR" absent du nom accessible. 3 liens sur chaque page, 4 locales, toutes les pages | construire `aria-label={`${target.locale.toUpperCase()} - ${label}`}` (le nom commence par le texte visible), ou supprimer l'aria-label et garder `lang`/`hrefLang` + `<span class="sr-only"> ({language})</span>` |
| HIGH | src/app/[locale]/page.tsx:182 ; `hero.discoverAriaLabel` x4 locales | visible "Decouvrir notre cuisine" / "Discover our cuisine" / "Unsere Kueche entdecken" / "Upptack vart kok" ; aria "Decouvrir notre carte et nos specialites" (mots visibles non contigus) | supprimer l'aria-label (le texte visible suffit) ou le formuler en commencant par le texte visible : "Decouvrir notre cuisine : la carte et nos specialites" |
| MED | src/app/[locale]/page.tsx:735 ; `contactSection.viewMapAriaLabel` x4 | visible "Voir sur Google Maps ->" ; aria "Voir notre emplacement sur Google Maps (ouvre dans un nouvel onglet)" : echec axe en fr/en/sv | aria = "Voir sur Google Maps (ouvre dans un nouvel onglet)" (idem en/de/sv avec le libelle visible en prefixe) |
| LOW | src/components/ReservationForm.tsx:490,501 (-/+) | visible "-" / "+" (symboles) ; aria "Moins/Plus de couverts" : pas d'echec axe (symboles exclus) | aucune action requise |
| LOW | src/components/SocialProof.tsx:139 | visible "TRIPADVISOR", aria "Voir l'avis de X sur tripadvisor" : contient le texte visible, OK | aucune action |
| INFO | SiteHeader:22, page.tsx:106 | `Gecko Cabane - Accueil` / `Reserver une table` contiennent le texte visible : OK | aucune action |
| INFO | nav / footer / div notation (`aria-label` sur elements non interactifs) | ecarts "visible vs label" sans valeur 2.5.3 (non controles) | aucune action |

## 5. Synthese

| Categorie | Points distincts |
|-----------|------------------|
| Contraste | 9 groupes de sources (5 HIGH, 2 MED, 2 LOW), ~77 noeuds uniques ; Lighthouse /fr : 22 noeuds |
| Zones cliquables < 48 px | 13 lignes (4 HIGH < 40 px, le reste a 44 px via `min-h-11` global : 32 occurrences / 17 fichiers) |
| aria-label vs visible | 3 echecs reels (switcher langue, CTA hero, lien Maps), 0 sur les autres |

Ordre de travail propose : (1) jeton `--gc-brass-ink` + remplacements (2) `min-h-11` -> `min-h-12` global + les 5 cas < 40 px (3) trois libelles aria x 4 locales (cles `switchTo`, `hero.discoverAriaLabel`, `contactSection.viewMapAriaLabel` dans fr/en/de/sv). Verifier les tests i18n (`tests/i18n.test.ts`) apres changement des cles.
