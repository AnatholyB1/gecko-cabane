/**
 * REP-03 (décision du propriétaire, 2026-10-31) : le total Google n'est plus saisi à la main,
 * la collecte KPI hebdomadaire en est la seule source. Seul le total TripAdvisor reste saisi.
 * Fonctions pures, testées sans réseau.
 */
import { isValidTotal } from './review-report'

export type TotalsPayload = { month: string; tripadvisor: number }

export type TotalsPayloadResult =
  | { ok: true; payload: TotalsPayload }
  | { ok: false; reason: 'empty' | 'invalid' }

/** Corps du PUT /api/review/stats : le mois et le seul total TripAdvisor (aucune clé `google`). */
export function buildTotalsPayload(month: string, tripadvisor: string): TotalsPayloadResult {
  if (tripadvisor.trim() === '') return { ok: false, reason: 'empty' }
  const n = Number(tripadvisor)
  if (!isValidTotal(n)) return { ok: false, reason: 'invalid' }
  return { ok: true, payload: { month, tripadvisor: n } }
}

type CollectedRow = {
  week_start: string
  week_end: string
  collected_at: string | null
  google_reviews_total: number | null
}

export type CollectedGoogle = { total: number; weekStart: string; collectedOn: string }

/** Dernier total Google collecté (semaine la plus récente qui en porte un) et sa date (jour AAAA-MM-JJ). */
export function latestCollectedGoogle(weeks: readonly CollectedRow[]): CollectedGoogle | null {
  const rows = weeks
    .filter((w) => typeof w.google_reviews_total === 'number')
    .sort((a, b) => b.week_start.localeCompare(a.week_start))
  const r = rows[0]
  if (!r) return null
  return { total: r.google_reviews_total as number, weekStart: r.week_start, collectedOn: (r.collected_at ?? r.week_end).slice(0, 10) }
}
