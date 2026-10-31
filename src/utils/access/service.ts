/**
 * Logique métier du module « Accès » (ACC-02) : inviter, accepter, révoquer, réinitialiser.
 *
 * Aucun appel réseau ici : tout passe par `AccessDeps` (base, Supabase Auth admin, Resend).
 * Les tests injectent des doubles ; la production injecte `createAccessDeps()` (deps.ts).
 *
 * Règles de sécurité (voir 17b-ACC02-DESIGN.md) :
 *  - l'appartenance admin n'existe que par une ligne `gecko_admins` insérée ICI, côté serveur ;
 *  - jeton aléatoire 256 bits, empreinte seule stockée, usage unique par « claim » atomique ;
 *  - jeton inconnu, expiré, déjà utilisé, révoqué ou mal formé : une seule réponse (`invalid`) ;
 *  - la réinitialisation ne concerne QUE les comptes présents dans `gecko_admins` : jamais ceux
 *    de l'autre application qui partage le pool d'authentification ;
 *  - la demande de réinitialisation ne révèle jamais si l'email existe.
 */

import {
  expiryFor,
  generateToken,
  hashToken,
  isWellFormedToken,
  tokenStatus,
  type TokenKind,
} from './tokens'
import { isUuid, isValidEmail, normalizeEmail, validatePassword } from './validation'

export type AdminRow = { id: string; email: string; created_at: string }

export type TokenRow = {
  id: string
  kind: TokenKind
  email: string
  user_id: string | null
  invited_by: string | null
  created_at: string
  expires_at: string
  used_at: string | null
  revoked_at: string | null
}

export type RevokeAdminOutcome = 'ok' | 'self' | 'last' | 'not_found'

export interface AccessStore {
  listAdmins(): Promise<AdminRow[]>
  findAdminByEmail(email: string): Promise<AdminRow | null>
  /** Insère la ligne gecko_admins. Faux si elle existe déjà ou si l'insertion échoue. */
  insertAdmin(id: string, email: string): Promise<boolean>
  /** Retrait atomique (RPC à verrou) : refuse soi-même et le dernier administrateur. */
  revokeAdmin(actorId: string, targetId: string): Promise<RevokeAdminOutcome>
  /** Invitations non utilisées et non révoquées (y compris expirées). */
  listPendingInvites(): Promise<TokenRow[]>
  insertToken(row: {
    kind: TokenKind
    email: string
    user_id: string | null
    invited_by: string | null
    token_hash: string
    expires_at: string
  }): Promise<TokenRow | null>
  /** Révoque les jetons en attente du même type et de la même adresse. */
  revokePending(kind: TokenKind, email: string): Promise<void>
  /** Révoque les invitations en attente envoyées par cet administrateur (retiré). */
  revokePendingBy(invitedBy: string): Promise<void>
  /** Révoque un jeton en attente ; faux s'il n'existe pas ou n'est plus en attente. */
  revokeToken(id: string, kind: TokenKind): Promise<boolean>
  /** Lecture seule (aperçu de la page d'acceptation) : ne consomme rien. */
  findByHash(hash: string, kind: TokenKind): Promise<TokenRow | null>
  /** Consommation ATOMIQUE : renvoie la ligne seulement si elle était valide et la marque utilisée. */
  claimToken(hash: string, kind: TokenKind, nowIso: string): Promise<TokenRow | null>
  /** Annule une consommation (échec après le claim : le jeton redevient utilisable). */
  releaseToken(id: string): Promise<void>
}

export type CreateUserResult = { ok: true; id: string } | { ok: false; reason: 'exists' | 'error' }

export interface AccessAuth {
  /** Crée un compte confirmé SANS envoyer d'email. `exists` si l'adresse a déjà un compte. */
  createUser(email: string, password: string): Promise<CreateUserResult>
  deleteUser(id: string): Promise<void>
  updatePassword(id: string, password: string): Promise<boolean>
}

export interface AccessMailer {
  sendInvitation(args: { to: string; link: string; expiresAt: Date; inviterEmail: string }): Promise<boolean>
  sendReset(args: { to: string; link: string; expiresAt: Date }): Promise<boolean>
}

export interface AccessDeps {
  store: AccessStore
  auth: AccessAuth
  mailer: AccessMailer
  now: () => Date
  /** Base des liens envoyés par email. Jamais déduite d'un en-tête de la requête (Host injection). */
  baseUrl: string
  /** Rapport d'incident sans PII (Sentry). */
  report?: (message: string, error?: unknown) => void
  /** Injection pour les tests ; défaut = aléatoire cryptographique. */
  newToken?: () => string
}

const newToken = (deps: AccessDeps) => (deps.newToken ?? generateToken)()

export function inviteLink(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/admin/invitation#token=${token}`
}
export function resetLink(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/admin/reinitialiser#token=${token}`
}

// ---------------------------------------------------------------------------
// Liste
// ---------------------------------------------------------------------------

export type AccessList = {
  admins: { id: string; email: string; since: string; isSelf: boolean }[]
  invitations: { id: string; email: string; sentAt: string; expiresAt: string; status: 'pending' | 'expired' }[]
}

export async function listAccess(deps: AccessDeps, actorId: string): Promise<AccessList> {
  const [admins, invites] = await Promise.all([deps.store.listAdmins(), deps.store.listPendingInvites()])
  const now = deps.now()
  return {
    admins: admins
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((a) => ({ id: a.id, email: a.email, since: a.created_at, isSelf: a.id === actorId })),
    invitations: invites
      .map((t) => ({
        id: t.id,
        email: t.email,
        sentAt: t.created_at,
        expiresAt: t.expires_at,
        status: tokenStatus(t, now) === 'pending' ? ('pending' as const) : ('expired' as const),
      }))
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
  }
}

// ---------------------------------------------------------------------------
// Invitation
// ---------------------------------------------------------------------------

export type InviteResult =
  | { ok: true; email: string; expiresAt: string }
  | { ok: false; code: 'invalid_email' | 'already_admin' | 'send_failed' | 'error' }

export async function inviteAdmin(
  deps: AccessDeps,
  args: { actor: { id: string; email: string }; email: unknown },
): Promise<InviteResult> {
  const email = normalizeEmail(args.email)
  if (!isValidEmail(email)) return { ok: false, code: 'invalid_email' }

  try {
    if (await deps.store.findAdminByEmail(email)) return { ok: false, code: 'already_admin' }

    // Une seule invitation en attente par adresse : l'envoi remplace la précédente (« Renvoyer »).
    await deps.store.revokePending('invite', email)

    const token = newToken(deps)
    const expires = expiryFor('invite', deps.now())
    const row = await deps.store.insertToken({
      kind: 'invite',
      email,
      user_id: null,
      invited_by: args.actor.id,
      token_hash: hashToken(token),
      expires_at: expires.toISOString(),
    })
    if (!row) return { ok: false, code: 'error' }

    const sent = await deps.mailer.sendInvitation({
      to: email,
      link: inviteLink(deps.baseUrl, token),
      expiresAt: expires,
      inviterEmail: args.actor.email,
    })
    if (!sent) {
      // Aucun email parti : l'invitation ne reste pas en attente (aucun lien orphelin valable).
      await deps.store.revokeToken(row.id, 'invite')
      return { ok: false, code: 'send_failed' }
    }
    return { ok: true, email, expiresAt: expires.toISOString() }
  } catch (e) {
    deps.report?.('access.invite failed', e)
    return { ok: false, code: 'error' }
  }
}

// ---------------------------------------------------------------------------
// Retraits
// ---------------------------------------------------------------------------

export type RevokeResult = { ok: true } | { ok: false; code: 'invalid_id' | 'self' | 'last' | 'not_found' | 'error' }

export async function revokeAdmin(deps: AccessDeps, args: { actorId: string; targetId: unknown }): Promise<RevokeResult> {
  if (!isUuid(args.targetId)) return { ok: false, code: 'invalid_id' }
  // Garde applicative AVANT la base (la fonction SQL refuse aussi : défense en profondeur).
  if (args.targetId.toLowerCase() === args.actorId.toLowerCase()) return { ok: false, code: 'self' }
  try {
    const outcome = await deps.store.revokeAdmin(args.actorId, args.targetId)
    if (outcome !== 'ok') return { ok: false, code: outcome }
    // Un administrateur retiré ne laisse pas d'invitations valables derrière lui.
    await deps.store.revokePendingBy(args.targetId)
    return { ok: true }
  } catch (e) {
    deps.report?.('access.revokeAdmin failed', e)
    return { ok: false, code: 'error' }
  }
}

export async function revokeInvitation(deps: AccessDeps, args: { id: unknown }): Promise<RevokeResult> {
  if (!isUuid(args.id)) return { ok: false, code: 'invalid_id' }
  try {
    return (await deps.store.revokeToken(args.id, 'invite')) ? { ok: true } : { ok: false, code: 'not_found' }
  } catch (e) {
    deps.report?.('access.revokeInvitation failed', e)
    return { ok: false, code: 'error' }
  }
}

// ---------------------------------------------------------------------------
// Aperçu (page publique ; ne consomme jamais le jeton)
// ---------------------------------------------------------------------------

export type PeekResult = { valid: true; email: string } | { valid: false }

export async function peekToken(deps: AccessDeps, kind: TokenKind, token: unknown): Promise<PeekResult> {
  if (!isWellFormedToken(token)) return { valid: false }
  try {
    const row = await deps.store.findByHash(hashToken(token), kind)
    if (!row || tokenStatus(row, deps.now()) !== 'pending') return { valid: false }
    return { valid: true, email: row.email }
  } catch (e) {
    deps.report?.('access.peek failed', e)
    return { valid: false }
  }
}

// ---------------------------------------------------------------------------
// Acceptation d'une invitation
// ---------------------------------------------------------------------------

export type AcceptResult =
  | { ok: true; email: string }
  | { ok: false; code: 'invalid' | 'weak' | 'account_exists' | 'error'; message?: string }

export async function acceptInvitation(
  deps: AccessDeps,
  args: { token: unknown; password: unknown; confirm?: unknown },
): Promise<AcceptResult> {
  const weak = validatePassword(args.password, args.confirm)
  if (weak) return { ok: false, code: 'weak', message: weak }
  if (!isWellFormedToken(args.token)) return { ok: false, code: 'invalid' }
  const password = args.password as string

  let claimed: TokenRow | null
  try {
    claimed = await deps.store.claimToken(hashToken(args.token), 'invite', deps.now().toISOString())
  } catch (e) {
    deps.report?.('access.accept claim failed', e)
    return { ok: false, code: 'error' }
  }
  if (!claimed) return { ok: false, code: 'invalid' }

  try {
    const created = await deps.auth.createUser(claimed.email, password)
    if (!created.ok) {
      if (created.reason === 'exists') {
        // L'adresse a déjà un compte du pool partagé : on n'y touche JAMAIS (mot de passe de l'autre
        // application) et on ne lui accorde aucun droit. Le jeton reste consommé ; l'équipe technique
        // associe le compte à la main (17b-ACC02-DESIGN.md §6).
        return { ok: false, code: 'account_exists' }
      }
      await deps.store.releaseToken(claimed.id)
      return { ok: false, code: 'error' }
    }
    const inserted = await deps.store.insertAdmin(created.id, claimed.email)
    if (!inserted) {
      await deps.auth.deleteUser(created.id) // pas de compte orphelin
      await deps.store.releaseToken(claimed.id)
      return { ok: false, code: 'error' }
    }
    return { ok: true, email: claimed.email }
  } catch (e) {
    deps.report?.('access.accept failed', e)
    try {
      await deps.store.releaseToken(claimed.id)
    } catch {
      // le jeton reste consommé : l'administrateur renverra une invitation
    }
    return { ok: false, code: 'error' }
  }
}

// ---------------------------------------------------------------------------
// Mot de passe oublié
// ---------------------------------------------------------------------------

/**
 * Ne renvoie rien et ne lève jamais : l'appelant répond toujours la même chose, que l'adresse
 * existe ou non. Seuls les comptes présents dans `gecko_admins` reçoivent un lien.
 */
export async function requestPasswordReset(deps: AccessDeps, args: { email: unknown }): Promise<void> {
  const email = normalizeEmail(args.email)
  if (!isValidEmail(email)) return
  try {
    const admin = await deps.store.findAdminByEmail(email)
    if (!admin) return
    await deps.store.revokePending('reset', email)
    const token = newToken(deps)
    const expires = expiryFor('reset', deps.now())
    const row = await deps.store.insertToken({
      kind: 'reset',
      email,
      user_id: admin.id,
      invited_by: null,
      token_hash: hashToken(token),
      expires_at: expires.toISOString(),
    })
    if (!row) return
    const sent = await deps.mailer.sendReset({ to: email, link: resetLink(deps.baseUrl, token), expiresAt: expires })
    if (!sent) await deps.store.revokeToken(row.id, 'reset')
  } catch (e) {
    deps.report?.('access.forgot failed', e)
  }
}

export type ResetResult = { ok: true } | { ok: false; code: 'invalid' | 'weak' | 'error'; message?: string }

export async function resetPassword(
  deps: AccessDeps,
  args: { token: unknown; password: unknown; confirm?: unknown },
): Promise<ResetResult> {
  const weak = validatePassword(args.password, args.confirm)
  if (weak) return { ok: false, code: 'weak', message: weak }
  if (!isWellFormedToken(args.token)) return { ok: false, code: 'invalid' }

  let claimed: TokenRow | null
  try {
    claimed = await deps.store.claimToken(hashToken(args.token), 'reset', deps.now().toISOString())
  } catch (e) {
    deps.report?.('access.reset claim failed', e)
    return { ok: false, code: 'error' }
  }
  if (!claimed || !claimed.user_id) return { ok: false, code: 'invalid' }

  try {
    // Le compte doit être toujours administrateur au moment du changement (retiré entre-temps : refus).
    const admin = await deps.store.findAdminByEmail(claimed.email)
    if (!admin || admin.id !== claimed.user_id) return { ok: false, code: 'invalid' }
    const updated = await deps.auth.updatePassword(claimed.user_id, args.password as string)
    if (!updated) {
      await deps.store.releaseToken(claimed.id)
      return { ok: false, code: 'error' }
    }
    return { ok: true }
  } catch (e) {
    deps.report?.('access.reset failed', e)
    try {
      await deps.store.releaseToken(claimed.id)
    } catch {
      // le lien redemandé suffira
    }
    return { ok: false, code: 'error' }
  }
}
