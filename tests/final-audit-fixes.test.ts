/**
 * Corrections des audits de fin de milestone v1.1 (M1, M2 et basses de 17-SECURITY).
 * Voir .planning/phases/17-acces-securite-qa/FINAL-REVIEW-FIXES.md.
 */

import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EmptyState, ErrorState } from '../src/components/admin/states'
import { FILTERED, scrubEvent, scrubString } from '../src/utils/sentry-scrub'
import { parseTokenFragment } from '../src/utils/access/fragment'
import { inviteLink, resetLink } from '../src/utils/access/service'
import { PASSWORD_MAX, passwordBytes, validatePassword } from '../src/utils/access/validation'

const root = process.cwd()
const read = (f: string) => readFileSync(join(root, f), 'utf-8')
const TOKEN = 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v'

describe('M1 : le jeton ne part pas chez Sentry', () => {
  it('scrubString masque token= dans une URL, une query string et un fragment', () => {
    expect(scrubString(`https://x.fr/admin/invitation?token=${TOKEN}`)).toBe(`https://x.fr/admin/invitation?token=${FILTERED}`)
    expect(scrubString(`/admin/reinitialiser?a=1&token=${TOKEN}&b=2`)).toBe(`/admin/reinitialiser?a=1&token=${FILTERED}&b=2`)
    expect(scrubString(`https://x.fr/admin/invitation#token=${TOKEN}`)).toBe(`https://x.fr/admin/invitation#token=${FILTERED}`)
    expect(scrubString(`token=${TOKEN}&x=1`)).toBe(`token=${FILTERED}&x=1`)
    expect(scrubString('https://x.fr/fr/menu')).toBe('https://x.fr/fr/menu')
  })

  it('scrubEvent masque request.url, query_string, transaction, tags, breadcrumbs et spans', () => {
    const event = {
      request: { url: `https://x.fr/admin/invitation?token=${TOKEN}`, query_string: `token=${TOKEN}`, headers: { Referer: `https://x.fr/a?token=${TOKEN}` } },
      transaction: `GET /admin/invitation?token=${TOKEN}`,
      tags: { url: `/admin/invitation?token=${TOKEN}` },
      breadcrumbs: [
        { category: 'navigation', data: { from: '/', to: `/admin/invitation?token=${TOKEN}` } },
        { category: 'fetch', data: { url: `/api/x?token=${TOKEN}` } },
      ],
      spans: [{ description: `GET /admin/reinitialiser?token=${TOKEN}`, data: { 'http.url': `https://x.fr/?token=${TOKEN}` } }],
      extra: { body: { token: TOKEN, kind: 'invite' } },
    }
    const out = JSON.stringify(scrubEvent(event))
    expect(out).not.toContain(TOKEN)
    expect(out).toContain(`token=${FILTERED}`)
    expect(JSON.stringify(event)).toContain(TOKEN) // l'original n'est pas modifié
    expect(scrubEvent(event).extra.body.kind).toBe('invite')
  })

  it.each(['sentry.server.config.ts', 'sentry.edge.config.ts', 'src/instrumentation-client.ts'])('%s branche le filtre', (f) => {
    const src = read(f)
    expect(src).toContain('sentry-scrub')
    for (const hook of ['beforeSend:', 'beforeSendTransaction:', 'beforeBreadcrumb:']) expect(src).toContain(hook)
  })

  it('les liens d’email portent le jeton dans le fragment (#), jamais en query string', () => {
    for (const link of [inviteLink('https://geckocabanerestaurant.com/', TOKEN), resetLink('https://geckocabanerestaurant.com', TOKEN)]) {
      expect(link).toContain(`#token=${TOKEN}`)
      expect(link).not.toContain('?')
    }
    expect(inviteLink('https://g.fr', TOKEN)).toBe(`https://g.fr/admin/invitation#token=${TOKEN}`)
    expect(resetLink('https://g.fr', TOKEN)).toBe(`https://g.fr/admin/reinitialiser#token=${TOKEN}`)
  })

  it('parseTokenFragment lit #token= et ignore le reste', () => {
    expect(parseTokenFragment(`#token=${TOKEN}`)).toBe(TOKEN)
    expect(parseTokenFragment(`token=${TOKEN}`)).toBe(TOKEN)
    expect(parseTokenFragment(`#a=1&token=${TOKEN}`)).toBe(TOKEN)
    for (const bad of ['', '#', '#token=', '#autre=1',`#token=${'x'.repeat(201)}`]) expect(parseTokenFragment(bad)).toBeNull()
  })

  it('les pages lisent le fragment côté client, sans searchParams, et soumettent en POST', () => {
    for (const p of ['invitation', 'reinitialiser']) {
      const src = read(`src/app/admin/${p}/page.tsx`)
      expect(src).not.toContain('searchParams')
      expect(src).toContain('TokenGate')
      expect(src).toContain("referrer: 'no-referrer'")
    }
    const gate = read('src/app/admin/_auth/TokenGate.tsx')
    expect(gate).toContain("'use client'")
    expect(gate).toContain('window.location.hash')
    expect(gate).toContain('parseTokenFragment')
    expect(gate).toContain("method: 'POST'")
    expect(gate).toContain('/api/access/peek')
    expect(gate).not.toMatch(/location\.search|searchParams|[?&]token=/)
    const peek = read('src/app/api/access/peek/route.ts')
    expect(peek).toContain('isSameOrigin')
    expect(peek).toContain('readJsonObject')
    expect(peek).toContain('export async function POST')
    expect(peek).not.toContain('export async function GET')
    expect(read('src/app/admin/_auth/NewPasswordForm.tsx')).toContain("method: 'POST'")
  })

  it('aucun module n’émet encore de lien ?token=', () => {
    expect(read('src/utils/access/service.ts')).not.toMatch(/\?token=/)
  })
})

describe('M2 : signOut local seulement (pool Auth partagé)', () => {
  it.each([
    'src/middleware.ts',
    'src/app/admin/login/actions.ts',
    'src/app/admin/actions.ts',
    'src/app/api/auth/logout/route.ts',
  ])('%s', (f) => {
    const src = read(f)
    const calls = src.match(/auth\.signOut\([^)]*\)/g) ?? []
    expect(calls.length).toBeGreaterThan(0)
    for (const c of calls) expect(c).toContain("scope: 'local'")
  })

  it('GET /api/auth/logout ne déconnecte pas (seul POST le fait)', () => {
    const src = read('src/app/api/auth/logout/route.ts')
    const get = src.slice(src.indexOf('export async function GET'))
    expect(get).not.toContain('signOut')
  })
})

describe('basses : mot de passe en octets', () => {
  it('mesure les octets UTF-8, pas les caractères', () => {
    expect(passwordBytes('abc')).toBe(3)
    expect(passwordBytes('é')).toBe(2)
    const accents = 'é1'.repeat(20) + 'abcdefghij' // 50 caractères, 70 octets
    expect(accents.length).toBeLessThan(PASSWORD_MAX)
    expect(passwordBytes(accents)).toBe(70)
    expect(validatePassword(accents)).toBeNull()
    const tooBig = 'é1'.repeat(30) // 60 caractères mais 90 octets
    expect(tooBig.length).toBeLessThanOrEqual(PASSWORD_MAX)
    expect(validatePassword(tooBig)).toMatch(/72/)
    expect(validatePassword('Ab1'.repeat(24))).toBeNull() // 72 octets exactement
    expect(validatePassword('Ab1'.repeat(24) + 'x')).toMatch(/72/)
  })
})

describe('basses : GET /api/settings n’expose pas la mémoire de fermeture', () => {
  it('filtre service_closure_prev:* dans la requête publique', async () => {
    const calls: unknown[][] = []
    const chain = {
      select: () => chain,
      not: (...a: unknown[]) => {
        calls.push(a)
        return chain
      },
      order: () => Promise.resolve({ data: [{ key: 'max_covers', value: '40' }], error: null }),
    }
    vi.resetModules()
    vi.doMock('@/utils/supabase/server', () => ({ createClient: async () => ({ from: () => chain }) }))
    vi.doMock('@/utils/auth', () => ({ requireAdmin: vi.fn() }))
    vi.doMock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
    const { GET } = await import('../src/app/api/settings/route')
    const res = await GET()
    expect(res.status).toBe(200)
    expect(calls).toEqual([['key', 'like', 'service_closure_prev:%']])
    vi.doUnmock('@/utils/supabase/server')
    vi.doUnmock('@/utils/auth')
    vi.doUnmock('@sentry/nextjs')
  })
})

describe('QA-02 : hiérarchie des titres et débordement à 195 px', () => {
  it('les états vide / erreur sont des h2 sous le h1 de la page (h3 sur demande, sous un h2 de section)', () => {
    const html = renderToStaticMarkup(
      createElement('div', null, createElement(EmptyState, { title: 'Vide' }), createElement(ErrorState, { title: 'Erreur', description: 'x' }), createElement(EmptyState, { title: 'Sous-section', level: 3 })),
    )
    expect(html).toContain('<h2>Vide</h2>')
    expect(html).toContain('<h2>Erreur</h2>')
    expect(html).toContain('<h3>Sous-section</h3>')
    expect(html).not.toContain('<h3>Vide</h3>')
    expect(read('src/app/admin/admin.css')).toContain('.adm-state :is(h2, h3)')
  })

  it('les grilles des écrans Site public, Annonces et Accès ont une colonne minmax(0, 1fr) (pas de débordement en min-content)', () => {
    const site = read('src/components/admin/site/site.css')
    expect(site).toMatch(/\.adm-site-stack \{[^}]*grid-template-columns: minmax\(0, 1fr\)/)
    expect(site).toMatch(/\.adm-site-row2 \{[^}]*grid-template-columns: minmax\(0, 1fr\)/)
    expect(site).toMatch(/\.adm-site-hrow \{[^}]*grid-template-columns: minmax\(0, 1fr\) auto/)
    const access = read('src/components/admin/access/access.css')
    expect(access).toMatch(/\.adm-access \{[^}]*grid-template-columns: minmax\(0, 1fr\)/)
    expect(access).toMatch(/\.adm-access__panel \{[^}]*grid-template-columns: minmax\(0, 1fr\)/)
    const admin = read('src/app/admin/admin.css')
    expect(admin).toMatch(/\.adm-field \{[^}]*grid-template-columns: minmax\(0, 1fr\)/)
    expect(admin).toMatch(/\.adm-input, \.adm-select, \.adm-textarea \{[^}]*min-width: 0/)
  })

  it('la liste des couverts par heure, qui défile en horizontal sur téléphone, est atteignable au clavier', () => {
    expect(read('src/components/admin/reservations/TodayView.tsx')).toMatch(/className="rv-cap" role="list" tabIndex=\{0\} aria-labelledby="rv-c-t"/)
  })
})

describe('basses : migration 022 (additive, non appliquée)', () => {
  const raw = read('supabase/migrations/022_gecko_revoke_admin_hardening.sql')
  const code = raw.replace(/--.*$/gm, '').toLowerCase()
  it('fixe search_path avec pg_temp et vérifie l’appelant, sans toucher aux tables', () => {
    expect(code).toContain('create or replace function public.gecko_revoke_admin(p_actor uuid, p_target uuid)')
    expect(code).toContain('set search_path = public, pg_temp')
    expect(code).toContain('security definer')
    expect(code).toMatch(/not exists \(select 1 from public\.gecko_admins where id = p_actor\)/)
    expect(code).toContain("return 'forbidden'")
    for (const r of ["'self'", "'last'", "'not_found'", "'ok'"]) expect(code).toContain(`return ${r}`)
    expect(code).toMatch(/revoke all on function public\.gecko_revoke_admin\(uuid, uuid\) from public, anon, authenticated/)
    expect(code).toMatch(/grant execute on function public\.gecko_revoke_admin\(uuid, uuid\) to service_role/)
    expect(code).not.toMatch(/\bdrop\s+table\b|\balter\s+table\b|\bcreate\s+table\b|\bcreate\s+policy\b/)
  })
  it('le code n’applique aucune migration', () => {
    expect(read('src/utils/access/deps.ts')).not.toMatch(/apply_migration|db push/)
  })
})
