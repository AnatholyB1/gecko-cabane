# Gecko Cabane — Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refonte visuelle complète du site public selon la Direction Artistique "La Véranda" — fond noir-vert colonial, typographie Cinzel/Cormorant Garamond, zéro emoji dans l'UI publique.

**Architecture:** Nouvelles CSS variables `--gc-*` dans `globals.css`, remplacement des fontes Google (Playfair/Lora → Cinzel/Cormorant/Raleway), refonte JSX complète de `page.tsx`, restyling des 5 composants réutilisables. Un composant `GcDivider` est créé. Trois SVG botaniques dans `public/`. La logique métier (Supabase, OTP, API) reste intacte.

**Tech Stack:** Next.js 16 App Router · TypeScript · Tailwind CSS v4 · next/font/google · next-intl

**Spec de référence :** `docs/superpowers/specs/2026-05-18-gecko-cabane-visual-redesign.md`

---

## Fichiers modifiés / créés

| Fichier | Action |
|---------|--------|
| `src/app/globals.css` | Remplacement complet |
| `src/app/layout.tsx` | Remplacement fontes |
| `src/app/[locale]/page.tsx` | Remplacement complet JSX |
| `src/components/ui/GcDivider.tsx` | Création |
| `src/components/MenuDisplay.tsx` | Styles uniquement |
| `src/components/HoursDisplay.tsx` | Styles uniquement |
| `src/components/ReservationForm.tsx` | Styles uniquement, logique intacte |
| `src/components/AnnouncementBanner.tsx` | Styles uniquement |
| `src/components/LanguageSwitcher.tsx` | Styles uniquement |
| `public/botanical-heliconia.svg` | Création |
| `public/botanical-lotus.svg` | Création |
| `public/botanical-palm.svg` | Création |

---

## Task 1: CSS Foundation

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Remplacer globals.css intégralement**

```css
/* src/app/globals.css */
@import "tailwindcss";

/* ── Tokens couleurs ───────────────────────────────────── */
:root {
  --gc-void:        #0D1F17;
  --gc-jungle:      #0C3C2D;
  --gc-moss:        #1A4A35;
  --gc-gold:        #C69B3C;
  --gc-brass:       #B8860B;
  --gc-copper:      #8C5A3C;
  --gc-ivory:       #FAF0E6;
  --gc-parchment:   #F5EEDA;
  --gc-aged:        #E8DCC8;
  --gc-celadon:     #8FA882;
  --gc-text-dark:   #1A0E00;
  --gc-text-mid:    #5C4A3A;
}

/* ── Tailwind v4 theme ─────────────────────────────────── */
@theme inline {
  --color-gc-void:        var(--gc-void);
  --color-gc-jungle:      var(--gc-jungle);
  --color-gc-moss:        var(--gc-moss);
  --color-gc-gold:        var(--gc-gold);
  --color-gc-brass:       var(--gc-brass);
  --color-gc-copper:      var(--gc-copper);
  --color-gc-ivory:       var(--gc-ivory);
  --color-gc-parchment:   var(--gc-parchment);
  --color-gc-aged:        var(--gc-aged);
  --color-gc-celadon:     var(--gc-celadon);
  --color-gc-text-dark:   var(--gc-text-dark);
  --color-gc-text-mid:    var(--gc-text-mid);
  --font-cinzel:            var(--font-cinzel);
  --font-cinzel-decorative: var(--font-cinzel-decorative);
  --font-cormorant:         var(--font-cormorant);
  --font-raleway:           var(--font-raleway);
}

/* ── Base ──────────────────────────────────────────────── */
body {
  background: var(--gc-void);
  color: var(--gc-ivory);
  font-family: var(--font-cormorant), Georgia, serif;
}

html {
  scroll-behavior: smooth;
}

/* ── Scrollbar ─────────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--gc-void); }
::-webkit-scrollbar-thumb { background: var(--gc-gold); opacity: 0.4; }
::-webkit-scrollbar-thumb:hover { background: var(--gc-brass); }

/* ── Animations ────────────────────────────────────────── */
@keyframes gc-float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}
@keyframes gc-float-slow {
  0%, 100% { transform: translateY(0) rotate(180deg); }
  50%       { transform: translateY(-5px) rotate(180deg); }
}
@keyframes gc-scroll-pulse {
  0%, 100% { opacity: 0.25; transform: scaleY(0.5); transform-origin: top; }
  50%       { opacity: 0.9;  transform: scaleY(1);   transform-origin: top; }
}
@keyframes gc-reveal {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Utility classes ───────────────────────────────────── */
.gc-botanical {
  animation: gc-float 6s ease-in-out infinite;
}
.gc-botanical-slow {
  animation: gc-float-slow 8s ease-in-out infinite;
}
.gc-scroll-line {
  animation: gc-scroll-pulse 2s ease-in-out infinite;
}

/* Noise texture overlay (apply to an absolute positioned div) */
.gc-noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  opacity: 0.04;
  mix-blend-mode: overlay;
}

/* Card pilier cuisine */
.gc-card-pilier {
  background-color: var(--gc-jungle);
  border: 1px solid rgba(198, 155, 60, 0.2);
  border-top: 2px solid var(--gc-gold);
  padding: 32px;
  transition: background-color 300ms ease, box-shadow 300ms ease, transform 300ms ease;
}
.gc-card-pilier:hover {
  background-color: var(--gc-moss);
  box-shadow: 0 20px 60px rgba(198, 155, 60, 0.08);
  transform: translateY(-4px);
}

/* ── Accessibility ─────────────────────────────────────── */
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.focus-visible-ring:focus-visible {
  outline: 1px solid var(--gc-gold);
  outline-offset: 2px;
}

/* ── Reduce motion ─────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Vérifier que le serveur de dev démarre sans erreur**

```bash
npm run dev
```

Attendu : serveur démarre sur http://localhost:3000 sans erreur de compilation CSS.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: replace CSS tokens with gc-* dark colonial palette"
```

---

## Task 2: Font Loading

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Remplacer les imports de fontes**

Dans `src/app/layout.tsx`, remplacer les imports et déclarations de fontes (lignes 1-16) par :

```typescript
import type { Metadata } from "next";
import { Cinzel, Cinzel_Decorative, Cormorant_Garamond, Raleway } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel-decorative",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
});
```

- [ ] **Step 2: Mettre à jour la classe `<body>`**

Remplacer la ligne du body dans `RootLayout` :

```typescript
// Avant
className={`${playfair.variable} ${lora.variable} antialiased`}

// Après
className={`${cinzel.variable} ${cinzelDecorative.variable} ${cormorant.variable} ${raleway.variable} antialiased`}
```

Le reste du fichier (metadata, jsonLd, RootLayout) reste inchangé.

- [ ] **Step 3: Vérifier le build TypeScript**

```bash
npx tsc --noEmit
```

Attendu : aucune erreur TypeScript.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "style: replace Playfair/Lora with Cinzel/Cormorant/Raleway fonts"
```

---

## Task 3: Botanical SVG Assets

**Files:**
- Create: `public/botanical-heliconia.svg`
- Create: `public/botanical-lotus.svg`
- Create: `public/botanical-palm.svg`

- [ ] **Step 1: Créer `public/botanical-heliconia.svg`**

```svg
<svg viewBox="0 0 200 420" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#C69B3C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Tige principale -->
  <path d="M100 400 C99 340 97 280 100 200"/>
  <!-- Bracts supérieures droites -->
  <path d="M100 200 C118 178 148 162 142 135 C137 114 112 124 100 200"/>
  <path d="M102 260 C122 238 152 224 150 196 C148 174 122 182 102 260"/>
  <!-- Bracts gauches -->
  <path d="M100 230 C80 208 50 198 48 170 C46 148 74 154 100 230"/>
  <path d="M100 290 C78 268 48 262 44 234 C40 212 70 218 100 290"/>
  <!-- Grande feuille de base -->
  <path d="M100 350 C68 320 40 290 30 258 C22 232 60 238 100 350"/>
  <!-- Détails tige -->
  <path d="M100 380 C102 360 101 340 100 320"/>
  <!-- Petites nervures -->
  <path d="M115 185 C122 178 135 172 138 163" stroke-width="0.8"/>
  <path d="M118 245 C126 238 138 233 142 222" stroke-width="0.8"/>
  <path d="M85 218 C76 210 64 206 58 196" stroke-width="0.8"/>
  <path d="M84 278 C74 270 62 268 55 258" stroke-width="0.8"/>
</svg>
```

- [ ] **Step 2: Créer `public/botanical-lotus.svg`**

```svg
<svg viewBox="0 0 300 320" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#C69B3C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Tige -->
  <path d="M150 300 C150 260 149 230 150 195"/>
  <!-- Bouton central -->
  <ellipse cx="150" cy="188" rx="11" ry="15"/>
  <!-- Pétales intérieurs -->
  <path d="M150 200 C172 186 188 162 175 140 C164 122 150 136 150 200"/>
  <path d="M150 200 C128 186 112 162 125 140 C136 122 150 136 150 200"/>
  <!-- Pétales médians -->
  <path d="M150 210 C190 202 212 178 206 152 C200 130 175 138 150 210"/>
  <path d="M150 210 C110 202 88 178 94 152 C100 130 125 138 150 210"/>
  <!-- Grands pétales extérieurs -->
  <path d="M150 218 C198 214 222 190 220 162 C218 140 192 146 150 218"/>
  <path d="M150 218 C102 214 78 190 80 162 C82 140 108 146 150 218"/>
  <!-- Feuilles de nénuphar -->
  <path d="M100 295 C118 278 148 270 150 285"/>
  <path d="M200 295 C182 278 152 270 150 285"/>
  <path d="M75 305 C105 292 145 285 150 300"/>
  <path d="M225 305 C195 292 155 285 150 300"/>
  <!-- Nervures feuilles -->
  <path d="M120 285 C130 278 142 274 150 285" stroke-width="0.8"/>
  <path d="M108 295 C120 288 138 283 150 295" stroke-width="0.8"/>
</svg>
```

- [ ] **Step 3: Créer `public/botanical-palm.svg`**

```svg
<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#C69B3C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- Tige palmier -->
  <path d="M152 400 C150 340 148 270 150 180"/>
  <!-- Couronne de feuilles -->
  <!-- Feuille centrale haute -->
  <path d="M150 180 C155 145 178 118 168 88 C160 64 142 72 150 180"/>
  <!-- Feuille droite -->
  <path d="M150 192 C178 168 208 162 218 134 C228 110 202 105 150 192"/>
  <!-- Feuille gauche -->
  <path d="M150 192 C122 168 92 162 82 134 C72 110 98 105 150 192"/>
  <!-- Feuille droite basse -->
  <path d="M150 205 C188 190 215 198 228 172 C240 150 214 142 150 205"/>
  <!-- Feuille gauche basse -->
  <path d="M150 205 C112 190 85 198 72 172 C60 150 86 142 150 205"/>
  <!-- Feuille droite sol -->
  <path d="M150 220 C195 212 228 225 244 200 C258 180 228 168 150 220"/>
  <!-- Feuille gauche sol -->
  <path d="M150 220 C105 212 72 225 56 200 C42 180 72 168 150 220"/>
  <!-- Nervures feuilles (détails) -->
  <path d="M158 170 C165 155 172 145 168 132" stroke-width="0.8"/>
  <path d="M168 182 C182 168 194 162 200 148" stroke-width="0.8"/>
  <path d="M132 182 C118 168 106 162 100 148" stroke-width="0.8"/>
  <path d="M175 198 C192 188 204 192 212 180" stroke-width="0.8"/>
  <path d="M125 198 C108 188 96 192 88 180" stroke-width="0.8"/>
  <!-- Texture tige -->
  <path d="M149 240 C151 260 150 280 151 300" stroke-width="0.8" stroke-dasharray="4 6"/>
  <path d="M153 300 C151 320 150 350 152 380" stroke-width="0.8" stroke-dasharray="4 6"/>
</svg>
```

- [ ] **Step 4: Vérifier que les SVG sont valides**

```bash
# Ouvrir les SVGs dans le navigateur pour vérification visuelle
# Démarrer le serveur dev et naviguer vers :
# http://localhost:3000/botanical-heliconia.svg
# http://localhost:3000/botanical-lotus.svg
# http://localhost:3000/botanical-palm.svg
```

Attendu : chaque SVG affiche une illustration botanique en or sur fond transparent.

- [ ] **Step 5: Commit**

```bash
git add public/botanical-heliconia.svg public/botanical-lotus.svg public/botanical-palm.svg
git commit -m "feat: add botanical SVG decorations for colonial aesthetic"
```

---

## Task 4: GcDivider Component

**Files:**
- Create: `src/components/ui/GcDivider.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
// src/components/ui/GcDivider.tsx
interface GcDividerProps {
  /** Sur fond parchment (#F5EEDA), utiliser dark=true pour contraste suffisant */
  dark?: boolean
  className?: string
}

export default function GcDivider({ dark = false, className = '' }: GcDividerProps) {
  return (
    <span
      className={[
        'font-cinzel block text-center text-[14px] tracking-[0.4em]',
        dark ? 'text-gc-brass/70' : 'text-gc-gold/60',
        className,
      ].join(' ')}
      aria-hidden="true"
    >
      ——◆——
    </span>
  )
}
```

- [ ] **Step 2: Vérifier le TypeScript**

```bash
npx tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/GcDivider.tsx
git commit -m "feat: add GcDivider decorative separator component"
```

---

## Task 5: Page Complete Refactor

**Files:**
- Modify: `src/app/[locale]/page.tsx`

Cette tâche remplace intégralement le JSX de la page. La structure des imports et le `export default async function Home()` restent identiques ; seul le JSX rendu change.

- [ ] **Step 1: Remplacer `src/app/[locale]/page.tsx` intégralement**

```tsx
// src/app/[locale]/page.tsx
import { getTranslations } from 'next-intl/server'
import HoursDisplay from '@/components/HoursDisplay'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import MenuDisplay from '@/components/MenuDisplay'
import ReservationForm from '@/components/ReservationForm'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import GcDivider from '@/components/ui/GcDivider'

export default async function Home() {
  const t = await getTranslations()

  return (
    <div className="min-h-screen bg-gc-void font-cormorant">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-gc-gold focus:text-gc-void focus:px-4 focus:py-2 focus:font-cinzel focus:text-[12px] focus:tracking-[0.1em]"
      >
        {t('common.skipToContent')}
      </a>

      {/* ═══ NAVIGATION ═══ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-gc-void border-b border-gc-gold/10"
        role="navigation"
        aria-label={t('common.mainNav')}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-[72px] flex justify-between items-center">
          <a
            href="#"
            className="font-cinzel-decorative font-bold text-gc-gold text-xl tracking-[0.1em] focus:outline-none focus:ring-1 focus:ring-gc-gold"
            aria-label="Gecko Cabane - Accueil"
          >
            GECKO CABANE
          </a>
          <div className="hidden md:flex gap-8 font-raleway font-light text-[13px] tracking-[0.2em] uppercase" role="menubar">
            {[
              { href: '#about', key: 'common.about' },
              { href: '#menu', key: 'common.menu' },
              { href: '#hours', key: 'common.hours' },
              { href: '#reservation', key: 'common.reservation' },
              { href: '#contact', key: 'common.contact' },
            ].map(({ href, key }) => (
              <a
                key={href}
                href={href}
                className="text-gc-ivory/65 hover:text-gc-ivory transition-colors focus:outline-none focus:text-gc-gold"
                role="menuitem"
              >
                {t(key as Parameters<typeof t>[0])}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <a
              href="#reservation"
              className="font-cinzel text-[12px] tracking-[0.15em] uppercase text-gc-gold border border-gc-gold px-5 py-2.5 hover:bg-gc-gold hover:text-gc-void transition-all focus:outline-none focus:ring-1 focus:ring-gc-gold"
              aria-label={t('common.bookTable')}
            >
              {t('common.book')}
            </a>
          </div>
        </div>
      </nav>

      {/* Announcement Banner */}
      <div className="fixed top-[72px] left-0 right-0 z-40">
        <AnnouncementBanner />
      </div>

      <main id="main-content">

        {/* ═══ HERO ═══ */}
        <section className="relative min-h-screen flex items-center justify-center bg-gc-void pt-[72px] overflow-hidden">
          {/* Noise */}
          <div className="absolute inset-0 gc-noise pointer-events-none" aria-hidden="true" />
          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)' }}
            aria-hidden="true"
          />
          {/* Botanical right */}
          <div className="absolute bottom-0 right-0 w-72 h-[440px] opacity-[0.07] gc-botanical pointer-events-none select-none" aria-hidden="true">
            <img src="/botanical-heliconia.svg" alt="" className="w-full h-full object-contain object-bottom" />
          </div>
          {/* Botanical left */}
          <div className="absolute top-20 left-0 w-56 h-80 opacity-[0.05] gc-botanical-slow pointer-events-none select-none" aria-hidden="true">
            <img src="/botanical-palm.svg" alt="" className="w-full h-full object-contain" />
          </div>

          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
            <GcDivider />
            <h1 className="font-cinzel-decorative font-bold text-gc-gold tracking-[0.05em] leading-tight mt-5 mb-5"
                style={{ fontSize: 'clamp(40px, 8vw, 96px)' }}>
              GECKO CABANE
            </h1>
            <GcDivider />
            <p className="font-cormorant italic font-light text-gc-ivory/90 mt-7 mb-2 tracking-wide"
               style={{ fontSize: 'clamp(18px, 2.5vw, 24px)' }}>
              {t('hero.subtitle')}
            </p>
            <p className="font-raleway font-light text-[13px] tracking-[0.3em] uppercase text-gc-gold/55 mb-10">
              Krabi Town · Thaïlande
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#menu"
                className="font-cinzel text-[13px] tracking-[0.15em] uppercase text-gc-gold border border-gc-gold px-8 py-4 hover:bg-gc-gold hover:text-gc-void transition-all focus:outline-none focus:ring-1 focus:ring-gc-gold"
                aria-label={t('hero.discoverAriaLabel')}
              >
                {t('hero.discoverButton')}
              </a>
              <a
                href="#contact"
                className="font-raleway font-light text-[13px] tracking-[0.15em] uppercase text-gc-ivory/75 border border-gc-ivory/30 px-8 py-4 hover:border-gc-ivory/70 transition-all"
              >
                {t('hero.findUsButton')}
              </a>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" aria-hidden="true">
            <div className="w-px h-12 bg-gc-gold/50 gc-scroll-line" />
          </div>
        </section>

        {/* ═══ SIGNATURE ═══ */}
        <section className="relative bg-gc-jungle py-16 px-6 overflow-hidden">
          <div className="absolute inset-0 gc-noise pointer-events-none opacity-50" aria-hidden="true" />
          <div className="max-w-[720px] mx-auto text-center relative z-10">
            <GcDivider />
            <blockquote className="font-cormorant italic font-light text-gc-ivory leading-relaxed mt-6 mb-6"
                        style={{ fontSize: 'clamp(18px, 2.5vw, 26px)' }}>
              &ldquo;{t('about.chefQuote')}&rdquo;
            </blockquote>
            <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase text-gc-gold/65">
              — {t('about.chefName')}
            </p>
            <GcDivider className="mt-6" />
          </div>
        </section>

        {/* ═══ ABOUT ═══ */}
        <section id="about" className="py-24 px-6 bg-gc-parchment relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase text-gc-brass mb-4">
                  Notre Histoire
                </p>
                <h2
                  className="font-cinzel font-normal text-gc-text-dark leading-tight mb-6"
                  style={{ fontSize: 'clamp(26px, 3.5vw, 42px)' }}
                >
                  {t('about.title')}
                </h2>
                <div className="w-12 h-px bg-gc-gold mb-8" />
                <p className="font-cormorant text-[17px] text-gc-text-mid leading-[1.85] mb-5">
                  {t.rich('about.description1', {
                    chef: (chunks) => <span className="text-gc-text-dark font-semibold not-italic">{chunks}</span>
                  })}
                </p>
                <p className="font-cormorant text-[17px] text-gc-text-mid leading-[1.85] mb-8">
                  {t.rich('about.description2', {
                    seats: (chunks) => <span className="text-gc-text-dark font-semibold not-italic">{chunks}</span>
                  })}
                </p>
                <div className="flex items-start gap-4 p-5 border-l-[3px] border-gc-gold bg-gc-gold/5">
                  <svg className="w-5 h-5 text-gc-brass mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <p className="font-cormorant text-[16px] text-gc-text-dark leading-relaxed">
                    <strong>{t('about.important')} :</strong> {t('about.kitchenClose')}
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gc-void p-8 relative">
                  <div className="absolute inset-0 border border-gc-gold/20" />
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gc-gold" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gc-gold" />
                  <div className="relative z-10 text-center py-8">
                    <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase text-gc-gold/65 mb-5">
                      Chef de cuisine
                    </p>
                    <div className="w-20 h-px bg-gc-gold/30 mx-auto mb-5" />
                    <h3 className="font-cinzel font-normal text-gc-ivory text-2xl tracking-wide mb-5">
                      {t('about.chefName')}
                    </h3>
                    <p className="font-cormorant italic text-[17px] text-gc-ivory/75 leading-relaxed">
                      {t('about.chefQuote')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CUISINE ═══ */}
        <section id="cuisine" className="py-24 px-6 bg-gc-void relative overflow-hidden">
          <div className="absolute inset-0 gc-noise pointer-events-none" aria-hidden="true" />
          <div className="max-w-[1200px] mx-auto relative z-10">
            <div className="text-center mb-16">
              <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase text-gc-gold/65 mb-4">
                Notre Cuisine
              </p>
              <h2
                className="font-cinzel font-normal text-gc-ivory mb-4"
                style={{ fontSize: 'clamp(26px, 3.5vw, 42px)' }}
              >
                {t('cuisine.title')}
              </h2>
              <GcDivider />
              <p className="font-cormorant italic text-[18px] text-gc-ivory/65 max-w-2xl mx-auto mt-6">
                {t('cuisine.description')}
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-16">
              {[
                {
                  icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 21H9m6 0a2 2 0 0 0 2-2v-2.25H7V19a2 2 0 0 0 2 2h6Zm-7.5-7.5h9" />
                    </svg>
                  ),
                  titleKey: 'french', descKey: 'frenchDesc',
                },
                {
                  icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                    </svg>
                  ),
                  titleKey: 'thai', descKey: 'thaiDesc',
                },
                {
                  icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                  ),
                  titleKey: 'fusion', descKey: 'fusionDesc',
                },
                {
                  icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                    </svg>
                  ),
                  titleKey: 'healthy', descKey: 'healthyDesc',
                },
              ].map((item, i) => (
                <div key={i} className="gc-card-pilier group">
                  <div className="text-gc-gold mb-5 group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <h3 className="font-cinzel font-normal text-[17px] text-gc-ivory mb-3 tracking-wide">
                    {t(`cuisine.${item.titleKey}` as Parameters<typeof t>[0])}
                  </h3>
                  <p className="font-cormorant text-[15px] text-gc-ivory/60 leading-relaxed">
                    {t(`cuisine.${item.descKey}` as Parameters<typeof t>[0])}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                { titleKey: 'dinner', descKey: 'dinnerDesc' },
                { titleKey: 'brunch', descKey: 'brunchDesc' },
                { titleKey: 'drinks', descKey: 'drinksDesc' },
              ].map((item, i) => (
                <div key={i} className="border border-gc-gold/20 p-7 text-center hover:border-gc-gold/50 transition-colors">
                  <h3 className="font-cinzel font-normal text-[14px] text-gc-ivory tracking-widest uppercase mb-3">
                    {t(`cuisine.${item.titleKey}` as Parameters<typeof t>[0])}
                  </h3>
                  <div className="w-8 h-px bg-gc-gold/35 mx-auto mb-3" />
                  <p className="font-cormorant italic text-[15px] text-gc-ivory/55">
                    {t(`cuisine.${item.descKey}` as Parameters<typeof t>[0])}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ MENU ═══ */}
        <section id="menu" className="py-24 px-6 bg-gc-parchment relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-12">
              <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase text-gc-brass mb-4">
                La Carte
              </p>
              <h2
                className="font-cinzel font-normal text-gc-text-dark mb-4"
                style={{ fontSize: 'clamp(26px, 3.5vw, 42px)' }}
              >
                {t('menuSection.title')}
              </h2>
              <GcDivider dark />
              <p className="font-cormorant italic text-[18px] text-gc-text-mid max-w-2xl mx-auto mt-6">
                {t('menuSection.description')}
              </p>
            </div>
            <MenuDisplay />
          </div>
        </section>

        {/* ═══ SERVICES ═══ */}
        <section className="py-20 px-6 bg-gc-jungle relative overflow-hidden">
          <div className="absolute inset-0 gc-noise pointer-events-none opacity-50" aria-hidden="true" />
          <div className="max-w-[1200px] mx-auto relative z-10">
            <div className="text-center mb-12">
              <h2
                className="font-cinzel font-normal text-gc-ivory tracking-wide"
                style={{ fontSize: 'clamp(20px, 2.5vw, 32px)' }}
              >
                {t('services.title')}
              </h2>
              <GcDivider className="mt-4" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                {
                  icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" /></svg>,
                  labelKey: 'freeWifi',
                },
                {
                  icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>,
                  labelKey: 'cardsAccepted',
                },
                {
                  icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>,
                  labelKey: 'reservations',
                },
                {
                  icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>,
                  labelKey: 'tableService',
                },
                {
                  icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" /></svg>,
                  labelKey: 'streetParking',
                },
                {
                  icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>,
                  labelKey: 'vegetarian',
                },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-3 p-5 border border-gc-ivory/10 hover:border-gc-gold/30 transition-colors text-center">
                  <div className="text-gc-gold">{item.icon}</div>
                  <p className="font-raleway font-light text-[11px] tracking-[0.1em] uppercase text-gc-ivory/65">
                    {t(`services.${item.labelKey}` as Parameters<typeof t>[0])}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOURS ═══ */}
        <section id="hours" className="py-24 px-6 bg-gc-parchment relative overflow-hidden">
          <div className="max-w-[720px] mx-auto">
            <div className="text-center mb-12">
              <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase text-gc-brass mb-4">
                Horaires
              </p>
              <h2
                className="font-cinzel font-normal text-gc-text-dark mb-4"
                style={{ fontSize: 'clamp(26px, 3.5vw, 42px)' }}
              >
                {t('hoursSection.title')}
              </h2>
              <GcDivider dark />
            </div>
            <HoursDisplay />
          </div>
        </section>

        {/* ═══ SOCIAL ═══ */}
        <section className="py-20 px-6 bg-gc-void relative overflow-hidden">
          <div className="absolute inset-0 gc-noise pointer-events-none" aria-hidden="true" />
          <div className="max-w-[860px] mx-auto text-center relative z-10">
            <h2
              className="font-cinzel font-normal text-gc-ivory mb-4"
              style={{ fontSize: 'clamp(20px, 2.5vw, 32px)' }}
            >
              {t('social.title')}
            </h2>
            <GcDivider className="mb-8" />
            <p className="font-cormorant italic text-[18px] text-gc-ivory/65 mb-12 max-w-xl mx-auto">
              {t('social.description')}
            </p>
            <div className="grid md:grid-cols-2 gap-5">
              <a
                href="https://fr.tripadvisor.be/Restaurant_Review-g297927-d2413872-Reviews-Gecko_Cabane_Restaurant_krabi-Krabi_Town_Krabi_Province.html"
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-gc-gold/20 p-8 hover:border-gc-gold/50 transition-colors text-left"
              >
                <p className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold/55 mb-4">TripAdvisor</p>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-gc-gold text-gc-gold" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <p className="font-cormorant text-[16px] text-gc-ivory/65 mb-5 leading-relaxed">
                  {t('social.tripAdvisorText')}
                </p>
                <span className="font-cinzel text-[12px] tracking-[0.1em] uppercase text-gc-gold group-hover:tracking-[0.2em] transition-all">
                  {t('social.readReviews')} →
                </span>
              </a>

              <a
                href="https://www.facebook.com/GeckoCabaneRestaurant/"
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-gc-gold/20 p-8 hover:border-gc-gold/50 transition-colors text-left"
              >
                <p className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold/55 mb-4">Facebook</p>
                <svg className="w-8 h-8 fill-gc-gold opacity-50 mb-4" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <p className="font-cormorant text-[16px] text-gc-ivory/65 mb-5 leading-relaxed">
                  {t('social.facebookText')}
                </p>
                <span className="font-cinzel text-[12px] tracking-[0.1em] uppercase text-gc-gold group-hover:tracking-[0.2em] transition-all">
                  {t('social.followUs')} →
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* ═══ RESERVATION ═══ */}
        <section id="reservation" className="py-24 px-6 bg-gc-jungle relative overflow-hidden">
          <div className="absolute inset-0 gc-noise pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-48 h-72 opacity-[0.05] pointer-events-none" aria-hidden="true">
            <img src="/botanical-lotus.svg" alt="" className="w-full h-full object-contain" />
          </div>
          <div className="max-w-[600px] mx-auto relative z-10">
            <div className="text-center mb-10">
              <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase text-gc-gold/65 mb-4">
                Réservation
              </p>
              <h2
                className="font-cinzel font-normal text-gc-ivory mb-4"
                style={{ fontSize: 'clamp(26px, 3.5vw, 42px)' }}
              >
                {t('reservationForm.title')}
              </h2>
              <GcDivider />
              <p className="font-cormorant italic text-[17px] text-gc-ivory/65 mt-6">
                {t('reservationForm.subtitle')}
              </p>
            </div>

            <div className="relative">
              {/* Coming soon notice */}
              <div className="mb-6 border border-gc-gold/40 p-5 text-center">
                <p className="font-cinzel text-[12px] tracking-[0.2em] uppercase text-gc-gold mb-2">
                  {t('reservationForm.comingSoonTitle')}
                </p>
                <p className="font-cormorant italic text-[15px] text-gc-ivory/55">
                  {t('reservationForm.comingSoonText')}
                </p>
              </div>
              {/* Disabled form preview */}
              <div className="pointer-events-none select-none opacity-40 blur-[2px]" aria-hidden="true">
                <ReservationForm />
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CONTACT ═══ */}
        <section id="contact" className="py-24 px-6 bg-gc-parchment relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-12">
              <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase text-gc-brass mb-4">
                Nous trouver
              </p>
              <h2
                className="font-cinzel font-normal text-gc-text-dark mb-4"
                style={{ fontSize: 'clamp(26px, 3.5vw, 42px)' }}
              >
                {t('contactSection.title')}
              </h2>
              <GcDivider dark />
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="font-cinzel font-normal text-[18px] text-gc-text-dark tracking-wide mb-5">
                  {t('contactSection.addressTitle')}
                </h3>
                <div className="w-8 h-px bg-gc-gold mb-6" />
                <address className="font-cormorant not-italic text-[17px] text-gc-text-mid leading-[2.1] mb-8">
                  1/36-37 Soi Ruamjit<br />
                  Maharat Road<br />
                  Krabi Town 81000<br />
                  {t('contactSection.thailand')}
                </address>
                <div className="border-t border-gc-aged pt-6">
                  <h4 className="font-cinzel font-normal text-[13px] tracking-[0.15em] uppercase text-gc-text-dark mb-4">
                    {t('contactSection.reservationTitle')}
                  </h4>
                  <a
                    href="tel:+66819585945"
                    className="font-cormorant text-[22px] text-gc-brass hover:text-gc-text-dark transition-colors block mb-3"
                  >
                    +66 81 958 5945
                  </a>
                  <p className="font-cormorant italic text-[15px] text-gc-text-mid">
                    {t('contactSection.groupInfo')}
                  </p>
                </div>
              </div>

              <div className="bg-gc-void p-10 relative">
                <div className="absolute inset-0 border border-gc-gold/20" />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gc-gold" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gc-gold" />
                <div className="relative z-10">
                  <h3 className="font-cinzel font-normal text-[18px] text-gc-ivory tracking-wide mb-5">
                    {t('contactSection.welcomeTitle')}
                  </h3>
                  <div className="w-8 h-px bg-gc-gold mb-6" />
                  <p className="font-cormorant text-[16px] text-gc-ivory/75 leading-[1.85] mb-8">
                    {t('contactSection.welcomeText')}
                  </p>
                  <div className="space-y-3 mb-8">
                    {[
                      t('contactSection.maxSeats'),
                      t('contactSection.chefTeam'),
                      t('contactSection.cuisineType'),
                    ].map((label, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-px h-4 bg-gc-gold/50 shrink-0" />
                        <span className="font-cormorant text-[15px] text-gc-ivory/65">{label}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-3">
                      <div className="w-px h-4 bg-gc-gold/50 shrink-0" />
                      <a href="tel:+66819585945" className="font-cormorant text-[15px] text-gc-ivory hover:text-gc-gold transition-colors">
                        +66 81 958 5945
                      </a>
                    </div>
                  </div>
                  <a
                    href="https://maps.google.com/?q=1/36-37+Soi+Ruamjit+Maharat+Road+Krabi+Town+81000+Thailand"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-cinzel text-[12px] tracking-[0.15em] uppercase text-gc-gold border border-gc-gold px-6 py-3 hover:bg-gc-gold hover:text-gc-void transition-all inline-block focus:outline-none focus:ring-1 focus:ring-gc-gold"
                    aria-label={t('contactSection.viewMapAriaLabel')}
                  >
                    {t('contactSection.viewOnMap')} →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ═══ FOOTER ═══ */}
      <footer
        className="bg-gc-void border-t border-gc-gold/15 py-16 px-6 relative overflow-hidden"
        role="contentinfo"
        aria-label={t('footer.restaurantInfo')}
      >
        <div className="absolute inset-0 gc-noise pointer-events-none" aria-hidden="true" />
        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <p className="font-cinzel-decorative font-bold text-gc-gold text-lg tracking-[0.1em] mb-1">
                GECKO CABANE
              </p>
              <GcDivider className="!text-left !mx-0 mb-4 text-[10px]" />
              <p className="font-cormorant text-[14px] text-gc-ivory/45 leading-relaxed">
                {t('footer.subtitle')}<br />
                {t('footer.location')}
              </p>
            </div>
            <div>
              <h4 className="font-cinzel font-normal text-[12px] tracking-[0.2em] uppercase text-gc-ivory/75 mb-4">
                {t('footer.hoursTitle')}
              </h4>
              <p className="font-cormorant text-[14px] text-gc-ivory/45 leading-[1.85]">
                {t('footer.openHours')}<br />
                {t('footer.closedDay')}<br />
                {t('footer.lastOrder')}
              </p>
            </div>
            <div>
              <h4 className="font-cinzel font-normal text-[12px] tracking-[0.2em] uppercase text-gc-ivory/75 mb-4">
                {t('footer.contactTitle')}
              </h4>
              <p className="font-cormorant text-[14px] text-gc-ivory/45 leading-[1.85] mb-2">
                1/36-37 Soi Ruamjit<br />
                Maharat Road, Krabi Town 81000<br />
                {t('contactSection.thailand')}
              </p>
              <a href="tel:+66819585945" className="font-cormorant text-[14px] text-gc-ivory/55 hover:text-gc-gold transition-colors">
                +66 81 958 5945
              </a>
            </div>
            <div>
              <h4 className="font-cinzel font-normal text-[12px] tracking-[0.2em] uppercase text-gc-ivory/75 mb-4">
                {t('footer.legalTitle')}
              </h4>
              <ul className="font-cormorant text-[13px] text-gc-ivory/35 space-y-1.5 leading-relaxed">
                <li>{t('footer.legalBusiness')}</li>
                <li>{t('footer.legalVat')}</li>
                <li>{t('footer.legalAlcohol')}</li>
                <li className="mt-2">{t('footer.legalPdpa')}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gc-gold/10 pt-5 mb-4">
            <p className="font-cormorant text-[12px] text-gc-ivory/25 leading-relaxed">
              {t('footer.legalNotice')}
            </p>
          </div>
          <div className="border-t border-gc-gold/10 pt-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-cormorant text-[13px] text-gc-ivory/35">
              © 2026 Gecko Cabane Restaurant
            </p>
            <GcDivider className="hidden md:block" />
            <p className="font-cormorant text-[12px] text-gc-ivory/25 text-center md:text-right">
              {t('footer.createdBy')}{' '}
              <a href="https://selenium-studio.com" target="_blank" rel="noopener noreferrer"
                 className="hover:text-gc-gold/60 underline transition-colors">selenium-studio.com</a>
              {' & '}
              <a href="https://anatholy-bricon.com" target="_blank" rel="noopener noreferrer"
                 className="hover:text-gc-gold/60 underline transition-colors">anatholy-bricon.com</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Vérifier le TypeScript**

```bash
npx tsc --noEmit
```

Attendu : aucune erreur. Si TypeScript se plaint des clés de traduction (`t('key')` dynamic), caster avec `as Parameters<typeof t>[0]` (déjà fait dans le code).

- [ ] **Step 3: Vérifier visuellement dans le navigateur**

```bash
npm run dev
```

Ouvrir http://localhost:3000/fr et vérifier :
- Fond noir-vert `#0D1F17` sur toute la page
- Typographie Cinzel/Cormorant visible
- Séparateurs `——◆——` présents
- Illustrations botaniques en filigrane dans le hero
- Zéro emoji visible

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/page.tsx src/components/ui/GcDivider.tsx
git commit -m "feat: complete visual refactor of public page — La Véranda direction"
```

---

## Task 6: MenuDisplay Restyle

**Files:**
- Modify: `src/components/MenuDisplay.tsx`

Seuls les styles JSX changent. La logique Supabase (fetchMenu, useState, useEffect) reste intacte.

- [ ] **Step 1: Remplacer le JSX de retour de `MenuDisplay`**

Remplacer tout ce qui est après `const activePage = menuPages.find(p => p.id === activeTab)` :

```tsx
  return (
    <div className="mt-12">
      {/* Tab Navigation */}
      {menuPages.length > 1 && (
        <div className="flex flex-wrap justify-center gap-0 mb-10 border border-gc-aged">
          {menuPages.map(page => (
            <button
              key={page.id}
              onClick={() => setActiveTab(page.id)}
              className={[
                'font-cinzel text-[13px] tracking-[0.15em] uppercase px-8 py-3 transition-all border-r border-gc-aged last:border-r-0',
                activeTab === page.id
                  ? 'bg-gc-text-dark text-gc-gold'
                  : 'bg-transparent text-gc-text-mid hover:text-gc-text-dark hover:bg-gc-aged/30',
              ].join(' ')}
            >
              {page.name}
            </button>
          ))}
        </div>
      )}

      {/* Page Description */}
      {activePage?.description && (
        <p className="text-center font-cormorant italic text-[17px] text-gc-text-mid mb-10 max-w-xl mx-auto">
          {activePage.description}
        </p>
      )}

      {/* Categories and Items */}
      {activePage?.categories.map(category => (
        <div key={category.id} className="mb-14">
          <div className="text-center mb-8">
            <h3 className="font-cinzel font-normal text-[20px] text-gc-text-dark tracking-wide mb-2">
              {category.name}
            </h3>
            {category.description && (
              <p className="font-cormorant italic text-[16px] text-gc-text-mid max-w-lg mx-auto">
                {category.description}
              </p>
            )}
            <div className="w-10 h-px bg-gc-gold mx-auto mt-4" />
          </div>

          <div className="max-w-[860px] mx-auto">
            {(category.items || []).map(item => (
              <div
                key={item.id}
                className="flex justify-between items-baseline gap-6 py-4 border-b border-gc-aged/60 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h4 className="font-cormorant italic font-light text-[20px] text-gc-text-dark leading-tight">
                      {item.name}
                    </h4>
                    {item.is_vegetarian && (
                      <span className="font-cinzel text-[10px] tracking-[0.15em] text-gc-celadon">V</span>
                    )}
                    {item.is_spicy && (
                      <span className="font-cinzel text-[10px] tracking-[0.15em] text-gc-gold">S</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="font-cormorant italic text-[14px] text-gc-text-mid mt-1 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {item.description}
                    </p>
                  )}
                  {item.allergens && (
                    <p className="font-raleway text-[11px] tracking-[0.05em] text-gc-copper mt-1 uppercase">
                      {item.allergens}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {item.price && (
                    <span className="font-cinzel text-[15px] text-gc-gold">
                      {item.price} ฿
                    </span>
                  )}
                  {item.price_label && (
                    <span className="block font-cormorant text-[12px] text-gc-text-mid italic">
                      {item.price_label}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(!category.items || category.items.length === 0) && (
            <p className="text-center font-cormorant italic text-[16px] text-gc-text-mid">
              Ce menu est en cours de préparation
            </p>
          )}
        </div>
      ))}

      {(!activePage?.categories || activePage.categories.length === 0) && (
        <p className="text-center font-cormorant italic text-[17px] text-gc-text-mid">
          La carte est en cours de préparation
        </p>
      )}
    </div>
  )
```

Remplacer également le loading spinner :

```tsx
  // Avant
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    )
  }

  // Après
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="w-8 h-8 border border-gc-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
```

- [ ] **Step 2: Vérifier visuellement**

```bash
npm run dev
```

Naviguer vers la section menu. Vérifier :
- Tabs en Cinzel flat (pas rounded)
- Items listés en Cormorant Italic avec prix en or
- Loading spinner en or
- Description au hover

- [ ] **Step 3: Commit**

```bash
git add src/components/MenuDisplay.tsx
git commit -m "style: restyle MenuDisplay with Cinzel tabs and Cormorant menu items"
```

---

## Task 7: HoursDisplay Restyle

**Files:**
- Modify: `src/components/HoursDisplay.tsx`

Seuls les styles changent. Toute la logique (fetchHours, formatTime, getDayName, fallback) reste intacte.

- [ ] **Step 1: Remplacer le JSX de retour**

Remplacer le loading state, puis le `return` principal :

```tsx
  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-12 bg-gc-aged/20 animate-pulse" />
        ))}
      </div>
    )
  }

  // Main return
  return (
    <div>
      <div className="space-y-0">
        {displayHours.map((item, i) => (
          <div
            key={i}
            className={[
              'flex justify-between items-center px-5 py-4 border-b border-gc-aged/50',
              item.is_open ? 'hover:bg-gc-gold/5 transition-colors' : 'opacity-50',
            ].join(' ')}
          >
            <span className="font-cinzel font-normal text-[14px] tracking-[0.05em] text-gc-text-dark">
              {item.day_name || getDayName(item.day_of_week)}
            </span>
            <span className={[
              'font-cormorant text-[17px]',
              item.is_open ? 'text-gc-text-dark' : 'text-gc-text-mid italic',
            ].join(' ')}>
              {item.is_open
                ? `${formatTime(item.open_time)} — ${formatTime(item.close_time)}`
                : t('closed')}
            </span>
          </div>
        ))}
      </div>

      {/* Special Hours */}
      {specialHours.length > 0 && (
        <div className="mt-8 border border-gc-gold/30 p-6">
          <h4 className="font-cinzel font-normal text-[14px] tracking-[0.1em] uppercase text-gc-brass mb-5">
            {t('specialHours')}
          </h4>
          <div className="space-y-4">
            {specialHours.map((sh) => (
              <div
                key={sh.id}
                className={[
                  'px-4 py-3 border-l-2',
                  sh.is_open ? 'border-gc-gold' : 'border-gc-copper',
                ].join(' ')}
              >
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <p className="font-cinzel font-normal text-[13px] tracking-[0.05em] text-gc-text-dark">
                      {new Date(sh.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    {sh.title && (
                      <p className="font-cormorant italic text-[15px] text-gc-brass mt-1">
                        {sh.title}
                      </p>
                    )}
                  </div>
                  <span className="font-cormorant text-[16px] text-gc-text-dark">
                    {sh.is_open
                      ? `${formatTime(sh.open_time)} — ${formatTime(sh.close_time)}`
                      : t('closed')}
                  </span>
                </div>
                {sh.note && (
                  <p className="mt-2 font-cormorant italic text-[14px] text-gc-text-mid border-t border-gc-aged pt-2">
                    {sh.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 border border-gc-gold/20 text-center">
        <p className="font-cormorant text-[16px] text-gc-text-dark">
          {t('lastOrder')} : <strong className="font-cinzel text-gc-brass">22h00</strong>
        </p>
      </div>
    </div>
  )
```

- [ ] **Step 2: Vérifier visuellement**

```bash
npm run dev
```

Section horaires : tableau flat en Cinzel/Cormorant, pas de cards arrondies blanches.

- [ ] **Step 3: Commit**

```bash
git add src/components/HoursDisplay.tsx
git commit -m "style: restyle HoursDisplay with flat elegant list"
```

---

## Task 8: ReservationForm Restyle

**Files:**
- Modify: `src/components/ReservationForm.tsx`

**ATTENTION :** La logique OTP (sendOtp, checkOtp, handleSubmit, phoneVerifState, verificationToken) ne doit pas changer. Seuls les classNames CSS et la structure visuelle changent.

- [ ] **Step 1: Remplacer le success state**

```tsx
  if (success) {
    return (
      <div className="border border-gc-gold/30 p-10 text-center">
        <div className="w-10 h-px bg-gc-gold mx-auto mb-6" />
        <h3 className="font-cinzel font-normal text-[20px] text-gc-ivory tracking-wide mb-4">
          {t('successTitle')}
        </h3>
        <p className="font-cormorant text-[17px] text-gc-ivory/70 mb-6 leading-relaxed">
          {t('successMessage')}
        </p>
        <p className="font-cormorant italic text-[15px] text-gc-gold/70 mb-8">
          {t('successNote')}
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="font-cinzel text-[12px] tracking-[0.15em] uppercase text-gc-gold border border-gc-gold px-6 py-3 hover:bg-gc-gold hover:text-gc-void transition-all"
        >
          {t('newReservation')}
        </button>
      </div>
    )
  }
```

- [ ] **Step 2: Remplacer le formulaire principal**

Remplacer `return (<form ...>)` par :

```tsx
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="border-l-2 border-gc-copper p-4 bg-gc-copper/5">
          <p className="font-cormorant text-[16px] text-gc-ivory/80">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <label className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold block">
            {t('fullName')}
          </label>
          <input
            type="text"
            required
            value={form.customer_name}
            onChange={(e) => setForm(f => ({ ...f, customer_name: e.target.value }))}
            className="w-full bg-transparent border-0 border-b border-gc-gold/30 focus:border-gc-gold outline-none font-cormorant text-[17px] text-gc-ivory placeholder:text-gc-ivory/30 py-2 transition-colors"
            placeholder="Jean Dupont"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold block">
            {t('phone')}
          </label>
          <select
            value={selectedCountryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={phoneVerifState === 'verified'}
            aria-label={t('countryLabel')}
            className="w-full bg-transparent border-0 border-b border-gc-gold/30 focus:border-gc-gold outline-none font-cormorant text-[15px] text-gc-ivory py-2 mb-2 disabled:opacity-50 transition-colors"
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code} className="bg-gc-void text-gc-ivory">
                {c.flag} {c.name} ({c.dialCode})
              </option>
            ))}
          </select>

          <div className="flex items-stretch gap-0">
            <span className="font-cormorant text-[15px] text-gc-ivory/50 border-b border-gc-gold/30 pb-2 pr-2 shrink-0 select-none">
              {selectedCountry.flag} {selectedCountry.dialCode}
            </span>
            <input
              type="tel"
              required
              value={localPhone}
              onChange={(e) => handleLocalPhoneChange(e.target.value)}
              disabled={phoneVerifState === 'verified'}
              placeholder="812345678"
              className={[
                'flex-1 bg-transparent border-0 border-b outline-none font-cormorant text-[17px] text-gc-ivory placeholder:text-gc-ivory/30 py-2 pl-2 transition-colors disabled:opacity-50',
                localPhone && !phoneIsValid ? 'border-gc-copper' : phoneIsValid ? 'border-gc-celadon' : 'border-gc-gold/30 focus:border-gc-gold',
              ].join(' ')}
            />
            {phoneVerifState !== 'verified' && (
              <button
                type="button"
                onClick={sendOtp}
                disabled={sendDisabled}
                className="shrink-0 font-cinzel text-[11px] tracking-[0.1em] uppercase text-gc-gold border-b border-gc-gold px-3 py-2 hover:text-gc-void hover:bg-gc-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {phoneVerifState === 'sending' ? (
                  <span className="w-12 inline-flex justify-center">
                    <span className="w-3 h-3 border border-gc-gold border-t-transparent rounded-full animate-spin" />
                  </span>
                ) : (
                  <span className="w-12 inline-block text-center">
                    {phoneVerifState === 'sent' ? t('otpResend') : t('otpSend')}
                  </span>
                )}
              </button>
            )}
            {phoneVerifState === 'verified' && (
              <button
                type="button"
                onClick={resetVerification}
                className="shrink-0 font-cinzel text-[11px] tracking-[0.1em] uppercase text-gc-celadon border-b border-gc-celadon px-3 py-2 hover:opacity-70 transition-opacity"
              >
                {t('otpVerified')}
              </button>
            )}
          </div>

          {localPhone && !phoneIsValid && phoneVerifState === 'idle' && (
            <p className="font-cormorant italic text-[14px] text-gc-copper">{t('otpInvalidPhone')}</p>
          )}

          {(phoneVerifState === 'sent' || phoneVerifState === 'verifying') && (
            <div className="mt-3 p-4 border border-gc-gold/20">
              <p className="font-cormorant text-[15px] text-gc-ivory/70 mb-3">
                {t('otpSentTo')} <strong className="text-gc-gold">{fullPhone}</strong>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  aria-label="Code OTP"
                  className="flex-1 bg-transparent border-0 border-b border-gc-gold/30 focus:border-gc-gold outline-none font-cormorant text-[24px] text-gc-ivory text-center tracking-[0.5em] py-2 transition-colors"
                />
                <button
                  type="button"
                  onClick={checkOtp}
                  disabled={phoneVerifState === 'verifying' || otpCode.length < 6}
                  className="font-cinzel text-[11px] tracking-[0.1em] uppercase text-gc-gold border border-gc-gold px-3 py-2 hover:bg-gc-gold hover:text-gc-void transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {phoneVerifState === 'verifying' ? (
                    <span className="w-4 h-4 border border-gc-gold border-t-transparent rounded-full animate-spin inline-block" />
                  ) : t('otpVerify')}
                </button>
              </div>
              {otpError && (
                <p className="mt-2 font-cormorant italic text-[14px] text-gc-copper">{otpError}</p>
              )}
              <p className="mt-2 font-cormorant italic text-[13px] text-gc-ivory/40">{t('otpExpiry')}</p>
            </div>
          )}

          {phoneVerifState === 'idle' && otpError && (
            <p className="font-cormorant italic text-[14px] text-gc-copper">{otpError}</p>
          )}
        </div>

        {/* Email */}
        <div className="md:col-span-2 space-y-2">
          <label className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold block">
            {t('email')}
          </label>
          <input
            type="email"
            value={form.customer_email}
            onChange={(e) => setForm(f => ({ ...f, customer_email: e.target.value }))}
            className="w-full bg-transparent border-0 border-b border-gc-gold/30 focus:border-gc-gold outline-none font-cormorant text-[17px] text-gc-ivory placeholder:text-gc-ivory/30 py-2 transition-colors"
            placeholder="jean@example.com"
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold block">
            {t('date')}
          </label>
          <input
            type="date"
            required
            min={today}
            value={form.reservation_date}
            onChange={(e) => setForm(f => ({ ...f, reservation_date: e.target.value }))}
            aria-label={t('date')}
            className="w-full bg-transparent border-0 border-b border-gc-gold/30 focus:border-gc-gold outline-none font-cormorant text-[17px] text-gc-ivory py-2 transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Time */}
        <div className="space-y-2">
          <label className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold block">
            {t('time')}
          </label>
          <select
            required
            value={form.reservation_time}
            onChange={(e) => setForm(f => ({ ...f, reservation_time: e.target.value }))}
            aria-label={t('time')}
            className="w-full bg-gc-jungle border-0 border-b border-gc-gold/30 focus:border-gc-gold outline-none font-cormorant text-[17px] text-gc-ivory py-2 transition-colors"
          >
            <option value="" className="bg-gc-jungle">{t('selectTime')}</option>
            <optgroup label={t('lunch')} className="bg-gc-jungle">
              {TIME_SLOTS.filter(slot => slot < '15:00').map(time => (
                <option key={time} value={time} className="bg-gc-jungle">{time}</option>
              ))}
            </optgroup>
            <optgroup label={t('dinnerLabel')} className="bg-gc-jungle">
              {TIME_SLOTS.filter(slot => slot >= '15:00').map(time => (
                <option key={time} value={time} className="bg-gc-jungle">{time}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Party Size */}
        <div className="space-y-2">
          <label className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold block">
            {t('partySize')}
          </label>
          <div className="flex items-center gap-4 border-b border-gc-gold/30 py-2">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, party_size: Math.max(1, f.party_size - 1) }))}
              className="font-cinzel text-gc-gold text-xl leading-none hover:text-gc-ivory transition-colors w-6 text-center"
            >
              −
            </button>
            <span className="font-cinzel text-[22px] text-gc-ivory w-10 text-center">
              {form.party_size}
            </span>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, party_size: Math.min(20, f.party_size + 1) }))}
              className="font-cinzel text-gc-gold text-xl leading-none hover:text-gc-ivory transition-colors w-6 text-center"
            >
              +
            </button>
          </div>
          {form.party_size > 10 && (
            <p className="font-cormorant italic text-[14px] text-gc-brass">{t('largeGroupWarning')}</p>
          )}
        </div>

        {/* Occasion */}
        <div className="space-y-2">
          <label className="font-raleway font-light text-[11px] tracking-[0.2em] uppercase text-gc-gold block">
            {t('occasion')}
          </label>
          <select
            value={form.occasion}
            onChange={(e) => setForm(f => ({ ...f, occasion: e.target.value }))}
            aria-label={t('occasion')}
            className="w-full bg-gc-jungle border-0 border-b border-gc-gold/30 focus:border-gc-gold outline-none font-cormorant text-[17px] text-gc-ivory py-2 transition-colors"
          >
            {OCCASIONS.map(occ => (
              <option key={occ.value} value={occ.value} className="bg-gc-jungle">{occ.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || phoneVerifState !== 'verified'}
        className="w-full font-cinzel text-[13px] tracking-[0.15em] uppercase text-gc-gold border border-gc-gold py-4 hover:bg-gc-gold hover:text-gc-void transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-4"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <span className="w-4 h-4 border border-gc-gold border-t-transparent rounded-full animate-spin" />
            {t('sending')}
          </span>
        ) : t('submit')}
      </button>

      {phoneVerifState !== 'verified' && (
        <p className="text-center font-cormorant italic text-[14px] text-gc-gold/60 mt-2">
          {t('otpRequired')}
        </p>
      )}

      <p className="text-center font-cormorant italic text-[14px] text-gc-ivory/35 mt-2">
        {t('required')}
      </p>
    </form>
  )
```

- [ ] **Step 2: Vérifier le TypeScript et le comportement**

```bash
npx tsc --noEmit
```

Tester manuellement : saisir un numéro de téléphone, vérifier que le bouton OTP reste cliquable. La logique ne doit pas être affectée.

- [ ] **Step 3: Commit**

```bash
git add src/components/ReservationForm.tsx
git commit -m "style: restyle ReservationForm with flat underline inputs"
```

---

## Task 9: AnnouncementBanner Restyle

**Files:**
- Modify: `src/components/AnnouncementBanner.tsx`

- [ ] **Step 1: Remplacer les BG_CLASSES et le JSX**

Remplacer la constante `BG_CLASSES` et le `return` :

```tsx
// Remplacer BG_CLASSES par un style unique — la bannière utilise toujours le même style gold/void
// Supprimer BG_CLASSES entièrement

// Dans le return, remplacer :
  return (
    <div className="relative bg-gc-void border-b border-gc-gold/30 py-3 px-6">
      <div className="max-w-[1200px] mx-auto text-center">
        {announcement.title && (
          <p className="font-cinzel text-[13px] tracking-[0.1em] uppercase text-gc-gold mb-1">
            {announcement.title}
          </p>
        )}
        <p className="font-cormorant text-[16px] text-gc-ivory/80 whitespace-pre-wrap">
          {announcement.content}
        </p>
        {(announcement.start_date || announcement.end_date) && (
          <p className="font-raleway font-light text-[11px] tracking-[0.1em] uppercase text-gc-ivory/40 mt-1">
            {announcement.start_date && `Du ${new Date(announcement.start_date).toLocaleDateString('fr-FR')}`}
            {announcement.start_date && announcement.end_date && ' '}
            {announcement.end_date && `au ${new Date(announcement.end_date).toLocaleDateString('fr-FR')}`}
          </p>
        )}
      </div>
      <button
        onClick={() => setVisible(false)}
        className="absolute top-1/2 -translate-y-1/2 right-4 font-cinzel text-gc-gold/50 hover:text-gc-gold text-sm transition-colors p-1"
        aria-label="Fermer l'annonce"
      >
        ✕
      </button>
    </div>
  )
```

Supprimer aussi la ligne `const bgClasses = BG_CLASSES[announcement.bg_color] || BG_CLASSES.amber` qui ne sera plus utilisée.

- [ ] **Step 2: Commit**

```bash
git add src/components/AnnouncementBanner.tsx
git commit -m "style: restyle AnnouncementBanner with dark colonial style"
```

---

## Task 10: LanguageSwitcher Restyle

**Files:**
- Modify: `src/components/LanguageSwitcher.tsx`

- [ ] **Step 1: Remplacer le JSX du `return`**

```tsx
  return (
    <div className="flex items-center gap-1 font-raleway font-light text-[11px] tracking-[0.2em] uppercase">
      {locales.map((loc, index) => (
        <span key={loc} className="flex items-center">
          {index > 0 && (
            <span className="text-gc-gold/30 mx-1.5" aria-hidden="true">·</span>
          )}
          <Link
            href={pathWithoutLocale}
            locale={loc}
            className={[
              'py-1 transition-colors focus:outline-none focus:ring-1 focus:ring-gc-gold',
              locale === loc
                ? 'text-gc-gold'
                : 'text-gc-ivory/45 hover:text-gc-ivory/80',
            ].join(' ')}
            aria-label={t('switchTo', { language: t(loc as Parameters<typeof t>[0]) })}
            aria-current={locale === loc ? 'true' : undefined}
          >
            {loc.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  )
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LanguageSwitcher.tsx
git commit -m "style: restyle LanguageSwitcher with Raleway light uppercase"
```

---

## Task 11: Build & Accessibility Check

- [ ] **Step 1: Build de production**

```bash
npm run build
```

Attendu : `✓ Compiled successfully` sans erreurs. Des warnings TypeScript sur les clés de traduction dynamiques sont acceptables si le build réussit.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Corriger tout warning en erreur (unused imports, etc.).

- [ ] **Step 3: Vérification visuelle complète**

Démarrer `npm run dev` et vérifier section par section :

| Section | Vérifier |
|---------|---------|
| Nav | Cinzel Decorative, fond `#0D1F17`, CTA avec bordure or |
| Hero | Fond void, botaniques en filigrane, séparateurs `——◆——`, scroll indicator |
| Signature | Fond `#0C3C2D`, citation en Cormorant italic |
| About | Fond parchment, cornières or sur card chef |
| Cuisine | Cards `.gc-card-pilier` avec bordure-top or |
| Menu | Tabs flat, items en Cormorant italic, prix en or |
| Services | Grid avec icônes SVG or |
| Hours | Liste plate, Cinzel jours |
| Social | Cards avec bordure or subtile |
| Réservation | Notice "bientôt", form en filigrane |
| Contact | Cornières or sur card sombre |
| Footer | Wordmark Cinzel Decorative, 4 colonnes |

- [ ] **Step 4: Vérification responsive mobile (375px)**

Dans DevTools, passer en mobile 375px et vérifier :
- Hero : titre lisible (`clamp` fonctionne)
- Navigation : liens cachés (pas encore de menu hamburger, prévu dans une phase future)
- Grilles : passage en 1 ou 2 colonnes

- [ ] **Step 5: Vérification des contrastes accessibilité**

Vérifier manuellement les combinaisons critiques :
- Texte `#FAF0E6` (gc-ivory) sur `#0D1F17` (gc-void) → ratio > 14:1 ✓
- Texte `#C69B3C` (gc-gold) sur `#0D1F17` (gc-void) → ratio ~7:1 ✓
- Texte `#1A0E00` (gc-text-dark) sur `#F5EEDA` (gc-parchment) → ratio > 15:1 ✓

- [ ] **Step 6: Commit final**

```bash
git add -A
git commit -m "chore: final build check — visual redesign La Véranda complete"
```

---

## Critères de succès (checklist spec)

- [ ] Zéro emoji visible dans l'interface publique
- [ ] Palette `--gc-*` appliquée sur l'intégralité du site public
- [ ] Fontes Cinzel + Cormorant Garamond + Raleway actives
- [ ] Sections alternent void/parchment selon la règle de la spec
- [ ] Composants Button, Card, MenuItem, Form conformes au design system
- [ ] Séparateurs `——◆——` présents sur chaque section
- [ ] Gravures botaniques SVG présentes dans Hero et About minimum
- [ ] Animations scroll indicator et botanical float actives
- [ ] Score Lighthouse accessibilité ≥ 90
- [ ] Responsive mobile validé sur 375px et 768px
- [ ] `npm run build` sans erreurs
