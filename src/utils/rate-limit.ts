/**
 * Supabase-backed rate limiting for reservation creation (D-07, D-08, SEC-02).
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

export function hashKey(kind: 'ip' | 'email' | 'phone', value: string, secret: string): string {
  const normalized = kind === 'email' ? value.toLowerCase() : value
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
