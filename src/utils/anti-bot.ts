/**
 * Anti-bot checks for the public reservation form (D-09).
 * Pure functions: honeypot field and minimum / maximum fill time.
 */

export const MIN_FILL_MS = 3000
export const MAX_FILL_MS = 24 * 60 * 60 * 1000

/** A human never sees the honeypot field; any non-blank string means a bot. */
export function isHoneypotFilled(value: unknown): boolean {
  return typeof value === 'string' && value.trim() !== ''
}

/**
 * True when the elapsed time since the form was opened looks human:
 * at least MIN_FILL_MS, at most MAX_FILL_MS, and not in the future.
 */
export function checkFillTime(startedAt: unknown, now: number): boolean {
  if (typeof startedAt !== 'number' || !Number.isFinite(startedAt)) return false
  if (startedAt > now) return false
  const elapsed = now - startedAt
  return elapsed >= MIN_FILL_MS && elapsed <= MAX_FILL_MS
}
