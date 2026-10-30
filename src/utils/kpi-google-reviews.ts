/**
 * Total d'avis Google pour le rapport KPI hebdomadaire (Places API (New), Place Details).
 *
 * Authentification (serveur uniquement), par ordre de preference :
 *   - compte de service deja utilise pour Search Console (GSC_SERVICE_ACCOUNT_JSON), jeton OAuth
 *     portee cloud-platform : aucune cle supplementaire a stocker ;
 *   - sinon GOOGLE_PLACES_API_KEY (cle restreinte a Places API (New)).
 *   GOOGLE_PLACE_ID est optionnel.
 *
 * Champs demandes : rating et userRatingCount uniquement (pas de reviews : SKU moins cher, et
 * l'API ne renvoie de toute facon que 5 avis tries par pertinence, pas par date). Les nouveaux
 * avis de la semaine se deduisent du total de la semaine precedente ; la note la plus basse
 * (alerte avis negatif) reste une saisie manuelle.
 *
 * Un seul appel, pas de nouvelle tentative. Tout echec renvoie null (« non disponible »), jamais
 * une valeur inventee. Aucun log : la cle ne transite que par l'en-tete X-Goog-Api-Key.
 */

import { TOKEN_URL, parseServiceAccount, signServiceAccountJwt } from './kpi-gsc'

export const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places'
const CLOUD_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'

// Place ID derive de l'identifiant Maps de la fiche ; a confirmer par un premier appel reel.
export const DEFAULT_GOOGLE_PLACE_ID = 'ChIJozpAo2GUUTARABLcICH3H7I'

const DEFAULT_TIMEOUT_MS = 10_000
const MAX_TOTAL = 1_000_000

export type GoogleReviewsSummary = { total: number; rating: number | null }

export type GoogleReviewsDiagnosis = {
  stage: string
  http_status?: number
  google_status?: string
  detail?: string
  total?: number
  rating?: number | null
  duration_ms?: number
  error_name?: string
}

export function isValidPlaceId(id: string | undefined): id is string {
  return !!id && /^[A-Za-z0-9_-]{10,200}$/.test(id)
}

export function parsePlaceSummary(json: unknown): GoogleReviewsSummary | null {
  if (!json || typeof json !== 'object') return null
  const { userRatingCount, rating } = json as { userRatingCount?: unknown; rating?: unknown }
  if (typeof userRatingCount !== 'number' || !Number.isInteger(userRatingCount)) return null
  if (userRatingCount < 0 || userRatingCount > MAX_TOTAL) return null
  const r = typeof rating === 'number' && Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : null
  return { total: userRatingCount, rating: r }
}

type PlaceAuth = { apiKey?: string; serviceAccountJson?: string }
type PlaceOpts = PlaceAuth & { placeId?: string; fetchImpl?: typeof fetch; timeoutMs?: number; now?: Date }

export function hasPlaceAuth(a: PlaceAuth): boolean {
  return !!(a.apiKey || parseServiceAccount(a.serviceAccountJson))
}

// OAuth access token from the service account (same JWT flow as Search Console, wider scope).
async function serviceAccountToken(opts: PlaceOpts): Promise<{ token?: string; stage?: string; status?: number; error?: string }> {
  const sa = parseServiceAccount(opts.serviceAccountJson)
  if (!sa) return { stage: 'bad_service_account' }
  const doFetch = opts.fetchImpl ?? fetch
  const nowSec = Math.floor((opts.now ?? new Date()).getTime() / 1000)
  let assertion: string
  try {
    assertion = signServiceAccountJwt(sa, nowSec, CLOUD_SCOPE)
  } catch {
    return { stage: 'sign_error' }
  }
  const res = await doFetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }).toString(),
    signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  })
  if (!res.ok) {
    const j = (await res.json().catch(() => null)) as { error?: unknown } | null
    return { stage: 'token_http', status: res.status, error: typeof j?.error === 'string' ? j.error.slice(0, 160) : undefined }
  }
  const j = (await res.json().catch(() => null)) as { access_token?: unknown } | null
  return typeof j?.access_token === 'string' ? { token: j.access_token } : { stage: 'token_shape' }
}

async function placeRequest(opts: PlaceOpts & { placeId: string }): Promise<Response | { tokenError: { stage?: string; status?: number; error?: string } }> {
  const doFetch = opts.fetchImpl ?? fetch
  const headers: Record<string, string> = { 'x-goog-fieldmask': 'userRatingCount,rating' }
  if (parseServiceAccount(opts.serviceAccountJson)) {
    const t = await serviceAccountToken(opts)
    if (!t.token) return { tokenError: t }
    headers.authorization = `Bearer ${t.token}`
  } else if (opts.apiKey) {
    headers['x-goog-api-key'] = opts.apiKey
  }
  return doFetch(`${PLACES_ENDPOINT}/${encodeURIComponent(opts.placeId)}`, {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  })
}

export async function fetchGoogleReviewsSummary(opts: PlaceOpts): Promise<GoogleReviewsSummary | null> {
  const placeId = opts.placeId ?? DEFAULT_GOOGLE_PLACE_ID
  if (!hasPlaceAuth(opts) || !isValidPlaceId(placeId)) return null
  try {
    const res = await placeRequest({ ...opts, placeId })
    if ('tokenError' in res || !res.ok) return null
    return parsePlaceSummary(await res.json())
  } catch {
    return null
  }
}

// Dry run only: names the failing stage and Google's error status, never the key or the page body.
export async function diagnoseGoogleReviews(opts: PlaceOpts): Promise<GoogleReviewsDiagnosis> {
  const placeId = opts.placeId ?? DEFAULT_GOOGLE_PLACE_ID
  if (!hasPlaceAuth(opts)) return { stage: 'no_credentials' }
  if (!isValidPlaceId(placeId)) return { stage: 'bad_place_id' }
  const clip = (v: unknown) => (typeof v === 'string' ? v.slice(0, 160) : undefined)
  const startedAt = Date.now()
  try {
    const res = await placeRequest({ ...opts, placeId })
    if ('tokenError' in res) {
      const t = res.tokenError
      return { stage: t.stage ?? 'token', http_status: t.status, google_status: t.error, duration_ms: Date.now() - startedAt }
    }
    const base = { http_status: res.status, duration_ms: Date.now() - startedAt }
    const json: unknown = await res.json().catch(() => null)
    if (!res.ok) {
      const e = (json as { error?: { status?: unknown; message?: unknown } } | null)?.error
      return { stage: 'http_error', ...base, google_status: clip(e?.status), detail: clip(e?.message) }
    }
    const summary = parsePlaceSummary(json)
    return summary ? { stage: 'ok', ...base, total: summary.total, rating: summary.rating } : { stage: 'bad_shape', ...base }
  } catch (e) {
    return { stage: 'exception', duration_ms: Date.now() - startedAt, error_name: e instanceof Error ? e.name : 'unknown' }
  }
}
