/**
 * Comparaison S-1 et alertes du rapport KPI hebdomadaire (phase 8, KPI-03).
 * Module pur : aucun import serveur. Une valeur null n'est jamais traitee
 * comme 0 (pas de delta, pas d'alerte).
 */

import type { KpiAlert, KpiSourceKey, WeeklyKpiRow } from '@/types/database'
import { KPI_METRICS, formatKpiValue } from './kpi-format'

// [ASSUMED] A2 - seuils a valider par le proprietaire (specification introuvable).
// Voir docs/kpi/KPI-SETUP.md section 9. Seul endroit ou ces valeurs sont definies.
export const ALERT_THRESHOLDS = {
  reservationsDropPct: 0.3,
  reservationsMinBase: 5,
  noShowRateMax: 0.15,
  noShowMinCount: 2,
  gscClicksDropPct: 0.3,
  gscPositionWorsen: 3,
  tripadvisorRankWorsen: 3,
  lowRatingMax: 3,
  sourceUnavailableWeeks: 2,
} as const

export type AlertThresholds = { [K in keyof typeof ALERT_THRESHOLDS]: number }

export type MetricComparison = {
  key: string
  current: number | null
  previous: number | null
  delta: number | null
  deltaPct: number | null
}

export type KpiComparison = { firstWeek: boolean; metrics: MetricComparison[] }

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

export function compareWeeks(current: WeeklyKpiRow, previous: WeeklyKpiRow | null): KpiComparison {
  const metrics = KPI_METRICS.map((m) => {
    const c = num(current[m.key])
    const p = previous ? num(previous[m.key]) : null
    const delta = c !== null && p !== null ? c - p : null
    const deltaPct = delta !== null && p !== null && p !== 0 ? delta / p : null
    return { key: m.key as string, current: c, previous: p, delta, deltaPct }
  })
  return { firstWeek: previous === null, metrics }
}

const fmt = (key: string, v: number | null) => {
  const m = KPI_METRICS.find((x) => x.key === key)
  return formatKpiValue(v, m?.kind ?? 'int')
}

const pct = (x: number) => `${Math.round(x * 100)} %`

export function detectAlerts(
  current: WeeklyKpiRow,
  previous: WeeklyKpiRow | null,
  thresholds: AlertThresholds = ALERT_THRESHOLDS,
): KpiAlert[] {
  const t = thresholds
  const out: KpiAlert[] = []

  const pair = (key: keyof WeeklyKpiRow) => ({
    c: num(current[key]),
    p: previous ? num(previous[key]) : null,
  })

  // Reservations en baisse
  {
    const { c, p } = pair('reservations_new')
    if (c !== null && p !== null && p >= t.reservationsMinBase && p > 0) {
      const drop = (p - c) / p
      if (drop >= t.reservationsDropPct) {
        out.push({
          code: 'reservations_drop',
          severity: 'warning',
          metric: 'reservations_new',
          message: `Les nouvelles réservations passent de ${fmt('reservations_new', p)} à ${fmt('reservations_new', c)} (baisse de ${pct(drop)}).`,
          current: c,
          previous: p,
        })
      }
    }
  }

  // No-show eleve
  {
    const ns = num(current.no_show)
    const rate = num(current.no_show_rate)
    if (ns !== null && rate !== null && ns >= t.noShowMinCount && rate > t.noShowRateMax) {
      out.push({
        code: 'no_show_high',
        severity: 'warning',
        metric: 'no_show_rate',
        message: `${fmt('no_show', ns)} no-show cette semaine, soit un taux de ${fmt('no_show_rate', rate)}.`,
        current: rate,
        previous: previous ? num(previous.no_show_rate) : null,
      })
    }
  }

  // Clics Google en baisse
  {
    const { c, p } = pair('gsc_clicks')
    if (c !== null && p !== null && p > 0) {
      const drop = (p - c) / p
      if (drop >= t.gscClicksDropPct) {
        out.push({
          code: 'gsc_clicks_drop',
          severity: 'warning',
          metric: 'gsc_clicks',
          message: `Les clics Google passent de ${fmt('gsc_clicks', p)} à ${fmt('gsc_clicks', c)} (baisse de ${pct(drop)}).`,
          current: c,
          previous: p,
        })
      }
    }
  }

  // Position Google degradee (plus grand = pire)
  {
    const { c, p } = pair('gsc_position')
    if (c !== null && p !== null && c - p >= t.gscPositionWorsen) {
      out.push({
        code: 'gsc_position_worse',
        severity: 'warning',
        metric: 'gsc_position',
        message: `La position moyenne Google passe de ${fmt('gsc_position', p)} à ${fmt('gsc_position', c)}.`,
        current: c,
        previous: p,
      })
    }
  }

  // Rang TripAdvisor degrade
  {
    const { c, p } = pair('tripadvisor_rank')
    if (c !== null && p !== null && c - p >= t.tripadvisorRankWorsen) {
      out.push({
        code: 'tripadvisor_rank_worse',
        severity: 'warning',
        metric: 'tripadvisor_rank',
        message: `Le rang TripAdvisor passe de ${fmt('tripadvisor_rank', p)} à ${fmt('tripadvisor_rank', c)}.`,
        current: c,
        previous: p,
      })
    }
  }

  // Desinscriptions > inscriptions confirmees
  {
    const un = num(current.newsletter_unsubscribed)
    const co = num(current.newsletter_confirmed)
    if (un !== null && co !== null && un > co) {
      out.push({
        code: 'unsubscribes_exceed',
        severity: 'warning',
        metric: 'newsletter_unsubscribed',
        message: `${fmt('newsletter_unsubscribed', un)} désinscriptions pour ${fmt('newsletter_confirmed', co)} inscriptions confirmées cette semaine.`,
        current: un,
        previous: co,
      })
    }
  }

  // Note basse
  {
    const r = num(current.google_min_rating)
    if (r !== null && r <= t.lowRatingMax) {
      out.push({
        code: 'low_rating',
        severity: 'critical',
        metric: 'google_min_rating',
        message: `Un avis Google à ${fmt('google_min_rating', r)} sur 5 a été publié cette semaine : à traiter rapidement.`,
        current: r,
        previous: previous ? num(previous.google_min_rating) : null,
      })
    }
  }

  // Source indisponible sur 2 semaines consecutives
  if (previous && t.sourceUnavailableWeeks <= 2) {
    for (const k of Object.keys(current.sources_status ?? {}) as KpiSourceKey[]) {
      if (current.sources_status[k] === 'unavailable' && previous.sources_status?.[k] === 'unavailable') {
        out.push({
          code: 'source_unavailable',
          severity: 'warning',
          metric: k,
          message: `La source « ${k} » est indisponible depuis ${t.sourceUnavailableWeeks} semaines consécutives.`,
          current: null,
          previous: null,
        })
      }
    }
  }

  return out
}
