/**
 * POST /api/reservations pipeline tests (RESA-01, RESA-02, D-01, D-04, D-05, D-06, D-11)
 *
 * Handler-level: Supabase admin client, Resend, Sentry and after() are mocked.
 * Fixed clock: 2026-10-20T03:00:00Z = Tuesday 10:00 in Krabi.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const rpc = vi.fn()
const afterCallbacks: Array<() => unknown> = []

const REGULAR = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
  day_of_week: d,
  is_open: d !== 2, // closed Tuesday
  open_time: '11:30:00',
  close_time: '22:00:00',
}))
const SETTINGS = [
  { key: 'max_covers', value: '40' },
  { key: 'table_block_duration_minutes', value: '120' },
]

function builder(rows: unknown[]) {
  const b: Record<string, unknown> = {}
  b.select = () => b
  b.eq = () => b
  b.then = (resolve: (v: unknown) => unknown) => resolve({ data: rows, error: null })
  return b
}

const updateSpy = vi.fn()
let updateResult: { error: unknown } | 'throw' = { error: null }

function reservationsBuilder() {
  const b = builder([]) as Record<string, unknown>
  b.update = (payload: unknown) => {
    updateSpy(payload)
    return {
      eq: async () => {
        if (updateResult === 'throw') throw new Error('boom')
        return updateResult
      },
    }
  }
  return b
}

const adminClient = {
  from: vi.fn((table: string) => {
    if (table === 'gecko_reservations') return reservationsBuilder()
    if (table === 'gecko_opening_hours') return builder(REGULAR)
    if (table === 'gecko_special_hours') return builder([])
    if (table === 'gecko_restaurant_settings') return builder(SETTINGS)
    return builder([])
  }),
  rpc: (...args: unknown[]) => rpc(...args),
}

vi.mock('@/utils/supabase/server', () => ({
  createAdminClient: vi.fn(() => adminClient),
  createClient: vi.fn(),
  isGeckoAdmin: vi.fn(),
}))
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: (cb: () => unknown) => {
      afterCallbacks.push(cb)
    },
  }
})
vi.mock('@/utils/resend', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/resend')>()
  return { ...actual, getResendClient: () => null }
})
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }))
const checkLimits = vi.fn()
vi.mock('@/utils/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/rate-limit')>()
  return { ...actual, checkReservationRateLimits: (...a: unknown[]) => checkLimits(...a) }
})

import { POST } from '@/app/api/reservations/route'
import { MARKETING_CONSENT_VERSION } from '@/utils/reservation-schema'

function req(body: unknown, raw = false) {
  return new Request('http://localhost/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '1.2.3.4' },
    body: raw ? (body as string) : JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

const valid = {
  customer_name: 'Jane Doe',
  customer_email: 'Jane@Example.COM',
  customer_phone: '07911 123456',
  phone_country: 'GB',
  reservation_date: '2026-10-24',
  reservation_time: '19:00',
  party_size: 2,
  locale: 'en',
  marketing_consent: false,
  company_url: '',
  // Getter: evaluated per request so it follows the fake clock set in beforeEach.
  get form_started_at() {
    return Date.now() - 10000
  },
}

describe('POST /api/reservations', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-20T03:00:00Z'))
    rpc.mockReset()
    checkLimits.mockReset()
    checkLimits.mockResolvedValue({ limited: false })
    afterCallbacks.length = 0
    updateSpy.mockReset()
    updateResult = { error: null }
    rpc.mockResolvedValue({
      data: [{ reservation_id: 123, reservation_status: 'pending', is_full: false }],
      error: null,
    })
  })
  afterEach(() => vi.useRealTimers())

  it('creates a pending reservation without OTP token and ignores a stale token', async () => {
    const res = await POST(req({ ...valid, phone_verification_token: 'abc' }))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ data: { id: 123, status: 'pending' } })
    expect(rpc).toHaveBeenCalledTimes(1)
    const [name, args] = rpc.mock.calls[0]
    expect(name).toBe('gecko_create_reservation')
    expect(args).toMatchObject({
      p_phone: '+447911123456',
      p_locale: 'en',
      p_marketing_consent: false,
      p_consent_version: MARKETING_CONSENT_VERSION,
      p_email: 'jane@example.com',
    })
    expect(JSON.stringify(args)).not.toContain('abc')
    expect(afterCallbacks).toHaveLength(1)
  })

  it('passes marketing consent to the RPC', async () => {
    const res = await POST(req({ ...valid, marketing_consent: true }))
    expect(res.status).toBe(201)
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_marketing_consent: true })
  })

  it('rejects a missing email (400 invalid_email)', async () => {
    const rest: Record<string, unknown> = { ...valid }
    delete rest.customer_email
    const res = await POST(req(rest))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('invalid_email')
    expect(rpc).not.toHaveBeenCalled()
    expect(afterCallbacks).toHaveLength(0)
  })

  it('rejects a Tuesday (422 slot_unavailable)', async () => {
    const res = await POST(req({ ...valid, reservation_date: '2026-10-27' }))
    expect(res.status).toBe(422)
    expect((await res.json()).code).toBe('slot_unavailable')
    expect(rpc).not.toHaveBeenCalled()
    expect(afterCallbacks).toHaveLength(0)
  })

  it('returns 409 slot_full when the RPC reports full capacity', async () => {
    rpc.mockResolvedValue({
      data: [{ reservation_id: null, reservation_status: null, is_full: true }],
      error: null,
    })
    const res = await POST(req(valid))
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('slot_full')
    expect(afterCallbacks).toHaveLength(0)
  })

  it('returns 500 server_error without leaking Supabase details', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'secret pg message', details: 'd', hint: 'h', code: 'XX000' },
    })
    const res = await POST(req(valid))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.code).toBe('server_error')
    const text = JSON.stringify(body)
    expect(text).not.toContain('secret pg message')
    expect(text).not.toContain('details')
    expect(text).not.toContain('hint')
    expect(afterCallbacks).toHaveLength(0)
  })

  it('rejects invalid JSON (400 invalid_body)', async () => {
    const res = await POST(req('{not json', true))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('invalid_body')
    expect(rpc).not.toHaveBeenCalled()
  })

  // Fixed clock is set in beforeEach, so build bodies relative to it.
  const fresh = () => ({ ...valid, form_started_at: Date.now() - 10000 })

  it('fakes a 201 for a filled honeypot with no DB write', async () => {
    const res = await POST(req({ ...fresh(), company_url: 'http://spam' }))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ data: { id: 0, status: 'pending' } })
    expect(rpc).not.toHaveBeenCalled()
    expect(checkLimits).not.toHaveBeenCalled()
    expect(afterCallbacks).toHaveLength(0)
  })

  it('rejects a too fast or missing form_started_at (400 too_fast)', async () => {
    const fast = await POST(req({ ...fresh(), form_started_at: Date.now() - 500 }))
    expect(fast.status).toBe(400)
    expect((await fast.json()).code).toBe('too_fast')
    const rest: Record<string, unknown> = { ...fresh() }
    delete rest.form_started_at
    const missing = await POST(req(rest))
    expect(missing.status).toBe(400)
    expect((await missing.json()).code).toBe('too_fast')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('returns 429 rate_limited with a localized WhatsApp message', async () => {
    checkLimits.mockResolvedValue({ limited: true })
    const en = await POST(req({ ...fresh(), locale: 'en' }))
    expect(en.status).toBe(429)
    const enBody = await en.json()
    expect(enBody.code).toBe('rate_limited')
    expect(enBody.error).toContain('WhatsApp')
    expect(enBody.error).toContain('Too many requests')
    const fr = await POST(req({ ...fresh(), locale: 'fr' }))
    expect(fr.status).toBe(429)
    expect((await fr.json()).error).toContain('Trop de demandes')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('does not consume quota for invalid input or an unavailable slot', async () => {
    const bad = await POST(req({ ...fresh(), customer_email: 'nope' }))
    expect(bad.status).toBe(400)
    const tue = await POST(req({ ...fresh(), reservation_date: '2026-10-27' }))
    expect(tue.status).toBe(422)
    expect(checkLimits).not.toHaveBeenCalled()
  })

  it('ignores a forged source and stores sanitized utm via a follow-up update', async () => {
    const res = await POST(
      req({ ...fresh(), source: 'whatsapp', utm_source: 'google', utm_medium: 'gbp' })
    )
    expect(res.status).toBe(201)
    expect(JSON.stringify(rpc.mock.calls[0][1])).not.toContain('source')
    expect(updateSpy).toHaveBeenCalledTimes(1)
    expect(updateSpy.mock.calls[0][0]).toEqual({
      utm_source: 'google',
      utm_medium: 'gbp',
      ref: null,
    })
    for (const c of updateSpy.mock.calls) expect(Object.keys(c[0])).not.toContain('source')
  })

  it('does not update when no utm is sent', async () => {
    const res = await POST(req(fresh()))
    expect(res.status).toBe(201)
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('drops hostile utm values without updating', async () => {
    const res = await POST(req({ ...fresh(), utm_source: '<b>x</b>' }))
    expect(res.status).toBe(201)
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('still returns 201 when the utm update fails', async () => {
    updateResult = { error: { message: 'nope' } }
    const res = await POST(req({ ...fresh(), utm_source: 'google' }))
    expect(res.status).toBe(201)
    expect(updateSpy).toHaveBeenCalledTimes(1)
  })

  it('POST handler never reads source from the body', async () => {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const src = readFileSync(
      join(__dirname, '..', 'src', 'app', 'api', 'reservations', 'route.ts'),
      'utf-8'
    )
    const post = src.slice(src.indexOf('export async function POST'), src.indexOf('const RESERVATION_STATUSES'))
    expect(post.length).toBeGreaterThan(100)
    expect(post).not.toMatch(/body\.source|input\.source|\br\.source\b/)
  })

  it('checks limits once with normalized ip, email and phone', async () => {
    const res = await POST(req(fresh()))
    expect(res.status).toBe(201)
    expect(checkLimits).toHaveBeenCalledTimes(1)
    expect(checkLimits.mock.calls[0][1]).toEqual({
      ip: '1.2.3.4',
      email: 'jane@example.com',
      phone: '+447911123456',
    })
  })
})
