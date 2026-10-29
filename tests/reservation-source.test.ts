/**
 * Reservation source / UTM helpers (RESA-06, D-04, D-05, D-06)
 */

import { describe, it, expect } from 'vitest'
import {
  RESERVATION_SOURCES,
  SOURCE_LABELS,
  isReservationSource,
  sanitizeUtm,
  formatOrigin,
} from '../src/utils/reservation-source'

describe('reservation sources', () => {
  it('lists the 4 sources', () => {
    expect([...RESERVATION_SOURCES]).toEqual(['site', 'whatsapp', 'telephone', 'sans_reservation'])
  })

  it('isReservationSource accepts only exact values', () => {
    for (const s of RESERVATION_SOURCES) expect(isReservationSource(s)).toBe(true)
    for (const v of ['Site', '', null, 'email', undefined, 3]) expect(isReservationSource(v)).toBe(false)
  })

  it('has French labels for exactly those keys', () => {
    expect(SOURCE_LABELS).toEqual({
      site: 'Site',
      whatsapp: 'WhatsApp',
      telephone: 'Téléphone',
      sans_reservation: 'Sans réservation',
    })
  })
})

describe('sanitizeUtm', () => {
  it('accepts safe values and trims', () => {
    for (const v of ['google', 'gbp', 'gbp_menu', 'news-2026', 'a.b~c/d']) {
      expect(sanitizeUtm(v)).toBe(v)
    }
    expect(sanitizeUtm('  google ')).toBe('google')
  })

  it('rejects unsafe or invalid values', () => {
    for (const v of ['', '  ', 'a b', '<script>', 'x'.repeat(101), 42, null, undefined]) {
      expect(sanitizeUtm(v)).toBeNull()
    }
  })
})

describe('formatOrigin', () => {
  it('joins source and medium', () => {
    expect(formatOrigin({ utm_source: 'google', utm_medium: 'gbp', ref: null })).toBe('google / gbp')
  })
  it('falls back to ref', () => {
    expect(formatOrigin({ utm_source: null, utm_medium: null, ref: 'newsletter' })).toBe('newsletter')
  })
  it('returns null when empty', () => {
    expect(formatOrigin({ utm_source: null, utm_medium: null, ref: null })).toBeNull()
  })
})
