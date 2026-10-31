'use client'

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
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
  /**
   * Relance la requête (les données actuelles restent affichées pendant le rechargement).
   * La promesse ne rejette jamais : `true` quand les données rechargées sont arrivées, `false` si
   * le rechargement a échoué (ou si le composant est démonté avant la réponse).
   */
  refetch: () => Promise<boolean>
}

/** Numéro de tentative d'une clé `url#N` (NaN si la clé n'en porte pas). */
export function attemptOfKey(key: string): number {
  const i = key.lastIndexOf('#')
  return i < 0 ? NaN : Number(key.slice(i + 1))
}

export function useAdminQuery<T>(url: string): UseAdminQueryResult<T> {
  const [attempt, setAttempt] = useState(0)
  const [state, dispatch] = useReducer(queryReducer<T>, initialQueryState as QueryState<T>)
  const key = `${url}#${attempt}`
  const attemptRef = useRef(0)
  const waiters = useRef<{ attempt: number; resolve: (ok: boolean) => void }[]>([])

  useEffect(() => startAdminQuery<T>(url, key, dispatch), [url, key])

  // Une réponse (succès ou échec) de la tentative N règle toutes les promesses de `refetch` <= N.
  useEffect(() => {
    const done = attemptOfKey(state.key)
    if (Number.isNaN(done)) return
    const ok = state.error === null
    waiters.current = waiters.current.filter((w) => {
      if (w.attempt > done) return true
      w.resolve(ok)
      return false
    })
  }, [state])
  useEffect(
    () => () => {
      waiters.current.forEach((w) => w.resolve(false))
      waiters.current = []
    },
    [],
  )

  const refetch = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        const next = attemptRef.current + 1
        attemptRef.current = next
        waiters.current.push({ attempt: next, resolve })
        setAttempt(next)
      }),
    [],
  )
  return { ...deriveQueryView(state, url, key), refetch }
}
