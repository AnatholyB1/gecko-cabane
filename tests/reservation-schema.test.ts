/**
 * Reservation request schema tests (zod) — stable error codes, E.164 output.
 */

import { describe, it, expect } from 'vitest'
import {
  reservationRequestSchema,
  firstErrorCode,
  MARKETING_CONSENT_VERSION,
} from '../src/utils/reservation-schema'

const valid = {
  customer_name: '  Jean Dupont ',
  customer_email: ' Jean@Example.COM ',
  customer_phone: '07911 123456',
  phone_country: 'GB',
  reservation_date: '2026-12-01',
  reservation_time: '19:00',
  party_size: 4,
  locale: 'en',
}

function codeFor(body: unknown) {
  const r = reservationRequestSchema.safeParse(body)
  if (r.success) throw new Error('expected failure')
  return firstErrorCode(r.error)
}

describe('reservationRequestSchema', () => {
  it('accepts a valid body and normalizes it', () => {
    const r = reservationRequestSchema.safeParse(valid)
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data.customer_phone).toBe('+447911123456')
    expect(r.data.customer_email).toBe('jean@example.com')
    expect(r.data.customer_name).toBe('Jean Dupont')
    expect(r.data.marketing_consent).toBe(false)
  })

  it('defaults locale to fr and uses it for the phone country', () => {
    const { phone_country: _c, locale: _l, ...rest } = valid
    void _c
    void _l
    const r = reservationRequestSchema.safeParse({ ...rest, customer_phone: '06 12 34 56 78' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.locale).toBe('fr')
      expect(r.data.customer_phone).toBe('+33612345678')
    }
  })

  it('accepts an international number without a country', () => {
    const r = reservationRequestSchema.safeParse({ ...valid, customer_phone: '+49 151 12345678' })
    expect(r.success && r.data.customer_phone).toBe('+4915112345678')
  })

  it('maps a missing email to invalid_email', () => {
    const { customer_email: _e, ...rest } = valid
    void _e
    expect(codeFor(rest)).toBe('invalid_email')
    expect(codeFor({ ...valid, customer_email: 'nope' })).toBe('invalid_email')
  })

  it('maps a bad phone to invalid_phone', () => {
    expect(codeFor({ ...valid, customer_phone: 'abc' })).toBe('invalid_phone')
    expect(codeFor({ ...valid, customer_phone: '12345' })).toBe('invalid_phone')
  })

  it('maps party size problems to invalid_party_size', () => {
    expect(codeFor({ ...valid, party_size: 41 })).toBe('invalid_party_size')
    expect(codeFor({ ...valid, party_size: 0 })).toBe('invalid_party_size')
  })

  it('rejects a string party size (no coercion)', () => {
    expect(reservationRequestSchema.safeParse({ ...valid, party_size: '4' }).success).toBe(false)
  })

  it('rejects a non-boolean marketing_consent', () => {
    expect(reservationRequestSchema.safeParse({ ...valid, marketing_consent: 'yes' }).success).toBe(false)
    const ok = reservationRequestSchema.safeParse({ ...valid, marketing_consent: true })
    expect(ok.success && ok.data.marketing_consent).toBe(true)
  })

  it('rejects bad date/time formats and oversized strings', () => {
    expect(codeFor({ ...valid, reservation_date: '01/12/2026' })).toBe('invalid_fields')
    expect(codeFor({ ...valid, reservation_time: '25:00' })).toBe('invalid_fields')
    expect(codeFor({ ...valid, customer_name: 'x'.repeat(101) })).toBe('invalid_fields')
    expect(codeFor({ ...valid, company_url: 'x'.repeat(201) })).toBe('invalid_fields')
  })

  it('exposes a server-side consent version constant', () => {
    expect(MARKETING_CONSENT_VERSION).toBe('reservation-form-2026-10-16')
  })
})
