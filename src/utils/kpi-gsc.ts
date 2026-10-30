/**
 * Source Search Console du rapport KPI hebdomadaire (08-02, D-02b).
 *
 * Flux : JWT RS256 signe avec la cle du compte de service (node:crypto, sans lib Google)
 * -> POST https://oauth2.googleapis.com/token (grant jwt-bearer) -> access_token
 * -> POST searchAnalytics/query (dimension date) -> agregat de la semaine.
 *
 * Scope lecture seule uniquement (webmasters.readonly).
 * Variables d'environnement (lues par l'appelant, jamais ici) :
 *   - GSC_SERVICE_ACCOUNT_JSON : JSON complet du compte de service (client_email + private_key)
 *   - GSC_SITE_URL : propriete Search Console, ex. `sc-domain:geckocabanerestaurant.com`
 *
 * Hypothese A6 : le compte de service a ete ajoute comme utilisateur de la propriete.
 * Ecart accepte : Google calcule les dates en heure du Pacifique, la semaine est en heure de Krabi.
 *
 * Securite : la cle privee n'est jamais loggee ni renvoyee ; aucun log et aucun Sentry dans
 * ce module (la route decide quoi remonter). Toute erreur => null ("non disponible").
 */
import { createSign } from 'node:crypto'

export const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const QUERY_BASE = 'https://www.googleapis.com/webmasters/v3/sites'
const DEFAULT_TIMEOUT_MS = 10_000

export type ServiceAccount = { client_email: string; private_key: string }
export type GscRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }
export type GscWeekResult = {
  clicks: number
  impressions: number
  ctr: number | null
  position: number | null
  daysCovered: number
  partial: boolean
}

export function parseServiceAccount(json: string | undefined): ServiceAccount | null {
  if (!json) return null
  try {
    const parsed: unknown = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') return null
    const { client_email, private_key } = parsed as Record<string, unknown>
    if (typeof client_email !== 'string' || !client_email) return null
    if (typeof private_key !== 'string' || !private_key) return null
    return { client_email, private_key: private_key.replace(/\\n/g, '\n') }
  } catch {
    return null
  }
}

function b64url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

export function signServiceAccountJwt(sa: ServiceAccount, nowSec: number): string {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: GSC_SCOPE,
      aud: TOKEN_URL,
      iat: nowSec,
      exp: nowSec + 3600,
    }),
  )
  const signingInput = `${header}.${claims}`
  const signature = createSign('RSA-SHA256').update(signingInput).sign(sa.private_key).toString('base64url')
  return `${signingInput}.${signature}`
}

export function aggregateGscRows(
  rows: GscRow[],
  week: { start: string; end: string },
  firstIncompleteDate?: string,
): GscWeekResult {
  let clicks = 0
  let impressions = 0
  let weighted = 0
  const dates = new Set<string>()
  for (const row of rows) {
    const date = Array.isArray(row?.keys) ? row.keys[0] : undefined
    if (typeof date !== 'string' || date < week.start || date > week.end) continue
    if (![row.clicks, row.impressions, row.position].every((n) => typeof n === 'number' && Number.isFinite(n))) continue
    clicks += row.clicks
    impressions += row.impressions
    weighted += row.position * row.impressions
    dates.add(date)
  }
  const daysCovered = dates.size
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : null,
    position: impressions > 0 ? weighted / impressions : null,
    daysCovered,
    partial: daysCovered < 7 || (firstIncompleteDate !== undefined && firstIncompleteDate <= week.end),
  }
}

export async function fetchGscWeek(
  week: { start: string; end: string },
  opts: {
    serviceAccountJson?: string
    siteUrl?: string
    fetchImpl?: typeof fetch
    now?: Date
    timeoutMs?: number
  },
): Promise<GscWeekResult | null> {
  try {
    const sa = parseServiceAccount(opts.serviceAccountJson)
    if (!sa || !opts.siteUrl) return null
    const doFetch = opts.fetchImpl ?? fetch
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
    const nowSec = Math.floor((opts.now ?? new Date()).getTime() / 1000)

    const assertion = signServiceAccountJwt(sa, nowSec)
    const tokenRes = await doFetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }).toString(),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!tokenRes.ok) return null
    const tokenJson: unknown = await tokenRes.json()
    const accessToken = (tokenJson as { access_token?: unknown } | null)?.access_token
    if (typeof accessToken !== 'string' || !accessToken) return null

    const queryRes = await doFetch(`${QUERY_BASE}/${encodeURIComponent(opts.siteUrl)}/searchAnalytics/query`, {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        startDate: week.start,
        endDate: week.end,
        dimensions: ['date'],
        dataState: 'all',
        rowLimit: 100,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!queryRes.ok) return null
    const data = (await queryRes.json()) as {
      rows?: unknown
      metadata?: { first_incomplete_date?: unknown }
    } | null
    if (!data || typeof data !== 'object') return null
    // Pas de lignes = aucune donnee pour la semaine (valide) ; autre forme = reponse invalide.
    if (data.rows !== undefined && !Array.isArray(data.rows)) return null
    const first = data.metadata?.first_incomplete_date
    return aggregateGscRows(
      (data.rows ?? []) as GscRow[],
      week,
      typeof first === 'string' ? first : undefined,
    )
  } catch {
    return null
  }
}
