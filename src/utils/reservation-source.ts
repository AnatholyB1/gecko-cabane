/**
 * Reservation source and attribution helpers (RESA-06, D-04, D-05, D-06).
 * Pure functions; French labels are admin-only (no i18n).
 */

import type { Reservation, ReservationSource } from '@/types/database'

export const RESERVATION_SOURCES: readonly ReservationSource[] = [
  'site',
  'whatsapp',
  'telephone',
  'sans_reservation',
]

export function isReservationSource(v: unknown): v is ReservationSource {
  return typeof v === 'string' && (RESERVATION_SOURCES as readonly string[]).includes(v)
}

export const SOURCE_LABELS: Record<ReservationSource, string> = {
  site: 'Site',
  whatsapp: 'WhatsApp',
  telephone: 'Téléphone',
  sans_reservation: 'Sans réservation',
}

export const UTM_VALUE_RE = /^[A-Za-z0-9._~/-]{1,100}$/

/** Returns the trimmed value if it is a safe attribution token, else null. */
export function sanitizeUtm(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return UTM_VALUE_RE.test(t) ? t : null
}

/** "google / gbp", else the ref, else null. */
export function formatOrigin(
  r: Pick<Reservation, 'utm_source' | 'utm_medium' | 'ref'>
): string | null {
  const parts = [r.utm_source, r.utm_medium].filter((p): p is string => !!p)
  if (parts.length > 0) return parts.join(' / ')
  return r.ref || null
}
