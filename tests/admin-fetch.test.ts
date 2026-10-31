/**
 * DSN-05 : adminFetch (JSON, erreurs typées, annulation) et describeError.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminFetchError, adminFetch, describeError, isAbortError } from '../src/components/admin/admin-fetch'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('adminFetch', () => {
  it('renvoie le corps JSON d’une réponse 200 et demande du JSON', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ data: [1, 2] }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(adminFetch<{ data: number[] }>('/api/hours')).resolves.toEqual({ data: [1, 2] })
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
    expect(new Headers(init.headers).get('Accept')).toBe('application/json')
  })

  it('sérialise `json` avec Content-Type et la méthode fournie', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    await adminFetch('/api/settings', { method: 'PUT', json: { max_covers: 40 } })
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
    expect(init.method).toBe('PUT')
    expect(init.body).toBe('{"max_covers":40}')
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json')
  })

  it('204 : renvoie undefined', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })))
    await expect(adminFetch('/api/x', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('erreur HTTP avec { error } : AdminFetchError typée (message + statut)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'Heure invalide' }, 400)))
    const err = await adminFetch('/api/x').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(AdminFetchError)
    expect((err as AdminFetchError).message).toBe('Heure invalide')
    expect((err as AdminFetchError).status).toBe(400)
  })

  it('erreur HTTP sans corps JSON : message par défaut selon le statut', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>', { status: 502 })))
    const err = (await adminFetch('/api/x').catch((e: unknown) => e)) as AdminFetchError
    expect(err.status).toBe(502)
    expect(err.message).toMatch(/serveur/)
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 401 })))
    expect(((await adminFetch('/api/x').catch((e: unknown) => e)) as AdminFetchError).message).toMatch(/Session expirée/)
  })

  it('réseau coupé : AdminFetchError de statut 0', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    const err = (await adminFetch('/api/x').catch((e: unknown) => e)) as AdminFetchError
    expect(err).toBeInstanceOf(AdminFetchError)
    expect(err.status).toBe(0)
  })

  it('succès avec corps illisible : AdminFetchError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('pas du json', { status: 200 })))
    const err = (await adminFetch('/api/x').catch((e: unknown) => e)) as AdminFetchError
    expect(err).toBeInstanceOf(AdminFetchError)
    expect(err.message).toMatch(/illisible/)
  })

  it('annulation : transmet le signal et relance l’AbortError d’origine', async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()
    const pending = adminFetch('/api/x', { signal: controller.signal }).catch((e: unknown) => e)
    controller.abort()
    const err = await pending
    expect(isAbortError(err)).toBe(true)
    expect(err).not.toBeInstanceOf(AdminFetchError)
  })
})

describe('describeError', () => {
  it('connexion perdue, accès refusé, générique', () => {
    expect(describeError(new AdminFetchError('x', 0)).title).toBe('Connexion perdue')
    expect(describeError(new AdminFetchError('Session expirée.', 401)).title).toBe('Accès impossible')
    expect(describeError(new AdminFetchError('Oups', 500)).description).toContain('Rien n’a été modifié')
    expect(describeError('bizarre').title).toBe('Impossible de charger la liste')
  })
})
