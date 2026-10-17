/**
 * Acquisition attribution (RESA-06, D-05): utm_source, utm_medium and ref are kept
 * in sessionStorage (last touch) and sent with the reservation POST.
 * The server re-validates; the client only bounds the values.
 */

export const ATTRIBUTION_STORAGE_KEY = 'gc_attr'
export const ATTRIBUTION_KEYS = ['utm_source', 'utm_medium', 'ref'] as const
const MAX_LEN = 100

export type Attribution = Partial<Record<(typeof ATTRIBUTION_KEYS)[number], string>>

export function parseAttribution(search: string): Attribution | null {
  const params = new URLSearchParams(search)
  const out: Attribution = {}
  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key)?.trim().slice(0, MAX_LEN)
    if (value) out[key] = value
  }
  return Object.keys(out).length > 0 ? out : null
}

export function captureAttribution(): void {
  if (typeof window === 'undefined') return
  try {
    const parsed = parseAttribution(window.location.search)
    if (parsed) window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    // storage unavailable: attribution is best effort
  }
}

export function readAttribution(): Attribution {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw) as Record<string, unknown>
    const out: Attribution = {}
    for (const key of ATTRIBUTION_KEYS) {
      const v = data?.[key]
      if (typeof v === 'string' && v.length >= 1 && v.length <= MAX_LEN) out[key] = v
    }
    return out
  } catch {
    return {}
  }
}
