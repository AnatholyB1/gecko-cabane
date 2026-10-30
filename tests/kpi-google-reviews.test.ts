/**
 * Tests du total d'avis Google (Places API (New)). fetch injecte : aucun appel reseau reel.
 */
import { describe, it, expect, vi } from 'vitest'
import {
  fetchGoogleReviewsSummary,
  diagnoseGoogleReviews,
  parsePlaceSummary,
  isValidPlaceId,
  PLACES_ENDPOINT,
  DEFAULT_GOOGLE_PLACE_ID,
} from '../src/utils/kpi-google-reviews'
import { generateKeyPairSync } from 'node:crypto'
import { TOKEN_URL } from '../src/utils/kpi-gsc'
import { collectExternalKpis } from '../src/utils/kpi-sources'
import type { WeeklyKpiRow } from '../src/types/database'

const asFetch = (f: unknown) => f as typeof fetch
const ok = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const week = { start: '2026-10-19', end: '2026-10-25' }
const row = (p: Partial<WeeklyKpiRow>) => p as WeeklyKpiRow

describe('parsePlaceSummary', () => {
  it('total et note valides', () => {
    expect(parsePlaceSummary({ userRatingCount: 1065, rating: 4.7 })).toEqual({ total: 1065, rating: 4.7 })
  })
  it('note absente => null, total conserve', () => {
    expect(parsePlaceSummary({ userRatingCount: 0 })).toEqual({ total: 0, rating: null })
  })
  it('formes invalides => null', () => {
    for (const bad of [null, 'x', {}, { userRatingCount: '12' }, { userRatingCount: -1 }, { userRatingCount: 1.5 }, { userRatingCount: 2_000_000 }]) {
      expect(parsePlaceSummary(bad)).toBeNull()
    }
  })
})

describe('isValidPlaceId', () => {
  it('accepte le Place ID par defaut, refuse les valeurs dangereuses', () => {
    expect(isValidPlaceId(DEFAULT_GOOGLE_PLACE_ID)).toBe(true)
    expect(isValidPlaceId('../x')).toBe(false)
    expect(isValidPlaceId('a b c d e f g h i j')).toBe(false)
    expect(isValidPlaceId(undefined)).toBe(false)
  })
})

describe('fetchGoogleReviewsSummary', () => {
  it('une requete GET, cle en en-tete, champs minimaux, jamais dans l URL', async () => {
    const f = vi.fn().mockResolvedValue(ok({ userRatingCount: 1065, rating: 4.7 }))
    const r = await fetchGoogleReviewsSummary({ apiKey: 'secret-key', fetchImpl: asFetch(f) })
    expect(r).toEqual({ total: 1065, rating: 4.7 })
    expect(f).toHaveBeenCalledTimes(1)
    const [url, init] = f.mock.calls[0]
    expect(url).toBe(`${PLACES_ENDPOINT}/${DEFAULT_GOOGLE_PLACE_ID}`)
    expect(String(url)).not.toContain('secret-key')
    expect(init.headers['x-goog-api-key']).toBe('secret-key')
    expect(init.headers['x-goog-fieldmask']).toBe('userRatingCount,rating')
  })
  it('sans cle ou Place ID invalide => null, aucun appel', async () => {
    const f = vi.fn()
    expect(await fetchGoogleReviewsSummary({ fetchImpl: asFetch(f) })).toBeNull()
    expect(await fetchGoogleReviewsSummary({ apiKey: 'k', placeId: '../x', fetchImpl: asFetch(f) })).toBeNull()
    expect(f).not.toHaveBeenCalled()
  })
  it('non-2xx, exception, forme invalide => null', async () => {
    expect(await fetchGoogleReviewsSummary({ apiKey: 'k', fetchImpl: asFetch(vi.fn().mockResolvedValue(ok({}, 403))) })).toBeNull()
    expect(await fetchGoogleReviewsSummary({ apiKey: 'k', fetchImpl: asFetch(vi.fn().mockRejectedValue(new Error('x'))) })).toBeNull()
    expect(await fetchGoogleReviewsSummary({ apiKey: 'k', fetchImpl: asFetch(vi.fn().mockResolvedValue(ok({ foo: 1 }))) })).toBeNull()
  })
})

describe('diagnoseGoogleReviews', () => {
  it('stages sans appel', async () => {
    const f = vi.fn()
    expect((await diagnoseGoogleReviews({ fetchImpl: asFetch(f) })).stage).toBe('no_credentials')
    expect((await diagnoseGoogleReviews({ apiKey: 'k', placeId: '../x', fetchImpl: asFetch(f) })).stage).toBe('bad_place_id')
    expect(f).not.toHaveBeenCalled()
  })
  it('ok', async () => {
    const f = vi.fn().mockResolvedValue(ok({ userRatingCount: 1065, rating: 4.7 }))
    expect(await diagnoseGoogleReviews({ apiKey: 'k', fetchImpl: asFetch(f) })).toMatchObject({ stage: 'ok', http_status: 200, total: 1065, rating: 4.7 })
  })
  it('erreur Google => statut et message clippes, sans la cle', async () => {
    const f = vi.fn().mockResolvedValue(ok({ error: { status: 'PERMISSION_DENIED', message: 'API key not valid' } }, 403))
    const d = await diagnoseGoogleReviews({ apiKey: 'secret-key', fetchImpl: asFetch(f) })
    expect(d).toMatchObject({ stage: 'http_error', http_status: 403, google_status: 'PERMISSION_DENIED' })
    expect(JSON.stringify(d)).not.toContain('secret-key')
  })
  it('timeout => exception + nom', async () => {
    const f = vi.fn().mockRejectedValue(Object.assign(new Error('boom secret-key'), { name: 'TimeoutError' }))
    const d = await diagnoseGoogleReviews({ apiKey: 'secret-key', fetchImpl: asFetch(f) })
    expect(d).toMatchObject({ stage: 'exception', error_name: 'TimeoutError' })
    expect(JSON.stringify(d)).not.toContain('secret-key')
  })
})

describe('collectExternalKpis - avis Google', () => {
  const env = { GOOGLE_PLACES_API_KEY: 'k' }
  const fetchPlaces = (total: number) => vi.fn().mockImplementation(async (u: string) =>
    String(u).startsWith(PLACES_ENDPOINT) ? ok({ userRatingCount: total, rating: 4.7 }) : ok({}, 500))

  it('avec total S-1 : nouveaux avis = difference, statut ok', async () => {
    const r = await collectExternalKpis(week, null, env, { skipPaid: true, previous: row({ google_reviews_total: 1060 }), fetchImpl: asFetch(fetchPlaces(1065)) })
    expect(r.values).toMatchObject({ google_reviews_total: 1065, google_new_reviews: 5 })
    expect(r.status.google_reviews).toBe('ok')
  })
  it('un total en baisse (avis supprimes) ne donne jamais un negatif', async () => {
    const r = await collectExternalKpis(week, null, env, { skipPaid: true, previous: row({ google_reviews_total: 1070 }), fetchImpl: asFetch(fetchPlaces(1065)) })
    expect(r.values.google_new_reviews).toBe(0)
  })
  it('premiere semaine (pas de S-1) : total rempli, nouveaux null, statut partial', async () => {
    const r = await collectExternalKpis(week, null, env, { skipPaid: true, previous: null, fetchImpl: asFetch(fetchPlaces(1065)) })
    expect(r.values).toMatchObject({ google_reviews_total: 1065, google_new_reviews: null })
    expect(r.status.google_reviews).toBe('partial')
  })
  it('appele aussi en controle a blanc (skipPaid), contrairement a TripAdvisor', async () => {
    const f = fetchPlaces(1065)
    await collectExternalKpis(week, null, env, { skipPaid: true, fetchImpl: asFetch(f) })
    expect(f.mock.calls.some(([u]) => String(u).startsWith(PLACES_ENDPOINT))).toBe(true)
  })
  it('saisie manuelle deja presente : jamais ecrasee, aucun appel Google', async () => {
    const f = fetchPlaces(9999)
    const r = await collectExternalKpis(week, row({ google_reviews_total: 1000, google_new_reviews: 3 }), env, { skipPaid: true, fetchImpl: asFetch(f) })
    expect(f.mock.calls.some(([u]) => String(u).startsWith(PLACES_ENDPOINT))).toBe(false)
    expect(r.values).not.toHaveProperty('google_reviews_total')
    expect(r.status.google_reviews).toBe('ok')
  })
  it('panne Google => unavailable, les autres sources ne sont pas bloquees', async () => {
    const r = await collectExternalKpis(week, null, env, { skipPaid: true, fetchImpl: asFetch(vi.fn().mockRejectedValue(new Error('down'))) })
    expect(r.status.google_reviews).toBe(
'unavailable')
    expect(r.values).toMatchObject({ google_reviews_total: null, google_new_reviews: null })
    expect(r.status.search_console).toBe('unavailable')
  })
})

describe('compte de service (jeton OAuth, sans cle API)', () => {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  })
  const saJson = JSON.stringify({ client_email: 'sa@gecko-cabane.iam.gserviceaccount.com', private_key: privateKey })
  const placesOk = () => ok({ userRatingCount: 1065, rating: 4.7 })
  const route = (tokenRes: Response) =>
    vi.fn().mockImplementation(async (u: string) => (String(u) === TOKEN_URL ? tokenRes.clone() : placesOk()))

  it('jeton puis GET Places avec Authorization Bearer, sans en-tete de cle', async () => {
    const f = route(ok({ access_token: 'tok-123' }))
    const r = await fetchGoogleReviewsSummary({ serviceAccountJson: saJson, fetchImpl: asFetch(f) })
    expect(r).toEqual({ total: 1065, rating: 4.7 })
    expect(f).toHaveBeenCalledTimes(2)
    const [tokenUrl, tokenInit] = f.mock.calls[0]
    expect(tokenUrl).toBe(TOKEN_URL)
    expect(String(tokenInit.body)).toContain('jwt-bearer')
    const [, placesInit] = f.mock.calls[1]
    expect(placesInit.headers.authorization).toBe('Bearer tok-123')
    expect(placesInit.headers['x-goog-api-key']).toBeUndefined()
  })
  it('le compte de service prime sur la cle API', async () => {
    const f = route(ok({ access_token: 'tok' }))
    await fetchGoogleReviewsSummary({ serviceAccountJson: saJson, apiKey: 'k', fetchImpl: asFetch(f) })
    expect(f.mock.calls[1][1].headers['x-goog-api-key']).toBeUndefined()
  })
  it('refus du jeton => null, Places jamais appele', async () => {
    const f = route(ok({ error: 'invalid_grant' }, 400))
    expect(await fetchGoogleReviewsSummary({ serviceAccountJson: saJson, fetchImpl: asFetch(f) })).toBeNull()
    expect(f).toHaveBeenCalledTimes(1)
  })
  it('JSON de compte de service invalide et pas de cle => null, aucun appel', async () => {
    const f = vi.fn()
    expect(await fetchGoogleReviewsSummary({ serviceAccountJson: '{nope', fetchImpl: asFetch(f) })).toBeNull()
    expect(f).not.toHaveBeenCalled()
  })
  it('diagnostic : jeton refuse => stage token_http + code Google, sans secret', async () => {
    const f = route(ok({ error: 'invalid_grant' }, 400))
    const d = await diagnoseGoogleReviews({ serviceAccountJson: saJson, fetchImpl: asFetch(f) })
    expect(d).toMatchObject({ stage: 'token_http', http_status: 400, google_status: 'invalid_grant' })
    expect(JSON.stringify(d)).not.toContain('PRIVATE KEY')
  })
  it('diagnostic : PERMISSION_DENIED sur Places est restitue', async () => {
    const f = vi.fn().mockImplementation(async (u: string) =>
      String(u) === TOKEN_URL ? ok({ access_token: 't' }) : ok({ error: { status: 'PERMISSION_DENIED', message: 'caller lacks permission' } }, 403))
    expect(await diagnoseGoogleReviews({ serviceAccountJson: saJson, fetchImpl: asFetch(f) })).toMatchObject({
      stage: 'http_error', http_status: 403, google_status: 'PERMISSION_DENIED',
    })
  })
  it('collecteur : GSC_SERVICE_ACCOUNT_JSON suffit pour remplir le total', async () => {
    const f = vi.fn().mockImplementation(async (u: string) =>
      String(u) === TOKEN_URL ? ok({ access_token: 't' }) : String(u).startsWith(PLACES_ENDPOINT) ? placesOk() : ok({}, 500))
    const r = await collectExternalKpis(week, null, { GSC_SERVICE_ACCOUNT_JSON: saJson }, { skipPaid: true, previous: row({ google_reviews_total: 1060 }), fetchImpl: asFetch(f) })
    expect(r.values).toMatchObject({ google_reviews_total: 1065, google_new_reviews: 5 })
    expect(r.status.google_reviews).toBe('ok')
  })
})
