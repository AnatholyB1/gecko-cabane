import { createHash } from 'crypto'

/**
 * Resend Idempotency-Key per (kind, period, contact). The key is stable across runs, so
 * a retry after an ambiguous failure (timeout after Resend accepted the mail) is
 * de-duplicated by Resend instead of mailing the contact twice. The email is hashed:
 * it never appears in the header.
 */
export function sendIdempotencyKey(email: string, kind: string, period: string): string {
  const h = createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 32)
  return `nl:${kind}:${period}:${h}`
}

/** Worst case for one send iteration: claim insert + Resend call + pause. */
export const SEND_ITERATION_MS = 4000

/**
 * True when one more claim+send fits before the deadline. Called BEFORE claiming, so a
 * contact is never claimed unless its send can finish inside the function time limit.
 */
export function hasTimeForSend(now: number, deadline: number, iterationMs = SEND_ITERATION_MS): boolean {
  return now + iterationMs <= deadline
}
