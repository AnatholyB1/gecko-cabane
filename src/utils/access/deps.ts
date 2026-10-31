/**
 * Implémentation de production des dépendances du module « Accès » : base (service role),
 * Supabase Auth admin et Resend. SERVEUR UNIQUEMENT : ne jamais importer depuis un composant client.
 *
 * Toute la logique vit dans service.ts (testée avec des doubles) ; ce fichier ne contient que
 * des appels fins aux services externes. Aucun test n'appelle ce fichier avec de vrais services.
 */

import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/utils/supabase/server'
import { getResendClient, RESEND_FROM_EMAIL } from '@/utils/resend'
import { SITE_URL } from '@/utils/seo'
import { invitationEmail, resetEmail } from './email'
import type { AccessAuth, AccessDeps, AccessMailer, AccessStore, AdminRow, TokenRow } from './service'
import type { TokenKind } from './tokens'

const TOKENS = 'gecko_access_tokens'
const TOKEN_COLUMNS = 'id, kind, email, user_id, invited_by, created_at, expires_at, used_at, revoked_at'

/**
 * Base des liens envoyés par email. `ACCESS_LINK_BASE_URL` (https, ou http://localhost) pour une
 * préversion ; sinon le domaine public. Jamais l'en-tête Host de la requête (injection d'hôte).
 */
export function accessBaseUrl(env: Record<string, string | undefined> = process.env): string {
  const raw = env.ACCESS_LINK_BASE_URL?.trim()
  if (raw) {
    try {
      const u = new URL(raw)
      if (u.protocol === 'https:' || (u.protocol === 'http:' && u.hostname === 'localhost')) return u.origin
    } catch {
      // valeur invalide : on retombe sur le domaine public
    }
  }
  return SITE_URL
}

export function createAccessStore(admin: SupabaseClient): AccessStore {
  return {
    async listAdmins() {
      const { data, error } = await admin.from('gecko_admins').select('id, email, created_at')
      if (error) throw error
      return (data ?? []) as AdminRow[]
    },
    async findAdminByEmail(email) {
      // ilike (sans casse) : % et _ sont des jokers, on les échappe pour une égalité exacte.
      const pattern = email.replace(/[\\%_]/g, (c) => `\\${c}`)
      const { data, error } = await admin.from('gecko_admins').select('id, email, created_at').ilike('email', pattern).limit(1)
      if (error) throw error
      const row = (data ?? [])[0] as AdminRow | undefined
      return row && row.email.toLowerCase() === email.toLowerCase() ? row : null
    },
    async insertAdmin(id, email) {
      const { error } = await admin.from('gecko_admins').insert({ id, email })
      return !error
    },
    async revokeAdmin(actorId, targetId) {
      const { data, error } = await admin.rpc('gecko_revoke_admin', { p_actor: actorId, p_target: targetId })
      if (error) throw error
      return data === 'ok' || data === 'self' || data === 'last' || data === 'not_found' ? data : 'not_found'
    },
    async listPendingInvites() {
      const { data, error } = await admin
        .from(TOKENS)
        .select(TOKEN_COLUMNS)
        .eq('kind', 'invite')
        .is('used_at', null)
        .is('revoked_at', null)
      if (error) throw error
      return (data ?? []) as TokenRow[]
    },
    async insertToken(row) {
      const { data, error } = await admin.from(TOKENS).insert(row).select(TOKEN_COLUMNS).single()
      if (error) throw error
      return data as TokenRow
    },
    async revokePending(kind: TokenKind, email) {
      const { error } = await admin
        .from(TOKENS)
        .update({ revoked_at: new Date().toISOString() })
        .eq('kind', kind)
        .eq('email', email)
        .is('used_at', null)
        .is('revoked_at', null)
      if (error) throw error
    },
    async revokePendingBy(invitedBy) {
      const { error } = await admin
        .from(TOKENS)
        .update({ revoked_at: new Date().toISOString() })
        .eq('kind', 'invite')
        .eq('invited_by', invitedBy)
        .is('used_at', null)
        .is('revoked_at', null)
      if (error) throw error
    },
    async revokeToken(id, kind) {
      const { data, error } = await admin
        .from(TOKENS)
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', id)
        .eq('kind', kind)
        .is('used_at', null)
        .is('revoked_at', null)
        .select('id')
      if (error) throw error
      return (data ?? []).length > 0
    },
    async findByHash(hash, kind) {
      const { data, error } = await admin.from(TOKENS).select(TOKEN_COLUMNS).eq('token_hash', hash).eq('kind', kind).maybeSingle()
      if (error) throw error
      return (data as TokenRow | null) ?? null
    },
    async claimToken(hash, kind, nowIso) {
      // UPDATE conditionnel : une seule requête concurrente obtient la ligne (usage unique).
      const { data, error } = await admin
        .from(TOKENS)
        .update({ used_at: nowIso })
        .eq('token_hash', hash)
        .eq('kind', kind)
        .is('used_at', null)
        .is('revoked_at', null)
        .gt('expires_at', nowIso)
        .select(TOKEN_COLUMNS)
        .maybeSingle()
      if (error) throw error
      return (data as TokenRow | null) ?? null
    },
    async releaseToken(id) {
      const { error } = await admin.from(TOKENS).update({ used_at: null }).eq('id', id)
      if (error) throw error
    },
  }
}

export function createAccessAuth(admin: SupabaseClient): AccessAuth {
  return {
    async createUser(email, password) {
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
      if (error || !data.user) {
        const code = (error as { code?: string } | null)?.code
        const msg = error?.message?.toLowerCase() ?? ''
        if (code === 'email_exists' || code === 'user_already_exists' || msg.includes('already been registered')) {
          return { ok: false, reason: 'exists' }
        }
        return { ok: false, reason: 'error' }
      }
      return { ok: true, id: data.user.id }
    },
    async deleteUser(id) {
      await admin.auth.admin.deleteUser(id)
    },
    async updatePassword(id, password) {
      const { error } = await admin.auth.admin.updateUserById(id, { password })
      return !error
    },
  }
}

export function createAccessMailer(): AccessMailer {
  async function send(to: string, mail: { subject: string; html: string; text: string }): Promise<boolean> {
    const resend = getResendClient()
    if (!resend) return false
    try {
      const { error } = await resend.emails.send({ from: RESEND_FROM_EMAIL, to, subject: mail.subject, html: mail.html, text: mail.text })
      return !error
    } catch (e) {
      Sentry.captureException(e)
      return false
    }
  }
  return {
    sendInvitation: ({ to, link, expiresAt, inviterEmail }) => send(to, invitationEmail({ link, expiresAt, inviterEmail })),
    sendReset: ({ to, link, expiresAt }) => send(to, resetEmail({ link, expiresAt })),
  }
}

/** Dépendances de production (service role côté serveur uniquement). */
export function createAccessDeps(): AccessDeps {
  const admin = createAdminClient()
  return {
    store: createAccessStore(admin),
    auth: createAccessAuth(admin),
    mailer: createAccessMailer(),
    now: () => new Date(),
    baseUrl: accessBaseUrl(),
    report: (message, error) => {
      // Aucune donnée personnelle : le message est une constante, l'erreur vient de Supabase/Resend.
      if (error) Sentry.captureException(error, { tags: { area: 'access' }, extra: { message } })
      else Sentry.captureMessage(message, 'error')
    },
  }
}
