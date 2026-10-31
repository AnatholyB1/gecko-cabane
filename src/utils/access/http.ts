/**
 * Aides HTTP du module « Accès » : contrôle d'origine, lecture JSON bornée, limitation de débit,
 * correspondance code de service -> statut HTTP + message français.
 * Réponses d'erreur : toujours `{ error: string }`, jamais de trace ni de message brut de Supabase.
 */

import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { hashKey, getClientIp, type HashKind } from '@/utils/rate-limit'

export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

/**
 * Enveloppe d'un handler : toute exception (clé de service absente, base injoignable) devient un
 * 500 générique `{ error }`, signalé à Sentry, sans détail interne dans la réponse.
 */
export async function guarded(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run()
  } catch (e) {
    Sentry.captureException(e)
    return errorResponse("Une erreur est survenue. Rien n'a été modifié.", 500)
  }
}

/**
 * Refus des requêtes inter-sites (CSRF) sur les mutations : si le navigateur envoie `Origin`
 * ou `Sec-Fetch-Site`, ils doivent désigner la même origine. Les appels sans ces en-têtes
 * (curl, tests) passent : ils n'ont pas de cookie de session volé à rejouer.
 */
export function isSameOrigin(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return false
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      return new URL(origin).origin === new URL(request.url).origin
    } catch {
      return false
    }
  }
  return true
}

const MAX_BODY_BYTES = 4096

/** Corps JSON objet de moins de 4 Ko, `Content-Type: application/json` obligatoire ; sinon null. */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  const type = request.headers.get('content-type') ?? ''
  if (!/^application\/json\b/i.test(type)) return null
  try {
    const text = await request.text()
    if (text.length === 0 || text.length > MAX_BODY_BYTES) return null
    const parsed: unknown = JSON.parse(text)
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export type Bucket = { kind: HashKind; value: string | null; limit: number; windowSeconds: number }

/** Plafond global quand l'identité n'est pas connue ou que RATE_LIMIT_SECRET manque (échec fermé). */
export const ACCESS_GLOBAL_BUCKET = { key: 'acc:global', limit: 30, windowSeconds: 3600 } as const

/**
 * Vrai si UN des seuils est dépassé. Les clés sont des HMAC (jamais d'IP ni d'email en clair).
 * Panne du limiteur (RPC en erreur) : on laisse passer et on le signale, comme les autres routes.
 */
export async function isRateLimited(admin: SupabaseClient, buckets: Bucket[]): Promise<boolean> {
  const secret = process.env.RATE_LIMIT_SECRET
  const byKey = new Map<string, { key: string; limit: number; windowSeconds: number }>()
  for (const b of buckets) {
    const h =
      !secret || !b.value
        ? ACCESS_GLOBAL_BUCKET
        : { key: hashKey(b.kind, b.value, secret), limit: b.limit, windowSeconds: b.windowSeconds }
    byKey.set(h.key, h) // une identité inconnue ne compte qu'une fois sur le plafond global
  }
  const hits = [...byKey.values()]
  if (!secret) Sentry.captureMessage('RATE_LIMIT_SECRET is not set: access uses the global bucket', 'error')
  let limited = false
  for (const h of hits) {
    try {
      const { data, error } = await admin.rpc('gecko_rate_limit_hit', {
        p_key: h.key,
        p_limit: h.limit,
        p_window_seconds: h.windowSeconds,
      })
      if (error) {
        Sentry.captureException(error)
        continue
      }
      if (data === false) limited = true
    } catch (e) {
      Sentry.captureException(e)
    }
  }
  return limited
}

export function clientIp(request: Request): string | null {
  return getClientIp(request.headers)
}

// Messages de refus (français), indexés par code de service. Jamais de détail interne.
export const INVITE_ERRORS = {
  invalid_email: { status: 400, message: "Adresse email invalide : vérifiez qu'elle contient un « @ » et un domaine." },
  already_admin: { status: 409, message: 'Cette personne est déjà administrateur.' },
  send_failed: {
    status: 502,
    message: "L'invitation n'a pas pu être envoyée. Aucun email n'est parti. Réessayez dans un instant ; si cela persiste, contactez l'équipe technique.",
  },
  error: { status: 500, message: "Une erreur est survenue. Rien n'a été modifié." },
} as const

export const REVOKE_ERRORS = {
  invalid_id: { status: 400, message: 'Identifiant invalide.' },
  self: { status: 409, message: 'Vous ne pouvez pas retirer votre propre accès.' },
  last: { status: 409, message: 'Impossible de retirer le dernier administrateur.' },
  not_found: { status: 404, message: 'Élément introuvable.' },
  error: { status: 500, message: "Une erreur est survenue. Rien n'a été modifié." },
} as const

export const INVALID_LINK_MESSAGE = "Ce lien n'est plus valable : l'invitation a expiré ou a déjà été utilisée."
