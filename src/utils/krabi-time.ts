/**
 * Krabi time helpers (Asia/Bangkok, UTC+7, no DST) — pure, no framework imports.
 *
 * reservation_date / reservation_time are WALL-CLOCK values of Krabi: they are
 * displayed as stored, never converted through Date/timezones (RSV-05). Only
 * "now" needs a timezone, and it is always computed in Krabi, never from the
 * server or browser zone (fixes the admin page opening on the UTC date, which
 * shows yesterday between 00:00 and 07:00 in Krabi).
 */

import { bangkokNow, toMinutes } from '@/utils/reservation-rules'

export const KRABI_TZ_LABEL = 'Heures de Krabi (UTC+7)'
export const SERVICE_OPEN = '12:00'
export const SERVICE_CLOSE = '22:00'

export type ServiceKey = 'dejeuner' | 'diner'

/** Reservations starting before 16:00 belong to the lunch service, else dinner. */
export const SERVICE_SPLIT_MINUTES = 16 * 60

/** Krabi "today" as YYYY-MM-DD. */
export function krabiTodayYmd(now: Date = new Date()): string {
  return bangkokNow(now).date
}

export function minutesToClock(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Krabi clock as 'HH:MM'. */
export function krabiClock(now: Date = new Date()): string {
  return minutesToClock(bangkokNow(now).minutes)
}

/** True between 12:00 (included) and 22:00 (excluded) Krabi time. */
export function isServiceHours(now: Date = new Date()): boolean {
  const { minutes } = bangkokNow(now)
  return minutes >= toMinutes(SERVICE_OPEN) && minutes < toMinutes(SERVICE_CLOSE)
}

/** Adds n days to a YYYY-MM-DD string (pure calendar arithmetic, no timezone). */
export function addDaysYmd(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

/** Strict YYYY-MM-DD check (real calendar date). */
export function isYmd(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

/** "Hier" | "Aujourd'hui" | "Demain" | null relative to Krabi today. */
export function relativeDayLabel(date: string, now: Date = new Date()): string | null {
  const today = krabiTodayYmd(now)
  if (date === today) return "Aujourd'hui"
  if (date === addDaysYmd(today, -1)) return 'Hier'
  if (date === addDaysYmd(today, 1)) return 'Demain'
  return null
}

/** Stored 'HH:MM' or 'HH:MM:SS' -> 'HH:MM', verbatim (no Date, no timezone). Invalid -> input. */
export function formatReservationTime(time: string): string {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(time.trim())
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : time
}

/** 'HH:MM' -> '19h30' ('19h' on the hour). */
export function formatHourFr(time: string): string {
  const t = formatReservationTime(time)
  const [h, m] = t.split(':')
  return m === '00' ? `${parseInt(h, 10)}h` : `${parseInt(h, 10)}h${m}`
}

const DAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

/** 'YYYY-MM-DD' -> 'samedi 31 octobre 2026'; no local-zone Date parsing. Invalid -> input. */
export function formatReservationDate(date: string): string {
  if (!isYmd(date)) return date
  const [y, m, d] = date.split('-').map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return `${DAYS_FR[dow]} ${d} ${MONTHS_FR[m - 1]} ${y}`
}

/** Service a reservation time belongs to. */
export function serviceOf(time: string): ServiceKey {
  return toMinutes(formatReservationTime(time)) < SERVICE_SPLIT_MINUTES ? 'dejeuner' : 'diner'
}
