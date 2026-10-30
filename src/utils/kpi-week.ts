/**
 * Krabi calendar weeks (Monday to Sunday) for the weekly KPI report (Phase 8).
 * Pure: no supabase/next imports. Krabi is UTC+7 all year, no DST.
 */

import { krabiToday, addDays } from '@/utils/review-invitations'

const KRABI_OFFSET_MS = 7 * 3600_000

/** Day of week of a YYYY-MM-DD date: 0 = Sunday ... 6 = Saturday. */
function dayOfWeek(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** The Monday-to-Sunday Krabi week that ended before `now`'s current Krabi week. */
export function previousWeek(now: Date): { start: string; end: string } {
  const today = krabiToday(now)
  const sinceMonday = (dayOfWeek(today) + 6) % 7
  const start = addDays(today, -sinceMonday - 7)
  return { start, end: addDays(start, 6) }
}

/** Strict YYYY-MM-DD, real calendar date, Monday only; otherwise null. */
export function parseWeekParam(v: string | null): string | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  const [y, m, d] = v.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.toISOString().slice(0, 10) !== v) return null
  return date.getUTCDay() === 1 ? v : null
}

export function weekEndOf(start: string): string {
  return addDays(start, 6)
}

/** UTC instants covering the Krabi week: [fromIso, toIso). */
export function weekUtcBounds(start: string): { fromIso: string; toIso: string } {
  const [y, m, d] = start.split('-').map(Number)
  const from = Date.UTC(y, m - 1, d) - KRABI_OFFSET_MS
  return {
    fromIso: new Date(from).toISOString(),
    toIso: new Date(from + 7 * 86_400_000).toISOString(),
  }
}

/** True only on a Krabi Monday at or after 08:00 (send window of the weekly report). */
export function shouldSendNow(now: Date): boolean {
  const krabi = new Date(now.getTime() + KRABI_OFFSET_MS)
  return krabi.getUTCDay() === 1 && krabi.getUTCHours() >= 8
}
