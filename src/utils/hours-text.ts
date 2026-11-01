/**
 * Visible opening-hours text built from gecko_opening_hours (single source of truth, shared with
 * the JSON-LD). Pure module: the strings that embed a time take it as a next-intl value
 * ({open}, {close}) and never contain a hard-coded hour.
 */

import { KITCHEN_CLOSE, toMinutes } from './reservation-rules'
import type { OpeningHoursRow, SeoLocale } from './seo'

/**
 * open/close: the room hours (database). kitchen: last order = min(KITCHEN_CLOSE, close_time),
 * owner decision; kitchenIsClose is true when the kitchen and the room close together.
 */
export type UniformHours = { open: string; close: string; kitchen: string; kitchenIsClose: boolean }

/** Last-order time of a day: the kitchen closes at KITCHEN_CLOSE, or earlier if the room does. */
export function kitchenCloseFor(closeTime: string): string {
  const close = closeTime.slice(0, 5)
  return toMinutes(close) < toMinutes(KITCHEN_CLOSE) ? close : KITCHEN_CLOSE
}

const TIME = /^(\d{1,2}):(\d{2})/

/** Time of day as written in each locale (fr 22h, en 10pm, de 22 + "Uhr" in the message, sv 22). */
export function formatClock(time: string, locale: SeoLocale): string {
  const m = TIME.exec(time)
  if (!m) return time
  const h = Number(m[1])
  const min = m[2]
  const hasMinutes = min !== '00'
  switch (locale) {
    case 'fr':
      return hasMinutes ? `${h}h${min}` : `${h}h`
    case 'en': {
      const h12 = h % 12 === 0 ? 12 : h % 12
      return `${h12}${hasMinutes ? `:${min}` : ''}${h < 12 ? 'am' : 'pm'}`
    }
    case 'sv':
      return hasMinutes ? `${h}.${min}` : `${h}`
    default:
      return hasMinutes ? `${h}:${min}` : `${h}`
  }
}

/**
 * The hours when the restaurant is open all 7 days with the same opening and closing time
 * (the only case where "every day" and a single last-order time are true); null otherwise,
 * including when the table is empty or incomplete. The caller then uses a text without hours.
 */
export function summarizeUniformHours(rows: OpeningHoursRow[], locale: SeoLocale): UniformHours | null {
  const days = new Set<number>()
  const ranges = new Set<string>()
  for (const row of rows) {
    if (row.is_open !== true || !row.open_time || !row.close_time) return null
    days.add(row.day_of_week)
    ranges.add(`${row.open_time.slice(0, 5)}|${row.close_time.slice(0, 5)}`)
  }
  if (days.size !== 7 || ranges.size !== 1) return null
  const [open, close] = [...ranges][0].split('|')
  const kitchen = kitchenCloseFor(close)
  return {
    open: formatClock(open, locale),
    close: formatClock(close, locale),
    kitchen: formatClock(kitchen, locale),
    kitchenIsClose: kitchen === close,
  }
}
