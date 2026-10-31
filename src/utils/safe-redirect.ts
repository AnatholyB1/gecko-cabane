/**
 * Redirections internes uniquement (anti open-redirect), fonctions pures.
 * Utilisées après connexion admin (`redirect`) et au retour OAuth (`next`).
 */

const CONTROL_OR_SPACE = /[\x00-\x20\x7f]/

/** Chemin interne : un seul `/` en tête, ni `\`, ni `@`, ni caractère de contrôle, y compris une fois décodé. */
export function isSafeInternalPath(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return false
  if (value[0] !== '/' || value[1] === '/') return false
  const candidates = [value]
  try {
    candidates.push(decodeURIComponent(value))
  } catch {
    return false
  }
  return candidates.every((c) => !c.includes('\\') &&!c.includes('@') && !CONTROL_OR_SPACE.test(c) && !c.startsWith('//') && !/^\/[^/?#]*:\/\//.test(c))
}

/** Cible de connexion admin : `/admin` ou `/admin/...` (aussi `?` et `#`), sinon `/admin`. */
export function safeAdminRedirect(value: unknown): string {
  if (!isSafeInternalPath(value)) return '/admin'
  if (value === '/admin') return value
  return /^\/admin([/?#]|$)/.test(value) ? value : '/admin'
}

/** Paramètre `next` du callback d'authentification : chemin interne, sinon `/admin`. */
export function safeNextPath(value: unknown): string {
  return isSafeInternalPath(value) ? value : '/admin'
}
