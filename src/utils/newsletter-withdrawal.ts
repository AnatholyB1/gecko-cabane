/**
 * Newsletter withdrawal helpers (D-04). Pure module: no next/supabase imports.
 */

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

const MIN_TS_MS = Date.UTC(2020, 0, 1)

function eventTime(ts: unknown, nowMs: number): string {
  if (typeof ts === 'string') {
    const ms = Date.parse(ts)
    if (Number.isFinite(ms) && ms >= MIN_TS_MS && ms <= nowMs + 86400 * 1000) return new Date(ms).toISOString()
  }
  return new Date(nowMs).toISOString()
}

function cleanEmail(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const email = v.trim().toLowerCase()
  return EMAIL_RE.test(email) ? email : null
}

/**
 * Withdrawals carried by one verified Resend webhook payload:
 * - email.complained (spam report) on any recipient;
 * - email.bounced with a permanent bounce (the address is dead: stop writing to it);
 * - contact.updated with unsubscribed = true (unsubscribe done in the Resend dashboard).
 */
export function parseResendWebhookEvent(body: unknown): WithdrawEvent[] {
  if (!body || typeof body !== 'object') return []
  const o = body as Record<string, unknown>
  const data = o.data && typeof o.data === 'object' ? (o.data as Record<string, unknown>) : null
  if (typeof o.type !== 'string' || !data) return []
  const at = eventTime(o.created_at, Date.now())
  const emails: string[] = []

  if (o.type === 'email.complained' || o.type === 'email.bounced') {
    if (o.type === 'email.bounced') {
      const bounce = data.bounce as { type?: unknown } | undefined
      if (typeof bounce?.type !== 'string' || bounce.type.toLowerCase() !== 'permanent') return []
    }
    const to = Array.isArray(data.to) ? data.to : []
    for (const t of to) {
      const e = cleanEmail(t)
      if (e) emails.push(e)
    }
  } else if (o.type === 'contact.updated' && data.unsubscribed === true) {
    const e = cleanEmail(data.email)
    if (e) emails.push(e)
  }
  return emails.map((email) => ({ kind: 'withdraw' as const, email, at }))
}

export function buildWithdrawalRow(p: {
  email: string
  locale: string
  source: 'unsubscribe_link' | 'resend_webhook'
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
