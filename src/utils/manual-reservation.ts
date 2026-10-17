/**
 * Manual (admin) reservation validation (RESA-06, D-06).
 * Pure; builds the value field by field from an allowlist (no mass assignment).
 * 'site' is excluded: only the public form produces it (D-04).
 */

import type { ReservationSource } from '@/types/database'
import { parsePhone, isEmailValid } from '@/utils/validation'

export const MANUAL_SOURCES = ['whatsapp', 'telephone', 'sans_reservation'] as const satisfies readonly ReservationSource[]

export type ManualReservation = {
  customer_name: string
  customer_phone: string
  customer_email: string | null
  reservation_date: string
  reservation_time: string
  party_size: number
  admin_notes: string | null
  locale: 'fr' | 'en'
  source: (typeof MANUAL_SOURCES)[number]
}

type Result = { ok: true; value: ManualReservation } | { ok: false; error: string }

function isRealDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

export function validateManualReservation(body: unknown): Result {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

  const name = str(b.customer_name)
  if (name.length < 2 || name.length > 100) return { ok: false, error: 'Nom invalide' }

  const source = (MANUAL_SOURCES as readonly unknown[]).includes(b.source)
    ? (b.source as ManualReservation['source'])
    : null
  if (!source) return { ok: false, error: 'Source invalide' }

  let phone = str(b.customer_phone)
  if (phone === '' && source === 'sans_reservation') {
    phone = ''
  } else {
    const parsed = parsePhone(phone, 'TH')
    if (!parsed || parsed.length > 30) return { ok: false, error: 'Téléphone invalide' }
    phone = parsed
  }

  let email: string | null = null
  const rawEmail = str(b.customer_email)
  if (rawEmail !== '') {
    const e = rawEmail.toLowerCase()
    if (e.length > 254 || !isEmailValid(e)) return { ok: false, error: 'Email invalide' }
    email = e
  }

  const date = str(b.reservation_date)
  if (!isRealDate(date)) return { ok: false, error: 'Date invalide' }

  const time = str(b.reservation_time)
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { ok: false, error: 'Heure invalide' }

  const size = b.party_size
  if (typeof size !== 'number' || !Number.isInteger(size) || size < 1 || size > 50) {
    return { ok: false, error: 'Nombre de personnes invalide' }
  }

  let notes: string | null = null
  if (b.admin_notes !== undefined && b.admin_notes !== null) {
    if (typeof b.admin_notes !== 'string' || b.admin_notes.length > 2000) {
      return { ok: false, error: 'Notes invalides' }
    }
    notes = b.admin_notes.trim() === '' ? null : b.admin_notes
  }

  return {
    ok: true,
    value: {
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      reservation_date: date,
      reservation_time: time,
      party_size: size,
      admin_notes: notes,
      locale: b.locale === 'en' ? 'en' : 'fr',
      source,
    },
  }
}
