/**
 * Formatage des KPI hebdomadaires (phase 8). Pur : imports de type seulement,
 * utilisable par l'email et par la page admin client.
 * D-03 : une valeur absente s'affiche « non disponible », jamais 0.
 */

import type { WeeklyKpiRow } from '@/types/database'

export const UNAVAILABLE_LABEL = 'non disponible'

export type KpiMetricKind = 'int' | 'rate' | 'decimal' | 'rank'

export const KPI_METRICS: readonly {
  key: keyof WeeklyKpiRow
  label: string
  kind: KpiMetricKind
  betterWhen: 'up' | 'down'
}[] = [
  { key: 'reservations_new', label: 'Nouvelles réservations', kind: 'int', betterWhen: 'up' },
  { key: 'covers', label: 'Couverts', kind: 'int', betterWhen: 'up' },
  { key: 'no_show', label: 'No-show', kind: 'int', betterWhen: 'down' },
  { key: 'no_show_rate', label: 'Taux de no-show', kind: 'rate', betterWhen: 'down' },
  { key: 'newsletter_confirmed', label: 'Inscriptions newsletter confirmées', kind: 'int', betterWhen: 'up' },
  { key: 'newsletter_unsubscribed', label: 'Désinscriptions newsletter', kind: 'int', betterWhen: 'down' },
  { key: 'newsletter_active_total', label: 'Abonnés newsletter actifs', kind: 'int', betterWhen: 'up' },
  { key: 'gsc_clicks', label: 'Clics Google (Search Console)', kind: 'int', betterWhen: 'up' },
  { key: 'gsc_impressions', label: 'Impressions Google', kind: 'int', betterWhen: 'up' },
  { key: 'gsc_ctr', label: 'CTR Google', kind: 'rate', betterWhen: 'up' },
  { key: 'gsc_position', label: 'Position moyenne Google', kind: 'decimal', betterWhen: 'down' },
  { key: 'tripadvisor_rank', label: 'Rang TripAdvisor', kind: 'rank', betterWhen: 'down' },
  { key: 'google_reviews_total', label: 'Avis Google (total)', kind: 'int', betterWhen: 'up' },
  { key: 'google_new_reviews', label: 'Nouveaux avis Google', kind: 'int', betterWhen: 'up' },
  { key: 'google_min_rating', label: 'Note la plus basse (Google)', kind: 'int', betterWhen: 'up' },
]

const nf = (digits: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function sign(n: number): string {
  return n > 0 ? '+' : n < 0 ? '-' : ''
}

export function formatKpiValue(v: number | null | undefined, kind: KpiMetricKind): string {
  if (!isNum(v)) return UNAVAILABLE_LABEL
  switch (kind) {
    case 'rate':
      return `${nf(1).format(v * 100)} %`
    case 'decimal':
      return nf(1).format(v)
    case 'rank':
      return `n° ${nf(0).format(v)}`
    default:
      return nf(0).format(v)
  }
}

export function formatDelta(
  current: number | null | undefined,
  previous: number | null | undefined,
  kind: KpiMetricKind,
): string {
  if (!isNum(current) || !isNum(previous)) return '—'

  if (kind === 'rate') {
    const pts = (current - previous) * 100
    return `${sign(pts)}${nf(1).format(Math.abs(pts))} pts`
  }
  if (kind === 'rank') {
    // Un rang plus petit est meilleur : gagner des places = +.
    const gained = previous - current
    const abs = Math.abs(gained)
    return `${sign(gained)}${nf(0).format(abs)} ${abs > 1 ? 'places' : 'place'}`
  }
  if (kind === 'decimal') {
    const d = current - previous
    return `${sign(d)}${nf(1).format(Math.abs(d))}`
  }
  const diff = current - previous
  if (previous === 0) return `${sign(diff)}${nf(0).format(Math.abs(diff))}`
  const pct = Math.round((diff / previous) * 100)
  return `${sign(pct)}${nf(0).format(Math.abs(pct))} %`
}
