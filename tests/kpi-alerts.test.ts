import { describe, it, expect } from 'vitest'
import { ALERT_THRESHOLDS, compareWeeks, detectAlerts, type AlertThresholds } from '../src/utils/kpi-alerts'
import type { WeeklyKpiRow } from '../src/types/database'

function row(over: Partial<WeeklyKpiRow> = {}): WeeklyKpiRow {
  return {
    week_start: '2026-10-19',
    week_end: '2026-10-25',
    reservations_new: null,
    covers: null,
    completed: null,
    no_show: null,
    cancelled: null,
    no_show_rate: null,
    reservations_by_source: null,
    review_clicks_week: null,
    review_clicks_snapshot: null,
    review_clicks_snapshot_month: null,
    newsletter_popup_shown: null,
    newsletter_subscribed: null,
    newsletter_confirmed: null,
    newsletter_unsubscribed: null,
    newsletter_active_total: null,
    gsc_clicks: null,
    gsc_impressions: null,
    gsc_ctr: null,
    gsc_position: null,
    gsc_days_covered: null,
    gsc_partial: null,
    tripadvisor_rank: null,
    tripadvisor_total: null,
    tripadvisor_checked_at: null,
    sources_status: {},
    alerts: [],
    narrative: null,
    report_mode: null,
    report_sent_at: null,
    collected_at: null,
    google_reviews_total: null,
    google_new_reviews: null,
    google_min_rating: null,
    ...over,
  } as WeeklyKpiRow
}

const codes = (c: WeeklyKpiRow, p: WeeklyKpiRow | null, t?: AlertThresholds) =>
  detectAlerts(c, p, t).map((a) => a.code)

describe('compareWeeks', () => {
  it('premiere semaine : firstWeek et deltas null', () => {
    const r = compareWeeks(row({ reservations_new: 4 }), null)
    expect(r.firstWeek).toBe(true)
    expect(r.metrics.every((m) => m.delta === null && m.deltaPct === null)).toBe(true)
  })
  it('calcule delta et deltaPct', () => {
    const r = compareWeeks(row({ reservations_new: 6 }), row({ reservations_new: 10 }))
    const m = r.metrics.find((x) => x.key === 'reservations_new')!
    expect(r.firstWeek).toBe(false)
    expect(m.delta).toBe(-4)
    expect(m.deltaPct).toBeCloseTo(-0.4)
  })
  it('null d un cote : pas de delta', () => {
    const r = compareWeeks(row({ reservations_new: null }), row({ reservations_new: 10 }))
    const m = r.metrics.find((x) => x.key === 'reservations_new')!
    expect(m.delta).toBeNull()
    expect(m.deltaPct).toBeNull()
  })
  it('previous 0 : deltaPct null', () => {
    const r = compareWeeks(row({ covers: 3 }), row({ covers: 0 }))
    const m = r.metrics.find((x) => x.key === 'covers')!
    expect(m.delta).toBe(3)
    expect(m.deltaPct).toBeNull()
  })
})

describe('detectAlerts', () => {
  it('reservations_drop : -40 % avec base >= 5', () => {
    expect(codes(row({ reservations_new: 6 }), row({ reservations_new: 10 }))).toContain('reservations_drop')
  })
  it('reservations : base < 5 => aucune alerte', () => {
    expect(codes(row({ reservations_new: 2 }), row({ reservations_new: 4 }))).not.toContain('reservations_drop')
  })
  it('reservations null cette semaine => aucune alerte', () => {
    expect(codes(row({ reservations_new: null }), row({ reservations_new: 10 }))).toEqual([])
  })
  it('no_show_high', () => {
    expect(codes(row({ no_show: 3, no_show_rate: 0.2 }), null)).toContain('no_show_high')
  })
  it('no_show : moins de 2 => aucune alerte', () => {
    expect(codes(row({ no_show: 1, no_show_rate: 0.5 }), null)).not.toContain('no_show_high')
  })
  it('gsc_clicks_drop', () => {
    expect(codes(row({ gsc_clicks: 60 }), row({ gsc_clicks: 100 }))).toContain('gsc_clicks_drop')
  })
  it('gsc_position_worse : 8 -> 12 oui, 8 -> 10 non', () => {
    expect(codes(row({ gsc_position: 12 }), row({ gsc_position: 8 }))).toContain('gsc_position_worse')
    expect(codes(row({ gsc_position: 10 }), row({ gsc_position: 8 }))).not.toContain('gsc_position_worse')
  })
  it('tripadvisor_rank_worse : 10 -> 13 oui, 10 -> 12 non', () => {
    expect(codes(row({ tripadvisor_rank: 13 }), row({ tripadvisor_rank: 10 }))).toContain('tripadvisor_rank_worse')
    expect(codes(row({ tripadvisor_rank: 12 }), row({ tripadvisor_rank: 10 }))).not.toContain('tripadvisor_rank_worse')
  })
  it('unsubscribes_exceed', () => {
    expect(codes(row({ newsletter_unsubscribed: 5, newsletter_confirmed: 2 }), null)).toContain('unsubscribes_exceed')
  })
  it('low_rating : 3 critique, 4 et null rien', () => {
    const a = detectAlerts(row({ google_min_rating: 3 }), null).find((x) => x.code === 'low_rating')
    expect(a?.severity).toBe('critical')
    expect(codes(row({ google_min_rating: 4 }), null)).not.toContain('low_rating')
    expect(codes(row({ google_min_rating: null }), null)).not.toContain('low_rating')
  })
  it('source_unavailable : deux semaines de suite seulement', () => {
    const cur = row({ sources_status: { search_console: 'unavailable' } })
    const prevU = row({ sources_status: { search_console: 'unavailable' } })
    const prevOk = row({ sources_status: { search_console: 'ok' } })
    const a = detectAlerts(cur, prevU).find((x) => x.code === 'source_unavailable')
    expect(a?.metric).toBe('search_console')
    expect(codes(cur, prevOk)).not.toContain('source_unavailable')
    expect(codes(cur, null)).not.toContain('source_unavailable')
  })
  it('seuils passes en argument', () => {
    const c = row({ reservations_new: 6 })
    const p = row({ reservations_new: 10 })
    expect(codes(c, p, { ...ALERT_THRESHOLDS, reservationsDropPct: 0.5 })).not.toContain('reservations_drop')
  })
  it('messages francais non vides avec chiffres', () => {
    const al = detectAlerts(row({ reservations_new: 6 }), row({ reservations_new: 10 }))
    expect(al[0].message.length).toBeGreaterThan(10)
    expect(al[0].message).toMatch(/6/)
    expect(al[0].message).toMatch(/10/)
  })
})
