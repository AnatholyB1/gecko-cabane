/**
 * Pure validation utilities — no framework, no external deps, fully testable.
 */

// ---------------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------------

/** Normalize a raw phone input to E.164 format. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s\-().]/g, '')
  // Thai mobile: 0[6-9]XXXXXXXX → +66XXXXXXXXX
  if (/^0[6-9]\d{8}$/.test(digits)) return '+66' + digits.slice(1)
  if (/^\+\d{8,15}$/.test(digits)) return digits
  return digits
}

/** Check that a phone string is a valid E.164 number (+XXXXXXXXXXX, 8-15 digits). */
export function isE164Phone(phone: string): boolean {
  return /^\+\d{8,15}$/.test(phone)
}

// ---------------------------------------------------------------------------
// Reservation fields
// ---------------------------------------------------------------------------

/** Return an error message if any required reservation field is missing, or null. */
export function validateReservationFields(body: Record<string, unknown>): string | null {
  const { customer_name, customer_phone, reservation_date, reservation_time, party_size } = body
  if (!customer_name || !customer_phone || !reservation_date || !reservation_time || !party_size) {
    return 'Veuillez remplir tous les champs obligatoires'
  }
  return null
}

/** Party size must be between 1 and 50. */
export function isPartySizeValid(size: unknown): boolean {
  if (typeof size !== 'number') return false
  return Number.isInteger(size) && size >= 1 && size <= 50
}

/**
 * Reservation date must not be strictly in the past (today is OK).
 * `dateStr` is a YYYY-MM-DD string.
 */
export function isReservationDateValid(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  return !isNaN(d.getTime()) && d >= today
}

/** OTP code must be exactly 6 digits. */
export function isOtpCode(code: string): boolean {
  return /^\d{6}$/.test(code)
}
