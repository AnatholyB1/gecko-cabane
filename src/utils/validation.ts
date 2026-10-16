/**
 * Pure validation utilities — no framework, fully testable.
 */

import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min'
import { MAX_PARTY_SIZE, bangkokNow } from './reservation-rules'

// ---------------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------------

/**
 * Parse a raw phone input into an E.164 string, or null when invalid.
 * `country` is the default country for national-format numbers.
 */
export function parsePhone(raw: string, country?: CountryCode): string | null {
  const parsed = parsePhoneNumberFromString(raw.trim(), country)
  return parsed && parsed.isValid() ? parsed.number : null
}

/** Normalize a raw phone input to E.164; returns the trimmed input when invalid. */
export function normalizePhone(raw: string, country: CountryCode = 'TH'): string {
  return parsePhone(raw, country) ?? raw.trim()
}

/** Check that a phone string is a valid number already in canonical E.164 form. */
export function isE164Phone(phone: string): boolean {
  return phone.startsWith('+') && parsePhone(phone) === phone
}

/** Default phone country for a UI locale (fr -> FR, en -> GB, fallback TH). */
export function phoneCountryForLocale(locale: string): CountryCode {
  if (locale === 'fr') return 'FR'
  if (locale === 'en') return 'GB'
  return 'TH'
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

/** Simple email format check (max 254 chars). */
export function isEmailValid(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

// ---------------------------------------------------------------------------
// Reservation fields
// ---------------------------------------------------------------------------

/** Return an error message if any required reservation field is missing, or null. */
export function validateReservationFields(body: Record<string, unknown>): string | null {
  const { customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size } = body
  if (!customer_name || !customer_email || !customer_phone || !reservation_date || !reservation_time || !party_size) {
    return 'Veuillez remplir tous les champs obligatoires'
  }
  return null
}

/** Party size must be an integer between 1 and MAX_PARTY_SIZE (40). */
export function isPartySizeValid(size: unknown): boolean {
  if (typeof size !== 'number') return false
  return Number.isInteger(size) && size >= 1 && size <= MAX_PARTY_SIZE
}

/**
 * Reservation date must not be strictly in the past (today is OK), in Krabi time.
 * `dateStr` is a YYYY-MM-DD string.
 */
export function isReservationDateValid(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(new Date(dateStr).getTime())) return false
  return dateStr >= bangkokNow().date
}
