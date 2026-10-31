/**
 * Masquage des jetons d'accès avant l'envoi à Sentry (`sendDefaultPii: true` enregistre les URL).
 * Les liens d'invitation et de réinitialisation portent le jeton dans le FRAGMENT (`#token=`, jamais
 * envoyé au serveur) ; ce filtre est la seconde barrière : tout `token=…` restant dans une URL, une
 * query string, un nom de transaction, une étiquette, un fil d'Ariane ou un span devient
 * `token=[Filtered]`. Sans dépendance : utilisable côté navigateur, Node et edge.
 */

export const FILTERED = '[Filtered]'

// `token=` précédé de ? & # ; ou de rien (query_string seule), valeur jusqu'au séparateur suivant.
const TOKEN_PARAM = /((?:^|[?&#;\s"'])token=)[^&#\s"';]*/gi

export function scrubString(value: string): string {
  return value.includes('oken') ? value.replace(TOKEN_PARAM, `$1${FILTERED}`) : value
}

const MAX_DEPTH = 12

/** Copie profonde de l'objet avec les chaînes masquées ; une clé `token` voit sa valeur remplacée. */
export function scrubDeep<T>(input: T, depth = 0): T {
  if (typeof input === 'string') return scrubString(input) as unknown as T
  if (input === null || typeof input !== 'object' || depth > MAX_DEPTH) return input
  if (Array.isArray(input)) return input.map((v) => scrubDeep(v, depth + 1)) as unknown as T
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    out[k] = k.toLowerCase() === 'token' && typeof v === 'string' ? FILTERED : scrubDeep(v, depth + 1)
  }
  return out as T
}

/** À passer à `beforeSend`, `beforeSendTransaction` et `beforeBreadcrumb`. */
export function scrubEvent<T>(event: T): T {
  return scrubDeep(event)
}
