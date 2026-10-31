/**
 * NAV-01 / NAV-05 : toutes les pages d'admin (hors connexion) sont dans le route group
 * `(app)` qui porte la garde serveur et le shell ; connexion et inscription restent dehors.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const has = (p: string) => existsSync(join(root, p))

const SHELL_PAGES = [
  'page.tsx',
  'reservations/page.tsx',
  'menu/page.tsx',
  'menu/[pageId]/page.tsx',
  'hours/page.tsx',
  'announcement/page.tsx',
  'settings/page.tsx',
  'avis/page.tsx',
  'kpi/page.tsx',
  'kit/page.tsx',
  'site/page.tsx',
  'reputation/page.tsx',
]

describe('NAV-01 route group admin/(app)', () => {
  it.each(SHELL_PAGES)('%s est dans le groupe (app)', (p) => {
    expect(has(`src/app/admin/(app)/${p}`)).toBe(true)
    expect(has(`src/app/admin/${p}`), `${p} ne doit plus exister hors du groupe`).toBe(false)
  })

  it('le layout du groupe : garde serveur, AdminRoot, AdminShell, logoutAction', () => {
    const src = read('src/app/admin/(app)/layout.tsx')
    expect(src).toContain('auth.getUser()')
    expect(src).toContain('isGeckoAdmin')
    expect(src).toContain('<AdminRoot>')
    expect(src).toContain('<AdminShell')
    expect(src).toContain('logoutAction')
    expect(src).toMatch(/redirect\('\/admin\/login'\)/)
  })

  it('le layout racine d’admin (noindex) reste à src/app/admin/layout.tsx et n’enveloppe pas de shell', () => {
    const src = read('src/app/admin/layout.tsx')
    expect(src).toContain('index: false')
    expect(src).not.toContain('AdminShell')
  })

  it('une seule zone <main> : les pages ne rendent pas leur propre <main>', () => {
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const e of readdirSync(dir)) {
        const p = join(dir, e)
        if (statSync(p).isDirectory()) walk(p)
        else if (/\.tsx$/.test(e) && /<main[\s>]/.test(readFileSync(p, 'utf8'))) offenders.push(p)
      }
    }
    walk(join(root, 'src/app/admin/(app)'))
    walk(join(root, 'src/components/admin'))
    // Le seul <main> légitime est celui du shell.
    expect(offenders.filter((p) => !/shell[\\/]AdminShell\.tsx$/.test(p))).toEqual([])
  })

  it('les pages migrées ne portent plus d’en-tête plein écran ni de déconnexion en dur', () => {
    const bad: string[] = []
    for (const p of SHELL_PAGES.filter((x) => !x.startsWith('kit'))) {
      const src = read(`src/app/admin/(app)/${p}`)
      if (/min-h-screen/.test(src) || /api\/auth\/logout/.test(src) || /← (Retour|Tableau)/.test(src)) bad.push(p)
    }
    expect(bad).toEqual([])
  })
})

describe('NAV-05 connexion et inscription hors shell', () => {
  it('login et signup sont à la racine d’admin, pas dans (app)', () => {
    expect(has('src/app/admin/login/page.tsx')).toBe(true)
    expect(has('src/app/admin/(app)/login')).toBe(false)
    expect(has('src/app/admin/(app)/signup')).toBe(false)
  })

  it('la page de connexion n’importe ni le shell ni AdminRoot', () => {
    const src = read('src/app/admin/login/page.tsx')
    expect(src).not.toMatch(/AdminShell|AdminRoot|components\/admin/)
  })

  it('le middleware garde /admin et laisse /admin/login et /admin/signup publics', () => {
    const src = read('src/middleware.ts')
    expect(src).toContain("pathname === '/admin/login'")
    expect(src).toContain("pathname === '/admin/signup'")
    expect(src).toContain("pathname.startsWith('/admin')")
  })
})
