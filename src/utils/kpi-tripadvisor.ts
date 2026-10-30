/**
 * Rang TripAdvisor via l'API REST Bright Data Web Unlocker (08-03, D-02c).
 *
 * Variables d'environnement (serveur uniquement) :
 *   BRIGHTDATA_API_KEY, BRIGHTDATA_ZONE, TRIPADVISOR_URL
 *
 * Hypotheses a confirmer :
 *   A3 - tarif Web Unlocker ~1,5 USD / 1000 requetes (a confirmer).
 *   A4 - format du rang « #N of M » (EN) / « N° N sur M » (FR) : NON valide sur
 *        un echantillon reel ; a verifier hors prod avant de declarer la source fiable.
 *   A7 - la zone Web Unlocker est creee par le proprietaire (nom dans BRIGHTDATA_ZONE).
 *
 * Cout plafonne : au plus UN appel par invocation, sans nouvelle tentative.
 * Tout echec (cle absente, URL refusee, HTTP non-2xx, 429, timeout, rang
 * introuvable) renvoie null (« non disponible »), jamais une valeur inventee.
 * L'outil MCP scrape_as_markdown n'est pas utilisable a l'execution.
 * Aucun log : la cle API ne transite que par l'en-tete Authorization.
 */

export const BRIGHTDATA_ENDPOINT = 'https://api.brightdata.com/request'

export type TripadvisorRank = { rank: number; total: number }

const MAX_TOTAL = 100_000
const DEFAULT_TIMEOUT_MS = 20_000

// Total avec separateurs de milliers eventuels (virgule, point, espaces).
const NUM = '\\d{1,3}(?:[,.\\u00a0\\u202f ]\\d{3})+|\\d+'

// Motifs bornes (pas de quantificateurs imbriques ambigus).
const RANK_PATTERNS: RegExp[] = [
  new RegExp(`#\\s?(\\d{1,6})\\s{1,3}of\\s{1,3}(${NUM})`, 'i'),
  new RegExp(`n\\s?[°º˚]\\s?(\\d{1,6})\\s{1,3}sur\\s{1,3}(${NUM})`, 'i'),
]

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&deg;': '°',
  '&ordm;': 'º',
  '&amp;': '&',
  '&#35;': '#',
  '&#176;': '°',
  '&#xb0;': '°',
}

function toPlainText(input: string): string {
  return input
    .replace(/<[^>]{0,2000}>/g, ' ')
    .replace(/&(?:nbsp|deg|ordm|amp);|&#35;|&#176;|&#xb0;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
}

export function parseTripadvisorRank(htmlOrText: string): TripadvisorRank | null {
  if (typeof htmlOrText !== 'string' || htmlOrText.length === 0) return null
  const text = toPlainText(htmlOrText)
  for (const pattern of RANK_PATTERNS) {
    const m = pattern.exec(text)
    if (!m) continue
    const rank = Number.parseInt(m[1], 10)
    const total = Number.parseInt(m[2].replace(/[,.   ]/g, ''), 10)
    if (Number.isFinite(rank) && Number.isFinite(total) && rank >= 1 && rank <= total && total <= MAX_TOTAL) {
      return { rank, total }
    }
  }
  return null
}

export function isAllowedTripadvisorUrl(url: string | undefined): boolean {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && /^(www\.)?tripadvisor\.[a-z.]{2,6}$/.test(u.hostname)
  } catch {
    return false
  }
}

export async function fetchTripadvisorRank(opts: {
  apiKey?: string
  zone?: string
  url?: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}): Promise<TripadvisorRank | null> {
  const { apiKey, zone, url } = opts
  if (!apiKey || !zone || !url) return null
  if (!isAllowedTripadvisorUrl(url)) return null
  try {
    const doFetch = opts.fetchImpl ?? fetch
    const res = await doFetch(BRIGHTDATA_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ zone, url, format: 'raw' }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    })
    if (!res.ok) return null
    return parseTripadvisorRank(await res.text())
  } catch {
    return null
  }
}
