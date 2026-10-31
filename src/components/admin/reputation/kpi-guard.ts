/**
 * Logique pure du rapport KPI : garde-fou d'envoi (REP-02), indicateurs, alertes.
 * Aucun appel réseau ici : les effets sont injectés (testables sans navigateur).
 *
 * Principe : rien n'est envoyé en affichant la page, en changeant d'onglet ou de
 * semaine. Le seul envoi atteignable depuis l'admin est l'alerte email déclenchée
 * par PUT /api/kpi (note minimale <= 3, nouvelle ou modifiée) : elle passe TOUJOURS
 * par `submitManualEntry`, qui exige une confirmation avant l'appel.
 */
import { ALERT_THRESHOLDS } from '@/utils/kpi-alerts'
import { KPI_METRICS, formatDelta, formatKpiValue, type KpiMetricKind } from '@/utils/kpi-format'
import type { KpiAlert, KpiReportMode, KpiSourceKey, WeeklyKpiRow } from '@/types/database'

export const TEST_REPORTS_TARGET = 2
/** Date au plus tôt du passage en live (décision propriétaire). */
export const LIVE_NOT_BEFORE = '2026-11-16'
export const GUARD_PHRASE = 'Aucun envoi live avant le 2026-11-16 et sans accord du propriétaire.'
export const LIVE_PASSAGE_SENTENCE = `Passage en live : décision du propriétaire après ${TEST_REPORTS_TARGET} rapports TEST vérifiés (au plus tôt mi-novembre 2026).`

export const SOURCE_LABELS: Record<KpiSourceKey, string> = {
  reservations: 'Réservations',
  newsletter: 'Newsletter',
  review_clicks: 'Clics /review',
  search_console: 'Search Console',
  tripadvisor: 'TripAdvisor',
  google_reviews: 'Avis Google',
  manual_reviews: 'Avis saisis',
}

/** Les 7 indicateurs du tableau (D4) ; les 15 restent dans le détail de la semaine. */
export const KEY_METRIC_KEYS: ReadonlyArray<keyof WeeklyKpiRow> = [
  'reservations_new',
  'covers',
  'no_show_rate',
  'gsc_clicks',
  'gsc_position',
  'tripadvisor_rank',
  'google_reviews_total',
]

export const KEY_METRICS = KEY_METRIC_KEYS.map((k) => KPI_METRICS.find((m) => m.key === k)!).filter(Boolean)

export function unavailableSources(row: WeeklyKpiRow): string[] {
  return Object.entries(row.sources_status ?? {})
    .filter(([, state]) => state === 'unavailable')
    .map(([key]) => SOURCE_LABELS[key as KpiSourceKey] ?? key)
}

export function formatWeek(row: Pick<WeeklyKpiRow, 'week_start' | 'week_end'>): string {
  return `${row.week_start} → ${row.week_end}`
}

/**
 * Mode affiché : celui du dernier rapport réellement envoyé ; TEST sinon (le
 * serveur est en TEST par défaut, tout ce qui n'est pas exactement « live » est TEST).
 * C'est un affichage : le mode se règle côté serveur (KPI_REPORT_MODE), jamais ici.
 */
export function reportModeOf(weeks: ReadonlyArray<Pick<WeeklyKpiRow, 'report_mode' | 'report_sent_at'>>): KpiReportMode {
  const last = weeks.find((w) => w.report_sent_at != null && w.report_mode != null)
  return last?.report_mode === 'live' ? 'live' : 'test'
}

/** Date du jour à Krabi, `YYYY-MM-DD`. */
export function krabiToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export function liveDateReached(today: string): boolean {
  return today >= LIVE_NOT_BEFORE
}

export type LiveCondition = { id: 'tests' | 'date' | 'owner'; label: string; detail: string; done: boolean }

export function liveConditions(testReportsSent: number | null, today: string): LiveCondition[] {
  const testsDone = testReportsSent !== null && testReportsSent >= TEST_REPORTS_TARGET
  const dateDone = liveDateReached(today)
  return [
    {
      id: 'tests',
      label: `${TEST_REPORTS_TARGET} rapports TEST vérifiés`,
      detail: `${testReportsSent ?? '—'} sur ${TEST_REPORTS_TARGET}, ${testsDone ? 'rempli' : 'à remplir'}.`,
      done: testsDone,
    },
    {
      id: 'date',
      label: 'Date',
      detail: `au plus tôt le ${LIVE_NOT_BEFORE}, ${dateDone ? 'rempli' : 'à remplir'}.`,
      done: dateDone,
    },
    {
      id: 'owner',
      label: 'Accord du propriétaire',
      detail: 'décision hors de cette page, à remplir.',
      done: false,
    },
  ]
}

// ---------------------------------------------------------------------------
// Alerte note basse : confirmation avant enregistrement
// ---------------------------------------------------------------------------

/** Même règle que le serveur (shouldAlertLowRating) : note basse nouvelle ou modifiée. */
export function shouldConfirmAlert(previous: number | null | undefined, next: number | null): boolean {
  return next !== null && next <= ALERT_THRESHOLDS.lowRatingMax && next !== previous
}

export type ManualPayload = {
  week_start: string
  google_reviews_total: number | null
  google_new_reviews: number | null
  google_min_rating: number | null
  manual_note: string
}

export type ManualResult = { status: 'cancelled' } | { status: 'saved'; alerted: boolean }

/**
 * Enregistre la saisie manuelle. Si l'enregistrement déclenche l'alerte email
 * immédiate (note <= 3), `confirm` est appelé AVANT `save` et un refus annule tout :
 * `save` (PUT /api/kpi) n'est alors jamais appelé.
 */
export async function submitManualEntry(deps: {
  payload: ManualPayload
  previousMinRating: number | null | undefined
  confirm: () => Promise<boolean>
  save: (payload: ManualPayload) => Promise<{ alerted: boolean }>
}): Promise<ManualResult> {
  if (shouldConfirmAlert(deps.previousMinRating, deps.payload.google_min_rating)) {
    const ok = await deps.confirm()
    if (!ok) return { status: 'cancelled' }
  }
  const { alerted } = await deps.save(deps.payload)
  return { status: 'saved', alerted }
}

/** Libellés de confirmation conservés tels quels (toasts). Le tiret long est celui du code d'origine. */
export function savedMessage(alerted: boolean): string {
  return alerted ? 'Saisie enregistrée — alerte envoyée au propriétaire' : 'Saisie enregistrée'
}

// ---------------------------------------------------------------------------
// Écarts et alertes
// ---------------------------------------------------------------------------

export type DeltaView = { text: string; direction: 'up' | 'down' | 'flat' | 'na'; tone: 'good' | 'bad' | 'neutral' }

export function deltaView(
  current: number | null,
  previous: number | null,
  kind: KpiMetricKind,
  betterWhen: 'up' | 'down',
): DeltaView {
  const text = formatDelta(current, previous, kind)
  if (current === null || previous === null || !Number.isFinite(current) || !Number.isFinite(previous)) {
    return { text, direction: 'na', tone: 'neutral' }
  }
  const diff = current - previous
  if (diff === 0) return { text, direction: 'flat', tone: 'neutral' }
  const up = diff > 0
  const good = betterWhen === 'up' ? up : !up
  return { text, direction: up ? 'up' : 'down', tone: good ? 'good' : 'bad' }
}

export function criticalAlerts(row: WeeklyKpiRow | undefined): KpiAlert[] {
  return (row?.alerts ?? []).filter((a) => a.severity === 'critical')
}

export { formatKpiValue }
