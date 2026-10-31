/**
 * Requêtes envoyées par l'interface « Aujourd'hui » / « Réservations » (phase 15).
 *
 * L'API de réservation est FIGÉE : ces constructeurs produisent EXACTEMENT les corps JSON de
 * l'ancienne page (mêmes clés, même ordre, mêmes valeurs). tests/reservations-ui-payloads.test.ts
 * le prouve contre une transcription littérale de l'ancien code. Aucun composant ne construit un
 * corps à la main.
 */

import type { ReservationSource, ReservationStatus } from '@/types/database'

export const RESERVATIONS_URL = '/api/reservations'
export const MANUAL_RESERVATION_URL = '/api/reservations/manual'

/** PUT { id, status } : même corps que l'ancienne `updateStatus`. */
export function statusUpdateBody(id: number, status: ReservationStatus) {
  return { id, status }
}

/** PUT { id, source } : même corps que l'ancienne `updateSource`. */
export function sourceUpdateBody(id: number, source: ReservationSource) {
  return { id, source }
}

/** PUT { id, admin_notes } : même corps que l'ancienne `saveNotes`. */
export function notesUpdateBody(id: number, adminNotes: string) {
  return { id, admin_notes: adminNotes }
}

/** DELETE /api/reservations?id= : même URL que l'ancienne `deleteReservation`. */
export function deleteUrl(id: number): string {
  return `${RESERVATIONS_URL}?id=${id}`
}

/** GET d'une journée : même paramètre `date` que l'ancienne page (le filtre de statut est fait côté client). */
export function dayUrl(date: string): string {
  return `${RESERVATIONS_URL}?date=${date}`
}

/**
 * POST /api/reservations/manual : mêmes clés, même ordre et mêmes conversions que l'ancien
 * formulaire. `allergies` (migration 019) n'est ajouté que s'il est renseigné : un formulaire
 * sans allergie envoie le corps historique à l'identique.
 */
export function manualReservationBody(fd: FormData) {
  const body: Record<string, string | number> = {
    customer_name: String(fd.get('customer_name') ?? ''),
    customer_phone: String(fd.get('customer_phone') ?? ''),
    customer_email: String(fd.get('customer_email') ?? ''),
    reservation_date: String(fd.get('reservation_date') ?? ''),
    reservation_time: String(fd.get('reservation_time') ?? ''),
    party_size: Number(fd.get('party_size')),
    source: String(fd.get('source') ?? ''),
    admin_notes: String(fd.get('admin_notes') ?? ''),
  }
  const allergies = String(fd.get('allergies') ?? '')
  if (allergies.trim() !== '') body.allergies = allergies
  return body
}

export const SERVICE_CLOSURE_URL = '/api/service-closure'

/** « Complet ce soir » (ACC-03) : GET/DELETE portent `?date=`, POST porte `{ date }` dans le corps. */
export function serviceClosureUrl(date?: string): string {
  return date ? `${SERVICE_CLOSURE_URL}?date=${encodeURIComponent(date)}` : SERVICE_CLOSURE_URL
}
