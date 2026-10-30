import { describe, it, expect } from 'vitest'
import { weeklyReportEmail } from '../src/utils/kpi-report-email'
import { KPI_METRICS } from '../src/utils/kpi-format'
import type { WeeklyKpiRow } from '../src/types/database'

function row(over: Partial<WeeklyKpiRow> = {}): WeeklyKpiRow {
  return {
    week_start: '2026-10-26',
    week_end: '2026-11-01',
    reservations_new: 12,
    covers: 40,
    completed: null,
    no_show: 1,
    cancelled: null,
    no_show_rate: 0.05,
    reservations_by_source: null,
    review_clicks_week: null,
    review_clicks_snapshot: null,
    review_clicks_snapshot_month: null,
    newsletter_popup_shown: null,
    newsletter_subscribed: null,
    newsletter_confirmed: 3,
    newsletter_unsubscribed: 0,
    newsletter_active_total: 120,
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
    manual_note: null,
    manual_updated_at: null,
    created_at: '2026-11-02T00:00:00Z',
    updated_at: '2026-11-02T00:00:00Z',
    ...over,
  } as WeeklyKpiRow
}

const adminUrl = 'https://geckocabanerestaurant.com/admin/kpi'
const build = (r: WeeklyKpiRow, previous: WeeklyKpiRow | null = null, mode: 'test' | 'live' = 'test') =>
  weeklyReportEmail({ row: r, previous, mode, adminUrl })

describe('weeklyReportEmail', () => {
  it('test: bandeau TEST dans html et texte, sujet [TEST]', () => {
    const e = build(row())
    expect(e.subject.startsWith('[TEST] ')).toBe(true)
    expect(e.html).toContain('TEST')
    expect(e.text).toContain('TEST')
  })
  it('live: pas de bandeau ni de prefixe', () => {
    const e = build(row(), null, 'live')
    expect(e.subject).not.toContain('[TEST]')
    expect(e.html).not.toContain('MODE TEST')
    expect(e.text).not.toContain('MODE TEST')
  })
  it('une ligne par KPI, colonnes Semaine / S-1 / Evolution', () => {
    const e = build(row(), row({ reservations_new: 10 }))
    for (const m of KPI_METRICS) {
      expect(e.html).toContain(m.label)
      expect(e.text).toContain(m.label)
    }
    expect(e.html).toContain('Semaine')
    expect(e.html).toContain('S-1')
    expect(e.html).toContain('Évolution')
  })
  it('valeur absente => non disponible, jamais 0', () => {
    const e = build(row({ gsc_clicks: null }))
    expect(e.text).toMatch(/Clics Google \(Search Console\)[^\n]*non disponible/)
  })
  it('previous null => premiere semaine', () => {
    const e = build(row(), null)
    expect(e.text).toContain('première semaine')
    expect(e.html).toContain('première semaine')
  })
  it('sources indisponibles listees', () => {
    const e = build(row({ sources_status: { search_console: 'unavailable', tripadvisor: 'ok' } }))
    expect(e.html).toContain('Sources non disponibles')
    expect(e.text).toContain('search_console')
  })
  it('aucune alerte / lecture non disponible par defaut', () => {
    const e = build(row())
    expect(e.text).toContain('Aucune alerte cette semaine')
    expect(e.text).toContain('Lecture non disponible cette semaine')
  })
  it('narrative fournie: lecture et actions', () => {
    const e = build(
      row({
        narrative: { lecture: ['L1 ok', 'L2 ok', 'L3 ok'], actions: ['A1 do', 'A2 do', 'A3 do'], source: 'fallback' },
      })
    )
    for (const s of ['L1 ok', 'L2 ok', 'L3 ok', 'A1 do', 'A2 do', 'A3 do']) {
      expect(e.html).toContain(s)
      expect(e.text).toContain(s)
    }
  })
  it('alertes affichees', () => {
    const e = build(
      row({
        alerts: [
          { code: 'x', severity: 'critical', metric: 'covers', message: 'Chute des couverts', current: 1, previous: 9 },
        ],
      })
    )
    expect(e.html).toContain('Chute des couverts')
    expect(e.text).not.toContain('Aucune alerte')
  })
  it('contenu non fiable echappe', () => {
    const e = build(
      row({
        manual_note: '<img src=x onerror=alert(1)>',
        narrative: { lecture: ['<script>alert(1)</script>'], actions: ['b'], source: 'ai' },
      })
    )
    expect(e.html).not.toContain('<script')
    expect(e.html).not.toContain('<img src=x')
    expect(e.html).toContain('&lt;script&gt;')
  })
  it('note manuelle libre: owner-only (test), jamais dans le rapport live', () => {
    const r = row({ manual_note: 'Avis de Mme Dupont' })
    expect(build(r, null, 'test').text).toContain('Dupont')
    const live = build(r, null, 'live')
    expect(live.text).not.toContain('Dupont')
    expect(live.html).not.toContain('Dupont')
    expect(live.html).not.toContain('Note manuelle')
  })
  it('gsc partiel et clics /review', () => {
    const e = build(row({ gsc_partial: true, gsc_days_covered: 5, review_clicks_week: { google: 4 } }))
    expect(e.text).toContain('données partielles, 5 jours')
    expect(e.text).toContain('approximation')
    expect(e.text).toContain('google')
  })
  it('lien vers le tableau de bord', () => {
    const e = build(row())
    expect(e.html).toContain(adminUrl)
    expect(e.text).toContain(adminUrl)
  })
})
