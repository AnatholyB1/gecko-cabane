/**
 * NAV-04 : aucun lien interne /admin/... mort, et les URL conservées existent toujours.
 * Les liens viennent de nav.ts et des sources des pages/composants d'admin.
 * Un route group (app) n'ajoute pas de segment : /admin/(app)/kpi/page.tsx sert /admin/kpi.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative } from 'path'
import { ACCOUNT_LINKS, NAV, NEW_RESERVATION_HREF, pathOf } from '../src/app/admin/(app)/nav'

const root = join(__dirname, '..')

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}
const posix = (p: string) => relative(root, p).split('\\').join('/')

/** Routes servies par src/app/admin : groupes (x) retirés, segments dynamiques [x] conservés. */
function adminRoutes(): string[] {
  const base = join(root, 'src/app/admin')
  return walk(base)
    .filter((f) => /[\\/]page\.tsx$/.test(f))
    .map((f) => {
      const segs = posix(f)
        .replace(/^src\/app\/admin\/?/, '')
        .replace(/\/?page\.tsx$/, '')
        .split('/')
        .filter((s) => s !== '' && !/^\(.*\)$/.test(s))
      return '/admin' + (segs.length ? '/' + segs.join('/') : '')
    })
}

function routeToRegex(route: string): RegExp {
  const src = route
    .split('/')
    .map((s) => (/^\[.+\]$/.test(s) ? '[^/]+' : s.replace(/[.*+?^${}()|\\]/g, '\\$&')))
    .join('/')
  return new RegExp('^' + src + '$')
}

const ROUTES = adminRoutes()
const exists = (href: string) => ROUTES.some((r) => routeToRegex(r).test(pathOf(href).replace(/\/$/, '') || '/'))

describe('NAV-04 liens de nav.ts', () => {
  const navLinks = [
    ...NAV.flatMap((n) => [n.href, ...(n.children ?? []).map((c) => c.href)]),
    NEW_RESERVATION_HREF,
    ...ACCOUNT_LINKS.filter((l) => !l.external && !l.planned).map((l) => l.href),
  ]

  it('chaque lien interne /admin de nav.ts correspond à une page existante', () => {
    const dead = navLinks.filter((h) => h.startsWith('/admin') && !exists(h))
    expect(dead, `liens morts : ${dead.join(', ')}`).toEqual([])
  })

  it('une entrée « prévue » n’est tolérée que tant que sa page n’existe pas', () => {
    for (const l of ACCOUNT_LINKS.filter((x) => x.planned)) {
      expect(exists(l.href), `${l.href} existe : retirer « planned » de nav.ts`).toBe(false)
    }
  })

  it('ni libellé ni href vide, pas de doublon d’identifiant', () => {
    const ids = NAV.flatMap((n) => [n.id, ...(n.children ?? []).map((c) => c.id)])
    expect(new Set(ids).size).toBe(ids.length)
    for (const n of NAV) {
      expect(n.label.trim()).not.toBe('')
      expect(n.href.startsWith('/admin')).toBe(true)
    }
  })

  it('le détecteur échoue bien sur un lien mort (garde de la garde)', () => {
    expect(exists('/admin/tables')).toBe(false)
    expect(exists('/admin/n-importe-quoi')).toBe(false)
  })
})

describe('NAV-04 liens écrits dans les pages et composants d’admin', () => {
  const files = [...walk(join(root, 'src/app/admin')), ...walk(join(root, 'src/components/admin'))].filter((f) => /\.tsx?$/.test(f))
  const planned = new Set(ACCOUNT_LINKS.filter((l) => l.planned).map((l) => l.href))
  const LINK = /['"`](\/admin(?:\/[^'"`\s]*)?)['"`]/g

  it('tout lien /admin/... cité entre guillemets mène à une page existante', () => {
    const dead: string[] = []
    for (const f of files) {
      const src = readFileSync(f, 'utf8')
      for (const m of src.matchAll(LINK)) {
        const href = m[1].replace(/\$\{[^}]*\}/g, 'x')
        if (planned.has(href)) continue // page prévue, vérifiée par le test « prévue » ci-dessus
        if (!exists(href)) dead.push(`${posix(f)} -> ${m[1]}`)
      }
    }
    expect(dead).toEqual([])
  })
})

describe('URL conservées (09-NAVIGATION-CIBLE §3)', () => {
  const KEPT = [
    '/admin',
    '/admin/login',
    '/admin/signup',
    '/admin/reservations',
    '/admin/menu',
    '/admin/menu/abc123',
    '/admin/hours',
    '/admin/announcement',
    '/admin/settings',
    '/admin/avis',
    '/admin/kpi',
  ]
  it.each(KEPT)('%s existe toujours', (url) => {
    expect(exists(url)).toBe(true)
  })

  it('les pages d’entrée de section existent', () => {
    expect(exists('/admin/site')).toBe(true)
    expect(exists('/admin/reputation')).toBe(true)
  })

  it('/admin/tables n’existe pas (suppression de la phase 10)', () => {
    expect(exists('/admin/tables')).toBe(false)
  })
})
