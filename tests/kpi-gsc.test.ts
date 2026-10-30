/**
 * Tests Search Console hebdomadaire (08-02). Aucune requete reseau : fetch mocke,
 * paire RSA generee dans le test.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { generateKeyPairSync, verify } from 'node:crypto'
import {
  GSC_SCOPE,
  aggregateGscRows,
  fetchGscWeek,
  parseServiceAccount,
  signServiceAccountJwt,
  type GscRow,
} from '../src/utils/kpi-gsc'

const WEEK = { start: '2026-10-19', end: '2026-10-25' }
const DAYS = ['19', '20', '21', '22', '23', '24', '25'].map((d) => `2026-10-${d}`)

let privateKeyPem = ''
let publicKeyPem = ''
let saJson = ''

beforeAll(() => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
  publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString()
  saJson = JSON.stringify({ client_email: 'kpi@proj.iam.gserviceaccount.com', private_key: privateKeyPem })
})

afterEach(() => {
  vi.restoreAllMocks()
})

function rows(days: string[], clicks = 2, impressions = 100, position = 5): GscRow[] {
  return days.map((d) => ({ keys: [d], clicks, impressions, ctr: clicks / impressions, position }))
}

function b64urlJson(seg: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(seg, 'base64url').toString('utf8'))
}

describe('parseServiceAccount', () => {
  it('renvoie null si absent, JSON invalide ou champs manquants', () => {
    expect(parseServiceAccount(undefined)).toBeNull()
    expect(parseServiceAccount('{pas du json')).toBeNull()
    expect(parseServiceAccount(JSON.stringify({ client_email: 'a@b' }))).toBeNull()
    expect(parseServiceAccount(JSON.stringify({ private_key: 'x' }))).toBeNull()
  })

  it('normalise les \\n litteraux de la cle privee', () => {
    const sa = parseServiceAccount(
      JSON.stringify({ client_email: 'a@b', private_key: '-----BEGIN-----\\nabc\\n-----END-----' }),
    )
    expect(sa?.private_key).toBe('-----BEGIN-----\nabc\n-----END-----')
  })
})

describe('signServiceAccountJwt', () => {
  it('produit un JWT RS256 verifiable avec les bons claims', () => {
    const jwt = signServiceAccountJwt({ client_email: 'kpi@proj', private_key: privateKeyPem }, 1_000_000)
    const [h, c, s] = jwt.split('.')
    expect(jwt.split('.')).toHaveLength(3)
    expect(b64urlJson(h)).toEqual({ alg: 'RS256', typ: 'JWT' })
    const claims = b64urlJson(c)
    expect(claims.iss).toBe('kpi@proj')
    expect(claims.scope).toBe(GSC_SCOPE)
    expect(claims.aud).toBe('https://oauth2.googleapis.com/token')
    expect(claims.iat).toBe(1_000_000)
    expect(claims.exp).toBe(1_003_600)
    const ok = verify('RSA-SHA256', Buffer.from(`${h}.${c}`), publicKeyPem, Buffer.from(s, 'base64url'))
    expect(ok).toBe(true)
  })
})

describe('aggregateGscRows', () => {
  it('somme clics/impressions, ctr et position ponderee, semaine complete', () => {
    const r = aggregateGscRows(
      [
        { keys: [DAYS[0]], clicks: 10, impressions: 100, ctr: 0.1, position: 2 },
        ...rows(DAYS.slice(1), 0, 300, 6).map((x, i) => (i === 0 ? { ...x, impressions: 300, position: 6 } : x)),
      ].map((x, i) => (i > 1 ? { ...x, impressions: 0 } : x)),
      WEEK,
    )
    expect(r.clicks).toBe(10)
    expect(r.impressions).toBe(400)
    expect(r.ctr).toBeCloseTo(10 / 400)
    expect(r.position).toBeCloseTo((2 * 100 + 6 * 300) / 400)
    expect(r.daysCovered).toBe(7)
    expect(r.partial).toBe(false)
  })

  it('ctr et position null si 0 impression', () => {
    const r = aggregateGscRows(rows(DAYS, 0, 0), WEEK)
    expect(r.ctr).toBeNull()
    expect(r.position).toBeNull()
  })

  it('partiel si moins de 7 jours', () => {
    const r = aggregateGscRows(rows(DAYS.slice(0, 5)), WEEK)
    expect(r.daysCovered).toBe(5)
    expect(r.partial).toBe(true)
  })

  it('partiel si firstIncompleteDate <= fin de semaine, complet sinon', () => {
    expect(aggregateGscRows(rows(DAYS), WEEK, '2026-10-25').partial).toBe(true)
    expect(aggregateGscRows(rows(DAYS), WEEK, '2026-10-26').partial).toBe(false)
  })

  it('ignore les lignes invalides', () => {
    const bad = [
      { keys: [DAYS[0]], clicks: Number.NaN, impressions: 10, ctr: 0, position: 1 },
      { keys: [], clicks: 1, impressions: 10, ctr: 0, position: 1 },
    ] as GscRow[]
    const r = aggregateGscRows([...bad, ...rows(DAYS.slice(1))], WEEK)
    expect(r.daysCovered).toBe(6)
    expect(r.clicks).toBe(12)
  })
})

describe('fetchGscWeek', () => {
  const siteUrl = 'sc-domain:geckocabanerestaurant.com'
  const now = new Date('2026-10-26T00:00:00Z')

  function mockFetch(tokenStatus = 200, queryStatus = 200, body: unknown = { rows: rows(DAYS) }) {
    return vi.fn(async (url: string | URL | Request) => {
      const u = String(url)
      if (u.includes('oauth2.googleapis.com/token')) {
        return new Response(JSON.stringify({ access_token: 'tok123' }), { status: tokenStatus })
      }
      return new Response(JSON.stringify(body), { status: queryStatus })
    })
  }

  it('renvoie null sans config, sans appel fetch', async () => {
    const f = mockFetch()
    expect(await fetchGscWeek(WEEK, { siteUrl, fetchImpl: f as unknown as typeof fetch })).toBeNull()
    expect(await fetchGscWeek(WEEK, { serviceAccountJson: saJson, fetchImpl: f as unknown as typeof fetch })).toBeNull()
    expect(f).not.toHaveBeenCalled()
  })

  it('token 400 => null', async () => {
    const f = mockFetch(400)
    expect(await fetchGscWeek(WEEK, { serviceAccountJson: saJson, siteUrl, fetchImpl: f as unknown as typeof fetch, now })).toBeNull()
  })

  it('query 403 => null', async () => {
    const f = mockFetch(200, 403)
    expect(await fetchGscWeek(WEEK, { serviceAccountJson: saJson, siteUrl, fetchImpl: f as unknown as typeof fetch, now })).toBeNull()
  })

  it('fetch rejete (timeout) => null', async () => {
    const f = vi.fn(async () => {
      throw new Error('timeout')
    })
    expect(await fetchGscWeek(WEEK, { serviceAccountJson: saJson, siteUrl, fetchImpl: f as unknown as typeof fetch, now })).toBeNull()
  })

  it('reponse de forme inattendue => null', async () => {
    const f = mockFetch(200, 200, { rows: 'nope' })
    expect(await fetchGscWeek(WEEK, { serviceAccountJson: saJson, siteUrl, fetchImpl: f as unknown as typeof fetch, now })).toBeNull()
  })

  it('succes : 2 appels corrects et agregat', async () => {
    const f = mockFetch(200, 200, { rows: rows(DAYS), metadata: { first_incomplete_date: '2026-10-27' } })
    const r = await fetchGscWeek(WEEK, { serviceAccountJson: saJson, siteUrl, fetchImpl: f as unknown as typeof fetch, now })
    expect(f).toHaveBeenCalledTimes(2)
    const [tokenUrl, tokenInit] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect(tokenUrl).toBe('https://oauth2.googleapis.com/token')
    expect(tokenInit.method).toBe('POST')
    const params = new URLSearchParams(String(tokenInit.body))
    expect(params.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer')
    expect(params.get('assertion')?.split('.')).toHaveLength(3)

    const [qUrl, qInit] = f.mock.calls[1] as unknown as [string, RequestInit]
    expect(qUrl).toContain(`/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`)
    expect((qInit.headers as Record<string, string>).authorization).toBe('Bearer tok123')
    expect(JSON.parse(String(qInit.body))).toEqual({
      startDate: WEEK.start,
      endDate: WEEK.end,
      dimensions: ['date'],
      dataState: 'all',
      rowLimit: 100,
    })
    expect(r).toEqual({ clicks: 14, impressions: 700, ctr: 14 / 700, position: 5, daysCovered: 7, partial: false })
  })

  it('ne fuite jamais la cle privee (resultat, console, erreurs)', async () => {
    const spies = [
      vi.spyOn(console, 'log').mockImplementation(() => {}),
      vi.spyOn(console, 'error').mockImplementation(() => {}),
      vi.spyOn(console, 'warn').mockImplementation(() => {}),
    ]
    const f = vi.fn(async () => {
      throw new Error(`boom ${privateKeyPem}`)
    })
    const bad = await fetchGscWeek(WEEK, { serviceAccountJson: saJson, siteUrl, fetchImpl: f as unknown as typeof fetch, now })
    const ok = await fetchGscWeek(WEEK, { serviceAccountJson: saJson, siteUrl, fetchImpl: mockFetch() as unknown as typeof fetch, now })
    const dump = JSON.stringify([bad, ok, spies.map((s) => s.mock.calls)])
    expect(dump).not.toContain('PRIVATE KEY')
  })
})
