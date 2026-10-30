import { describe, it, expect } from 'vitest'
import {
  aggregateReservations,
  aggregateNewsletterEvents,
  snapshotReviewClicks,
  computeReviewClickDelta,
  collectDbKpis,
} from '../src/utils/kpi-collect'

const WEEK = { start: '2026-10-26', end: '2026-11-01' }

describe('aggregateReservations', () => {
  const rows = [
    // nouvelle (creee dans la semaine), service dans la semaine
    { id: 1, status: 'completed', reservation_date: '2026-10-28', party_size: 4, created_at: '2026-10-26T03:00:00Z', source: 'site' },
    { id: 2, status: 'no_show', reservation_date: '2026-10-29', party_size: 2, created_at: '2026-10-20T03:00:00Z', source: 'whatsapp' },
    { id: 3, status: 'confirmed', reservation_date: '2026-11-01', party_size: 3, created_at: '2026-10-30T03:00:00Z', source: 'site' },
    { id: 4, status: 'cancelled', reservation_date: '2026-10-30', party_size: 5, created_at: '2026-10-27T03:00:00Z', source: 'telephone' },
    // hors semaine pour les deux criteres
    { id: 5, status: 'completed', reservation_date: '2026-11-02', party_size: 9, created_at: '2026-11-01T17:00:00Z', source: 'site' },
  ]
  it('compte nouvelles, couverts, no-show et sources', () => {
    const r = aggregateReservations(rows, WEEK)
    expect(r.reservations_new).toBe(3)
    expect(r.covers).toBe(7) // 4 completed + 3 confirmed
    expect(r.completed).toBe(1)
    expect(r.no_show).toBe(1)
    expect(r.cancelled).toBe(1)
    expect(r.no_show_rate).toBe(0.5)
    expect(r.reservations_by_source).toEqual({ site: 2, whatsapp: 0, telephone: 1, sans_reservation: 0 })
  })
  it('no_show_rate null si denominateur 0', () => {
    const r = aggregateReservations([rows[2]], WEEK)
    expect(r.no_show_rate).toBeNull()
    expect(r.covers).toBe(3)
  })
  it('semaine vide => zeros reels (pas null)', () => {
    const r = aggregateReservations([], WEEK)
    expect(r.reservations_new).toBe(0)
    expect(r.covers).toBe(0)
  })
})

describe('aggregateNewsletterEvents', () => {
  it('somme par evenement', () => {
    const r = aggregateNewsletterEvents([
      { event: 'popup_shown', count: 10 },
      { event: 'popup_shown', count: 5 },
      { event: 'subscribed', count: 2 },
      { event: 'confirmed', count: 1 },
      { event: 'popup_dismissed', count: 7 },
    ])
    expect(r).toEqual({
      newsletter_popup_shown: 15,
      newsletter_subscribed: 2,
      newsletter_confirmed: 1,
      newsletter_unsubscribed: 0,
    })
  })
})

describe('review clicks', () => {
  it('snapshotReviewClicks filtre le mois et cle source:kind', () => {
    const snap = snapshotReviewClicks(
      [
        { month: '2026-11-01', source: 'qr', kind: 'visit', hits: 5 },
        { month: '2026-11-01', source: 'qr', kind: 'visit', hits: 1 },
        { month: '2026-10-01', source: 'email', kind: 'google', hits: 9 },
      ],
      '2026-11-01'
    )
    expect(snap).toEqual({ 'qr:visit': 6 })
  })
  it('meme mois: cumul - snapshot precedent', () => {
    const d = computeReviewClickDelta({ 'qr:visit': 10, 'email:google': 3 }, '2026-10-01', { 'qr:visit': 4 }, '2026-10-01', null)
    expect(d).toEqual({ 'qr:visit': 6, 'email:google': 3 })
  })
  it('mois different: cumul courant + reste du mois precedent', () => {
    const d = computeReviewClickDelta({ 'qr:visit': 2 }, '2026-11-01', { 'qr:visit': 4 }, '2026-10-01', { 'qr:visit': 9 })
    expect(d).toEqual({ 'qr:visit': 7 })
  })
  it('mois different sans dernier cumul => null', () => {
    expect(computeReviewClickDelta({ 'qr:visit': 2 }, '2026-11-01', { 'qr:visit': 4 }, '2026-10-01', null)).toBeNull()
  })
  it('snapshot precedent absent => null', () => {
    expect(computeReviewClickDelta({ 'qr:visit': 2 }, '2026-11-01', null, null, null)).toBeNull()
  })
})

// Faux client chainable: chaque table renvoie un resultat fixe, les filtres sont ignores.
type Result = { data: unknown[] | null; error: { message: string } | null; count?: number | null }
function fakeAdmin(results: Record<string, Result[] | Result>, selects: Record<string, string[]> = {}) {
  const calls: Record<string, number> = {}
  return {
    from(table: string) {
      const entry = results[table]
      const list = Array.isArray(entry) ? entry : [entry]
      const idx = calls[table] ?? 0
      calls[table] = idx + 1
      const res = list[Math.min(idx, list.length - 1)]
      const out = { data: res.data, error: res.error, count: res.count ?? (res.data ? res.data.length : null) }
      const b: Record<string, unknown> = {
        select: (cols: string) => {
          ;(selects[table] ??= []).push(cols)
          return b
        },
        gte: () => b,
        lt: () => b,
        lte: () => b,
        in: () => b,
        order: () => b,
        range: () => b,
        then: (ok: (v: typeof out) => unknown, ko?: (e: unknown) => unknown) => Promise.resolve(out).then(ok, ko),
      }
      return b
    },
  }
}

const ledgerActive = {
  id: 1,
  email: 'a@example.com',
  consent: true,
  source: 'popup',
  locale: 'fr',
  consented_at: '2026-10-01T00:00:00Z',
  confirmed_at: '2026-10-01T00:05:00Z',
  confirmation_sent_at: null,
  country: null,
  is_resident: false,
  contact_synced_at: null,
  last_visit_synced: null,
  reservation_id: null,
}

describe('collectDbKpis', () => {
  it('reservations en erreur => null + unavailable (jamais 0)', async () => {
    const admin = fakeAdmin({
      gecko_reservations: { data: null, error: { message: 'boom' } },
      gecko_newsletter_events: { data: [], error: null },
      gecko_review_clicks: { data: [], error: null },
      gecko_marketing_consents: { data: [], error: null },
    })
    const { values, status } = await collectDbKpis(admin as never, WEEK, null, new Date('2026-11-02T00:05:00Z'))
    expect(status.reservations).toBe('unavailable')
    expect(values.reservations_new).toBeNull()
    expect(values.covers).toBeNull()
    expect(values.reservations_by_source).toBeNull()
  })

  it('newsletter en erreur => null + unavailable', async () => {
    const admin = fakeAdmin({
      gecko_reservations: { data: [], error: null },
      gecko_newsletter_events: { data: null, error: { message: 'boom' } },
      gecko_review_clicks: { data: [], error: null },
      gecko_marketing_consents: { data: null, error: { message: 'boom' } },
    })
    const { values, status } = await collectDbKpis(admin as never, WEEK, null, new Date('2026-11-02T00:05:00Z'))
    expect(status.newsletter).toBe('unavailable')
    expect(values.newsletter_popup_shown).toBeNull()
    expect(values.newsletter_active_total).toBeNull()
    expect(status.reservations).toBe('ok')
    expect(values.reservations_new).toBe(0)
  })

  it('chemin nominal: ok, snapshot stocke, delta null sans snapshot precedent', async () => {
    const selects: Record<string, string[]> = {}
    const admin = fakeAdmin(
      {
        gecko_reservations: { data: [{ id: 1, status: 'completed', reservation_date: '2026-10-28', party_size: 2, created_at: '2026-10-27T03:00:00Z', source: 'site' }], error: null },
        gecko_newsletter_events: { data: [{ event: 'subscribed', count: 2 }], error: null },
        gecko_review_clicks: { data: [{ month: '2026-11-01', source: 'qr', kind: 'visit', hits: 4 }], error: null },
        gecko_marketing_consents: { data: [ledgerActive], error: null },
      },
      selects
    )
    const { values, status } = await collectDbKpis(admin as never, WEEK, null, new Date('2026-11-02T00:05:00Z'))
    expect(values.reservations_new).toBe(1)
    expect(values.newsletter_subscribed).toBe(2)
    expect(values.newsletter_active_total).toBe(1)
    expect(values.review_clicks_snapshot).toEqual({ 'qr:visit': 4 })
    expect(values.review_clicks_snapshot_month).toBe('2026-11-01')
    expect(values.review_clicks_week).toBeNull()
    expect(status.review_clicks).toBe('partial')
    expect(status.reservations).toBe('ok')
    expect(JSON.stringify(selects.gecko_reservations)).not.toMatch(/customer_/)
  })
})
