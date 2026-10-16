/**
 * API validation tests
 *
 * Tests the pure validation utilities used by the API routes.
 * No mocking needed — these are deterministic, framework-free functions.
 */

import { describe, it, expect } from 'vitest'
import {
  parsePhone,
  phoneCountryForLocale,
  isEmailValid,
  normalizePhone,
  isE164Phone,
  validateReservationFields,
  isPartySizeValid,
  isReservationDateValid,
} from '../src/utils/validation'
import { bangkokNow } from '../src/utils/reservation-rules'

// ---------------------------------------------------------------------------
// parsePhone / normalizePhone
// ---------------------------------------------------------------------------

describe('parsePhone', () => {
  it('parses national numbers with their country', () => {
    expect(parsePhone('0812345678', 'TH')).toBe('+66812345678')
    expect(parsePhone('06 12 34 56 78', 'FR')).toBe('+33612345678')
    expect(parsePhone('07911 123456', 'GB')).toBe('+447911123456')
  })

  it('parses international numbers without a country', () => {
    expect(parsePhone('+49 151 12345678')).toBe('+4915112345678')
    expect(parsePhone('+66 81 234 5678')).toBe('+66812345678')
  })

  it('rejects invalid numbers', () => {
    expect(parsePhone('12345', 'FR')).toBeNull()
    expect(parsePhone('abc')).toBeNull()
    expect(parsePhone('')).toBeNull()
  })
})

describe('phoneCountryForLocale', () => {
  it('maps locales to default countries', () => {
    expect(phoneCountryForLocale('fr')).toBe('FR')
    expect(phoneCountryForLocale('en')).toBe('GB')
    expect(phoneCountryForLocale('de')).toBe('TH')
  })
})

describe('normalizePhone', () => {
  it('converts Thai local format to E.164 by default', () => {
    expect(normalizePhone('0812345678')).toBe('+66812345678')
    expect(normalizePhone('0912345678')).toBe('+66912345678')
  })

  it('strips spaces and formatting characters', () => {
    expect(normalizePhone('+66 81 234 5678')).toBe('+66812345678')
    expect(normalizePhone('+33-6-12-34-56-78')).toBe('+33612345678')
    expect(normalizePhone('+1 415 555 2671')).toBe('+14155552671')
  })

  it('passes through a valid E.164 number unchanged', () => {
    expect(normalizePhone('+33612345678')).toBe('+33612345678')
  })

  it('returns the trimmed input when the number is invalid', () => {
    expect(normalizePhone(' 12345 ')).toBe('12345')
  })
})

// ---------------------------------------------------------------------------
// isE164Phone
// ---------------------------------------------------------------------------

describe('isE164Phone', () => {
  it('accepts valid E.164 numbers', () => {
    expect(isE164Phone('+66812345678')).toBe(true)
    expect(isE164Phone('+33612345678')).toBe(true)
    expect(isE164Phone('+14155552671')).toBe(true)
  })

  it('rejects missing leading +', () => {
    expect(isE164Phone('66812345678')).toBe(false)
    expect(isE164Phone('0612345678')).toBe(false)
  })

  it('rejects too short / too long numbers', () => {
    expect(isE164Phone('+123456')).toBe(false)
    expect(isE164Phone('+12345678901234567')).toBe(false)
  })

  it('rejects formatting characters', () => {
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
    customer_email: 'jean@example.com',
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

  it('returns a French error when customer_email is missing', () => {
    const { customer_email: _omit, ...noEmail } = valid
    void _omit
    expect(validateReservationFields(noEmail)).toMatch(/obligatoires/)
    expect(validateReservationFields({ ...valid, customer_email: '' })).not.toBeNull()
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
    expect(isPartySizeValid(40)).toBe(true)
  })

  it('rejects 0 and negative numbers', () => {
    expect(isPartySizeValid(0)).toBe(false)
    expect(isPartySizeValid(-1)).toBe(false)
  })

  it('rejects sizes above 40', () => {
    expect(isPartySizeValid(41)).toBe(false)
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

describe('isEmailValid', () => {
  it('accepts normal emails', () => {
    expect(isEmailValid('jean@example.com')).toBe(true)
  })
  it('rejects malformed emails', () => {
    expect(isEmailValid('abc')).toBe(false)
    expect(isEmailValid('a@b')).toBe(false)
    expect(isEmailValid('')).toBe(false)
    expect(isEmailValid('a'.repeat(250) + '@x.com')).toBe(false)
  })
})

describe('isReservationDateValid', () => {
  it('accepts today (Krabi time)', () => {
    expect(isReservationDateValid(bangkokNow().date)).toBe(true)
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
