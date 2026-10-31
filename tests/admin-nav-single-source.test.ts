/**
 * NAV-03 : une seule modification de nav.ts ajoute ou retire une entrée dans toutes les surfaces
 * (navigation principale, onglets de section, cartes d'accueil, cartes de section), et aucun composant
 * du shell ne contient de libellé ou de lien interne en dur.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement } from 'react'
import type { ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { NAV as REAL_NAV } from '../src/app/admin/(app)/nav'

const root = join(__dirname, '..')
let mockPath = '/admin'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPath,
  useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }),
}))
const h = (type: unknown, props: Record<string, unknown> | null = null) =>
  createElement(type as ComponentType<Record<string, unknown>>, props)

const NAV_MODULE = '@/app/admin/(app)/nav'

afterEach(() => {
  vi.doUnmock(NAV_MODULE)
  vi.resetModules()
})
beforeEach(() => {
  vi.resetModules()
  mockPath = '/admin'
})

async function renderSurfaces(edit: (nav: typeof REAL_NAV) => typeof REAL_NAV) {
  vi.doMock(NAV_MODULE, async (importOriginal) => {
    const real = await importOriginal<typeof import('../src/app/admin/(app)/nav')>()
    return { ...real, NAV: edit(real.NAV) }
  })
  const { MainNav } = await import('../src/components/admin/shell/MainNav')
  const { SectionTabs } = await import('../src/components/admin/shell/SectionTabs')
  const { HomeCards, SectionCards } = await import('../src/components/admin/shell/HomeCards')
  const nav = (await import(NAV_MODULE)).NAV as typeof REAL_NAV
  const site = nav.find((n) => n.id === 'site')!
  return {
    main: renderToStaticMarkup(h(MainNav)),
    tabs: renderToStaticMarkup(h(SectionTabs)),
    home: renderToStaticMarkup(h(HomeCards)),
    section: renderToStaticMarkup(h(SectionCards, { items: site.children })),
  }
}

describe('NAV-03 une seule modification de nav.ts', () => {
  it('ajouter une entrée de premier niveau la fait apparaître dans la navigation et les cartes d’accueil', async () => {
    const Icon = REAL_NAV[0].icon
    const out = await renderSurfaces((nav) => [
      ...nav,
      { id: 'zz', label: 'Entrée de test', href: '/admin/zz-test', icon: Icon, description: 'Phrase de test.' },
    ])
    for (const html of [out.main, out.home]) {
      expect(html).toContain('Entrée de test')
      expect(html).toContain('href="/admin/zz-test"')
    }
    expect(out.home).toContain('Phrase de test.')
    // six entrées : le sixième lien de barre existe
    expect(out.main.match(/class="adm-nav-link"/g)).toHaveLength(REAL_NAV.length + 1)
  })

  it('ajouter une sous-entrée à « Site public » la fait apparaître dans la sous-navigation, les onglets et les cartes de section', async () => {
    mockPath = '/admin/hours'
    const out = await renderSurfaces((nav) =>
      nav.map((n) =>
        n.id === 'site'
          ? { ...n, inPageSegments: false, children: [...(n.children ?? []), { id: 'zz', label: 'Onglet de test', href: '/admin/zz-sub', description: 'Carte de test.' }] }
          : n,
      ),
    )
    for (const html of [out.main, out.tabs, out.section, out.home]) {
      expect(html, html.slice(0, 60)).toContain('Onglet de test')
    }
    expect(out.main).toContain('href="/admin/zz-sub"')
    expect(out.tabs).toContain('href="/admin/zz-sub"')
    expect(out.section).toContain('Carte de test.')
  })

  it('retirer une entrée la retire partout', async () => {
    const out = await renderSurfaces((nav) => nav.filter((n) => n.id !== 'menu'))
    for (const html of [out.main, out.home]) {
      expect(html).not.toContain('href="/admin/menu"')
      expect(html).not.toContain('>Carte<')
    }
    expect(out.main.match(/class="adm-nav-link"/g)).toHaveLength(REAL_NAV.length - 1)
  })

  it('retirer une sous-entrée la retire de la sous-navigation et des onglets', async () => {
    mockPath = '/admin/hours'
    const out = await renderSurfaces((nav) =>
      nav.map((n) => (n.id === 'site' ? { ...n, inPageSegments: false, children: n.children!.filter((c) => c.id !== 'capacity') } : n)),
    )
    expect(out.main).not.toContain('href="/admin/site#capacite"')
    expect(out.tabs).not.toContain('href="/admin/site#capacite"')
    expect(out.section).not.toContain('>Capacité<')
  })
})

describe('NAV-03 aucun libellé ni lien interne en dur dans les composants du shell', () => {
  const dir = join(root, 'src/components/admin/shell')
  const files = readdirSync(dir).filter((f) => /\.tsx?$/.test(f))

  it('les fichiers du shell existent', () => {
    expect(files).toEqual(expect.arrayContaining(['MainNav.tsx', 'SectionTabs.tsx', 'HomeCards.tsx', 'TopBar.tsx', 'AccountMenu.tsx', 'AdminShell.tsx']))
  })

  it('aucun lien /admin en dur', () => {
    for (const f of files) {
      const src = readFileSync(join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
      expect(src, f).not.toMatch(/['"`]\/admin/)
    }
  })

  it('aucun libellé d’entrée ou de sous-entrée de nav.ts recopié', () => {
    const labels = REAL_NAV.flatMap((n) => [n.label, ...(n.children ?? []).map((c) => c.label)])
    for (const f of files) {
      const src = readFileSync(join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
      for (const l of labels) {
        expect(src.includes(`'${l}'`) || src.includes(`"${l}"`) || src.includes(`>${l}<`), `${f} contient « ${l} »`).toBe(false)
      }
    }
  })

  it('les composants du shell ne sont importés que par src/app/admin', () => {
    const stack = [join(root, 'src')]
    const offenders: string[] = []
    while (stack.length) {
      const d = stack.pop()!
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name)
        if (e.isDirectory()) stack.push(p)
        else if (/\.tsx?$/.test(e.name)) {
          const rel = p.slice(root.length + 1).split('\\').join('/')
          if (rel.startsWith('src/app/admin/') || rel.startsWith('src/components/admin/')) continue
          if (/components\/admin\/shell/.test(readFileSync(p, 'utf8'))) offenders.push(rel)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
