/**
 * Newsletter withdrawal helpers (D-04). Pure module: no next/supabase imports.
 */

import { timingSafeEqual } from 'node:crypto'
import { NEWSLETTER_CONSENT_VERSION } from './newsletter-schema'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 'jean.dupont@gmail.com' -> 'j***@gmail.com'. Invalid input -> '***'. */
export function maskEmail(email: string): string {
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) return '***'
  const at = email.lastIndexOf('@')
  return `${email.slice(0, 1)}***${email.slice(at)}`
}

export interface WithdrawEvent {
  kind: 'withdraw'
  email: string
  at: string
}

const WITHDRAW_EVENTS = new Set(['unsubscribed', 'unsubscribe', 'spam'])
const MIN_TS_MS = Date.UTC(2020, 0, 1)

function eventTime(ts: unknown, nowMs: number): string {
  if (typeof ts === 'number' && Number.isFinite(ts)) {
    const ms = ts * 1000
    if (ms >= MIN_TS_MS && ms <= nowMs + 86400 * 1000) return new Date(ms).toISOString()
  }
  return new Date(nowMs).toISOString()
}

/** Extract withdrawal events from a Brevo marketing webhook payload (object or array). */
export function parseBrevoWebhookEvents(body: unknown): WithdrawEvent[] {
  const list = Array.isArray(body) ? body : [body]
  const nowMs = Date.now()
  const out: WithdrawEvent[] = []
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    if (typeof o.event !== 'string' || !WITHDRAW_EVENTS.has(o.event)) continue
    if (typeof o.email !== 'string') continue
    const email = o.email.trim().toLowerCase()
    if (!EMAIL_RE.test(email)) continue
    out.push({ kind: 'withdraw', email, at: eventTime(o.ts_event, nowMs) })
  }
  return out
}

/** Constant-time token comparison; false when either side is missing or lengths differ. */
export function tokenMatches(expected: string, given: string | null | undefined): boolean {
  if (!expected || !given) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(given)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function buildWithdrawalRow(p: {
  email: string
  locale: string
  source: 'unsubscribe_link' | 'brevo_webhook'
  at: string
}) {
  return {
    email: p.email,
    consent: false,
    locale: p.locale,
    source: p.source,
    consent_text_version: NEWSLETTER_CONSENT_VERSION,
    consented_at: p.at,
  }
}
