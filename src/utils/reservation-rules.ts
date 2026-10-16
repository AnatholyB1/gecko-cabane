/**
 * Reservation business rules — pure functions, no framework imports.
 *
 * Shared by the API (server authority) and the booking form (UX hints only).
 * All "today" / "now" computations use Krabi time (Asia/Bangkok, UTC+7),
 * never the server or browser timezone.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_PARTY_SIZE = 40
export const DEFAULT_BLOCK_MINUTES = 120
export const KITCHEN_CLOSE = '22:00'
export const SAME_DAY_MIN_LEAD_MINUTES = 30
const MAX_DAYS_AHEAD = 180

export const TIME_SLOTS: readonly string[] = [
  '11:30', '12:00', '12:30', '13:00', '13:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
]

export type HoursRow = {
  is_open: boolean | null
  open_time: string | null
  close_time: string | null
}

export type SettingsMap = Record<string, string | undefined>

export type SlotCheckResult =
  | { ok: true }
  | { ok: false; code: 'slot_unavailable' | 'date_past' | 'invalid_party_size' }

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

/** Current date (YYYY-MM-DD) and minutes since midnight in Krabi time. */
export function bangkokNow(now: Date = new Date()): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0'
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10),
  }
}

function utcMs(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Day of week of a YYYY-MM-DD string (0 = Sunday), independent of timezone. */
export function dayOfWeek(date: string): number {
  return new Date(utcMs(date)).getUTCDay()
}

/** Convert 'HH:MM' or 'HH:MM:SS' to minutes since midnight. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':')
  return parseInt(h, 10) * 60 + parseInt(m, 10)
}

// ---------------------------------------------------------------------------
// Hours and last bookable time
// ---------------------------------------------------------------------------

/** Resolve the hours for a date: a special_hours row wins over the weekly row. */
export function resolveHours(
  date: string,
  regular: (HoursRow & { day_of_week: number })[],
  special: (HoursRow & { date: string })[],
): HoursRow | null {
  const sp = special.find((s) => s.date === date)
  if (sp) return sp
  return regular.find((r) => r.day_of_week === dayOfWeek(date)) ?? null
}

/** Latest bookable start time, in minutes since midnight. */
export function computeLastBookableMinutes(settings: SettingsMap): number {
  const explicit = settings.last_reservation_time
  if (explicit && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(explicit)) {
    return toMinutes(explicit)
  }
  const block = parseInt(settings.table_block_duration_minutes ?? '', 10) || DEFAULT_BLOCK_MINUTES
  return toMinutes(KITCHEN_CLOSE) - block
}

/** Slots from the grid that are not after the last bookable time. */
export function bookableSlots(settings: SettingsMap): string[] {
  const last = computeLastBookableMinutes(settings)
  return TIME_SLOTS.filter((t) => toMinutes(t) <= last)
}

// ---------------------------------------------------------------------------
// Slot check
// ---------------------------------------------------------------------------

export function checkSlot(input: {
  date: string
  time: string
  partySize: number
  regular: (HoursRow & { day_of_week: number })[]
  special: (HoursRow & { date: string })[]
  settings: SettingsMap
  now?: Date
}): SlotCheckResult {
  const { date, time, partySize, regular, special, settings } = input

  if (!Number.isInteger(partySize) || partySize < 1 || partySize > MAX_PARTY_SIZE) {
    return { ok: false, code: 'invalid_party_size' }
  }

  const today = bangkokNow(input.now)
  if (date < today.date) return { ok: false, code: 'date_past' }
  if ((utcMs(date) - utcMs(today.date)) / 86400000 > MAX_DAYS_AHEAD) {
    return { ok: false, code: 'slot_unavailable' }
  }

  if (!TIME_SLOTS.includes(time)) return { ok: false, code: 'slot_unavailable' }

  const hours = resolveHours(date, regular, special)
  if (!hours || !hours.is_open || !hours.open_time || !hours.close_time) {
    return { ok: false, code: 'slot_unavailable' }
  }

  const t = toMinutes(time)
  const latest = Math.min(toMinutes(hours.close_time), computeLastBookableMinutes(settings))
  if (t < toMinutes(hours.open_time) || t > latest) {
    return { ok: false, code: 'slot_unavailable' }
  }

  if (date === today.date && t < today.minutes + SAME_DAY_MIN_LEAD_MINUTES) {
    return { ok: false, code: 'date_past' }
  }

  return { ok: true }
}
