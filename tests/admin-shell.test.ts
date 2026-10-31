/**
 * NAV-02 : balisage et comportement du shell (rendu statique, Vitest tourne sans DOM) ;
 * fonctions pures d'état actif de nav.ts ; mise en page responsive vérifiée dans admin.css
 * (le rendu réel aux trois largeurs est mesuré dans le navigateur, voir 12-VERIFICATION).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement } from 'react'
import type { ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  ACCOUNT_LINKS,
  NAV,
  NEW_RESERVATION_HREF,
  activeChildId,
  currentSection,
  homeSpans,
  isInSection,
  navCurrent,
  pathMatches,
} from '../src/app/admin/(app)/nav'
import { krabiDateLabel } from '../src/components/admin/shell/krabi-date'

let mockPath = '/admin'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPath,
  useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }),
}))

// Normalise les fins de ligne : un checkout Windows (autocrlf) donne du CRLF.
// Normalise fins de ligne ET espaces : les assertions ne dépendent plus du formatage du CSS (audit F-19).
const css = readFileSync(join(__dirname, '..', 'src/app/admin/admin.css'), 'utf8').replace(/\s+/g, ' ')
const h = (type: unknown, props: Record<string, unknown> | null = null) =>
  createElement(type as ComponentType<Record<string, unknown>>, props)

async function load() {
  const { MainNav } = await import('../src/components/admin/shell/MainNav')
  const { SectionTabs } = await import('../src/components/admin/shell/SectionTabs')
  const { AccountMenu } = await import('../src/components/admin/shell/AccountMenu')
  const { TopBar } = await import('../src/components/admin/shell/TopBar')
  const { AdminShell } = await import('../src/components/admin/shell/AdminShell')
  return { MainNav, SectionTabs, AccountMenu, TopBar, AdminShell }
}
const logout = async () => {}
/** Balise <a> complète qui porte ce href (l'ordre des attributs rendus ne compte pas). */
const tag = (html: string, href: string) =>
  html.match(new RegExp('<a [^>]*href="' + href.replace(/[.*+?^${}()|[\]\/]/g, '\$&') + '"[^>]*>'))?.[0] ?? ''

beforeEach(() => {
  mockPath = '/admin'
})

describe('NAV-02 navigation principale', () => {
  it('un repère nav nommé, cinq entrées avec icône et libellé, hrefs de nav.ts', async () => {
    const { MainNav } = await load()
    const html = renderToStaticMarkup(h(MainNav))
    expect(html).toContain('<nav class="adm-nav" aria-label="Navigation principale">')
    expect(html.match(/class="adm-nav-link"/g)).toHaveLength(NAV.length)
    expect(NAV).toHaveLength(5)
    for (const n of NAV) {
      expect(html).toContain(`href="${n.href}"`)
      expect(html).toContain(`<span class="adm-nav-label">${n.label.replace("'", '&#x27;')}</span>`)
    }
    expect(html.match(/<svg/g)!.length).toBeGreaterThanOrEqual(NAV.length)
  })

  it('exactement un lien actif sur /admin (page), les autres sans aria-current', async () => {
    const { MainNav } = await load()
    const html = renderToStaticMarkup(h(MainNav))
    expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    expect(html).not.toContain('aria-current="true"')
    expect(html).not.toContain('class="adm-subnav"')
  })

  it('/admin/menu/[pageId] active « Carte » (préfixe de segment)', async () => {
    mockPath = '/admin/menu/abc'
    const { MainNav } = await load()
    const html = renderToStaticMarkup(h(MainNav))
    expect(tag(html, '/admin/menu')).toContain('aria-current="page"')
    expect(html.match(/aria-current/g)).toHaveLength(1)
  })

  it('/admin/hours (ancienne adresse) : section « Site public » courante (true), sous-entrées, Horaires actif', async () => {
    mockPath = '/admin/hours'
    const { MainNav } = await load()
    const html = renderToStaticMarkup(h(MainNav))
    expect(tag(html, '/admin/site')).toContain('aria-current="true"')
    expect(html).toContain('class="adm-subnav"')
    expect(tag(html, '/admin/site#horaires')).toContain('aria-current="page"')
    expect(tag(html, '/admin/site#annonces')).not.toContain('aria-current')
  })

  it('/admin/announcement (ancienne adresse) active la sous-entrée Annonces', async () => {
    mockPath = '/admin/announcement'
    const { MainNav } = await load()
    const html = renderToStaticMarkup(h(MainNav))
    expect(tag(html, '/admin/site#annonces')).toContain('aria-current="page"')
    expect(tag(html, '/admin/site#horaires')).not.toContain('aria-current')
  })

  it('/admin/site : la section est la page courante', async () => {
    mockPath = '/admin/site'
    const { MainNav } = await load()
    const html = renderToStaticMarkup(h(MainNav))
    expect(tag(html, '/admin/site')).toContain('aria-current="page"')
  })
})

describe('NAV-02 onglets de section', () => {
  it('absents partout : « Site public » (onglets dans la page, phase 13) et Réputation (segments dans la page, phase 16)', async () => {
    const { SectionTabs } = await load()
    // Site public : les 4 onglets sont dans la page (SitePublic), pas dans le layout ; idem pour les anciennes adresses.
    // Réputation : les segments Avis / Rapport KPI sont dans la page (inPageSegments).
    for (const p of ['/admin/site', '/admin/hours', '/admin/announcement', '/admin/settings', '/admin/kpi', '/admin/avis', '/admin/reputation']) {
      mockPath = p
      expect(renderToStaticMarkup(h(SectionTabs)), p).toBe('')
    }
    for (const p of ['/admin', '/admin/menu', '/admin/reservations']) {
      mockPath = p
      expect(renderToStaticMarkup(h(SectionTabs))).toBe('')
    }
  })
})

describe('NAV-02 en-tête et menu du compte', () => {
  it('« + Réservation » mène à la saisie manuelle, étiquette d’accessibilité dédiée', async () => {
    const { TopBar } = await load()
    const html = renderToStaticMarkup(h(TopBar, { email: 'a@b.fr', logoutAction: logout, now: new Date('2026-10-31T05:00:00Z') }))
    expect(html).toContain(`href="${NEW_RESERVATION_HREF}"`)
    expect(html).toContain('aria-label="Nouvelle réservation"')
    expect(html).toContain('Samedi 31 octobre')
    expect(html).toContain('<header class="adm-header">')
  })

  it('menu du compte : disclosure sans rôle menu, fermeture sur sortie du focus et Échap sans voler le focus (F-04)', () => {
    const src = readFileSync(join(__dirname, '..', 'src/components/admin/shell/AccountMenu.tsx'), 'utf8')
    expect(src).not.toMatch(/role="menu|aria-haspopup|menuitem/)
    expect(src).toMatch(/onBlur=/)
    expect(src).toMatch(/relatedTarget/)
    // Échap rend le focus à l'avatar seulement si le focus est dans le menu
    expect(src).toMatch(/if \(focusInside\) buttonRef\.current\?\.focus\(\)/)
  })

  it('menu du compte : e-mail, lien site public, déconnexion par formulaire, Accès actif (ACC-02)', async () => {
    const { AccountMenu } = await load()
    const html = renderToStaticMarkup(h(AccountMenu, { email: 'chef@example.com', logoutAction: logout }))
    expect(html).not.toContain('aria-haspopup')
    expect(html).not.toContain('role="menu')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('aria-label="Compte : chef@example.com"')
    expect(html).toMatch(/id="adm-account-menu"[^>]*hidden/)
    expect(html).toContain('chef@example.com')
    expect(html).toContain('Voir le site public')
    expect(html).toContain('<form')
    expect(html).toContain('type="submit"')
    expect(html).toContain('Déconnexion')
    // ACC-02 : l'entrée Accès est livrée, c'est un vrai lien (plus de « Bientôt »).
    expect(ACCOUNT_LINKS.some((l) => l.planned)).toBe(false)
    expect(html).toContain('href="/admin/acces"')
    expect(html).not.toContain('aria-disabled="true"')
    expect(html).not.toContain('Bientôt')
  })

  it('le shell : lien d’évitement, nav, header, un seul main', async () => {
    const { AdminShell } = await load()
    const html = renderToStaticMarkup(h(AdminShell, { email: 'x@y.fr', logoutAction: logout, children: 'CONTENU' }))
    expect(html.indexOf('adm-skip')).toBeLessThan(html.indexOf('adm-nav"'))
    expect(html.match(/<main/g)).toHaveLength(1)
    expect(html.match(/<nav/g)).toHaveLength(1)
    expect(html).toContain('id="adm-main"')
    expect(html).toContain('href="#adm-main"')
    expect(html).toContain('CONTENU')
  })
})

describe('NAV-02 état actif (fonctions pures)', () => {
  it('/admin est exact, les autres chemins par préfixe de segment', () => {
    expect(pathMatches('/admin', '/admin')).toBe(true)
    expect(pathMatches('/admin', '/admin/menu')).toBe(false)
    expect(pathMatches('/admin/menu', '/admin/menu/1')).toBe(true)
    expect(pathMatches('/admin/menu', '/admin/menus')).toBe(false)
    expect(pathMatches('/admin/site#exceptions', '/admin/site')).toBe(true)
  })

  it('navCurrent : page / true / rien', () => {
    const site = NAV.find((n) => n.id === 'site')!
    const menu = NAV.find((n) => n.id === 'menu')!
    expect(navCurrent(site, '/admin/site')).toBe('page')
    expect(navCurrent(site, '/admin/settings')).toBe('true') // ancienne adresse conservée
    expect(navCurrent(site, '/admin/hours')).toBe('true')
    expect(navCurrent(site, '/admin/menu')).toBeUndefined()
    expect(navCurrent(menu, '/admin/menu/x')).toBe('page')
    expect(isInSection(site, '/admin/hours')).toBe(true)
    expect(currentSection(NAV, '/admin/avis')?.id).toBe('reputation')
    expect(currentSection(NAV, '/admin')?.id).toBe('today')
  })

  it('les 4 onglets de /admin/site partagent la page : l’ancre départage, à défaut la première', () => {
    const site = NAV.find((n) => n.id === 'site')!
    expect(activeChildId(site, '/admin/site', '')).toBe('hours')
    expect(activeChildId(site, '/admin/site', '#exceptions')).toBe('special-hours')
    expect(activeChildId(site, '/admin/site', '#annonces')).toBe('announcement')
    expect(activeChildId(site, '/admin/site', '#capacite')).toBe('capacity')
    expect(activeChildId(site, '/admin/site', '#autre')).toBe('hours')
    // anciennes adresses conservées : la sous-entrée correspondante
    expect(activeChildId(site, '/admin/hours', '')).toBe('hours')
    expect(activeChildId(site, '/admin/announcement', '')).toBe('announcement')
    expect(activeChildId(site, '/admin/settings', '')).toBe('capacity')
    expect(activeChildId(site, '/admin/menu', '')).toBeUndefined()
  })

  it('répartition des cartes d’accueil : lead puis 4+2, 3+3', () => {
    expect(homeSpans(5)).toEqual(['lead', 's4', 's2', 's3', 's3'])
    expect(homeSpans(6)).toEqual(['lead', 's4', 's2', 's3', 's3', 's6'])
    expect(homeSpans(0)).toEqual([])
  })

  it('date de Krabi : fuseau Asia/Bangkok, première lettre en capitale', () => {
    expect(krabiDateLabel(new Date('2026-10-31T05:00:00Z'))).toBe('Samedi 31 octobre')
    // 20 h UTC le 30 : déjà le 31 à Krabi
    expect(krabiDateLabel(new Date('2026-10-30T20:00:00Z'))).toBe('Samedi 31 octobre')
  })
})

describe('NAV-02 mise en page responsive (admin.css)', () => {
  const block = (re: RegExp) => css.match(re)?.[0] ?? ''

  it('téléphone : barre du bas fixe, 5 colonnes, étiquettes 12 px', () => {
    expect(css).toMatch(/\.adm-nav \{[^}]*position: fixed;[^}]*bottom: 0;/)
    expect(css).toMatch(/\.adm-nav__list \{[^}]*repeat\(5, 1fr\)/)
    expect(css).toMatch(/\.adm-nav-link \{[^}]*font-size: 12px/)
    expect(css).toMatch(/\.adm-nav-link \{[^}]*min-height: var\(--adm-target\)/)
  })

  it('tablette (768) : rail de 88 px, contenu décalé', () => {
    const tablet = block(/@media \(min-width: 768px\) \{ \.adm-nav \{[\s\S]*?\} \}/)
    expect(tablet).toMatch(/\.adm-nav \{[^}]*width: var\(--adm-rail-w\)/)
    expect(tablet).toMatch(/\.adm-col \{ margin-left: var\(--adm-rail-w\)/)
    expect(css).toMatch(/--adm-rail-w: 88px/)
  })

  it('ordinateur (1024) : barre latérale de 256 px, sous-navigation, onglets masqués', () => {
    const desktop = block(/@media \(min-width: 1024px\) \{ \.adm-nav \{[\s\S]*?\} \}/)
    expect(desktop).toMatch(/width: var\(--adm-sidebar-w\)/)
    expect(desktop).toMatch(/\.adm-subnav \{ display: grid/)
    expect(desktop).toMatch(/\.adm-tabs \{ display: none/)
    expect(css).toMatch(/--adm-sidebar-w: 256px/)
  })

  it('aucune détection de largeur en JavaScript dans le shell', () => {
    for (const f of ['MainNav', 'SectionTabs', 'AccountMenu', 'TopBar', 'AdminShell']) {
      const src = readFileSync(join(__dirname, '..', `src/components/admin/shell/${f}.tsx`), 'utf8')
      expect(src, f).not.toMatch(/matchMedia|innerWidth|ResizeObserver|useMediaQuery/)
    }
  })

  it('le focus clavier n’est jamais masqué par l’en-tête ni la barre du bas (F-02, WCAG 2.4.11)', () => {
    expect(css).toMatch(/html:has\(\.adm-root\) \{ scroll-padding-top: calc\(var\(--adm-header-h, 60px\) \+ 8px\)/)
    expect(css).toMatch(/max-width: 767\.98px\) \{ html:has\(\.adm-root\) \{ scroll-padding-bottom: calc\(var\(--adm-bottombar-h, 64px\) \+ 16px/)
  })

  it('la barre de défilement de la fenêtre du site public est neutralisée dans l’admin seulement (F-05)', () => {
    expect(css).toMatch(/html:has\(\.adm-root\) \{ color-scheme: light;/)
    expect(css).toMatch(/html:has\(\.adm-root\)::-webkit-scrollbar-track \{ background: initial/)
    const globals = readFileSync(join(__dirname, '..', 'src/app/globals.css'), 'utf8')
    expect(globals).toMatch(/::-webkit-scrollbar-track \{ background: var\(--gc-void\)/) // le site public garde la sienne
  })

  it('l’état désactivé primaire est lisible : blanc sur fond >= 4,5:1 (F-10)', () => {
    expect(css).toMatch(/\.adm-btn--primary:disabled \{ --_bg: #667A6D; --_fg: #fff;/)
  })

  it('les toasts surnuméraires sortent de la tabulation (F-20)', () => {
    expect(css).toMatch(/\.adm-toast\[data-limited\] \{ opacity: 0; visibility: hidden;/)
  })

  it('les toasts passent au-dessus de la barre du bas sur téléphone', () => {
    expect(css).toMatch(/max-width: 767\.98px\) \{ \.adm-portal \{ --adm-toast-offset: var\(--adm-bottombar-h\)/)
  })
})
