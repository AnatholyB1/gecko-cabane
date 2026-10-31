/**
 * Validation des entrées du module « Accès » (email, mot de passe, identifiants).
 * Fonctions pures, partagées par le serveur et par les formulaires.
 */

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/

/** Minuscules, espaces retirés. Les comparaisons d'email se font toujours sur cette forme. */
export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function isValidEmail(value: string): boolean {
  return value.length >= 6 && value.length <= 254 && EMAIL_RE.test(value) && !value.includes('..')
}

export const PASSWORD_MIN = 12
export const PASSWORD_MAX = 72 // limite bcrypt de Supabase Auth, en OCTETS (UTF-8), pas en caractères

/** Longueur UTF-8 en octets : c'est elle que borne bcrypt. */
export function passwordBytes(password: string): number {
  return new TextEncoder().encode(password).length
}

export type PasswordRule = { id: 'length' | 'mix' | 'same'; label: string; ok: boolean }

/** Critères visibles sur l'écran : 12 caractères, une lettre et un chiffre, saisies identiques. */
export function passwordRules(password: string, confirm: string): PasswordRule[] {
  return [
    { id: 'length', label: `${PASSWORD_MIN} caractères minimum`, ok: password.length >= PASSWORD_MIN },
    { id: 'mix', label: 'Une lettre et un chiffre', ok: /\p{L}/u.test(password) && /\d/.test(password) },
    { id: 'same', label: 'Les deux saisies sont identiques', ok: password.length > 0 && password === confirm },
  ]
}

/** Message d'erreur (français) ou null. `confirm` absent côté API : seule la force est vérifiée. */
export function validatePassword(password: unknown, confirm?: unknown): string | null {
  if (typeof password !== 'string') return 'Mot de passe manquant.'
  if (password.length < PASSWORD_MIN) return `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`
  if (passwordBytes(password) > PASSWORD_MAX) {
    return `Le mot de passe est trop long (${PASSWORD_MAX} octets au maximum : moins de ${PASSWORD_MAX} caractères si certains sont accentués).`
  }
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) return 'Le mot de passe doit contenir au moins une lettre et un chiffre.'
  if (confirm !== undefined && confirm !== password) return 'Les deux saisies ne sont pas identiques.'
  return null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}
