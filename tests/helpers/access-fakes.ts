/**
 * Doubles en mémoire pour le module « Accès » : aucun réseau, aucune base, aucun email.
 * `claimToken` reproduit la sémantique de l'UPDATE conditionnel de production (usage unique).
 */
import type {
  AccessAuth,
  AccessDeps,
  AccessMailer,
  AccessStore,
  AdminRow,
  CreateUserResult,
  RevokeAdminOutcome,
  TokenRow,
} from '../../src/utils/access/service'
import type { TokenKind } from '../../src/utils/access/tokens'

export const NOW = new Date('2026-11-01T03:00:00.000Z')
export const ADMIN_A = { id: '11111111-1111-4111-8111-111111111111', email: 'jariya@example.com' }
export const ADMIN_B = { id: '22222222-2222-4222-8222-222222222222', email: 'anatholy@example.com' }

export class FakeStore implements AccessStore {
  admins: AdminRow[] = [
    { id: ADMIN_A.id, email: ADMIN_A.email, created_at: '2026-03-02T00:00:00.000Z' },
    { id: ADMIN_B.id, email: ADMIN_B.email, created_at: '2026-03-03T00:00:00.000Z' },
  ]
  tokens: Array<TokenRow & { token_hash: string }> = []
  failInsertAdmin = false
  calls: string[] = []
  private seq = 0

  async listAdmins() {
    return this.admins.map((a) => ({ ...a }))
  }
  async findAdminByEmail(email: string) {
    return this.admins.find((a) => a.email.toLowerCase() === email.toLowerCase()) ?? null
  }
  async insertAdmin(id: string, email: string) {
    this.calls.push('insertAdmin')
    if (this.failInsertAdmin || this.admins.some((a) => a.id === id)) return false
    this.admins.push({ id, email, created_at: NOW.toISOString() })
    return true
  }
  async revokeAdmin(actorId: string, targetId: string): Promise<RevokeAdminOutcome> {
    this.calls.push('revokeAdmin')
    if (actorId === targetId) return 'self'
    if (!this.admins.some((a) => a.id === targetId)) return 'not_found'
    if (this.admins.length <= 1) return 'last'
    this.admins = this.admins.filter((a) => a.id !== targetId)
    return 'ok'
  }
  async listPendingInvites() {
    return this.tokens.filter((t) => t.kind === 'invite' && !t.used_at && !t.revoked_at).map(strip)
  }
  async insertToken(row: {
    kind: TokenKind
    email: string
    user_id: string | null
    invited_by: string | null
    token_hash: string
    expires_at: string
  }) {
    const live = this.tokens.find((t) => t.kind === row.kind && t.email === row.email && !t.used_at && !t.revoked_at)
    if (live) throw new Error('unique violation: one live token per kind and email')
    const t = { id: `00000000-0000-4000-8000-${String(++this.seq).padStart(12, '0')}`, created_at: NOW.toISOString(), used_at: null, revoked_at: null, ...row }
    this.tokens.push(t)
    return strip(t)
  }
  async revokePending(kind: TokenKind, email: string) {
    for (const t of this.tokens) if (t.kind === kind && t.email === email && !t.used_at && !t.revoked_at) t.revoked_at = NOW.toISOString()
  }
  async revokePendingBy(invitedBy: string) {
    for (const t of this.tokens) if (t.kind === 'invite' && t.invited_by === invitedBy && !t.used_at && !t.revoked_at) t.revoked_at = NOW.toISOString()
  }
  async revokeToken(id: string, kind: TokenKind) {
    const t = this.tokens.find((x) => x.id === id && x.kind === kind && !x.used_at && !x.revoked_at)
    if (!t) return false
    t.revoked_at = NOW.toISOString()
    return true
  }
  async findByHash(hash: string, kind: TokenKind) {
    const t = this.tokens.find((x) => x.token_hash === hash && x.kind === kind)
    return t ? strip(t) : null
  }
  async claimToken(hash: string, kind: TokenKind, nowIso: string) {
    this.calls.push('claimToken')
    const t = this.tokens.find(
      (x) => x.token_hash === hash && x.kind === kind && !x.used_at && !x.revoked_at && new Date(x.expires_at) > new Date(nowIso),
    )
    if (!t) return null
    t.used_at = nowIso // synchrone : deux claims simultanés ne peuvent pas tous deux réussir
    return strip(t)
  }
  async releaseToken(id: string) {
    this.calls.push('releaseToken')
    const t = this.tokens.find((x) => x.id === id)
    if (t) t.used_at = null
  }
}

function strip(t: TokenRow & { token_hash: string }): TokenRow {
  const { token_hash: _unused, ...rest } = t
  void _unused
  return { ...rest }
}

export class FakeAuth implements AccessAuth {
  /** email -> id : le pool d'authentification partagé (inclut des comptes de l'autre application). */
  users = new Map<string, { id: string; password: string }>()
  createCalls: Array<{ email: string; password: string }> = []
  updateCalls: Array<{ id: string; password: string }> = []
  deleted: string[] = []
  failCreate = false
  failUpdate = false
  private seq = 100

  async createUser(email: string, password: string): Promise<CreateUserResult> {
    this.createCalls.push({ email, password })
    if (this.failCreate) return { ok: false, reason: 'error' }
    if (this.users.has(email)) return { ok: false, reason: 'exists' }
    const id = `99999999-9999-4999-8999-${String(++this.seq).padStart(12, '0')}`
    this.users.set(email, { id, password })
    return { ok: true, id }
  }
  async deleteUser(id: string) {
    this.deleted.push(id)
    for (const [email, u] of this.users) if (u.id === id) this.users.delete(email)
  }
  async updatePassword(id: string, password: string) {
    this.updateCalls.push({ id, password })
    if (this.failUpdate) return false
    for (const u of this.users.values()) if (u.id === id) u.password = password
    return true
  }
}

export class FakeMailer implements AccessMailer {
  sent: Array<{ type: 'invite' | 'reset'; to: string; link: string; expiresAt: Date; inviterEmail?: string }> = []
  fail = false
  throws = false
  async sendInvitation(a: { to: string; link: string; expiresAt: Date; inviterEmail: string }) {
    if (this.throws) throw new Error('smtp down')
    if (this.fail) return false
    this.sent.push({ type: 'invite', ...a })
    return true
  }
  async sendReset(a: { to: string; link: string; expiresAt: Date }) {
    if (this.throws) throw new Error('smtp down')
    if (this.fail) return false
    this.sent.push({ type: 'reset', ...a })
    return true
  }
}

export function makeDeps(overrides: Partial<AccessDeps> = {}) {
  const store = new FakeStore()
  const auth = new FakeAuth()
  const mailer = new FakeMailer()
  const reports: string[] = []
  const deps: AccessDeps = {
    store,
    auth,
    mailer,
    now: () => NOW,
    baseUrl: 'https://geckocabanerestaurant.com',
    report: (m) => reports.push(m),
    ...overrides,
  }
  return { deps, store, auth, mailer, reports }
}

/** Extrait le jeton d'un lien envoyé par email. */
export function tokenFromLink(link: string): string {
  // Le jeton est dans le FRAGMENT (#token=…), jamais dans la query string.
  const url = new URL(link)
  if (url.search !== '') throw new Error('le lien ne doit pas porter de query string')
  return new URLSearchParams(url.hash.slice(1)).get('token') ?? ''
}
