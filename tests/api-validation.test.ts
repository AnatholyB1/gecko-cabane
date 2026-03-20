/**
 * API validation tests
 *
 * Tests the pure validation utilities used by the API routes.
 * No mocking needed — these are deterministic, framework-free functions.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizePhone,
  isE164Phone,
  validateReservationFields,
  isPartySizeValid,
  isReservationDateValid,
  isOtpCode,
} from '../src/utils/validation'

// ---------------------------------------------------------------------------
// normalizePhone
// ---------------------------------------------------------------------------

describe('normalizePhone', () => {
  it('converts Thai local format (08x) to E.164', () => {
    expect(normalizePhone('0812345678')).toBe('+66812345678')
    expect(normalizePhone('0912345678')).toBe('+66912345678')
    expect(normalizePhone('0612345678')).toBe('+66612345678')
  })

  it('strips spaces and formatting characters', () => {
    expect(normalizePhone('+66 81 234 5678')).toBe('+66812345678')
    expect(normalizePhone('+33-6-12-34-56-78')).toBe('+33612345678')
    expect(normalizePhone('+1 (415) 555-1234')).toBe('+14155551234')
  })

  it('passes through a valid E.164 number unchanged', () => {
    expect(normalizePhone('+33612345678')).toBe('+33612345678')
    expect(normalizePhone('+6681234567')).toBe('+6681234567')
  })

  it('does not convert Thai numbers starting with 05x (non-mobile)', () => {
    // 053… is a landline — should NOT get +66 prefix automatically
    expect(normalizePhone('0531234567')).toBe('0531234567')
  })
})

// ---------------------------------------------------------------------------
// isE164Phone
// ---------------------------------------------------------------------------

describe('isE164Phone', () => {
  it('accepts valid E.164 numbers', () => {
    expect(isE164Phone('+66812345678')).toBe(true)
    expect(isE164Phone('+33612345678')).toBe(true)
    expect(isE164Phone('+15551234567')).toBe(true)
    expect(isE164Phone('+4412345678')).toBe(true)   // 10 digits (min viable)
  })

  it('rejects missing leading +', () => {
    expect(isE164Phone('66812345678')).toBe(false)
    expect(isE164Phone('0812345678')).toBe(false)
  })

  it('rejects numbers that are too short', () => {
    expect(isE164Phone('+123456')).toBe(false)   // 6 digits — below 8
    expect(isE164Phone('+1234567')).toBe(false)  // 7 digits — below 8
  })

  it('rejects numbers that are too long', () => {
    expect(isE164Phone('+12345678901234567')).toBe(false) // 17 digits — above 15
  })

  it('rejects non-digit characters after +', () => {
    expect(isE164Phone('+66 812345678')).toBe(false)
    expect(isE164Phone('+66-812345678')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isE164Phone('')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// validateReservationFields
// ---------------------------------------------------------------------------

describe('validateReservationFields', () => {
  const valid = {
    customer_name: 'Jean Dupont',
    customer_phone: '+66812345678',
    reservation_date: '2026-12-01',
    reservation_time: '19:00',
    party_size: 2,
  }

  it('returns null when all required fields are present', () => {
    expect(validateReservationFields(valid)).toBeNull()
  })

  it('returns an error when customer_name is missing', () => {
    expect(validateReservationFields({ ...valid, customer_name: '' })).not.toBeNull()
    expect(validateReservationFields({ ...valid, customer_name: undefined })).not.toBeNull()
  })

  it('returns an error when customer_phone is missing', () => {
    expect(validateReservationFields({ ...valid, customer_phone: '' })).not.toBeNull()
  })

  it('returns an error when reservation_date is missing', () => {
    expect(validateReservationFields({ ...valid, reservation_date: '' })).not.toBeNull()
  })

  it('returns an error when reservation_time is missing', () => {
    expect(validateReservationFields({ ...valid, reservation_time: '' })).not.toBeNull()
  })

  it('returns an error when party_size is missing', () => {
    expect(validateReservationFields({ ...valid, party_size: 0 })).not.toBeNull()
    expect(validateReservationFields({ ...valid, party_size: undefined })).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// isPartySizeValid
// ---------------------------------------------------------------------------

describe('isPartySizeValid', () => {
  it('accepts valid party sizes', () => {
    expect(isPartySizeValid(1)).toBe(true)
    expect(isPartySizeValid(10)).toBe(true)
    expect(isPartySizeValid(50)).toBe(true)
  })

  it('rejects 0 and negative numbers', () => {
    expect(isPartySizeValid(0)).toBe(false)
    expect(isPartySizeValid(-1)).toBe(false)
  })

  it('rejects sizes above 50', () => {
    expect(isPartySizeValid(51)).toBe(false)
    expect(isPartySizeValid(100)).toBe(false)
  })

  it('rejects non-integer values', () => {
    expect(isPartySizeValid(2.5)).toBe(false)
    expect(isPartySizeValid('2')).toBe(false)
    expect(isPartySizeValid(null)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isReservationDateValid
// ---------------------------------------------------------------------------

describe('isReservationDateValid', () => {
  it('accepts today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(isReservationDateValid(today)).toBe(true)
  })

  it('accepts a future date', () => {
    expect(isReservationDateValid('2099-01-01')).toBe(true)
  })

  it('rejects a past date', () => {
    expect(isReservationDateValid('2000-01-01')).toBe(false)
    expect(isReservationDateValid('2026-01-01')).toBe(false) // before March 2026
  })

  it('rejects an invalid date string', () => {
    expect(isReservationDateValid('not-a-date')).toBe(false)
    expect(isReservationDateValid('')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isOtpCode
// ---------------------------------------------------------------------------

describe('isOtpCode', () => {
  it('accepts exactly 6 digits', () => {
    expect(isOtpCode('123456')).toBe(true)
    expect(isOtpCode('000000')).toBe(true)
    expect(isOtpCode('999999')).toBe(true)
  })

  it('rejects fewer than 6 digits', () => {
    expect(isOtpCode('12345')).toBe(false)
    expect(isOtpCode('')).toBe(false)
  })

  it('rejects more than 6 digits', () => {
    expect(isOtpCode('1234567')).toBe(false)
  })

  it('rejects non-digit characters', () => {
    expect(isOtpCode('12345a')).toBe(false)
    expect(isOtpCode('12 345')).toBe(false)
    expect(isOtpCode('12-345')).toBe(false)
  })
})
