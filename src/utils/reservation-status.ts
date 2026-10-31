/**
 * Reservation status presentation + transitions (Phase 15, RSV-01) — pure.
 *
 * PUT /api/reservations (frozen) only checks that the status belongs to the
 * enum: it does NOT validate transitions. UI_TRANSITIONS is the set of
 * transitions the admin UI proposes (D2 contract §4); it never exceeds what PUT
 * accepts. Server-side effects are unchanged: confirmed and cancelled send a
 * customer email; confirmed|completed make a reservation eligible for the J+1
 * review invitation; no_show/cancelled do not.
 */

import type { ReservationStatus } from '@/types/database'

export const RESERVATION_STATUS_ORDER: readonly ReservationStatus[] = [
  'pending', 'confirmed', 'completed', 'cancelled', 'no_show',
]

export type StatusTone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral'

export const STATUS_LABELS: Record<ReservationStatus, { label: string; tone: StatusTone }> = {
  pending: { label: 'En attente', tone: 'warn' },
  confirmed: { label: 'Confirmée', tone: 'ok' },
  completed: { label: 'Terminée', tone: 'info' },
  cancelled: { label: 'Annulée', tone: 'danger' },
  // Owner decision 2026-10-31: badge "Non présenté", button "Absent".
  no_show: { label: 'Non présenté', tone: 'neutral' },
}

/** Filter chip labels (plural). */
export const STATUS_FILTER_LABELS: Record<ReservationStatus, string> = {
  pending: 'À confirmer',
  confirmed: 'Confirmées',
  completed: 'Terminées',
  cancelled: 'Annulées',
  no_show: 'Non présentés',
}

export type ReservationAction = {
  /** Target status sent to PUT. */
  to: ReservationStatus
  label: string
  /** Progressive label shown while the request is in flight. */
  busyLabel: string
  /** Only cancellation asks for a confirmation dialog. */
  needsConfirm: boolean
  /** One 'primary' per row at most. */
  emphasis: 'primary' | 'secondary' | 'danger-outline'
}

const CONFIRM: ReservationAction = { to: 'confirmed', label: 'Confirmer', busyLabel: 'Confirmation…', needsConfirm: false, emphasis: 'primary' }
const COMPLETE: ReservationAction = { to: 'completed', label: 'Terminer', busyLabel: 'Clôture…', needsConfirm: false, emphasis: 'primary' }
const NO_SHOW: ReservationAction = { to: 'no_show', label: 'Absent', busyLabel: 'Enregistrement…', needsConfirm: false, emphasis: 'secondary' }
const CANCEL: ReservationAction = { to: 'cancelled', label: 'Annuler', busyLabel: 'Annulation…', needsConfirm: true, emphasis: 'danger-outline' }

const ACTIONS: Record<ReservationStatus, readonly ReservationAction[]> = {
  pending: [CONFIRM, CANCEL],
  confirmed: [COMPLETE, NO_SHOW, CANCEL],
  completed: [],
  cancelled: [],
  no_show: [],
}

/** Transitions proposed by the UI (D2 §4). "Rétablir" (no_show -> confirmed) is deliberately absent, see phase 15 report. */
export const UI_TRANSITIONS: Record<ReservationStatus, readonly ReservationStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'no_show', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
}

export function isReservationStatus(value: unknown): value is ReservationStatus {
  return typeof value === 'string' && (RESERVATION_STATUS_ORDER as readonly string[]).includes(value)
}

/** Actions to render for a status, in display order (fresh array each call). */
export function nextActions(status: ReservationStatus): ReservationAction[] {
  return (ACTIONS[status] ?? []).map((a) => ({ ...a }))
}

export function canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return (UI_TRANSITIONS[from] ?? []).includes(to)
}

export function statusLabel(status: ReservationStatus): string {
  return STATUS_LABELS[status]?.label ?? status
}

/** "Confirmer la réservation de {nom}, {heure}" style accessible name. */
export function actionAriaLabel(action: ReservationAction, name: string, time: string): string {
  const verb: Partial<Record<ReservationStatus, string>> = {
    confirmed: 'Confirmer',
    completed: 'Terminer',
    no_show: 'Marquer absente',
    cancelled: 'Annuler',
  }
  return `${verb[action.to] ?? action.label} la réservation de ${name}, ${time}`
}

/** Statuses counted in the "reserved covers" total (not cancelled / no_show). */
export function isActiveForCovers(status: ReservationStatus): boolean {
  return status !== 'cancelled' && status !== 'no_show'
}
