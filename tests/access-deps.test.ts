/**
 * Adaptateurs de production du module « Accès » (deps.ts), avec un faux client Supabase :
 * on vérifie les REQUÊTES construites (usage unique atomique, filtres), sans aucun service réel.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }))
vi.mock('@/utils/supabase/server', () => ({ createAdminClient: vi.fn() }))
const getResendClient = vi.fn()
vi.mock('@/utils/resend', () => ({ getResendClient: () => getResendClient(), RESEND_FROM_EMAIL: 'Gecko Cabane <test@example.com>' }))

import { accessBaseUrl, createAccessAuth, createAccessMailer, createAccessStore } from '@/utils/access/deps'

type Call = [string, ...unknown[]]

/** Faux générateur de requêtes : enregistre la chaîne d'appels, se résout avec `result`. */
function fakeAdmin(result: { data?: unknown; error?: unknown } = { data: [], error: null }) {
  const log: Call[] = []
  const chain: Record<string, unknown> = {}
  for (const m of ['select', 'insert', 'update', 'eq', 'is', 'gt', 'ilike', 'limit', 'single', 'maybeSingle']) {
    chain[m] = (...a: unknown[]) => {
      log.push([m, ...a])
      return chain
    }
  }
  chain.then = (resolve: (v: unknown) => unknown) => resolve({ data: result.data ?? null, error: result.error ?? null })
  const admin = {
    from: (t: string) => {
      log.push(['from', t])
      return chain
    },
    rpc: async (fn: string, args: unknown) => {
      log.push(['rpc', fn, args])
      return { data: result.data, error: result.error ?? null }
    },
    auth: { admin: { createUser: vi.fn(), deleteUser: vi.fn(), updateUserById: vi.fn() } },
  }
  return { admin, log }
}

beforeEach(() => getResendClient.mockReset())

describe('claimToken : UPDATE conditionnel atomique (usage unique)', () => {
  it('ne réussit que pour un jeton non utilisé, non révoqué, non expiré, du bon type', async () => {
    const { admin, log } = fakeAdmin({ data: null })
    const store = createAccessStore(admin as never)
    const now = '2026-11-01T03:00:00.000Z'
    expect(await store.claimToken('h'.repeat(64), 'invite', now)).toBeNull()
    expect(log).toContainEqual(['from', 'gecko_access_tokens'])
    expect(log).toContainEqual(['update', { used_at: now }])
    expect(log).toContainEqual(['eq', 'token_hash', 'h'.repeat(64)])
    expect(log).toContainEqual(['eq', 'kind', 'invite'])
    expect(log).toContainEqual(['is', 'used_at', null])
    expect(log).toContainEqual(['is', 'revoked_at', null])
    expect(log).toContainEqual(['gt', 'expires_at', now])
    expect(log.filter((c) => c[0] === 'update')).toHaveLength(1) // un seul aller-retour : pas de lecture puis écriture
  })

  it('une erreur de base remonte (jamais interprétée comme « jeton valide »)', async () => {
    const { admin } = fakeAdmin({ data: null, error: new Error('db down') })
    await expect(createAccessStore(admin as never).claimToken('h', 'invite', 'now')).rejects.toThrow('db down')
  })
})

describe('autres requêtes du magasin', () => {
  it('revokeToken : seulement un jeton en attente du bon type', async () => {
    const { admin, log } = fakeAdmin({ data: [{ id: 'x' }] })
    expect(await createAccessStore(admin as never).revokeToken('id-1', 'invite')).toBe(true)
    expect(log).toContainEqual(['eq', 'kind', 'invite'])
    expect(log).toContainEqual(['is', 'used_at', null])
    const none = fakeAdmin({ data: [] })
    expect(await createAccessStore(none.admin as never).revokeToken('id-1', 'invite')).toBe(false)
  })

  it('findAdminByEmail : échappe les jokers LIKE et exige l’égalité exacte', async () => {
    const { admin, log } = fakeAdmin({ data: [{ id: 'u1', email: 'someone@example.com', created_at: 'x' }] })
    const store = createAccessStore(admin as never)
    expect(await store.findAdminByEmail('100%_real@example.com')).toBeNull() // la ligne renvoyée ne correspond pas exactement
    expect(log).toContainEqual(['ilike', 'email', '100\\%\\_real@example.com'])
    expect(await store.findAdminByEmail('Someone@Example.com')).toMatchObject({ id: 'u1' })
  })

  it('revokeAdmin passe par la fonction SQL à verrou et normalise sa réponse', async () => {
    const { admin, log } = fakeAdmin({ data: 'last' })
    expect(await createAccessStore(admin as never).revokeAdmin('a', 'b')).toBe('last')
    expect(log).toContainEqual(['rpc', 'gecko_revoke_admin', { p_actor: 'a', p_target: 'b' }])
    expect(await createAccessStore(fakeAdmin({ data: 'rien' }).admin as never).revokeAdmin('a', 'b')).toBe('not_found')
  })

  it('listAdmins ne lit que id, email, created_at', async () => {
    const { admin, log } = fakeAdmin({ data: [] })
    await createAccessStore(admin as never).listAdmins()
    expect(log).toContainEqual(['select', 'id, email, created_at'])
  })

  it('les lectures de jetons ne demandent jamais l’empreinte (token_hash)', async () => {
    const { admin, log } = fakeAdmin({ data: [] })
    const store = createAccessStore(admin as never)
    await store.listPendingInvites()
    await store.findByHash('h', 'invite')
    const selects = log.filter((c) => c[0] === 'select').map((c) => String(c[1]))
    expect(selects.length).toBeGreaterThan(0)
    for (const s of selects) expect(s).not.toContain('token_hash')
  })
})

describe('createUser (Supabase Auth admin)', () => {
  it('crée un compte déjà confirmé (aucun email Supabase) et reconnaît « existe déjà »', async () => {
    const { admin } = fakeAdmin()
    admin.auth.admin.createUser.mockResolvedValueOnce({ data: { user: { id: 'u-1' } }, error: null })
    const auth = createAccessAuth(admin as never)
    expect(await auth.createUser('a@b.fr', 'Correct-horse-42')).toEqual({ ok: true, id: 'u-1' })
    expect(admin.auth.admin.createUser).toHaveBeenCalledWith({ email: 'a@b.fr', password: 'Correct-horse-42', email_confirm: true })
    admin.auth.admin.createUser.mockResolvedValueOnce({ data: { user: null }, error: { code: 'email_exists', message: 'x' } })
    expect(await auth.createUser('a@b.fr', 'p')).toEqual({ ok: false, reason: 'exists' })
    admin.auth.admin.createUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'A user with this email address has already been registered' } })
    expect(await auth.createUser('a@b.fr', 'p')).toEqual({ ok: false, reason: 'exists' })
    admin.auth.admin.createUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'boom' } })
    expect(await auth.createUser('a@b.fr', 'p')).toEqual({ ok: false, reason: 'error' })
  })
})

describe('mailer', () => {
  it('sans clé Resend : échec propre (faux), aucun envoi', async () => {
    getResendClient.mockReturnValue(null)
    expect(await createAccessMailer().sendInvitation({ to: 'a@b.fr', link: 'https://x/y', expiresAt: new Date(), inviterEmail: 'z@z.fr' })).toBe(false)
  })
  it('exception ou erreur Resend : faux', async () => {
    getResendClient.mockReturnValue({ emails: { send: vi.fn().mockRejectedValue(new Error('network')) } })
    expect(await createAccessMailer().sendReset({ to: 'a@b.fr', link: 'https://x/y', expiresAt: new Date() })).toBe(false)
    getResendClient.mockReturnValue({ emails: { send: vi.fn().mockResolvedValue({ error: { message: 'bad' } }) } })
    expect(await createAccessMailer().sendReset({ to: 'a@b.fr', link: 'https://x/y', expiresAt: new Date() })).toBe(false)
  })
  it('envoie à une seule adresse', async () => {
    const send = vi.fn().mockResolvedValue({ error: null })
    getResendClient.mockReturnValue({ emails: { send } })
    expect(await createAccessMailer().sendInvitation({ to: 'a@b.fr', link: 'https://x/y', expiresAt: new Date(), inviterEmail: 'z@z.fr' })).toBe(true)
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0].to).toBe('a@b.fr')
  })
})

describe('accessBaseUrl : jamais déduite d’un en-tête', () => {
  it('par défaut le domaine public', () => {
    expect(accessBaseUrl({})).toBe('https://geckocabanerestaurant.com')
  })
  it('accepte https et http://localhost seulement', () => {
    expect(accessBaseUrl({ ACCESS_LINK_BASE_URL: 'https://preview.example.com/chemin' })).toBe('https://preview.example.com')
    expect(accessBaseUrl({ ACCESS_LINK_BASE_URL: 'http://localhost:3119' })).toBe('http://localhost:3119')
    for (const bad of ['http://evil.example', 'javascript:alert(1)', '//evil.example', 'ftp://x', 'pas une url', 'http://localhost.evil.example']) {
      expect(accessBaseUrl({ ACCESS_LINK_BASE_URL: bad }), bad).toBe('https://geckocabanerestaurant.com')
    }
  })
})
