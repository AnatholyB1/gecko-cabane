'use client'

import { useCallback, useEffect, useReducer, useState } from 'react'
import { adminFetch, AdminFetchError, isAbortError } from './admin-fetch'

/**
 * useAdminQuery (DSN-05) : chargement d'une route GET `/api/*`.
 *
 * Conception compatible React Compiler :
 * - un seul `useEffect`, qui n'appelle `dispatch` que de façon asynchrone (jamais de setState synchrone) ;
 * - la logique vit dans `startAdminQuery` (fonction pure testable, renvoie l'annulation) ;
 * - l'état affiché est DÉRIVÉ (`deriveQueryView`) : pas de donnée périmée après un changement d'URL.
 */

export type QueryStatus = 'loading' | 'ready' | 'error'

export type QueryState<T> = {
  /** Clé de la requête qui a produit ce résultat (url + tentative). */
  key: string
  url: string
  data: T | null
  error: AdminFetchError | null
}

export type QueryAction<T> =
  | { type: 'success'; key: string; url: string; data: T }
  | { type: 'failure'; key: string; url: string; error: AdminFetchError }

export const initialQueryState = { key: '', url: '', data: null, error: null } as const

export function queryReducer<T>(state: QueryState<T>, action: QueryAction<T>): QueryState<T> {
  if (action.type === 'success') {
    return { key: action.key, url: action.url, data: action.data, error: null }
  }
  // Échec : on garde les données de la même URL (affichage périmé plutôt que vide).
  return { key: action.key, url: action.url, data: state.url === action.url ? state.data : null, error: action.error }
}

export type QueryView<T> = { status: QueryStatus; data: T | null; error: AdminFetchError | null }

/** Vue affichée : « loading » tant que le résultat reçu ne correspond pas à la clé courante. */
export function deriveQueryView<T>(state: QueryState<T>, currentUrl: string, currentKey: string): QueryView<T> {
  const data = state.url === currentUrl ? state.data : null
  if (state.key !== currentKey) return { status: 'loading', data, error: null }
  if (state.error) return { status: 'error', data, error: state.error }
  return { status: 'ready', data, error: null }
}

type Fetcher = <R>(url: string, init?: { signal?: AbortSignal }) => Promise<R>

/**
 * Lance la requête ; renvoie la fonction d'annulation (abandonne le `fetch` et
 * garantit qu'aucune action n'est émise ensuite).
 */
export function startAdminQuery<T>(
  url: string,
  key: string,
  dispatch: (action: QueryAction<T>) => void,
  fetcher: Fetcher = adminFetch,
): () => void {
  const controller = new AbortController()
  fetcher<T>(url, { signal: controller.signal }).then(
    (data) => {
      if (!controller.signal.aborted) dispatch({ type: 'success', key, url, data })
    },
    (e: unknown) => {
      if (controller.signal.aborted || isAbortError(e)) return
      const error = e instanceof AdminFetchError ? e : new AdminFetchError('Erreur inattendue.', 0)
      dispatch({ type: 'failure', key, url, error })
    },
  )
  return () => controller.abort()
}

export type UseAdminQueryResult<T> = QueryView<T> & {
  /** Relance la requête (les données actuelles restent affichées pendant le rechargement). */
  refetch: () => void
}

export function useAdminQuery<T>(url: string): UseAdminQueryResult<T> {
  const [attempt, setAttempt] = useState(0)
  const [state, dispatch] = useReducer(queryReducer<T>, initialQueryState as QueryState<T>)
  const key = `${url}#${attempt}`

  useEffect(() => startAdminQuery<T>(url, key, dispatch), [url, key])

  const refetch = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...deriveQueryView(state, url, key), refetch }
}
