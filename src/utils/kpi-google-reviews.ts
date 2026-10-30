/**
 * Total d'avis Google pour le rapport KPI hebdomadaire (Places API (New), Place Details).
 *
 * Variables d'environnement (serveur uniquement) :
 *   GOOGLE_PLACES_API_KEY (restreinte a Places API (New)), GOOGLE_PLACE_ID (optionnel).
 *
 * Champs demandes : rating et userRatingCount uniquement (pas de reviews : SKU moins cher, et
 * l'API ne renvoie de toute facon que 5 avis tries par pertinence, pas par date). Les nouveaux
 * avis de la semaine se deduisent du total de la semaine precedente ; la note la plus basse
 * (alerte avis negatif) reste une saisie manuelle.
 *
 * Un seul appel, pas de nouvelle tentative. Tout echec renvoie null (« non disponible »), jamais
 * une valeur inventee. Aucun log : la cle ne transite que par l'en-tete X-Goog-Api-Key.
 */

export const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places'

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

function placeRequest(opts: { apiKey: string; placeId: string; fetchImpl?: typeof fetch; timeoutMs?: number }) {
  const doFetch = opts.fetchImpl ?? fetch
  return doFetch(`${PLACES_ENDPOINT}/${encodeURIComponent(opts.placeId)}`, {
    method: 'GET',
    headers: {
      'x-goog-api-key': opts.apiKey,
      'x-goog-fieldmask': 'userRatingCount,rating',
    },
    signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  })
}

export async function fetchGoogleReviewsSummary(opts: {
  apiKey?: string
  placeId?: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}): Promise<GoogleReviewsSummary | null> {
  const placeId = opts.placeId ?? DEFAULT_GOOGLE_PLACE_ID
  if (!opts.apiKey || !isValidPlaceId(placeId)) return null
  try {
    const res = await placeRequest({ ...opts, apiKey: opts.apiKey, placeId })
    if (!res.ok) return null
    return parsePlaceSummary(await res.json())
  } catch {
    return null
  }
}

// Dry run only: names the failing stage and Google's error status, never the key or the page body.
export async function diagnoseGoogleReviews(opts: {
  apiKey?: string
  placeId?: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}): Promise<GoogleReviewsDiagnosis> {
  const placeId = opts.placeId ?? DEFAULT_GOOGLE_PLACE_ID
  if (!opts.apiKey) return { stage: 'no_api_key' }
  if (!isValidPlaceId(placeId)) return { stage: 'bad_place_id' }
  const clip = (v: unknown) => (typeof v === 'string' ? v.slice(0, 160) : undefined)
  const startedAt = Date.now()
  try {
    const res = await placeRequest({ ...opts, apiKey: opts.apiKey, placeId })
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
