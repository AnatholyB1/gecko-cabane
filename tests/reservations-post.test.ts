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

const adminClient = {
  from: vi.fn((table: string) => {
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
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

import { POST } from '@/app/api/reservations/route'
import { MARKETING_CONSENT_VERSION } from '@/utils/reservation-schema'

function req(body: unknown, raw = false) {
  return new Request('http://localhost/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw ? (body as string) : JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

const valid = {
  customer_name: 'Jane Doe',
  customer_email: 'Jane@Example.COM',
  customer_phone: '07700 900123',
  phone_country: 'GB',
  reservation_date: '2026-10-24',
  reservation_time: '19:00',
  party_size: 2,
  locale: 'en',
  marketing_consent: false,
}

describe('POST /api/reservations', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-20T03:00:00Z'))
    rpc.mockReset()
    afterCallbacks.length = 0
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
      p_phone: '+447700900123',
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
})
