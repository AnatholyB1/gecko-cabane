/**
 * Pure helpers of the « Réservations » list (Phase 15, RSV-02): client-side search and status
 * filter, counts, grouping by service, day summary. No network, no Date/timezone: times are the
 * stored wall-clock values of Krabi, displayed as is (RSV-05).
 */

import type { Reservation, ReservationStatus } from '@/types/database'
import { formatReservationTime, serviceOf, type ServiceKey } from '@/utils/krabi-time'
import { toMinutes } from '@/utils/reservation-rules'
import { isActiveForCovers, RESERVATION_STATUS_ORDER } from '@/utils/reservation-status'

export type ListReservation = Pick<
  Reservation,
  'id' | 'reservation_time' | 'party_size' | 'status' | 'customer_name' | 'customer_phone'
> &
  Partial<Pick<Reservation, 'customer_email' | 'admin_notes' | 'occasion' | 'allergies' | 'source' | 'locale'>>

export type StatusFilter = 'all' | ReservationStatus

export function isStatusFilter(value: string): value is StatusFilter {
  return value === 'all' || (RESERVATION_STATUS_ORDER as readonly string[]).includes(value)
}

function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function digits(s: string): string {
  return s.replace(/\D/g, '')
}

/** Name, phone (digits only), email, notes, occasion, allergies. Accent- and case-insensitive. Empty query matches all. */
export function matchesQuery(r: ListReservation, query: string): boolean {
  const q = fold(query.trim())
  if (q === '') return true
  const hay = fold(
    [r.customer_name, r.customer_email, r.admin_notes, r.occasion, r.allergies, r.customer_phone]
      .filter((v): v is string => typeof v === 'string')
      .join(' \n '),
  )
  if (hay.includes(q)) return true
  // Thai national format (0812345678) matches the stored international number (+66812345678).
  const phone = digits(r.customer_phone)
  const qd = digits(q)
  return [qd, qd.replace(/^0+/, '')].some((d) => d.length >= 3 && phone.includes(d))
}

export function filterReservations<T extends ListReservation>(rows: readonly T[], status: StatusFilter, query: string): T[] {
  return rows.filter((r) => (status === 'all' || r.status === status) && matchesQuery(r, query))
}

export function statusCounts(rows: readonly ListReservation[]): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = { all: rows.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 }
  for (const r of rows) counts[r.status] += 1
  return counts
}

export function sortByTime<T extends ListReservation>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => toMinutes(a.reservation_time) - toMinutes(b.reservation_time) || a.id - b.id)
}

export type ServiceGroup<T extends ListReservation> = {
  key: ServiceKey
  label: string
  reservations: T[]
  /** Active (not cancelled / no_show) reservations and covers of the group. */
  count: number
  covers: number
}

const SERVICE_LABELS: Record<ServiceKey, string> = { dejeuner: 'Déjeuner', diner: 'Dîner' }

export function groupByService<T extends ListReservation>(rows: readonly T[]): ServiceGroup<T>[] {
  const groups: ServiceGroup<T>[] = []
  for (const key of ['dejeuner', 'diner'] as const) {
    const part = sortByTime(rows).filter((r) => serviceOf(formatReservationTime(r.reservation_time)) === key)
    if (part.length === 0) continue
    const active = part.filter((r) => isActiveForCovers(r.status))
    groups.push({
      key,
      label: SERVICE_LABELS[key],
      reservations: part,
      count: active.length,
      covers: active.reduce((s, r) => s + r.party_size, 0),
    })
  }
  return groups
}

export type DaySummary = { reservations: number; covers: number; cancelled: number }

/** « 13 réservations · 49 couverts » : cancelled and no_show are excluded from both figures. */
export function daySummary(rows: readonly ListReservation[]): DaySummary {
  const active = rows.filter((r) => isActiveForCovers(r.status))
  return {
    reservations: active.length,
    covers: active.reduce((s, r) => s + r.party_size, 0),
    cancelled: rows.length - active.length,
  }
}

export function plural(n: number, one: string, many: string = `${one}s`): string {
  return `${n} ${n > 1 ? many : one}`
}
