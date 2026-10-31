/**
 * Jetons d'accès (invitation d'un administrateur, réinitialisation du mot de passe).
 *
 * Le jeton envoyé par email est 32 octets aléatoires (256 bits, base64url). Seule son
 * empreinte SHA-256 est stockée : une lecture de la base ne permet pas de rejouer un lien.
 * Fonctions pures (sauf `generateToken`, qui lit le générateur aléatoire du système).
 */

import { createHash, randomBytes } from 'node:crypto'

export type TokenKind = 'invite' | 'reset'

/** Invitation : 7 jours (décision du propriétaire, 2026-10-31). */
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000
/** Réinitialisation de mot de passe : 1 heure. */
export const RESET_TTL_MS = 60 * 60 * 1000

export const TOKEN_TTL_MS: Record<TokenKind, number> = { invite: INVITE_TTL_MS, reset: RESET_TTL_MS }

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/

export function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

/** Forme attendue d'un jeton (43 caractères base64url) : tout autre texte est rejeté avant la base. */
export function isWellFormedToken(value: unknown): value is string {
  return typeof value === 'string' && TOKEN_RE.test(value)
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function expiryFor(kind: TokenKind, now: Date): Date {
  return new Date(now.getTime() + TOKEN_TTL_MS[kind])
}

export type TokenStatus = 'pending' | 'expired' | 'used' | 'revoked'

export function tokenStatus(
  row: { expires_at: string; used_at: string | null; revoked_at: string | null },
  now: Date,
): TokenStatus {
  if (row.used_at) return 'used'
  if (row.revoked_at) return 'revoked'
  return new Date(row.expires_at).getTime() > now.getTime() ? 'pending' : 'expired'
}
