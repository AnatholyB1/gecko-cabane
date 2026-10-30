/**
 * Database-side collector for the weekly KPI report (Phase 8, KPI-02).
 * Pure aggregators + one read function. A source that fails is stored null with
 * status 'unavailable', never 0 (D-03). No customer PII is ever selected or kept.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchAllPages } from '@/utils/paginate'
import { resolveActiveSubscribers, type LedgerRow } from '@/utils/newsletter-ledger'
import { previousWeek, weekUtcBounds } from '@/utils/kpi-week'
import type { KpiSourcesStatus, KpiSourceState, WeeklyKpiRow } from '@/types/database'

type Week = { start: string; end: string }

export interface ReservationKpiRow {
  id?: number
  status: string
  reservation_date: string
  party_size: number
  created_at: string
  source: string
}

export interface NewsletterEventRow {
  event: string
  count: number
}

export interface ReviewClickRow {
  month: string
  source: string
  kind: string
  hits: number
}

const SOURCES = ['site', 'whatsapp', 'telephone', 'sans_reservation'] as const

// ---------------------------------------------------------------------------
// Pure aggregators
// ---------------------------------------------------------------------------

export function aggregateReservations(rows: ReservationKpiRow[], week: Week) {
  const { fromIso, toIso } = weekUtcBounds(week.start)
  const from = Date.parse(fromIso)
  const to = Date.parse(toIso)
  const bySource: Record<string, number> = Object.fromEntries(SOURCES.map((s) => [s, 0]))
  let created = 0
  let covers = 0
  let completed = 0
  let noShow = 0
  let cancelled = 0

  for (const r of rows) {
    const t = Date.parse(r.created_at)
    if (t >= from && t < to) {
      created++
      if (r.source in bySource) bySource[r.source]++
    }
    if (r.reservation_date >= week.start && r.reservation_date <= week.end) {
      if (r.status === 'confirmed' || r.status === 'completed') covers += r.party_size
      if (r.status === 'completed') completed++
      else if (r.status === 'no_show') noShow++
      else if (r.status === 'cancelled') cancelled++
    }
  }

  const denominator = completed + noShow
  return {
    reservations_new: created,
    covers,
    completed,
    no_show: noShow,
    cancelled,
    no_show_rate: denominator === 0 ? null : noShow / denominator,
    reservations_by_source: bySource,
  }
}

export function aggregateNewsletterEvents(rows: NewsletterEventRow[]) {
  const sum = (event: string) => rows.filter((r) => r.event === event).reduce((n, r) => n + r.count, 0)
  return {
    newsletter_popup_shown: sum('popup_shown'),
    newsletter_subscribed: sum('subscribed'),
    newsletter_confirmed: sum('confirmed'),
    newsletter_unsubscribed: sum('unsubscribed'),
  }
}

/** Cumulative hits of one month, keyed `${source}:${kind}`. */
export function snapshotReviewClicks(rows: ReviewClickRow[], month: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of rows) {
    if (r.month !== month) continue
    const key = `${r.source}:${r.kind}`
    out[key] = (out[key] ?? 0) + r.hits
  }
  return out
}

/**
 * Weekly delta of the monthly /review counters. Same month: current - previous snapshot.
 * Month rollover: current cumul + (last cumul of the previous month - old snapshot).
 * Missing reference data => null (unknown, not 0). A negative raw delta means the counter was
 * reset or decremented: the whole delta is then unknown (null), never clamped to 0.
 * The delta is an approximation: it spans two run instants (Monday to Monday), not Monday-Sunday.
 */
export function computeReviewClickDelta(
  current: Record<string, number>,
  currentMonth: string,
  previous: Record<string, number> | null,
  previousMonth: string | null,
  lastOfPreviousMonth: Record<string, number> | null
): Record<string, number> | null {
  if (!previous || !previousMonth) return null
  const out: Record<string, number> = {}
  if (previousMonth === currentMonth) {
    for (const key of new Set([...Object.keys(current), ...Object.keys(previous)])) {
      const d = (current[key] ?? 0) - (previous[key] ?? 0)
      if (d < 0) return null
      out[key] = d
    }
    return out
  }
  if (!lastOfPreviousMonth) return null
  for (const key of new Set([...Object.keys(current), ...Object.keys(previous), ...Object.keys(lastOfPreviousMonth)])) {
    const d = (current[key] ?? 0) + (lastOfPreviousMonth[key] ?? 0) - (previous[key] ?? 0)
    if (d < 0) return null
    out[key] = d
  }
  return out
}

function monthIndex(m: string): number {
  const [y, mo] = m.split('-').map(Number)
  return y * 12 + (mo - 1)
}

/**
 * Keeps a re-collection from degrading a stored row: a value that came back null while the row
 * already holds a non-null value is dropped from the write (the old value stays), the /review
 * snapshot trio is never rewritten once stored (a re-run would shift the next week's base), and
 * a source reported unavailable keeps its previous non-unavailable status when its data is kept.
 */
export function preserveExistingValues(
  values: Partial<WeeklyKpiRow>,
  status: KpiSourcesStatus,
  existing: WeeklyKpiRow | null
): { values: Partial<WeeklyKpiRow>; status: KpiSourcesStatus } {
  if (!existing) return { values, status }
  const out: Record<string, unknown> = { ...values }
  const kept = new Set<string>()
  for (const [key, v] of Object.entries(out)) {
    const old = (existing as unknown as Record<string, unknown>)[key]
    if (v === null && old != null) {
      delete out[key]
      kept.add(key)
    }
  }
  if (existing.review_clicks_snapshot != null) {
    delete out.review_clicks_snapshot
    delete out.review_clicks_snapshot_month
    delete out.review_clicks_week
    kept.add('review_clicks_week')
  }
  const outStatus: KpiSourcesStatus = { ...status }
  const sourceKeys: Record<string, string[]> = {
    reservations: ['reservations_new', 'covers'],
    newsletter: ['newsletter_subscribed', 'newsletter_active_total'],
    review_clicks: ['review_clicks_week'],
    search_console: ['gsc_clicks', 'gsc_impressions'],
    tripadvisor: ['tripadvisor_rank'],
  }
  for (const [src, keys] of Object.entries(sourceKeys)) {
    const k = src as keyof KpiSourcesStatus
    const prev = existing.sources_status?.[k]
    if (outStatus[k] === 'unavailable' && prev && prev !== 'unavailable' && keys.some((x) => kept.has(x))) {
      outStatus[k] = prev
    }
  }
  return { values: out as Partial<WeeklyKpiRow>, status: outStatus }
}

// ---------------------------------------------------------------------------
// Collector
// ---------------------------------------------------------------------------

// Minimal ledger columns for resolveActiveSubscribers (no locale, country, reservation link...).
const LEDGER_COLUMNS = 'id, email, consent, consented_at, confirmed_at, confirmation_sent_at'
const RESERVATION_COLUMNS = 'id, status, reservation_date, party_size, created_at, source'

export async function collectDbKpis(
  admin: SupabaseClient,
  week: Week,
  previousRow: WeeklyKpiRow | null,
  now: Date = new Date()
): Promise<{ values: Partial<WeeklyKpiRow>; status: KpiSourcesStatus }> {
  const { fromIso, toIso } = weekUtcBounds(week.start)
  // Month of the collected week (its last day), not of the run instant: a run on the 1st for a
  // week ending on the last day of the previous month snapshots that month's final cumul.
  const currentMonth = `${week.end.slice(0, 7)}-01`
  // Counters are live cumuls: only the week that just ended (relative to `now`) gets a snapshot
  // and a delta. A catch-up for an older week would store today's cumul under an old row.
  const freshWeek = previousWeek(now).start === week.start
  const prevSnapshotMonth = previousRow?.review_clicks_snapshot_month ?? null
  const months = prevSnapshotMonth && prevSnapshotMonth !== currentMonth ? [currentMonth, prevSnapshotMonth] : [currentMonth]

  const [createdRes, datedRes, eventsRes, clicksRes, ledgerRes] = await Promise.allSettled([
    fetchAllPages<ReservationKpiRow>((a, b) =>
      admin
        .from('gecko_reservations')
        .select(RESERVATION_COLUMNS, { count: 'exact' })
        .gte('created_at', fromIso)
        .lt('created_at', toIso)
        .order('id', { ascending: true })
        .range(a, b)
    ),
    fetchAllPages<ReservationKpiRow>((a, b) =>
      admin
        .from('gecko_reservations')
        .select(RESERVATION_COLUMNS, { count: 'exact' })
        .gte('reservation_date', week.start)
        .lte('reservation_date', week.end)
        .order('id', { ascending: true })
        .range(a, b)
    ),
    (async () => {
      const { data, error } = await admin
        .from('gecko_newsletter_events')
        .select('event, count')
        .gte('day', week.start)
        .lte('day', week.end)
      if (error) throw new Error(error.message)
      return (data ?? []) as NewsletterEventRow[]
    })(),
    (async () => {
      const { data, error } = await admin
        .from('gecko_review_clicks')
        .select('month, source, kind, hits')
        .in('month', months)
      if (error) throw new Error(error.message)
      return (data ?? []) as ReviewClickRow[]
    })(),
    fetchAllPages<LedgerRow>((a, b) =>
      admin
        .from('gecko_marketing_consents')
        .select(LEDGER_COLUMNS, { count: 'exact' })
        .order('id', { ascending: true })
        .range(a, b)
    ),
  ])

  const values: Partial<WeeklyKpiRow> = {}
  const status: KpiSourcesStatus = {}

  // Reservations
  if (createdRes.status === 'fulfilled' && datedRes.status === 'fulfilled') {
    const byId = new Map<number | string, ReservationKpiRow>()
    ;[...createdRes.value, ...datedRes.value].forEach((r, i) => byId.set(r.id ?? `n${i}`, r))
    Object.assign(values, aggregateReservations([...byId.values()], week))
    status.reservations = 'ok'
  } else {
    Object.assign(values, {
      reservations_new: null,
      covers: null,
      completed: null,
      no_show: null,
      cancelled: null,
      no_show_rate: null,
      reservations_by_source: null,
    })
    status.reservations = 'unavailable'
  }

  // Newsletter (events + active total)
  if (eventsRes.status === 'fulfilled') {
    Object.assign(values, aggregateNewsletterEvents(eventsRes.value))
  } else {
    Object.assign(values, {
      newsletter_popup_shown: null,
      newsletter_subscribed: null,
      newsletter_confirmed: null,
      newsletter_unsubscribed: null,
    })
  }
  // Only the count leaves this scope: the ledger rows (emails) are discarded here.
  values.newsletter_active_total = ledgerRes.status === 'fulfilled' ? resolveActiveSubscribers(ledgerRes.value).size : null
  const nlOk = Number(eventsRes.status === 'fulfilled') + Number(ledgerRes.status === 'fulfilled')
  status.newsletter = (['unavailable', 'partial', 'ok'] as KpiSourceState[])[nlOk]

  // /review clicks (monthly counters => weekly delta against the stored snapshot)
  if (clicksRes.status === 'fulfilled') {
    const current = snapshotReviewClicks(clicksRes.value, currentMonth)
    const lastOfPrev =
      prevSnapshotMonth && prevSnapshotMonth !== currentMonth ? snapshotReviewClicks(clicksRes.value, prevSnapshotMonth) : null
    // A skipped month (missed run) loses intermediate clicks: unknown, not a wrong number.
    const consecutive =
      !prevSnapshotMonth ||
      monthIndex(currentMonth) - monthIndex(prevSnapshotMonth) === 0 ||
      monthIndex(currentMonth) - monthIndex(prevSnapshotMonth) === 1
    const delta =
      freshWeek && consecutive
        ? computeReviewClickDelta(current, currentMonth, previousRow?.review_clicks_snapshot ?? null, prevSnapshotMonth, lastOfPrev)
        : null
    if (freshWeek) {
      values.review_clicks_snapshot = current
      values.review_clicks_snapshot_month = currentMonth
    }
    values.review_clicks_week = delta
    status.review_clicks = delta ? 'ok' : 'partial'
  } else {
    values.review_clicks_week = null
    values.review_clicks_snapshot = null
    values.review_clicks_snapshot_month = null
    status.review_clicks = 'unavailable'
  }

  return { values, status }
}
