/**
 * ACC-02 : routes API du module « Accès ». requireAdmin, validation stricte, erreurs `{ error: string }`,
 * origine, débit, énumération. Supabase, Resend et Sentry sont simulés (aucun appel réel).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'
import { ADMIN_A, ADMIN_B, makeDeps, tokenFromLink } from './helpers/access-fakes'

const afterCallbacks: Array<() => unknown> = []
const rpc = vi.fn()
const requireAdmin = vi.fn()
let ctx = makeDeps()
const createAccessDeps = vi.fn(() => ctx.deps)

vi.mock('@/utils/supabase/server', () => ({
  createAdminClient: vi.fn(() => ({ rpc })),
  createClient: vi.fn(),
  isGeckoAdmin: vi.fn(),
}))
vi.mock('@/utils/auth', () => ({ requireAdmin: () => requireAdmin() }))
vi.mock('@/utils/access/deps', () => ({ createAccessDeps: () => createAccessDeps() }))
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return { ...actual, after: (cb: () => unknown) => void afterCallbacks.push(cb) }
})
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }))

import { GET as listGET } from '@/app/api/access/route'
import { POST as invitePOST } from '@/app/api/access/invitations/route'
import { DELETE as inviteDELETE } from '@/app/api/access/invitations/[id]/route'
import { DELETE as adminDELETE } from '@/app/api/access/admins/[id]/route'
import { POST as acceptPOST } from '@/app/api/access/accept/route'
import { POST as resetPOST } from '@/app/api/access/reset/route'
import { POST as forgotPOST } from '@/app/api/access/forgot/route'

const OK_ADMIN = { ok: true, user: { id: ADMIN_A.id, email: ADMIN_A.email }, supabase: {} }
const GOOD_PW = 'Correct-horse-42-battery'

function jsonReq(url: string, body: unknown, headers: Record<string, string> = {}, method = 'POST') {
  return new Request(`http://localhost${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.9', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}
const params = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  ctx = makeDeps()
  afterCallbacks.length = 0
  rpc.mockReset().mockResolvedValue({ data: true, error: null })
  requireAdmin.mockReset().mockResolvedValue(OK_ADMIN)
  createAccessDeps.mockClear()
  process.env.RATE_LIMIT_SECRET = 'test-secret'
})

const denied = (status: number) => ({
  ok: false,
  response: NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Forbidden' }, { status }),
})

describe('routes réservées aux administrateurs : non-admin refusé, rien n’est exécuté', () => {
  const calls: Array<[string, () => Promise<Response>]> = [
    ['GET /api/access', () => listGET()],
    ['POST /api/access/invitations', () => invitePOST(jsonReq('/api/access/invitations', { email: 'marie@example.com' }))],
    ['DELETE /api/access/invitations/[id]', () => inviteDELETE(jsonReq('/x', '', {}, 'DELETE'), params('33333333-3333-4333-8333-333333333333'))],
    ['DELETE /api/access/admins/[id]', () => adminDELETE(jsonReq('/x', '', {}, 'DELETE'), params(ADMIN_B.id))],
  ]
  it.each(calls)('%s : anonyme -> 401', async (_n, run) => {
    requireAdmin.mockResolvedValue(denied(401))
    const res = await run()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
    expect(createAccessDeps).not.toHaveBeenCalled()
    expect(rpc).not.toHaveBeenCalled()
  })
  it.each(calls)('%s : compte connecté non admin (autre application) -> 403', async (_n, run) => {
    requireAdmin.mockResolvedValue(denied(403))
    const res = await run()
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Forbidden' })
    expect(createAccessDeps).not.toHaveBeenCalled()
    expect(ctx.mailer.sent).toHaveLength(0)
    expect(ctx.store.admins).toHaveLength(2)
  })
})

describe('GET /api/access', () => {
  it('renvoie { data } sans jeton ni empreinte, jamais mis en cache', async () => {
    await ctx.store.insertToken({ kind: 'invite', email: 'marie@example.com', user_id: null, invited_by: ADMIN_A.id, token_hash: 'a'.repeat(64), expires_at: '2026-11-08T00:00:00.000Z' })
    const res = await listGET()
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
    const text = await res.text()
    expect(text).not.toContain('a'.repeat(64))
    expect(JSON.parse(text).data.admins).toHaveLength(2)
  })
  it('panne de la base : { error } générique, sans détail', async () => {
    createAccessDeps.mockImplementationOnce(() => {
      throw new Error('connect ECONNREFUSED 10.0.0.5:5432 password=hunter2')
    })
    const res = await listGET()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(Object.keys(body)).toEqual(['error'])
    expect(JSON.stringify(body)).not.toMatch(/ECONNREFUSED|hunter2|10\.0\.0\.5|stack/)
  })
})

describe('POST /api/access/invitations', () => {
  it('201 : envoie un seul email, crée un jeton, aucun compte', async () => {
    const res = await invitePOST(jsonReq('/api/access/invitations', { email: ' Marie@Example.com ' }))
    expect(res.status).toBe(201)
    expect((await res.json()).data.email).toBe('marie@example.com')
    expect(ctx.mailer.sent).toHaveLength(1)
    expect(ctx.auth.createCalls).toHaveLength(0)
  })
  it.each([[{}], [{ email: 5 }], [{ email: 'nope' }], [{ email: 'a@b' }], [[]], ['not json'], ['']])('400 pour le corps %j', async (body) => {
    const res = await invitePOST(jsonReq('/api/access/invitations', body as never))
    expect(res.status).toBe(400)
    expect(Object.keys(await res.json())).toEqual(['error'])
    expect(ctx.mailer.sent).toHaveLength(0)
    expect(rpc).not.toHaveBeenCalled() // l'entrée invalide ne consomme pas de seuil
  })
  it('refuse un Content-Type autre que JSON (formulaire inter-sites)', async () => {
    const req = new Request('http://localhost/api/access/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'email=marie@example.com',
    })
    expect((await invitePOST(req)).status).toBe(400)
    expect(ctx.mailer.sent).toHaveLength(0)
  })
  it('refuse une requête inter-sites (Origin / Sec-Fetch-Site) avant tout traitement', async () => {
    const hostile: Record<string, string>[] = [{ Origin: 'https://evil.example' }, { 'Sec-Fetch-Site': 'cross-site' }, { Origin: 'null' }]
    for (const h of hostile) {
      const res = await invitePOST(jsonReq('/api/access/invitations', { email: 'marie@example.com' }, h))
      expect(res.status).toBe(403)
    }
    expect(ctx.mailer.sent).toHaveLength(0)
  })
  it('accepte la même origine', async () => {
    const res = await invitePOST(jsonReq('/api/access/invitations', { email: 'marie@example.com' }, { Origin: 'http://localhost', 'Sec-Fetch-Site': 'same-origin' }))
    expect(res.status).toBe(201)
  })
  it('limitation de débit : 429 sans envoi quand un seuil est dépassé', async () => {
    rpc.mockResolvedValue({ data: false, error: null })
    const res = await invitePOST(jsonReq('/api/access/invitations', { email: 'marie@example.com' }))
    expect(res.status).toBe(429)
    expect(ctx.mailer.sent).toHaveLength(0)
  })
  it('les clés de débit sont des HMAC : ni email ni IP en clair', async () => {
    await invitePOST(jsonReq('/api/access/invitations', { email: 'marie@example.com' }))
    const keys = rpc.mock.calls.map((c) => (c[1] as { p_key: string }).p_key)
    expect(keys.length).toBeGreaterThanOrEqual(3)
    for (const k of keys) {
      expect(k).toMatch(/^acc-(user|ip|email):[0-9a-f]{64}$/)
      expect(k).not.toContain('marie')
      expect(k).not.toContain('203.0.113.9')
    }
  })
  it('déjà administrateur : 409 ; échec d’envoi : 502 avec la phrase « Aucun email n’est parti »', async () => {
    expect((await invitePOST(jsonReq('/api/access/invitations', { email: ADMIN_B.email }))).status).toBe(409)
    ctx.mailer.fail = true
    const res = await invitePOST(jsonReq('/api/access/invitations', { email: 'marie@example.com' }))
    expect(res.status).toBe(502)
    expect((await res.json()).error).toContain("Aucun email n'est parti")
  })
})

describe('DELETE admins et invitations', () => {
  it('auto-révocation : 409 { error }, rien n’est supprimé', async () => {
    const res = await adminDELETE(jsonReq('/x', '', {}, 'DELETE'), params(ADMIN_A.id))
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'Vous ne pouvez pas retirer votre propre accès.' })
    expect(ctx.store.admins).toHaveLength(2)
  })
  it('dernier administrateur : 409', async () => {
    ctx.store.admins = [ctx.store.admins[1]]
    const res = await adminDELETE(jsonReq('/x', '', {}, 'DELETE'), params(ADMIN_B.id))
    expect(res.status).toBe(409)
    expect((await res.json()).error).toContain('dernier administrateur')
    expect(ctx.store.admins).toHaveLength(1)
  })
  it('retire un autre administrateur : 200', async () => {
    const res = await adminDELETE(jsonReq('/x', '', {}, 'DELETE'), params(ADMIN_B.id))
    expect(res.status).toBe(200)
    expect(ctx.store.admins.map((a) => a.id)).toEqual([ADMIN_A.id])
  })
  it('identifiant invalide : 400 ; inconnu : 404 ; inter-sites : 403', async () => {
    expect((await adminDELETE(jsonReq('/x', '', {}, 'DELETE'), params('1; drop table gecko_admins'))).status).toBe(400)
    expect((await adminDELETE(jsonReq('/x', '', {}, 'DELETE'), params('33333333-3333-4333-8333-333333333333'))).status).toBe(404)
    expect((await adminDELETE(jsonReq('/x', '', { Origin: 'https://evil.example' }, 'DELETE'), params(ADMIN_B.id))).status).toBe(403)
    expect(ctx.store.admins).toHaveLength(2)
  })
  it('révoque une invitation', async () => {
    await invitePOST(jsonReq('/api/access/invitations', { email: 'marie@example.com' }))
    const id = ctx.store.tokens[0].id
    expect((await inviteDELETE(jsonReq('/x', '', {}, 'DELETE'), params(id))).status).toBe(200)
    expect(ctx.store.tokens[0].revoked_at).not.toBeNull()
  })
})

describe('routes publiques : acceptation, réinitialisation, mot de passe oublié', () => {
  it('ne demandent PAS de session (le visiteur n’a pas de compte) mais ne s’appuient que sur le jeton', async () => {
    await invitePOST(jsonReq('/api/access/invitations', { email: 'marie@example.com' }))
    const token = tokenFromLink(ctx.mailer.sent[0].link)
    requireAdmin.mockClear()
    const res = await acceptPOST(jsonReq('/api/access/accept', { token, password: GOOD_PW, confirm: GOOD_PW }))
    expect(res.status).toBe(200)
    expect(requireAdmin).not.toHaveBeenCalled()
    expect(ctx.store.admins).toHaveLength(3)
  })
  it('jeton rejoué : 410 avec le message unique', async () => {
    await invitePOST(jsonReq('/api/access/invitations', { email: 'marie@example.com' }))
    const token = tokenFromLink(ctx.mailer.sent[0].link)
    await acceptPOST(jsonReq('/api/access/accept', { token, password: GOOD_PW }))
    const again = await acceptPOST(jsonReq('/api/access/accept', { token, password: GOOD_PW }))
    expect(again.status).toBe(410)
    expect((await again.json()).error).toContain("Ce lien n'est plus valable")
  })
  it('mot de passe faible : 400 ; corps invalide : 400 ; inter-sites : 403 ; débit : 429', async () => {
    expect((await acceptPOST(jsonReq('/api/access/accept', { token: 'x', password: 'short' }))).status).toBe(400)
    expect((await acceptPOST(jsonReq('/api/access/accept', 'zzz'))).status).toBe(400)
    expect((await acceptPOST(jsonReq('/api/access/accept', { token: 'x', password: GOOD_PW }, { Origin: 'https://evil.example' }))).status).toBe(403)
    rpc.mockResolvedValue({ data: false, error: null })
    expect((await acceptPOST(jsonReq('/api/access/accept', { token: 'x', password: GOOD_PW }))).status).toBe(429)
    expect((await resetPOST(jsonReq('/api/access/reset', { token: 'x', password: GOOD_PW }))).status).toBe(429)
  })
  it('compte déjà présent dans le pool partagé : 409, mot de passe de l’autre application intact', async () => {
    await invitePOST(jsonReq('/api/access/invitations', { email: 'marie@example.com' }))
    const token = tokenFromLink(ctx.mailer.sent[0].link)
    ctx.auth.users.set('marie@example.com', { id: 'portfolio', password: 'portfolio-secret' })
    const res = await acceptPOST(jsonReq('/api/access/accept', { token, password: GOOD_PW }))
    expect(res.status).toBe(409)
    expect(ctx.auth.users.get('marie@example.com')!.password).toBe('portfolio-secret')
  })
  it('erreur interne : message générique, aucune trace', async () => {
    createAccessDeps.mockImplementationOnce(() => {
      throw new Error('relation "gecko_access_tokens" does not exist')
    })
    let status = 0
    let text = ''
    try {
      const res = await acceptPOST(jsonReq('/api/access/accept', { token: 'x'.repeat(43), password: GOOD_PW }))
      status = res.status
      text = await res.text()
    } catch (e) {
      // une exception non gérée serait renvoyée en 500 par Next.js ; la route ne doit pas en dépendre
      throw new Error(`la route a laissé échapper une exception : ${(e as Error).message}`)
    }
    expect(status).toBe(500)
    expect(text).not.toMatch(/gecko_access_tokens|relation|stack/)
  })

  it('mot de passe oublié : réponse IDENTIQUE pour une adresse administrateur, inconnue, ou de l’autre application', async () => {
    ctx.auth.users.set('portfolio@example.com', { id: 'portfolio', password: 'secret-portfolio-1' })
    const bodies: string[] = []
    const statuses: number[] = []
    for (const email of [ADMIN_A.email, 'inconnu@example.com', 'portfolio@example.com']) {
      const res = await forgotPOST(jsonReq('/api/access/forgot', { email }))
      statuses.push(res.status)
      bodies.push(await res.text())
    }
    expect(new Set(statuses)).toEqual(new Set([200]))
    expect(new Set(bodies).size).toBe(1)
    // le travail se fait après la réponse : même durée de réponse quel que soit le compte
    expect(afterCallbacks).toHaveLength(3)
    expect(ctx.mailer.sent).toHaveLength(0)
    for (const cb of afterCallbacks) await cb()
    expect(ctx.mailer.sent.map((m) => m.to)).toEqual([ADMIN_A.email]) // seul l'administrateur reçoit un lien
  })
  it('mot de passe oublié : dépassement du seuil par adresse = même réponse neutre, sans signal', async () => {
    rpc.mockImplementation(async (_n: string, a: { p_key: string }) => ({ data: !a.p_key.startsWith('acc-email:'), error: null }))
    const res = await forgotPOST(jsonReq('/api/access/forgot', { email: ADMIN_A.email }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: { ok: true } })
    expect(afterCallbacks).toHaveLength(0)
  })
  it('mot de passe oublié : le seuil par IP répond 429 (sans lien avec l’existence du compte)', async () => {
    rpc.mockResolvedValue({ data: false, error: null })
    expect((await forgotPOST(jsonReq('/api/access/forgot', { email: 'inconnu@example.com' }))).status).toBe(429)
  })
  it('mot de passe oublié : email invalide 400, inter-sites 403', async () => {
    expect((await forgotPOST(jsonReq('/api/access/forgot', { email: 'pas-un-email' }))).status).toBe(400)
    expect((await forgotPOST(jsonReq('/api/access/forgot', { email: ADMIN_A.email }, { 'Sec-Fetch-Site': 'cross-site' }))).status).toBe(403)
  })
  it('réinitialisation : 200 puis 410 au rejeu', async () => {
    await forgotPOST(jsonReq('/api/access/forgot', { email: ADMIN_A.email }))
    for (const cb of afterCallbacks) await cb()
    ctx.auth.users.set(ADMIN_A.email, { id: ADMIN_A.id, password: 'old-password-1' })
    const token = tokenFromLink(ctx.mailer.sent[0].link)
    expect((await resetPOST(jsonReq('/api/access/reset', { token, password: GOOD_PW }))).status).toBe(200)
    expect((await resetPOST(jsonReq('/api/access/reset', { token, password: GOOD_PW }))).status).toBe(410)
  })
})
