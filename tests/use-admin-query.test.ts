/**
 * DSN-05 : useAdminQuery. Vitest n'a pas de DOM : la logique (annulation, dérivation d'état)
 * vit dans des fonctions pures testées directement ; le hook est vérifié par un rendu
 * statique (état initial « loading », forme du résultat).
 */
import { describe, expect, it, vi } from 'vitest'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  deriveQueryView,
  initialQueryState,
  queryReducer,
  startAdminQuery,
  useAdminQuery,
  type QueryAction,
  type QueryState,
} from '../src/components/admin/use-admin-query'
import { AdminFetchError } from '../src/components/admin/admin-fetch'

type Item = { id: number }
const initial = initialQueryState as QueryState<Item[]>

/** fetcher dont on contrôle la résolution et qui réagit au signal comme un vrai fetch. */
function controllableFetcher() {
  let resolve!: (v: unknown) => void
  let reject!: (e: unknown) => void
  let signal: AbortSignal | undefined
  const fetcher = vi.fn((_url: string, init?: { signal?: AbortSignal }) => {
    signal = init?.signal
    return new Promise((res, rej) => {
      resolve = res
      reject = rej
    })
  })
  return { fetcher: fetcher as never, resolve: (v: unknown) => resolve(v), reject: (e: unknown) => reject(e), getSignal: () => signal }
}

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('startAdminQuery', () => {
  it('succès : émet success avec la clé et l’URL', async () => {
    const c = controllableFetcher()
    const actions: QueryAction<Item[]>[] = []
    startAdminQuery<Item[]>('/api/a', 'k1', (a) => actions.push(a), c.fetcher)
    c.resolve([{ id: 1 }])
    await flush()
    expect(actions).toEqual([{ type: 'success', key: 'k1', url: '/api/a', data: [{ id: 1 }] }])
  })

  it('échec : émet failure avec une AdminFetchError', async () => {
    const c = controllableFetcher()
    const actions: QueryAction<Item[]>[] = []
    startAdminQuery<Item[]>('/api/a', 'k1', (a) => actions.push(a), c.fetcher)
    c.reject(new AdminFetchError('Heure invalide', 400))
    await flush()
    expect(actions).toHaveLength(1)
    expect(actions[0].type).toBe('failure')
    expect((actions[0] as { error: AdminFetchError }).error.status).toBe(400)
  })

  it('erreur inattendue (hors AdminFetchError) : convertie en AdminFetchError', async () => {
    const c = controllableFetcher()
    const actions: QueryAction<Item[]>[] = []
    startAdminQuery<Item[]>('/api/a', 'k1', (a) => actions.push(a), c.fetcher)
    c.reject(new Error('boom'))
    await flush()
    expect((actions[0] as { error: unknown }).error).toBeInstanceOf(AdminFetchError)
  })

  it('annulation (démontage / changement de clé) : abandonne le fetch et n’émet plus rien', async () => {
    const c = controllableFetcher()
    const dispatch = vi.fn()
    const cancel = startAdminQuery<Item[]>('/api/a', 'k1', dispatch, c.fetcher)
    expect(c.getSignal()?.aborted).toBe(false)
    cancel()
    expect(c.getSignal()?.aborted).toBe(true)
    c.resolve([{ id: 1 }]) // réponse tardive : ignorée
    await flush()
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('annulation : un AbortError n’est jamais présenté comme une erreur', async () => {
    const c = controllableFetcher()
    const dispatch = vi.fn()
    startAdminQuery<Item[]>('/api/a', 'k1', dispatch, c.fetcher)
    c.reject(new DOMException('Aborted', 'AbortError'))
    await flush()
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('transmet un signal à chaque appel (deux requêtes = deux signaux indépendants)', () => {
    const a = controllableFetcher()
    const b = controllableFetcher()
    const cancelA = startAdminQuery<Item[]>('/api/a', 'k1', vi.fn(), a.fetcher)
    startAdminQuery<Item[]>('/api/b', 'k2', vi.fn(), b.fetcher)
    cancelA()
    expect(a.getSignal()?.aborted).toBe(true)
    expect(b.getSignal()?.aborted).toBe(false)
  })
})

describe('queryReducer / deriveQueryView', () => {
  const ok = queryReducer(initial, { type: 'success', key: '/api/a#0', url: '/api/a', data: [{ id: 1 }] })

  it('état initial : loading, aucune donnée', () => {
    expect(deriveQueryView(initial, '/api/a', '/api/a#0')).toEqual({ status: 'loading', data: null, error: null })
  })

  it('succès : ready avec les données', () => {
    expect(deriveQueryView(ok, '/api/a', '/api/a#0')).toEqual({ status: 'ready', data: [{ id: 1 }], error: null })
  })

  it('refetch (même URL, nouvelle tentative) : loading en conservant les données', () => {
    expect(deriveQueryView(ok, '/api/a', '/api/a#1')).toEqual({ status: 'loading', data: [{ id: 1 }], error: null })
  })

  it('changement d’URL : loading SANS donnée périmée', () => {
    expect(deriveQueryView(ok, '/api/b', '/api/b#0')).toEqual({ status: 'loading', data: null, error: null })
  })

  it('échec : error, données de la même URL conservées', () => {
    const err = new AdminFetchError('x', 500)
    const failed = queryReducer(ok, { type: 'failure', key: '/api/a#1', url: '/api/a', error: err })
    expect(deriveQueryView(failed, '/api/a', '/api/a#1')).toEqual({ status: 'error', data: [{ id: 1 }], error: err })
  })

  it('échec après changement d’URL : pas de données de l’ancienne URL', () => {
    const failed = queryReducer(ok, { type: 'failure', key: '/api/b#0', url: '/api/b', error: new AdminFetchError('x', 500) })
    expect(deriveQueryView(failed, '/api/b', '/api/b#0').data).toBeNull()
  })

  it('succès après échec : error effacée', () => {
    const failed = queryReducer(ok, { type: 'failure', key: '/api/a#1', url: '/api/a', error: new AdminFetchError('x', 500) })
    const again = queryReducer(failed, { type: 'success', key: '/api/a#2', url: '/api/a', data: [{ id: 2 }] })
    expect(deriveQueryView(again, '/api/a', '/api/a#2')).toEqual({ status: 'ready', data: [{ id: 2 }], error: null })
  })
})

describe('useAdminQuery (rendu statique)', () => {
  it('premier rendu : loading, données nulles, refetch est une fonction', () => {
    function Probe() {
      const q = useAdminQuery<Item[]>('/api/hours')
      return h('p', null, JSON.stringify({ status: q.status, data: q.data, error: q.error, refetch: typeof q.refetch }))
    }
    const html = renderToStaticMarkup(h(Probe))
    expect(html).toBe('<p>{&quot;status&quot;:&quot;loading&quot;,&quot;data&quot;:null,&quot;error&quot;:null,&quot;refetch&quot;:&quot;function&quot;}</p>')
  })
})
