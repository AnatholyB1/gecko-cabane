import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchAllPages, PAGE_SIZE, TruncatedReadError } from '../src/utils/paginate'
import { sendIdempotencyKey, hasTimeForSend, SEND_ITERATION_MS } from '../src/utils/newsletter-send'
import {
  resolveEmailState,
  decideSubscribeAction,
  resolveActiveSubscribers,
  MAX_PENDING_CONFIRMATIONS,
  type LedgerRow,
} from '../src/utils/newsletter-ledger'

function row(over: Partial<LedgerRow> = {}): LedgerRow {
  return {
    id: 1,
    email: 'a@example.com',
    consent: true,
    source: 'footer',
    locale: 'fr',
    consented_at: '2026-10-01T10:00:00Z',
    confirmed_at: null,
    confirmation_sent_at: null,
    country: null,
    is_resident: false,
    contact_synced_at: null,
    last_visit_synced: null,
    reservation_id: null,
    ...over,
  }
}

// ---- 1. pagination: fail closed ------------------------------------------------
describe('fetchAllPages', () => {
  const makeSource = (total: number, maxRows = PAGE_SIZE, reportedCount: number = total) => {
    const all = Array.from({ length: total }, (_, i) => ({ id: i + 1 }))
    return async (from: number, to: number) => ({
      data: all.slice(from, Math.min(to + 1, from + maxRows)),
      error: null,
      count: reportedCount,
    })
  }

  it('reads 1500 rows across pages so a late withdrawal is never lost', async () => {
    const rows = await fetchAllPages(makeSource(1500))
    expect(rows).toHaveLength(1500)
    expect(rows[1499]).toEqual({ id: 1500 })
  })

  it('a withdrawal beyond row 1000 still wins in the resolved state', async () => {
    const ledger: LedgerRow[] = []
    for (let i = 1; i <= 1499; i++) {
      ledger.push(row({ id: i, email: `u${i}@example.com`, consented_at: '2026-10-01T10:00:00Z', confirmed_at: '2026-10-01T11:00:00Z' }))
    }
    ledger.push(row({ id: 1500, email: 'u5@example.com', consent: false, consented_at: '2026-10-20T10:00:00Z' }))
    const source = async (from: number, to: number) => ({
      data: ledger.slice(from, to + 1),
      error: null,
      count: ledger.length,
    })
    const all = await fetchAllPages<LedgerRow>(source)
    expect(resolveActiveSubscribers(all).has('u5@example.com')).toBe(false)
    expect(resolveActiveSubscribers(all).size).toBe(1498)
  })

  it('FAILS when the server caps pages below the declared count (truncation)', async () => {
    // server max_rows 300 with 1200 rows: pages come back short and then empty
    const all = Array.from({ length: 1200 }, (_, i) => ({ id: i + 1 }))
    const capped = async (from: number) => ({
      data: from < 300 ? all.slice(from, 300) : [],
      error: null,
      count: 1200,
    })
    await expect(fetchAllPages(capped)).rejects.toBeInstanceOf(TruncatedReadError)
  })

  it('FAILS when no exact count is returned', async () => {
    await expect(fetchAllPages(async () => ({ data: [], error: null, count: null }))).rejects.toThrow(/count/)
  })

  it('FAILS on a database error', async () => {
    await expect(
      fetchAllPages(async () => ({ data: null, error: { message: 'boom' }, count: null }))
    ).rejects.toThrow('boom')
  })

  it('handles an empty ledger', async () => {
    expect(await fetchAllPages(makeSource(0))).toEqual([])
  })
})

// ---- 2. idempotency key + time budget -------------------------------------------
describe('send idempotency and time budget', () => {
  it('key is stable per (kind, period, contact), case-insensitive, and hides the email', () => {
    const a = sendIdempotencyKey('Eve@Example.com', 'october_return', '2026')
    expect(a).toBe(sendIdempotencyKey('eve@example.com', 'october_return', '2026'))
    expect(a).not.toContain('example')
    expect(a).not.toBe(sendIdempotencyKey('eve@example.com', 'green_season', '2026'))
    expect(a).not.toBe(sendIdempotencyKey('eve@example.com', 'october_return', '2027'))
    expect(a).not.toBe(sendIdempotencyKey('bob@example.com', 'october_return', '2026'))
    expect(a.length).toBeLessThanOrEqual(256)
  })

  it('refuses to start a send that cannot finish before the deadline', () => {
    const deadline = 100_000
    expect(hasTimeForSend(deadline - SEND_ITERATION_MS, deadline)).toBe(true)
    expect(hasTimeForSend(deadline - SEND_ITERATION_MS + 1, deadline)).toBe(false)
    expect(hasTimeForSend(deadline + 1, deadline)).toBe(false)
  })
})

// ---- 3. subscribe policy --------------------------------------------------------
describe('decideSubscribeAction hardening', () => {
  const now = Date.parse('2026-10-20T12:00:00Z')

  it('never mails a withdrawn address, even long after', () => {
    const s = resolveEmailState([
      row({ id: 1, confirmed_at: '2026-10-01T11:00:00Z' }),
      row({ id: 2, consent: false, consented_at: '2026-10-02T10:00:00Z' }),
    ])
    expect(decideSubscribeAction(s, now + 400 * 24 * 3600_000)).toBe('skip_withdrawn')
  })

  it('stops after MAX_PENDING_CONFIRMATIONS unconfirmed rows', () => {
    const old = new Date(now - 48 * 3600_000).toISOString()
    const rows = Array.from({ length: MAX_PENDING_CONFIRMATIONS }, (_, i) =>
      row({ id: i + 1, consented_at: old, confirmation_sent_at: old })
    )
    expect(decideSubscribeAction(resolveEmailState(rows), now)).toBe('skip_pending_cap')
    expect(decideSubscribeAction(resolveEmailState(rows.slice(1)), now)).toBe('create')
  })

  it('an older pending row mailed within 24 h blocks a new row (no row-hopping)', () => {
    const recent = new Date(now - 3600_000).toISOString()
    const old = new Date(now - 48 * 3600_000).toISOString()
    const s = resolveEmailState([
      row({ id: 1, consented_at: old, confirmation_sent_at: recent }),
      row({ id: 2, consented_at: recent, confirmation_sent_at: null }),
    ])
    expect(decideSubscribeAction(s, now)).toBe('skip_recent_pending')
  })
})

// ---- 4. reservation opt-in confirmation (mocked supabase + resend, no network) --
const sendMock = vi.fn()
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }))
vi.mock('../src/utils/resend', () => ({
  getResendClient: () => ({ emails: { send: sendMock } }),
  RESEND_FROM_EMAIL: 'Test <t@example.com>',
}))

type Update = { values: Record<string, unknown>; id: number }
function fakeAdmin(rows: LedgerRow[]) {
  const updates: Update[] = []
  const admin = {
    from: () => ({
      select: () => ({ ilike: async () => ({ data: rows, error: null }) }),
      update: (values: Record<string, unknown>) => ({
        eq: (_c: string, id: number) => {
          updates.push({ values, id })
          const res = { data: [{ id }], error: null }
          return { is: () => ({ select: async () => res }), then: (f: (v: unknown) => unknown) => f({ error: null }) }
        },
      }),
    }),
  }
  return { admin: admin as never, updates }
}

describe('sendReservationOptInConfirmation', () => {
  beforeEach(() => {
    sendMock.mockReset()
    sendMock.mockResolvedValue({ data: { id: 'x' }, error: null })
    process.env.NEWSLETTER_SIGNING_SECRET = 'test-secret-test-secret-test-secret-1234'
  })

  it('sends one double opt-in confirmation, with an idempotency key and unsubscribe headers', async () => {
    const { sendReservationOptInConfirmation } = await import('../src/utils/newsletter-reservation-confirm')
    const { admin, updates } = fakeAdmin([
      row({ id: 7, source: 'reservation_form', reservation_id: 42, email: 'g@example.com' }),
    ])
    const out = await sendReservationOptInConfirmation(admin, { email: 'G@example.com', reservationId: 42 })
    expect(out).toBe('sent')
    expect(sendMock).toHaveBeenCalledTimes(1)
    const [payload, opts] = sendMock.mock.calls[0]
    expect(payload.to).toBe('g@example.com')
    expect(payload.html).toContain('/newsletter/confirm')
    expect(payload.headers['List-Unsubscribe']).toBeTruthy()
    expect(opts.idempotencyKey).toMatch(/^nl:reservation_optin:7:/)
    expect(updates[0].values.confirmation_sent_at).toBeTruthy()
  })

  it('FAIL PATH: sends nothing to an address that ever withdrew', async () => {
    const { sendReservationOptInConfirmation } = await import('../src/utils/newsletter-reservation-confirm')
    const { admin } = fakeAdmin([
      row({ id: 1, email: 'g@example.com', confirmed_at: '2026-09-01T11:00:00Z', consented_at: '2026-09-01T10:00:00Z' }),
      row({ id: 2, email: 'g@example.com', consent: false, consented_at: '2026-09-10T10:00:00Z' }),
      row({ id: 3, email: 'g@example.com', source: 'reservation_form', reservation_id: 42, consented_at: '2026-10-19T10:00:00Z' }),
    ])
    expect(await sendReservationOptInConfirmation(admin, { email: 'g@example.com', reservationId: 42 })).toBe('skipped')
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('FAIL PATH: sends nothing to an already active subscriber or without the signing secret', async () => {
    const { sendReservationOptInConfirmation } = await import('../src/utils/newsletter-reservation-confirm')
    const active = fakeAdmin([
      row({ id: 1, email: 'g@example.com', confirmed_at: '2026-09-01T11:00:00Z', consented_at: '2026-09-01T10:00:00Z' }),
      row({ id: 3, email: 'g@example.com', source: 'reservation_form', reservation_id: 42, consented_at: '2026-10-19T10:00:00Z' }),
    ])
    expect(await sendReservationOptInConfirmation(active.admin, { email: 'g@example.com', reservationId: 42 })).toBe('skipped')
    delete process.env.NEWSLETTER_SIGNING_SECRET
    const none = fakeAdmin([row({ id: 3, source: 'reservation_form', reservation_id: 42 })])
    expect(await sendReservationOptInConfirmation(none.admin, { email: 'a@example.com', reservationId: 42 })).toBe('no_secret')
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('FAIL PATH: a Resend API error releases the claim and reports failed', async () => {
    const { sendReservationOptInConfirmation } = await import('../src/utils/newsletter-reservation-confirm')
    sendMock.mockResolvedValue({ data: null, error: { name: 'rate_limit_exceeded', message: 'x' } })
    const { admin, updates } = fakeAdmin([
      row({ id: 7, source: 'reservation_form', reservation_id: 42 }),
    ])
    expect(await sendReservationOptInConfirmation(admin, { email: 'a@example.com', reservationId: 42 })).toBe('failed')
    expect(updates.at(-1)?.values.confirmation_sent_at).toBeNull()
  })

  it('FAIL PATH: a thrown (ambiguous) send keeps the claim, so no duplicate is possible', async () => {
    const { sendReservationOptInConfirmation } = await import('../src/utils/newsletter-reservation-confirm')
    sendMock.mockRejectedValue(new Error('timeout'))
    const { admin, updates } = fakeAdmin([
      row({ id: 7, source: 'reservation_form', reservation_id: 42 }),
    ])
    expect(await sendReservationOptInConfirmation(admin, { email: 'a@example.com', reservationId: 42 })).toBe('failed')
    expect(updates.every((u) => u.values.confirmation_sent_at !== null)).toBe(true)
  })
})
