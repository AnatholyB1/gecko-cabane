/**
 * Redirections ouvertes (audit P15, SECURITY) : connexion admin et callback d'authentification.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { safeAdminRedirect, safeNextPath } from '../src/utils/safe-redirect'

const ATTACKS: unknown[] = [
  '//evil.tld',
  '//evil.tld/admin',
  'https://evil.tld',
  'http://evil.tld/admin',
  'javascript:alert(1)',
  '/\\evil.tld',
  '\\\\evil.tld',
  '\\evil.tld',
  '@evil.tld',
  '/@evil.tld',
  '/admin@evil.tld',
  '/admin/\\evil.tld',
  '/%5Cevil.tld',
  '/admin%5Cevil',
  '/\t/evil.tld',
  '/\n/evil.tld',
  '/ /evil.tld',
  'evil.tld',
  '',
  null,
  undefined,
  42,
]

describe('safeAdminRedirect', () => {
  it.each(ATTACKS)('refuse %j et renvoie /admin', (v) => {
    expect(safeAdminRedirect(v)).toBe('/admin')
  })
  it('refuse un chemin interne hors /admin', () => {
    for (const v of ['/', '/fr', '/api/auth/logout', '/administrator', '/adminx/evil']) expect(safeAdminRedirect(v)).toBe('/admin')
  })
  it('accepte /admin et ses sous-chemins', () => {
    for (const v of ['/admin', '/admin/', '/admin/reservations', '/admin/reservations?date=2026-11-01', '/admin?x=1', '/admin#a']) {
      expect(safeAdminRedirect(v)).toBe(v)
    }
  })
})

describe('safeNextPath', () => {
  it.each(ATTACKS)('refuse %j et renvoie /admin', (v) => {
    expect(safeNextPath(v)).toBe('/admin')
  })
  it('accepte un chemin interne à un seul /', () => {
    for (const v of ['/admin', '/fr/reservation', '/admin/kpi?x=1']) expect(safeNextPath(v)).toBe(v)
  })
})

describe('câblage', () => {
  it.each([
    ['src/app/admin/login/actions.ts', 'safeAdminRedirect(redirectTo)'],
    ['src/app/api/auth/login/route.ts', 'safeAdminRedirect(redirectTo)'],
    ['src/app/auth/callback/route.ts', "safeNextPath(searchParams.get('next'))"],
  ])('%s utilise le validateur', (file, snippet) => {
    const src = readFileSync(file, 'utf8')
    expect(src).toContain(snippet)
    expect(src).not.toMatch(/redirectTo \|\| '\/admin'/)
  })
})
