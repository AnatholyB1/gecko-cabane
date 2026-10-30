import { describe, it, expect } from 'vitest'
import {
  KPI_METRICS,
  UNAVAILABLE_LABEL,
  formatDelta,
  formatKpiValue,
} from '../src/utils/kpi-format'

describe('formatKpiValue', () => {
  it('shows "non disponible" for null/undefined, never 0', () => {
    expect(UNAVAILABLE_LABEL).toBe('non disponible')
    expect(formatKpiValue(null, 'int')).toBe('non disponible')
    expect(formatKpiValue(undefined, 'rate')).toBe('non disponible')
  })
  it('keeps 0 as 0', () => {
    expect(formatKpiValue(0, 'int')).toBe('0')
  })
  it('formats rate, decimal and rank in French', () => {
    expect(formatKpiValue(0.1234, 'rate')).toBe('12,3 %')
    expect(formatKpiValue(8.456, 'decimal')).toBe('8,5')
    expect(formatKpiValue(12, 'rank')).toBe('n° 12')
  })
})

describe('formatDelta', () => {
  it('computes relative change for ints', () => {
    expect(formatDelta(12, 10, 'int')).toBe('+20 %')
    expect(formatDelta(8, 10, 'int')).toBe('-20 %')
  })
  it('falls back to absolute change when previous is 0', () => {
    expect(formatDelta(12, 0, 'int')).toBe('+12')
  })
  it('returns a dash when a side is missing', () => {
    expect(formatDelta(null, 10, 'int')).toBe('—')
    expect(formatDelta(10, null, 'int')).toBe('—')
  })
  it('uses points for rates', () => {
    expect(formatDelta(0.2, 0.1, 'rate')).toBe('+10,0 pts')
  })
  it('uses places for rank (lower is better)', () => {
    expect(formatDelta(8, 12, 'rank')).toBe('+4 places')
    expect(formatDelta(12, 8, 'rank')).toBe('-4 places')
  })
})

describe('KPI_METRICS', () => {
  it('has unique keys and non-empty labels', () => {
    const keys = KPI_METRICS.map((m) => m.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const m of KPI_METRICS) expect(m.label.length).toBeGreaterThan(0)
  })
  it('covers the required metrics', () => {
    const keys = KPI_METRICS.map((m) => m.key as string)
    for (const k of [
      'reservations_new', 'covers', 'no_show', 'no_show_rate',
      'newsletter_confirmed', 'newsletter_unsubscribed', 'newsletter_active_total',
      'gsc_clicks', 'gsc_impressions', 'gsc_ctr', 'gsc_position',
      'tripadvisor_rank', 'google_reviews_total', 'google_new_reviews', 'google_min_rating',
    ]) expect(keys).toContain(k)
  })
})
