import { describe, it, expect } from 'vitest'
import {
  phoneCountry,
  isThaiPhone,
  resolveCountry,
  resolveResident,
  krabiDateOf,
  initialLastVisit,
  buildSubscriberProfile,
} from '../src/utils/newsletter-segments'
import type { LedgerRow } from '../src/utils/newsletter-ledger'

function row(over: Partial<LedgerRow> = {}): LedgerRow {
  return {
    id: 1,
    email: 'a@b.co',
    consent: true,
    source: 'footer',
    locale: 'de',
    consented_at: '2026-10-17T03:00:00Z',
    confirmed_at: '2026-10-17T03:10:00Z',
    confirmation_sent_at: '2026-10-17T03:00:01Z',
    country: null,
    is_resident: false,
    brevo_synced_at: null,
    last_visit_synced: null,
    reservation_id: null,
    ...over,
  }
}

describe('phone helpers', () => {
  it('detects the phone country', () => {
    expect(phoneCountry('+33612345678')).toBe('FR')
    expect(phoneCountry('+66819585945')).toBe('TH')
  })
  it('never throws on odd input', () => {
    expect(() => phoneCountry('+14155550100')).not.toThrow()
    expect(phoneCountry(null)).toBeNull()
    expect(phoneCountry('garbage')).toBeNull()
  })
  it('detects Thai numbers', () => {
    expect(isThaiPhone('+66819585945')).toBe(true)
    expect(isThaiPhone('+33612345678')).toBe(false)
    expect(isThaiPhone(null)).toBe(false)
  })
})

describe('resolveCountry', () => {
  it('prefers the phone country', () => {
    expect(resolveCountry({ phoneCountry: 'FR', geoCountry: 'TH', source: 'footer' })).toBe('FR')
  })
  it('uses geo for web sources', () => {
    expect(resolveCountry({ phoneCountry: null, geoCountry: 'DE', source: 'popup' })).toBe('DE')
  })
  it('ignores geo for wifi and bill_qr', () => {
    expect(resolveCountry({ phoneCountry: null, geoCountry: 'TH', source: 'wifi' })).toBeNull()
    expect(resolveCountry({ phoneCountry: null, geoCountry: 'TH', source: 'bill_qr' })).toBeNull()
  })
})

describe('resolveResident', () => {
  it('uses the checkbox or a Thai phone', () => {
    expect(resolveResident({ checkbox: false, phone: '+66819585945' })).toBe(true)
    expect(resolveResident({ checkbox: true, phone: null })).toBe(true)
    expect(resolveResident({ checkbox: false, phone: '+447911123456' })).toBe(false)
  })
})

describe('Krabi dates', () => {
  it('converts to the Krabi calendar day', () => {
    expect(krabiDateOf('2026-10-17T18:30:00Z')).toBe('2026-10-18')
  })
  it('sets an initial visit for bill_qr and wifi only', () => {
    expect(initialLastVisit({ source: 'bill_qr', confirmed_at: '2026-10-17T03:00:00Z' })).toBe('2026-10-17')
    expect(initialLastVisit({ source: 'wifi', confirmed_at: '2026-10-17T03:00:00Z' })).toBe('2026-10-17')
    expect(initialLastVisit({ source: 'footer', confirmed_at: '2026-10-17T03:00:00Z' })).toBeNull()
    expect(initialLastVisit({ source: 'bill_qr', confirmed_at: null })).toBeNull()
  })
})

describe('buildSubscriberProfile', () => {
  it('maps a ledger row', () => {
    const p = buildSubscriberProfile(row({ country: 'DE' }), {})
    expect(p).toEqual({
      email: 'a@b.co',
      language: 'de',
      country: 'DE',
      resident: false,
      source: 'footer',
      consentAt: '2026-10-17T03:00:00Z',
      lastVisit: null,
    })
  })
  it('uses the reservation phone', () => {
    const p = buildSubscriberProfile(row({ source: 'reservation_form', locale: 'fr' }), {
      phone: '+33612345678',
    })
    expect(p.country).toBe('FR')
    expect(p.resident).toBe(false)
    const th = buildSubscriberProfile(row({ source: 'reservation_form' }), { phone: '+66819585945' })
    expect(th.resident).toBe(true)
  })
  it('falls back to en for unknown locales and uses the QR visit date', () => {
    const p = buildSubscriberProfile(row({ source: 'bill_qr', locale: 'xx', country: 'TH' }), {})
    expect(p.language).toBe('en')
    expect(p.country).toBeNull()
    expect(p.lastVisit).toBe('2026-10-17')
  })
})
