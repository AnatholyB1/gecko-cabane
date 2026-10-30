/**
 * Saisie manuelle hebdomadaire (plan 08-09, KPI-07, D-03, D-08).
 */

import { describe, it, expect } from 'vitest'
import {
  manualKpiSchema,
  shouldAlertLowRating,
  lowRatingAlertEmail,
} from '../src/utils/kpi-manual'

const base = { week_start: '2026-10-26' }

describe('manualKpiSchema', () => {
  it('accepts a full valid entry', () => {
    const r = manualKpiSchema.safeParse({
      ...base,
      google_reviews_total: 120,
      google_new_reviews: 4,
      google_min_rating: 5,
      manual_note: '  RAS  ',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.manual_note).toBe('RAS')
  })

  it.each([6, 0, 2.5, -1])('rejects rating %s', (n) => {
    expect(manualKpiSchema.safeParse({ ...base, google_min_rating: n }).success).toBe(false)
  })

  it('rejects a week_start that is not a Monday', () => {
    expect(manualKpiSchema.safeParse({ week_start: '2026-10-27' }).success).toBe(false)
  })

  it('rejects a negative total and an oversized note', () => {
    expect(manualKpiSchema.safeParse({ ...base, google_reviews_total: -1 }).success).toBe(false)
    expect(manualKpiSchema.safeParse({ ...base, manual_note: 'a'.repeat(501) }).success).toBe(false)
    expect(manualKpiSchema.safeParse({ ...base, manual_note: 'a'.repeat(500) }).success).toBe(true)
  })

  it('maps absent or empty fields to null and strips unknown keys', () => {
    const r = manualKpiSchema.parse({ ...base, manual_note: '   ', report_sent_at: 'x' })
    expect(r.google_reviews_total).toBeNull()
    expect(r.google_new_reviews).toBeNull()
    expect(r.google_min_rating).toBeNull()
    expect(r.manual_note).toBeNull()
    expect('report_sent_at' in r).toBe(false)
  })
})

describe('shouldAlertLowRating', () => {
  it.each([
    [null, 3, true],
    [4, 2, true],
    [2, 2, false],
    [2, 1, true],
    [null, 4, false],
    [3, null, false],
    [undefined, 1, true],
  ] as const)('(%s, %s) = %s', (prev, next, expected) => {
    expect(shouldAlertLowRating(prev, next)).toBe(expected)
  })
})

describe('lowRatingAlertEmail', () => {
  it('escapes the free note and keeps a one-line subject', () => {
    const m = lowRatingAlertEmail({
      weekStart: '2026-10-26',
      rating: 2,
      note: '<b>x</b>\nsuite',
      adminUrl: 'https://example.com/admin/kpi',
    })
    expect(m.html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(m.html).not.toContain('<b>x</b>')
    expect(m.subject).toMatch(/^Alerte avis/)
    expect(m.subject).not.toMatch(/[\r\n]/)
    expect(m.subject).toContain('2/5')
    expect(m.subject).toContain('2026-10-26')
    expect(m.text).toContain('https://example.com/admin/kpi')
    expect(m.text).toContain('48 h')
  })

  it('handles a missing note', () => {
    const m = lowRatingAlertEmail({ weekStart: '2026-10-26', rating: 1, note: null, adminUrl: 'u' })
    expect(m.text).toContain('Aucune note')
  })
})
