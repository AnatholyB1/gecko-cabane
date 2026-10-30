import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { LedgerRow } from '../src/utils/newsletter-ledger'

// Route-level tests of the newsletter-sync cron with a fake Supabase and a fake Resend.
// No network, no database, no real email.

const sendMock = vi.fn()
const state = {
  ledger: [] as LedgerRow[],
  ledgerCount: null as number | null, // override the declared count (simulates truncation)
  ledgerCap: Infinity, // simulates PostgREST max_rows
  inserts: [] as Record<string, unknown>[],
  deletes: 0,
}
let timeAllowed = true

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }))
vi.mock('../src/utils/resend', () => ({
  getResendClient: () => ({ emails: { send: sendMock } }),
  RESEND_FROM_EMAIL: 'Test <t@example.com>',
}))
vi.mock('../src/utils/resend-contacts', () => ({
  upsertResendContact: vi.fn(async () => ({ ok: true })),
  updateResendContactProperties: vi.fn(async () => ({ ok: true })),
}))
vi.mock('../src/utils/newsletter-send', async (orig) => {
  const real = await orig<typeof import('../src/utils/newsletter-send')>()
  return { ...real, hasTimeForSend: (...a: Parameters<typeof real.hasTimeForSend>) => (timeAllowed ? real.hasTimeForSend(...a) : false) }
})

vi.mock('../src/utils/supabase/server', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      let op = 'select'
      let range: [number, number] | null = null
      const b: Record<string, unknown> = {}
      const chain = () => b
      for (const m of ['select', 'order', 'gte', 'in', 'lte', 'eq', 'is']) {
        b[m] = (...args: unknown[]) => {
          if (m === 'select' && op === 'select') op = 'select'
          void args
          return chain()
        }
      }
      b.range = (from: number, to: number) => {
        range = [from, to]
        return chain()
      }
      b.insert = (v: Record<string, unknown>) => {
        op = 'insert'
        state.inserts.push(v)
        return chain()
      }
      b.delete = () => {
        op = 'delete'
        state.deletes++
        return chain()
      }
      b.update = () => {
        op = 'update'
        return chain()
      }
      b.then = (resolve: (v: unknown) => unknown) => {
        if (op !== 'select') return resolve({ data: null, error: null })
        if (table === 'gecko_marketing_consents') {
          const from = range ? range[0] : 0
          const to = range ? range[1] : state.ledger.length
          const visible = state.ledger.slice(0, state.ledgerCap)
          return resolve({
            data: visible.slice(from, to + 1),
            error: null,
            count: state.ledgerCount ?? state.ledger.length,
          })
        }
        if (table === 'gecko_reservations') {
          return resolve({
            data: [
              { customer_email: 'eve@example.com', reservation_date: '2026-10-18', customer_phone: '+33612345678', status: 'confirmed' },
            ],
            error: null,
          })
        }
        return resolve({ data: [], error: null, count: 0 })
      }
      return b
    },
  }),
}))

function active(id: number): LedgerRow {
  return {
    id,
    email: id === 1 ? 'eve@example.com' : `u${id}@example.com`,
    consent: true,
    source: 'footer',
    locale: 'fr',
    consented_at: '2026-10-01T10:00:00Z',
    confirmed_at: '2026-10-01T11:00:00Z',
    confirmation_sent_at: '2026-10-01T10:00:05Z',
    country: null,
    is_resident: false,
    contact_synced_at: '2026-10-01T11:00:01Z',
    last_visit_synced: null,
    reservation_id: null,
  }
}

async function callCron() {
  const { GET } = await import('../src/app/api/cron/newsletter-sync/route')
  const req = {
    headers: { get: (k: string) => (k === 'authorization' ? 'Bearer cron-test-secret' : null) },
    nextUrl: new URL('https://example.com/api/cron/newsletter-sync'),
  }
  const res = await GET(req as never)
  return { status: res.status, body: await res.json() }
}

describe('newsletter-sync cron route', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-20T05:00:00Z')) // visit 2026-10-18 = J+2 in Krabi
    sendMock.mockReset()
    sendMock.mockResolvedValue({ data: { id: 'x' }, error: null })
    state.ledger = [active(1)]
    state.ledgerCount = null
    state.ledgerCap = Infinity
    state.inserts = []
    state.deletes = 0
    timeAllowed = true
    process.env.CRON_SECRET = 'cron-test-secret'
    process.env.NEWSLETTER_SIGNING_SECRET = 'test-secret-test-secret-test-secret-1234'
    process.env.NEWSLETTER_SEQUENCES_ENABLED = '1'
    delete process.env.NEWSLETTER_CAMPAIGNS_ENABLED
  })
  afterEach(() => {
    vi.useRealTimers()
    delete process.env.NEWSLETTER_SEQUENCES_ENABLED
  })

  it('sends the J+2 mail with a stable Idempotency-Key', async () => {
    const { status, body } = await callCron()
    expect(status).toBe(200)
    expect(body.data.sent).toBe(1)
    const [, opts] = sendMock.mock.calls[0]
    expect(opts.idempotencyKey).toMatch(/^nl:after_visit_j2:2026-10-18:/)
  })

  it('FAIL PATH: a ledger read capped below its count returns 500 and sends nothing', async () => {
    state.ledger = Array.from({ length: 1200 }, (_, i) => active(i + 1))
    state.ledgerCap = 300 // PostgREST max_rows lower than the ledger
    const { status } = await callCron()
    expect(status).toBe(500)
    expect(sendMock).not.toHaveBeenCalled()
    expect(state.inserts).toHaveLength(0)
  })

  it('reads a 1200-row ledger completely (no truncation at 1000)', async () => {
    state.ledger = Array.from({ length: 1200 }, (_, i) => active(i + 1))
    // withdrawal of the eligible contact lives in row 1200
    state.ledger.push({ ...active(1201), email: 'eve@example.com', consent: false, consented_at: '2026-10-19T10:00:00Z', confirmed_at: null })
    const { status, body } = await callCron()
    expect(status).toBe(200)
    expect(body.data.planned).toBe(0)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('never claims a contact when the deadline leaves no time to send', async () => {
    timeAllowed = false
    const { status, body } = await callCron()
    expect(status).toBe(200)
    expect(state.inserts).toHaveLength(0)
    expect(sendMock).not.toHaveBeenCalled()
    expect(body.data.sent).toBe(0)
    expect(body.data.skipped).toBeGreaterThan(0)
  })

  it('FAIL PATH: a thrown send keeps the claim (no delete, no retry duplicate)', async () => {
    sendMock.mockRejectedValue(new Error('timeout'))
    const { body } = await callCron()
    expect(state.inserts).toHaveLength(1)
    expect(state.deletes).toBe(0)
    expect(body.data.ambiguous).toBe(1)
    expect(body.data.sent).toBe(0)
  })

  it('an explicit API error releases the claim so the next run can retry', async () => {
    sendMock.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'x' } })
    const { body } = await callCron()
    expect(state.deletes).toBe(1)
    expect(body.data.failed).toBe(1)
  })
})
