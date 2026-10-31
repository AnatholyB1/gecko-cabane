/**
 * adminFetch : appel JSON vers les routes `/api/*` (DSN-05).
 *
 * - Succès : renvoie le corps JSON (les routes renvoient `{ data }`, ou `{ success }` etc. :
 *   le typage `T` est celui du corps entier).
 * - Échec HTTP : lève `AdminFetchError` avec `status` et le message de `{ error: string }`.
 * - Réseau coupé : `AdminFetchError` de statut 0.
 * - Annulation (AbortSignal) : l'`AbortError` d'origine est relancée telle quelle ;
 *   testez-la avec `isAbortError()`.
 */

export class AdminFetchError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'AdminFetchError'
    this.status = status
  }
}

export function isAbortError(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { name?: unknown }).name === 'AbortError'
}

export type AdminFetchInit = Omit<RequestInit, 'body'> & {
  /** Corps JSON : sérialisé, avec l'en-tête `Content-Type` adéquat. */
  json?: unknown
  body?: BodyInit | null
}

function messageForStatus(status: number): string {
  if (status === 401) return 'Session expirée. Reconnectez-vous.'
  if (status === 403) return "Accès refusé pour ce compte."
  if (status === 404) return 'Élément introuvable.'
  if (status === 429) return 'Trop de requêtes. Patientez un instant.'
  if (status >= 500) return 'Le serveur a rencontré un problème. Réessayez dans un instant.'
  return 'Requête refusée.'
}

export async function adminFetch<T = unknown>(input: string, init: AdminFetchInit = {}): Promise<T> {
  const { json, headers, ...rest } = init
  const h = new Headers(headers)
  if (!h.has('Accept')) h.set('Accept', 'application/json')
  let body = rest.body
  if (json !== undefined) {
    h.set('Content-Type', 'application/json')
    body = JSON.stringify(json)
  }

  let res: Response
  try {
    res = await fetch(input, { ...rest, headers: h, body })
  } catch (e) {
    if (isAbortError(e)) throw e
    throw new AdminFetchError('Connexion perdue.', 0)
  }

  if (!res.ok) {
    let message: string | null = null
    try {
      const err = (await res.json()) as { error?: unknown }
      if (typeof err.error === 'string' && err.error.trim()) message = err.error
    } catch {
      // corps absent ou non JSON : message par défaut
    }
    throw new AdminFetchError(message ?? messageForStatus(res.status), res.status)
  }

  if (res.status === 204) return undefined as T
  try {
    return (await res.json()) as T
  } catch (e) {
    if (isAbortError(e)) throw e
    throw new AdminFetchError('Réponse illisible du serveur.', res.status)
  }
}

/** Titre + phrase pour ErrorState, à partir d'une erreur de chargement. */
export function describeError(error: unknown): { title: string; description: string } {
  if (error instanceof AdminFetchError) {
    if (error.status === 0) {
      return { title: 'Connexion perdue', description: 'Vérifiez la connexion, puis réessayez. Rien n’a été modifié.' }
    }
    if (error.status === 401 || error.status === 403) {
      return { title: 'Accès impossible', description: error.message }
    }
    return { title: 'Impossible de charger la liste', description: `${error.message} Rien n’a été modifié.` }
  }
  return { title: 'Impossible de charger la liste', description: 'Vérifiez la connexion, puis réessayez. Rien n’a été modifié.' }
}
