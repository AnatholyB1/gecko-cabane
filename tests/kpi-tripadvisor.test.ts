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
