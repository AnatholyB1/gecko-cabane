/**
 * Rate limiter helpers (D-07, D-08): IP extraction, HMAC keys, fail-open checks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const captureException = vi.fn()
const captureMessage = vi.fn()
vi.mock('@sentry/nextjs', () => ({
  captureException: (...a: unknown[]) => captureException(...a),
  captureMessage: (...a: unknown[]) => captureMessage(...a),
}))

import {
  getClientIp,
  hashKey,
  checkReservationRateLimits,
  checkFeedbackRateLimit,
  RATE_LIMITS,
} from '../src/utils/rate-limit'

describe('getClientIp', () => {
  it('prefers x-vercel-forwarded-for over x-real-ip', () => {
    const h = new Headers({ 'x-vercel-forwarded-for': '1.2.3.4', 'x-real-ip': '5.6.7.8' })
    expect(getClientIp(h)).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip then the first x-forwarded-for entry', () => {
    expect(getClientIp(new Headers({ 'x-real-ip': '5.6.7.8' }))).toBe('5.6.7.8')
    expect(getClientIp(new Headers({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' }))).toBe('9.9.9.9')
  })

  it('returns null when no header is present', () => {
    expect(getClientIp(new Headers())).toBeNull()
  })
})

describe('hashKey', () => {
  it('is case-insensitive for email, prefixed and never contains the raw value', () => {
    const a = hashKey('email', 'A@B.com', 's')
    expect(a).toBe(hashKey('email', 'a@b.com', 's'))
    expect(a.startsWith('email:')).toBe(true)
    expect(a).not.toContain('a@b.com')
  })

  it('depends on the secret', () => {
    expect(hashKey('ip', '1.2.3.4', 's1')).not.toBe(hashKey('ip', '1.2.3.4', 's2'))
  })
})

describe('checkReservationRateLimits', () => {
  const ids = { ip: '1.2.3.4', email: 'a@b.com', phone: '+447911123456' }
  const rpc = vi.fn()
  const admin = { rpc: (...a: unknown[]) => rpc(...a) } as never

  beforeEach(() => {
    rpc.mockReset()
    captureException.mockReset()
    captureMessage.mockReset()
    vi.stubEnv('RATE_LIMIT_SECRET', 'test-secret')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('allows when all counters are under the limit', async () => {
    rpc.mockResolvedValue({ data: true, error: null })
    expect(await checkReservationRateLimits(admin, ids)).toEqual({ limited: false })
    expect(rpc).toHaveBeenCalledTimes(3)
    expect(rpc.mock.calls[0][0]).toBe('gecko_rate_limit_hit')
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_limit: 5, p_window_seconds: 3600 })
    expect(rpc.mock.calls[1][1]).toMatchObject({ p_limit: 3, p_window_seconds: 86400 })
    expect(rpc.mock.calls[2][1]).toMatchObject({ p_limit: 3, p_window_seconds: 86400 })
    expect(RATE_LIMITS.ip.limit).toBe(5)
    const keys = rpc.mock.calls.map((c) => (c[1] as { p_key: string }).p_key).join(' ')
    expect(keys).not.toContain('a@b.com')
    expect(keys).not.toContain('1.2.3.4')
  })

  it('is limited when one call returns false', async () => {
    rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: false, error: null })
      .mockResolvedValueOnce({ data: true, error: null })
    expect(await checkReservationRateLimits(admin, ids)).toEqual({ limited: true })
  })

  it('skips the IP check when the IP is unknown', async () => {
    rpc.mockResolvedValue({ data: true, error: null })
    await checkReservationRateLimits(admin, { ...ids, ip: null })
    expect(rpc).toHaveBeenCalledTimes(2)
  })

  it('fails open and reports to Sentry on RPC error', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } })
    expect(await checkReservationRateLimits(admin, ids)).toEqual({ limited: false })
    expect(captureException).toHaveBeenCalled()
  })

  it('fails open when RATE_LIMIT_SECRET is missing', async () => {
    vi.stubEnv('RATE_LIMIT_SECRET', '')
    expect(await checkReservationRateLimits(admin, ids)).toEqual({ limited: false })
    expect(rpc).not.toHaveBeenCalled()
    expect(captureMessage).toHaveBeenCalled()
  })
})

describe('feedback bucket', () => {
  const rpc = vi.fn()
  const admin = { rpc: (...a: unknown[]) => rpc(...a) } as never

  beforeEach(() => {
    rpc.mockReset()
    captureMessage.mockReset()
    vi.stubEnv('RATE_LIMIT_SECRET', 'test-secret')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('has its own limit and key prefix', () => {
    expect(RATE_LIMITS.feedback).toEqual({ limit: 3, windowSeconds: 3600 })
    expect(hashKey('feedback', '1.2.3.4', 's').startsWith('feedback:')).toBe(true)
    expect(hashKey('feedback', '1.2.3.4', 's')).not.toBe(hashKey('ip', '1.2.3.4', 's'))
  })

  it('is limited when the rpc returns false', async () => {
    rpc.mockResolvedValue({ data: false, error: null })
    expect(await checkFeedbackRateLimit(admin, '1.2.3.4')).toEqual({ limited: true })
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_limit: 3, p_window_seconds: 3600 })
  })

  it('fails closed on the global bucket when the ip is unknown', async () => {
    rpc.mockResolvedValue({ data: true, error: null })
    expect(await checkFeedbackRateLimit(admin, null)).toEqual({ limited: false })
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc.mock.calls[0][1]).toEqual({ p_key: 'feedback:global', p_limit: 10, p_window_seconds: 3600 })
    rpc.mockResolvedValue({ data: false, error: null })
    expect(await checkFeedbackRateLimit(admin, null)).toEqual({ limited: true })
  })

  it('fails closed on the global bucket (no hashing) and reports when the secret is missing', async () => {
    vi.stubEnv('RATE_LIMIT_SECRET', '')
    rpc.mockResolvedValue({ data: false, error: null })
    expect(await checkFeedbackRateLimit(admin, '1.2.3.4')).toEqual({ limited: true })
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_key: 'feedback:global' })
    expect(JSON.stringify(rpc.mock.calls[0][1])).not.toContain('1.2.3.4')
    expect(captureMessage).toHaveBeenCalled()
  })

  it('uses the per-ip bucket (not the global one) when secret and ip are present', async () => {
    rpc.mockResolvedValue({ data: true, error: null })
    await checkFeedbackRateLimit(admin, '1.2.3.4')
    expect(rpc.mock.calls[0][1].p_key).toMatch(/^feedback:[0-9a-f]{64}$/)
  })

  it('still fails open on an rpc outage (reported)', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'down' } })
    expect(await checkFeedbackRateLimit(admin, '1.2.3.4')).toEqual({ limited: false })
  })
})
