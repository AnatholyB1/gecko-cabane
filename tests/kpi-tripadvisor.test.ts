/**
 * Tests du rang TripAdvisor (08-03). Fixtures synthetiques, fetch injecte :
 * aucun appel reseau reel.
 */
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  parseTripadvisorRank,
  fetchTripadvisorRank,
  diagnoseTripadvisor,
  isAllowedTripadvisorUrl,
  BRIGHTDATA_ENDPOINT,
} from '../src/utils/kpi-tripadvisor'

const fx = (name: string) => readFileSync(join(__dirname, 'fixtures', name), 'utf8')
const URL_OK = 'https://www.tripadvisor.com/Restaurant_Review-g1-d2-Reviews-Example.html'
const asFetch = (f: unknown) => f as typeof fetch

describe('parseTripadvisorRank', () => {
  it('EN simple', () => {
    expect(parseTripadvisorRank('#12 of 85 Restaurants in Krabi Town')).toEqual({ rank: 12, total: 85 })
  })
  it('EN separateur de milliers', () => {
    expect(parseTripadvisorRank('#1 of 1,234 restaurants in Krabi Town')).toEqual({ rank: 1, total: 1234 })
  })
  it('FR N° et n°', () => {
    expect(parseTripadvisorRank('N° 12 sur 85 restaurants à Krabi Town')).toEqual({ rank: 12, total: 85 })
    expect(parseTripadvisorRank('n°12 sur 85')).toEqual({ rank: 12, total: 85 })
  })
  it('balises entre les tokens', () => {
    expect(parseTripadvisorRank('<b>#12</b> of 85')).toEqual({ rank: 12, total: 85 })
  })
  it('fixtures EN et FR', () => {
    expect(parseTripadvisorRank(fx('tripadvisor-en.html'))).toEqual({ rank: 12, total: 85 })
    expect(parseTripadvisorRank(fx('tripadvisor-fr.html'))).toEqual({ rank: 12, total: 85 })
  })
  it('norank => null', () => {
    expect(parseTripadvisorRank(fx('tripadvisor-norank.html'))).toBeNull()
  })
  it('rank > total ou rank < 1 => null', () => {
    expect(parseTripadvisorRank('#90 of 85 Restaurants')).toBeNull()
    expect(parseTripadvisorRank('#0 of 85 Restaurants')).toBeNull()
  })
})

describe('isAllowedTripadvisorUrl', () => {
  it('accepte les hotes tripadvisor en https', () => {
    expect(isAllowedTripadvisorUrl(URL_OK)).toBe(true)
    expect(isAllowedTripadvisorUrl('https://www.tripadvisor.fr/Restaurant_Review-x.html')).toBe(true)
    expect(isAllowedTripadvisorUrl('https://tripadvisor.co.uk/x')).toBe(true)
  })
  it('refuse http, hotes tiers, undefined', () => {
    expect(isAllowedTripadvisorUrl('http://www.tripadvisor.com/x')).toBe(false)
    expect(isAllowedTripadvisorUrl('https://evil.com/?tripadvisor.com')).toBe(false)
    expect(isAllowedTripadvisorUrl('https://tripadvisor.com.evil.io/')).toBe(false)
    expect(isAllowedTripadvisorUrl(undefined)).toBe(false)
  })
})

describe('fetchTripadvisorRank', () => {
  const okResponse = () => new Response(fx('tripadvisor-en.html'), { status: 200 })

  it('parametre manquant => null, 0 appel', async () => {
    const f = vi.fn()
    expect(await fetchTripadvisorRank({ zone: 'z', url: URL_OK, fetchImpl: asFetch(f) })).toBeNull()
    expect(await fetchTripadvisorRank({ apiKey: 'k', url: URL_OK, fetchImpl: asFetch(f) })).toBeNull()
    expect(await fetchTripadvisorRank({ apiKey: 'k', zone: 'z', fetchImpl: asFetch(f) })).toBeNull()
    expect(f).toHaveBeenCalledTimes(0)
  })

  it('url refusee => null, 0 appel', async () => {
    const f = vi.fn()
    const r = await fetchTripadvisorRank({ apiKey: 'k', zone: 'z', url: 'https://evil.com/', fetchImpl: asFetch(f) })
    expect(r).toBeNull()
    expect(f).toHaveBeenCalledTimes(0)
  })

  it('200 => rang, exactement 1 POST avec Bearer et corps attendu', async () => {
    const f = vi.fn().mockResolvedValue(okResponse())
    const r = await fetchTripadvisorRank({ apiKey: 'secret-key', zone: 'zone1', url: URL_OK, fetchImpl: asFetch(f) })
    expect(r).toEqual({ rank: 12, total: 85 })
    expect(f).toHaveBeenCalledTimes(1)
    const [endpoint, init] = f.mock.calls[0]
    expect(endpoint).toBe(BRIGHTDATA_ENDPOINT)
    expect(init.method).toBe('POST')
    const headers = new Headers(init.headers)
    expect(headers.get('authorization')).toBe('Bearer secret-key')
    expect(JSON.parse(init.body)).toEqual({ zone: 'zone1', url: URL_OK, format: 'raw' })
  })

  it('429 => null, un seul appel (pas de retry)', async () => {
    const f = vi.fn().mockResolvedValue(new Response('', { status: 429 }))
    const r = await fetchTripadvisorRank({ apiKey: 'k', zone: 'z', url: URL_OK, fetchImpl: asFetch(f) })
    expect(r).toBeNull()
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('500 => null', async () => {
    const f = vi.fn().mockResolvedValue(new Response('', { status: 500 }))
    expect(await fetchTripadvisorRank({ apiKey: 'k', zone: 'z', url: URL_OK, fetchImpl: asFetch(f) })).toBeNull()
  })

  it('fetch rejete (timeout) => null', async () => {
    const f = vi.fn().mockRejectedValue(new DOMException('timeout', 'TimeoutError'))
    expect(await fetchTripadvisorRank({ apiKey: 'k', zone: 'z', url: URL_OK, fetchImpl: asFetch(f) })).toBeNull()
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('200 sans rang => null', async () => {
    const f = vi.fn().mockResolvedValue(new Response(fx('tripadvisor-norank.html'), { status: 200 }))
    expect(await fetchTripadvisorRank({ apiKey: 'k', zone: 'z', url: URL_OK, fetchImpl: asFetch(f) })).toBeNull()
  })
})

describe('diagnoseTripadvisor', () => {
  const run = (f: unknown, extra = {}) =>
    diagnoseTripadvisor({ apiKey: 'secret-key', zone: 'z', url: URL_OK, fetchImpl: asFetch(f), ...extra })

  it('configuration manquante => stage nomme, aucun appel', async () => {
    const f = vi.fn()
    expect((await diagnoseTripadvisor({ zone: 'z', url: URL_OK, fetchImpl: asFetch(f) })).stage).toBe('no_api_key')
    expect((await diagnoseTripadvisor({ apiKey: 'k', url: URL_OK, fetchImpl: asFetch(f) })).stage).toBe('no_zone')
    expect((await diagnoseTripadvisor({ apiKey: 'k', zone: 'z', fetchImpl: asFetch(f) })).stage).toBe('no_url')
    expect((await diagnoseTripadvisor({ apiKey: 'k', zone: 'z', url: 'https://evil.example/x', fetchImpl: asFetch(f) })).stage).toBe('url_refused')
    expect(f).not.toHaveBeenCalled()
  })
  it('200 avec rang => ok, une seule requete', async () => {
    const f = vi.fn().mockResolvedValue(new Response('#6 of 437 Restaurants', { status: 200 }))
    const d = await run(f)
    expect(d).toMatchObject({ stage: 'ok', http_status: 200, rank_pattern_found: true, rank: 6, total: 437 })
    expect(f).toHaveBeenCalledTimes(1)
    expect(f.mock.calls[0][0]).toBe(BRIGHTDATA_ENDPOINT)
  })
  it('200 sans rang => rank_not_found', async () => {
    const f = vi.fn().mockResolvedValue(new Response('<html>blocked</html>', { status: 200 }))
    expect(await run(f)).toMatchObject({ stage: 'rank_not_found', rank_pattern_found: false, bytes: 20 })
  })
  it('non-2xx => http_error avec en-tetes Bright Data, sans la cle ni le corps', async () => {
    const f = vi
      .fn()
      .mockResolvedValue(
        new Response('page body', { status: 403, headers: { 'x-brd-err-code': 'client_10010', 'x-brd-err-msg': 'zone off' } })
      )
    const d = await run(f)
    expect(d).toMatchObject({ stage: 'http_error', http_status: 403, brd_error: 'client_10010 zone off' })
    expect(JSON.stringify(d)).not.toContain('secret-key')
    expect(JSON.stringify(d)).not.toContain('page body')
  })
  it('exception (timeout) => exception + nom, sans message', async () => {
    const f = vi.fn().mockRejectedValue(Object.assign(new Error('boom secret-key'), { name: 'TimeoutError' }))
    const d = await run(f)
    expect(d).toMatchObject({ stage: 'exception', error_name: 'TimeoutError' })
    expect(JSON.stringify(d)).not.toContain('secret-key')
  })
})
