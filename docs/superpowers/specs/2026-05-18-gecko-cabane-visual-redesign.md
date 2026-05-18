# Gecko Cabane — Refonte Visuelle · Direction Artistique

**Date :** 2026-05-18  
**Auteur :** UX/UI Senior (Claude)  
**Statut :** Approuvé  
**Direction :** B — "La Véranda"

---

## 1. Brief & Concept

### Concept central
Le visiteur arrive sur le site comme on arrive devant la véranda du Gecko Cabane à la nuit tombée — la jungle derrière, la lumière chaude des bougies dedans, l'odeur des épices. Le site est ce seuil. Chaque scroll est un pas vers la table.

### Territoire
**Indochine coloniale 1920-30** × **jungle brute de Krabi** × **food porn gastronomique** × **fond sombre** × **typographie lapidaire solennelle**

### Références visuelles clés
- Sofitel Legend Metropole Hanoi — palette coloniale ivoire/vert/or, photographie d'ambiance
- Ultraviolet by Paul Pairet (Shanghai) — fond noir, rituel du repas, typographie minimaliste
- Musée Guimet Paris — objets de valeur isolés dans l'obscurité, lumière de musée sur la nourriture
- Chef's Table Netflix (saisons 1-2) — photographie chiaroscuro, ombre non récupérée, lumière tungstène

### Ce qui disparaît
- Tous les emojis dans l'UI publique (nav, titres, sections)
- Palette vert vif générique (#4CAF50, #2E7D32)
- Boutons `rounded-full` partout
- Fond vert clair (#F5F9F4)
- Décors emoji 🌿🍃🌴 comme seul langage décoratif

---

## 2. Palette de Couleurs

```css
:root {
  /* Fonds */
  --gc-void:        #0D1F17;   /* Hero, galeries, footer — noir-vert forêt */
  --gc-jungle:      #0C3C2D;   /* Sections secondaires sombres */
  --gc-moss:        #1A4A35;   /* Hover states, cartes au survol */

  /* Métalliques */
  --gc-gold:        #C69B3C;   /* Or antique — titres, séparateurs, CTA */
  --gc-brass:       #B8860B;   /* Or patiné — accents secondaires, icônes */
  --gc-copper:      #8C5A3C;   /* Cuivre — accents tertiaires */

  /* Clairs */
  --gc-ivory:       #FAF0E6;   /* Texte principal sur fond sombre */
  --gc-parchment:   #F5EEDA;   /* Fond sections About, Menu, Contact */
  --gc-aged:        #E8DCC8;   /* Bordures, séparateurs subtils */

  /* Accent */
  --gc-celadon:     #8FA882;   /* Céladon — badges végétarien, rareté */
  --gc-text-dark:   #1A0E00;   /* Texte foncé sur fond parchment */
  --gc-text-mid:    #5C4A3A;   /* Descriptions sur fond parchment */
}
```

### Règle d'alternance des sections
```
Hero          → --gc-void
Signature     → --gc-jungle
About         → --gc-parchment
Cuisine       → --gc-void
Menu          → --gc-parchment
Galerie       → --gc-void
Hours         → --gc-jungle
Réservation   → --gc-void
Contact       → --gc-parchment
Footer        → --gc-void
```

---

## 3. Typographie

### Google Fonts à charger
```
Cinzel:              400, 600, 700
Cinzel Decorative:   700
Cormorant Garamond:  300, 300i, 400, 400i, 600i
Raleway:             300, 400
```

### Hiérarchie typographique

| Rôle | Police | Graisse | Taille desktop | Particularité |
|------|--------|---------|---------------|---------------|
| Logo wordmark | Cinzel Decorative | 700 | 28px | Letter-spacing 0.1em |
| Titre Hero | Cinzel Decorative | 700 | 96px | Letter-spacing 0.05em |
| Titre section | Cinzel | 400 | 48px | Letter-spacing 0.03em |
| Sous-titre section | Cormorant Garamond | 400i | 22px | Line-height 1.6 |
| Nom de plat | Cormorant Garamond | 300i | 22px | |
| Description plat | Cormorant Garamond | 400 | 15px | Line-height 1.8, opacity 0.75 |
| Prix | Cinzel | 400 | 16px | Small caps, --gc-gold |
| Navigation | Raleway | 300 | 13px | UPPERCASE, letter-spacing 0.2em |
| Corps texte | Cormorant Garamond | 400 | 17px | Line-height 1.8 |
| Labels form | Raleway | 300 | 11px | UPPERCASE, letter-spacing 0.2em |
| Séparateur `——◆——` | Cinzel | 400 | 14px | Letter-spacing 0.4em, --gc-gold |

### Tailles mobiles (breakpoint < 768px)
- Titre Hero : 56px
- Titre section : 32px
- Corps : 16px

---

## 4. Textures & Effets Visuels

### Noise organique (tous les fonds sombres)
```css
/* Appliquer via pseudo-élément ::after ou background-image */
background-image: url('/textures/noise.png');
background-size: 200px 200px;
opacity: 0.04;
mix-blend-mode: overlay;
```
Générer le fichier `noise.png` : PNG 200×200 avec bruit gaussien monochrome, opaque.

### Vignette (sections hero et galerie)
```css
background: radial-gradient(
  ellipse 80% 80% at 50% 50%,
  transparent 40%,
  rgba(0, 0, 0, 0.45) 100%
);
```

### Gravures botaniques
- Format : SVG line art de feuilles tropicales (heliconia, bananier, lotus, fougère)
- Couleur stroke : `#C69B3C`
- Opacité : 6-8%
- Position : absolue, débordant les containers, non-interactives (pointer-events: none)
- Source : Biodiversity Heritage Library (domaine public, 19e siècle)
- Fichiers : `botanical-heliconia.svg`, `botanical-lotus.svg`, `botanical-palm.svg`
- Animation : `float` CSS 6s infinite ease-in-out, amplitude ±8px Y

### Séparateur décoratif
```css
.gc-divider {
  font-family: 'Cinzel', serif;
  color: #C69B3C;
  letter-spacing: 0.4em;
  opacity: 0.6;
  text-align: center;
  font-size: 14px;
  margin: 32px auto;
  display: block;
}
/* Rendu : ——◆—— */
```

---

## 5. Composants

### Navigation
```
Fond :           #0D1F17 (plein, pas de backdrop-blur)
Hauteur :        72px
Logo :           Cinzel Decorative 700, --gc-gold, "GECKO CABANE"
Liens :          Raleway 300, UPPERCASE, --gc-ivory 70% → 100% + underline --gc-gold au hover
CTA Réserver :   bordure 1px solid --gc-gold, fond transparent → fond --gc-gold hover
                 texte --gc-gold → --gc-void hover
                 padding 12px 28px, radius 0
Mobile :         hamburger SVG line art --gc-gold, menu drawer fond --gc-void
```

### Bouton Primary (CTA)
```css
.btn-primary {
  font-family: 'Cinzel', serif;
  font-size: 13px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--gc-gold);
  background: transparent;
  border: 1px solid var(--gc-gold);
  padding: 14px 36px;
  border-radius: 0;
  transition: all 200ms ease;
}
.btn-primary:hover {
  background: var(--gc-gold);
  color: var(--gc-void);
}
```

### Bouton Secondary
```css
.btn-secondary {
  font-family: 'Raleway', sans-serif;
  font-weight: 300;
  font-size: 13px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--gc-ivory);
  background: transparent;
  border: 1px solid rgba(250,240,230,0.35);
  padding: 14px 36px;
  border-radius: 0;
}
.btn-secondary:hover {
  border-color: rgba(250,240,230,0.8);
}
```

### Card Pilier Cuisine (section 4 colonnes)
```css
.card-pilier {
  background: var(--gc-jungle);
  border: 1px solid rgba(198,155,60,0.2);
  border-top: 2px solid var(--gc-gold);
  padding: 32px;
  transition: all 300ms ease;
}
.card-pilier:hover {
  background: var(--gc-moss);
  box-shadow: 0 20px 60px rgba(198,155,60,0.08);
  transform: translateY(-4px);
}
/* Icône : SVG line art 32px, stroke --gc-gold */
/* Titre : Cinzel 400 18px --gc-ivory */
/* Texte : Cormorant Garamond 400 16px rgba(250,240,230,0.7) */
```

### Item Menu
```
Layout :      flex, justify-between, align-baseline
Padding :     16px 0
Border-bas :  1px solid rgba(232,220,200,0.3)

Nom :         Cormorant Garamond Italic 300 · 22px · --gc-text-dark
Prix :        Cinzel 400 · 16px · --gc-gold · margin-left: auto · padding-left: 24px
Description : Cormorant Garamond 400 · 15px · --gc-text-mid · italic
Badge V :     Cinzel 400 · 11px · --gc-celadon · small caps
Badge S :     Cinzel 400 · 11px · --gc-gold · small caps
```

### Form Fields (Réservation)
```css
.gc-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(198,155,60,0.3);
  border-radius: 0;
  color: var(--gc-ivory);
  font-family: 'Cormorant Garamond', serif;
  font-size: 17px;
  padding: 12px 0;
  width: 100%;
}
.gc-input:focus {
  outline: none;
  border-bottom-color: var(--gc-gold);
}
.gc-label {
  font-family: 'Raleway', sans-serif;
  font-weight: 300;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--gc-gold);
  display: block;
  margin-bottom: 6px;
}
```

---

## 6. Structure des Sections

### Hero
- Fond `--gc-void` + noise 4% + vignette radiale
- Gravure botanique positionnée bas-droite (heliconia SVG)
- Centre : séparateur `——◆——` · "GECKO CABANE" Cinzel Decorative 96px · séparateur
- Sous-titre Cormorant Garamond Italic 22px ivoire
- Localisation Raleway 300 13px uppercase or, opacité 0.6
- 2 boutons : Primary "Réserver une Table" + Secondary "Découvrir la Carte"
- Scroll indicator : ligne verticale fine or, animation pulse 2s

### Signature (nouvelle section)
- Fond `--gc-jungle`, hauteur 180px
- Citation chef Jariya · Cormorant Garamond Italic 28px · --gc-ivory centré
- Séparateurs `——◆——` avant/après
- Pas d'image

### About
- Fond `--gc-parchment`
- Grille 2 colonnes (texte + carte chef)
- Texte : Cormorant Garamond 400 17px --gc-text-dark, line-height 1.8
- Carte chef : fond `--gc-void`, bordure or, photo chef N&B teinté chaud ou portrait gravure
- Alerte cuisine 22h : card sobre, bordure-left `3px solid --gc-gold`, fond `rgba(198,155,60,0.08)`

### Section Cuisine (4 piliers)
- Fond `--gc-void`
- 4 cards `.card-pilier` : Gastronomie Française · Cuisine Thaï · Fusion Créative · Produits Frais
- Icônes SVG line art, pas d'emojis

### Menu
- Fond `--gc-parchment`
- Tabs Cinzel UPPERCASE + ligne or en bas sur tab active
- Items selon composant Menu Item Row ci-dessus
- Séparateurs entre catégories : `——◆——` en or

### Galerie Plats (nouvelle section)
- Fond `--gc-void`
- Grille masonry 3 colonnes desktop, 2 mobile, 1 xs
- Photos chiaroscuro : surface teck sombre, lumière tungstène gauche, ombres non récupérées
- Lightbox au clic : fond `rgba(0,0,0,0.95)`, navigation par flèches SVG or
- Si pas de vraies photos : utiliser Higgsfield pour générer les visuels (voir Section 8)

### Hours + Services
- Fond `--gc-jungle`
- Tableau horaires : Raleway 300 nav + Cormorant Garamond 400 pour les valeurs
- Services : grille 3-4 colonnes, icônes SVG 24px stroke or, libellés Raleway 300

### Réservation
- Fond `--gc-void`
- Formulaire centré max-width 600px
- Fields `.gc-input` avec `.gc-label`
- Titre Cinzel 400 48px ivoire + séparateur or
- Badge "Bientôt disponible" : sobre, Raleway 300, bordure or, pas de jaune-chantier

### Contact
- Fond `--gc-parchment`
- 2 colonnes : adresse + carte d'identité restaurant
- Adresse : Cormorant Garamond 400 17px --gc-text-dark
- Carte restaurant : fond `--gc-void`, infos en ivoire, bouton "Voir sur la carte" primary

### Footer
- Fond `--gc-void`
- 4 colonnes : brand · horaires · contact · mentions légales
- Wordmark Cinzel Decorative or en haut à gauche
- Séparateur or `——◆——` sous le wordmark
- Texte : Raleway 300 12px ivoire 50%
- Bas de footer : ligne bordure or 20%, copyright Raleway 300, crédit studios

---

## 7. Animations & Interactions

```css
/* Entrée au scroll (IntersectionObserver) */
.gc-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 600ms ease-out, transform 600ms ease-out;
}
.gc-reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
/* Stagger entre enfants : délai +100ms par élément */

/* Float gravure botanique */
@keyframes gc-float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}
.gc-botanical { animation: gc-float 6s ease-in-out infinite; }

/* Scroll indicator hero */
@keyframes gc-pulse-line {
  0%, 100% { opacity: 0.3; transform: scaleY(0.5); }
  50%       { opacity: 1;   transform: scaleY(1); }
}
```

---

## 8. Assets à Générer

### Higgsfield (photo/vidéo)
Générer via le skill `higgsfield-generate` :
1. **Hero background video** (optionnel, muted autoplay loop) : table dressée en teck sombre, une bougie allumée, reflets or sur couverts anciens, jungle floue en arrière-plan, caméra très lente (timelapse inverse), palette `#0D1F17` dominante
2. **5-8 photos plats** style chiaroscuro : surface teck sombre, lumière tungstène gauche, ombres profondes, plats Franco-Thaï (curry rouge gastronomique, carpaccio de thon, dessert jasmin)
3. **Portrait chef Jariya** : style gravure N&B légèrement teinté sépia, cuisine en fond flou

### Blender (3D)
Générer via les outils MCP Blender :
1. **Gecko décoratif SVG-ready** : gecko stylisé Art Nouveau, style gravure, exportable en SVG pour le logo
2. **Couverts anciens** : fourchette et couteau style colonial, rendu N&B gravure, pour assets décoratifs
3. **Feuilles botaniques 3D** : heliconia et lotus en rendu flat/gravure, exportables en SVG

### SVG à créer manuellement
- `botanical-heliconia.svg` : illustration ligne or, 400×600px viewBox
- `botanical-lotus.svg` : idem
- `botanical-palm.svg` : idem
- `gc-divider.svg` : `——◆——` vectorisé

---

## 9. Iconographie

Règle : **zéro emoji dans l'interface publique.**

| Usage | Format | Style |
|-------|--------|-------|
| Navigation (lieu, tel, mail) | SVG inline 20px | Line art, stroke `#C69B3C`, strokeWidth 1.5 |
| Services (wifi, parking, etc.) | SVG sprite 24px | Line art, stroke `#C69B3C` |
| Badge Végétarien | Lettre "V" · Cinzel 400 11px small caps | Couleur `--gc-celadon` |
| Badge Épicé | Lettre "S" · Cinzel 400 11px small caps | Couleur `--gc-gold` |
| Scroll indicator hero | SVG flèche fine verticale | Stroke `--gc-gold`, strokeWidth 1 |
| Fleche navigation | `→` Cinzel ou SVG | `--gc-gold` |

---

## 10. Implémentation Tailwind v4

Les nouvelles variables remplacent le système actuel dans `globals.css`.  
Toutes les classes utilisent la notation `bg-(--gc-void)`, `text-(--gc-gold)`, etc. conforme à Tailwind v4.

Les fontes Google sont chargées via `next/font/google` dans `src/app/layout.tsx` :
- `Cinzel` (subsets: latin)
- `Cormorant_Garamond` (subsets: latin, weights: 300, 400, 600, style: italic)
- `Raleway` (subsets: latin, weights: 300, 400)

---

## 11. Périmètre de la refonte

### Inclus
- `src/app/globals.css` — nouvelles variables CSS + Tailwind theme
- `src/app/[locale]/page.tsx` — refonte complète de toutes les sections
- `src/app/[locale]/layout.tsx` — nouvelles fontes
- `src/app/layout.tsx` — chargement fontes Google
- `src/components/MenuDisplay.tsx` — nouveau rendu items
- `src/components/HoursDisplay.tsx` — nouveau rendu tableau
- `src/components/ReservationForm.tsx` — nouveaux styles form
- `src/components/AnnouncementBanner.tsx` — style sobre or/void
- `src/components/LanguageSwitcher.tsx` — style Raleway 300
- `public/` — ajout assets SVG botaniques + noise.png

### Hors périmètre (cette phase)
- Interface admin (`src/app/admin/`) — reste en fr fixe, pas de refonte
- Route handlers API — aucun changement
- Base de données Supabase — aucun changement
- Système i18n — aucun changement (les clés existantes sont réutilisées)

---

## 12. Critères de succès

- [ ] Zéro emoji visible dans l'interface publique
- [ ] Palette `--gc-*` appliquée sur l'intégralité du site public
- [ ] Fontes Cinzel + Cormorant Garamond + Raleway actives
- [ ] Sections alternent correctement void/parchment selon la règle
- [ ] Composants Button, Card, MenuItem, Form conformes au design system
- [ ] Séparateurs `——◆——` or présents sur chaque section
- [ ] Gravures botaniques SVG présentes dans Hero et About minimum
- [ ] Animations scroll reveal actives
- [ ] Score Lighthouse accessibilité ≥ 90 (contrastes vérifiés)
- [ ] Responsive mobile validé sur 375px et 768px
