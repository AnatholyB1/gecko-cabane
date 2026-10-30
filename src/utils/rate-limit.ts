/**
 * Supabase-backed rate limiting for reservation creation and review feedback (D-07, D-08, SEC-02).
 *
 * The service-role client is required: gecko_rate_limits has RLS enabled with
 * no policy and gecko_rate_limit_hit() is executable by service_role only.
 * Keys are HMAC-SHA256 hashes (PDPA data minimisation): raw IP, email and
 * phone are never stored. Fails open (with a Sentry report) so a limiter
 * outage never blocks real bookings in high season.
 */

import { createHmac } from 'node:crypto'
import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

export const RATE_LIMITS = {
  ip: { limit: 5, windowSeconds: 3600 },
  email: { limit: 3, windowSeconds: 86400 },
  phone: { limit: 3, windowSeconds: 86400 },
  feedback: { limit: 3, windowSeconds: 3600 },
} as const

/** Client IP from Vercel-controlled headers first; null when unknown. */
export function getClientIp(h: Headers): string | null {
  const vercel = h.get('x-vercel-forwarded-for')?.trim()
  if (vercel) return vercel
  const real = h.get('x-real-ip')?.trim()
  if (real) return real
  const first = h.get('x-forwarded-for')?.split(',')[0]?.trim()
  return first || null
}

export type HashKind = 'ip' | 'email' | 'phone' | 'feedback' | 'nl-ip' | 'nl-email' | 'review-hit'

export function hashKey(kind: HashKind, value: string, secret: string): string {
  const normalized = kind === 'email' || kind === 'nl-email' ? value.toLowerCase() : value
  return `${kind}:` + createHmac('sha256', secret).update(normalized).digest('hex')
}

export async function checkReservationRateLimits(
  admin: SupabaseClient,
  ids: { ip: string | null; email: string; phone: string }
): Promise<{ limited: boolean }> {
  const secret = process.env.RATE_LIMIT_SECRET
  if (!secret) {
    Sentry.captureMessage('RATE_LIMIT_SECRET is not set: rate limiting disabled', 'error')
    return { limited: false }
  }

  const checks: Array<{ kind: 'ip' | 'email' | 'phone'; value: string }> = []
  if (ids.ip) checks.push({ kind: 'ip', value: ids.ip })
  checks.push({ kind: 'email', value: ids.email })
  checks.push({ kind: 'phone', value: ids.phone })

  let limited = false
  for (const { kind, value } of checks) {
    const { limit, windowSeconds } = RATE_LIMITS[kind]
    try {
      const { data, error } = await admin.rpc('gecko_rate_limit_hit', {
        p_key: hashKey(kind, value, secret),
        p_limit: limit,
        p_window_seconds: windowSeconds,
      })
      if (error) {
        Sentry.captureException(error)
        continue
      }
      if (data === false) limited = true
    } catch (e) {
      Sentry.captureException(e)
    }
  }
  return { limited }
}

/** Newsletter subscribe limits (D-02). Distinct key prefixes: never shared with reservations. */
export const NEWSLETTER_RATE_LIMITS = {
  ip: { limit: 5, windowSeconds: 3600 },
  email: { limit: 3, windowSeconds: 86400 },
} as const

export async function checkNewsletterRateLimits(
  admin: SupabaseClient,
  ids: { ip: string | null; email: string }
): Promise<{ limited: boolean }> {
  const secret = process.env.RATE_LIMIT_SECRET
  if (!secret) {
    Sentry.captureMessage('RATE_LIMIT_SECRET is not set: rate limiting disabled', 'error')
    return { limited: false }
  }
  const checks: Array<{ kind: 'nl-ip' | 'nl-email'; value: string; cfg: { limit: number; windowSeconds: number } }> = []
  if (ids.ip) checks.push({ kind: 'nl-ip', value: ids.ip, cfg: NEWSLETTER_RATE_LIMITS.ip })
  checks.push({ kind: 'nl-email', value: ids.email, cfg: NEWSLETTER_RATE_LIMITS.email })

  let limited = false
  for (const { kind, value, cfg } of checks) {
    try {
      const { data, error } = await admin.rpc('gecko_rate_limit_hit', {
        p_key: hashKey(kind, value, secret),
        p_limit: cfg.limit,
        p_window_seconds: cfg.windowSeconds,
      })
      if (error) {
        Sentry.captureException(error)
        continue
      }
      if (data === false) limited = true
    } catch (e) {
      Sentry.captureException(e)
    }
  }
  return { limited }
}

/** Shared bucket used when the caller cannot be identified (no secret / no IP): tight global cap. */
export const FEEDBACK_GLOBAL_LIMIT = { key: 'feedback:global', limit: 10, windowSeconds: 3600 } as const

/**
 * Review feedback ("Un souci ?", D-23): 3 messages per hour per hashed IP, separate bucket.
 *
 * Fails CLOSED on missing identity: each accepted message sends an email to the owner, so
 * without RATE_LIMIT_SECRET or a client IP the request is counted against one shared global
 * bucket (10/h, no PII in the key) instead of being waved through. A limiter RPC outage still
 * fails open (reported to Sentry): the form must not die because of a database blip.
 */
export async function checkFeedbackRateLimit(
  admin: SupabaseClient,
  ip: string | null
): Promise<{ limited: boolean }> {
  const secret = process.env.RATE_LIMIT_SECRET
  let key: string
  let limit: number
  let windowSeconds: number
  if (!secret || !ip) {
    if (!secret) Sentry.captureMessage('RATE_LIMIT_SECRET is not set: feedback uses the global bucket', 'error')
    key = FEEDBACK_GLOBAL_LIMIT.key
    limit = FEEDBACK_GLOBAL_LIMIT.limit
    windowSeconds = FEEDBACK_GLOBAL_LIMIT.windowSeconds
  } else {
    key = hashKey('feedback', ip, secret)
    ;({ limit, windowSeconds } = RATE_LIMITS.feedback)
  }
  try {
    const { data, error } = await admin.rpc('gecko_rate_limit_hit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      Sentry.captureException(error)
      return { limited: false }
    }
    return { limited: data === false }
  } catch (e) {
    Sentry.captureException(e)
    return { limited: false }
  }
}

/** Review counters (REV-06): per hashed IP, and a shared bucket when the caller is unidentified. */
export const REVIEW_HIT_LIMITS = {
  ip: { limit: 30, windowSeconds: 3600 },
  global: { key: 'review-hit:global', limit: 600, windowSeconds: 3600 },
} as const

/**
 * Throttle for the review counters only. `limited: true` means "do not count this hit"; it must
 * never block a visitor or a redirect. Unidentified callers (no secret / no IP) share one global
 * bucket; an RPC outage skips the count (fail closed for the counter, harmless for the visitor).
 */
export async function checkReviewHitRateLimit(
  admin: SupabaseClient,
  ip: string | null
): Promise<{ limited: boolean }> {
  const secret = process.env.RATE_LIMIT_SECRET
  const identified = Boolean(secret && ip)
  const key = identified ? hashKey('review-hit', ip as string, secret as string) : REVIEW_HIT_LIMITS.global.key
  const { limit, windowSeconds } = identified ? REVIEW_HIT_LIMITS.ip : REVIEW_HIT_LIMITS.global
  try {
    const { data, error } = await admin.rpc('gecko_rate_limit_hit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      Sentry.captureException(error)
      return { limited: true }
    }
    return { limited: data === false }
  } catch (e) {
    Sentry.captureException(e)
    return { limited: true }
  }
}
