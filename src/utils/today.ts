/**
 * "Aujourd'hui" service figures (Phase 15, TDY-01 / TDY-02) — pure functions,
 * no network, no database, no framework imports.
 *
 * Two different notions on purpose (owner decision 2026-10-31):
 *  - per-hour occupancy (`hourlySlots`) mirrors EXACTLY the public booking rule
 *    of gecko_create_reservation (supabase/migrations/008): sum of party_size of
 *    pending + confirmed reservations whose start time is strictly less than
 *    table_block_duration_minutes away from the slot, compared with max_covers
 *    through hasCapacity(). The SQL cannot be imported, so `slotUsedCovers` is
 *    its TypeScript twin; tests/today.test.ts proves parity against a literal
 *    transcription of the SQL predicate.
 *  - service gauges (`servicePeaks`) are the PEAK of simultaneous covers: a
 *    reservation occupies [start, start + block). Total of the day is returned
 *    separately (`reservedCovers`).
 */

import type { Reservation, ReservationStatus } from '@/types/database'
import {
  DEFAULT_BLOCK_MINUTES,
  hasCapacity,
  MAX_PARTY_SIZE,
  toMinutes,
  type SettingsMap,
} from '@/utils/reservation-rules'
import { formatReservationTime, serviceOf, type ServiceKey } from '@/utils/krabi-time'
import { isActiveForCovers } from '@/utils/reservation-status'

/** Minimal shape needed from a reservation row. */
export type DayReservation = Pick<Reservation, 'id' | 'reservation_time' | 'party_size' | 'status'>

export const SLOT_HOURS: readonly number[] = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21]

/** "Presque complet" threshold: 30 of 40, i.e. 75 % of max_covers. */
export const ALMOST_FULL_RATIO = 0.75

/** Statuses that hold a table for the public availability check (SQL: status in ('pending','confirmed')). */
export const BLOCKING_STATUSES: readonly ReservationStatus[] = ['pending', 'confirmed']

// ---------------------------------------------------------------------------
// Settings (same parsing as the SQL: digits only, else default)
// ---------------------------------------------------------------------------

export const DEFAULT_MAX_COVERS = 40

function parseDigits(value: string | undefined, fallback: number): number {
  return value !== undefined && /^\s*\d+\s*$/.test(value) ? parseInt(value.trim(), 10) : fallback
}

/** max_covers as read by gecko_create_reservation (default 40). */
export function parseMaxCovers(settings: SettingsMap): number {
  return parseDigits(settings.max_covers, DEFAULT_MAX_COVERS)
}

/** table_block_duration_minutes as read by gecko_create_reservation (default 120). */
export function parseBlockMinutes(settings: SettingsMap): number {
  return parseDigits(settings.table_block_duration_minutes, DEFAULT_BLOCK_MINUTES)
}

// ---------------------------------------------------------------------------
// Public-availability twin
// ---------------------------------------------------------------------------

/**
 * Covers already blocking the slot at `slotMinutes`: pending+confirmed rows whose
 * start is strictly less than `block` minutes away (either side). Twin of
 * `abs(extract(epoch from (r.reservation_time - p_time)) / 60) < v_block`.
 */
export function slotUsedCovers(
  rows: readonly DayReservation[],
  slotMinutes: number,
  block: number,
): number {
  let used = 0
  for (const r of rows) {
    if (!BLOCKING_STATUSES.includes(r.status)) continue
    if (Math.abs(toMinutes(r.reservation_time) - slotMinutes) < block) used += r.party_size
  }
  return used
}

/** Would the public form accept `party` guests at `time`? (capacity part only) */
export function wouldAcceptBooking(
  rows: readonly DayReservation[],
  time: string,
  party: number,
  settings: SettingsMap,
): boolean {
  if (!Number.isInteger(party) || party < 1 || party > MAX_PARTY_SIZE) return false
  const used = slotUsedCovers(rows, toMinutes(time), parseBlockMinutes(settings))
  return hasCapacity(used, party, parseMaxCovers(settings))
}

// ---------------------------------------------------------------------------
// Hourly occupancy (TDY-02)
// ---------------------------------------------------------------------------

export type SlotLevel = 'free' | 'almost' | 'full'

export type HourlySlot = {
  /** 'HH:00' */
  time: string
  used: number
  max: number
  level: SlotLevel
  /** Hidden-text equivalent of the chart column. */
  text: string
}

export function slotLevel(used: number, max: number): SlotLevel {
  if (max <= 0 || used >= max) return 'full'
  return used >= max * ALMOST_FULL_RATIO ? 'almost' : 'free'
}

export function hourlySlots(rows: readonly DayReservation[], settings: SettingsMap): HourlySlot[] {
  const max = parseMaxCovers(settings)
  const block = parseBlockMinutes(settings)
  return SLOT_HOURS.map((h) => {
    const used = slotUsedCovers(rows, h * 60, block)
    const level = slotLevel(used, max)
    const suffix = level === 'full' ? ', complet' : level === 'almost' ? ', presque complet' : ''
    return {
      time: `${String(h).padStart(2, '0')}:00`,
      used,
      max,
      level,
      text: `${used} couvert${used > 1 ? 's' : ''} sur ${max} à ${h}h${suffix}`,
    }
  })
}

// ---------------------------------------------------------------------------
// Peak of simultaneous covers (service gauges)
// ---------------------------------------------------------------------------

/**
 * Peak of simultaneous covers over the given reservations, each occupying
 * [start, start + block). The maximum is always reached at some reservation
 * start, so only starts are probed.
 */
export function peakSimultaneous(rows: readonly DayReservation[], block: number): number {
  const span = Math.max(block, 1)
  const items = rows.map((r) => ({ s: toMinutes(r.reservation_time), n: r.party_size }))
  let peak = 0
  for (const probe of items) {
    let sum = 0
    for (const it of items) {
      if (it.s <= probe.s && probe.s < it.s + span) sum += it.n
    }
    if (sum > peak) peak = sum
  }
  return peak
}

export type ServiceFigures = {
  /** Peak of simultaneous covers (gauge value). */
  peak: number
  /** Total covers booked for the service (small figure). */
  total: number
  /** Number of reservations. */
  count: number
}

// ---------------------------------------------------------------------------
// Arrivals by hour
// ---------------------------------------------------------------------------

export type ArrivalGroup<T extends DayReservation> = {
  /** 'HH:00' */
  hour: string
  reservations: T[]
  covers: number
}

// ---------------------------------------------------------------------------
// Whole-day summary
// ---------------------------------------------------------------------------

export type TodaySummary<T extends DayReservation> = {
  /** Covers booked for the day, excluding cancelled and no_show. */
  reservedCovers: number
  maxCovers: number
  /** Pending reservations, earliest first. */
  toConfirm: T[]
  /** Active (not cancelled / no_show) arrivals grouped by hour, earliest first. */
  arrivals: ArrivalGroup<T>[]
  services: Record<ServiceKey, ServiceFigures>
  slots: HourlySlot[]
}

function byTimeThenId<T extends DayReservation>(a: T, b: T): number {
  return toMinutes(a.reservation_time) - toMinutes(b.reservation_time) || a.id - b.id
}

/** Active reservations of the day (pending, confirmed, completed), earliest first. */
export function activeReservations<T extends DayReservation>(rows: readonly T[]): T[] {
  return rows.filter((r) => isActiveForCovers(r.status)).sort(byTimeThenId)
}

export function groupArrivalsByHour<T extends DayReservation>(rows: readonly T[]): ArrivalGroup<T>[] {
  const groups = new Map<number, ArrivalGroup<T>>()
  for (const r of activeReservations(rows)) {
    const h = Math.floor(toMinutes(r.reservation_time) / 60)
    let g = groups.get(h)
    if (!g) {
      g = { hour: `${String(h).padStart(2, '0')}:00`, reservations: [], covers: 0 }
      groups.set(h, g)
    }
    g.reservations.push(r)
    g.covers += r.party_size
  }
  return [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([, g]) => g)
}

export function computeToday<T extends DayReservation>(
  rows: readonly T[],
  settings: SettingsMap,
): TodaySummary<T> {
  const block = parseBlockMinutes(settings)
  const active = activeReservations(rows)
  const figures = (key: ServiceKey): ServiceFigures => {
    const part = active.filter((r) => serviceOf(formatReservationTime(r.reservation_time)) === key)
    return {
      peak: peakSimultaneous(part, block),
      total: part.reduce((s, r) => s + r.party_size, 0),
      count: part.length,
    }
  }
  return {
    reservedCovers: active.reduce((s, r) => s + r.party_size, 0),
    maxCovers: parseMaxCovers(settings),
    toConfirm: rows.filter((r) => r.status === 'pending').sort(byTimeThenId),
    arrivals: groupArrivalsByHour(rows),
    services: { dejeuner: figures('dejeuner'), diner: figures('diner') },
    slots: hourlySlots(rows, settings),
  }
}
