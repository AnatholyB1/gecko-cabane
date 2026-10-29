import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHmac } from 'node:crypto'
import { NextRequest } from 'next/server'
import { parseResendWebhookEvent } from '../src/utils/newsletter-withdrawal'

const inserted: Record<string, unknown>[] = []
let ledgerRows: Record<string, unknown>[] = []

vi.mock('@/utils/supabase/server', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ ilike: async () => ({ data: ledgerRows, error: null }) }),
      insert: async (row: Record<string, unknown>) => {
        inserted.push(row)
        return { error: null }
      },
    }),
    rpc: async () => ({ error: null }),
  }),
}))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }))

const SECRET_RAW = Buffer.from('test-signing-secret-bytes-0123456789')
const WEBHOOK_SECRET = `whsec_${SECRET_RAW.toString('base64')}`

function signed(payload: string, opts: { id?: string; ts?: number; secret?: Buffer } = {}) {
  const id = opts.id ?? 'msg_1'
  const ts = String(opts.ts ?? Math.floor(Date.now() / 1000))
  const sig = createHmac('sha256', opts.secret ?? SECRET_RAW)
    .update(`${id}.${ts}.${payload}`)
    .digest('base64')
  return { 'svix-id': id, 'svix-timestamp': ts, 'svix-signature': `v1,${sig}` }
}

function req(payload: string, headers: Record<string, string>) {
  return new NextRequest('https://example.com/api/webhooks/resend', {
    method: 'POST',
    body: payload,
    headers,
  })
}

const complaint = JSON.stringify({
  type: 'email.complained',
  created_at: new Date().toISOString(),
  data: { to: ['Jean@Gmail.com'], email_id: 'x', from: 'a@b.co', subject: 's', message_id: 'm', created_at: 'x' },
})

describe('parseResendWebhookEvent', () => {
  it('maps a spam complaint to a withdrawal for each recipient', () => {
    const out = parseResendWebhookEvent(JSON.parse(complaint))
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ kind: 'withdraw', email: 'jean@gmail.com' })
  })
  it('maps only permanent bounces', () => {
    const base = { type: 'email.bounced', created_at: new Date().toISOString() }
    const perm = parseResendWebhookEvent({ ...base, data: { to: ['a@b.co'], bounce: { type: 'Permanent' } } })
    const temp = parseResendWebhookEvent({ ...base, data: { to: ['a@b.co'], bounce: { type: 'Transient' } } })
    expect(perm).toHaveLength(1)
    expect(temp).toEqual([])
  })
  it('maps a dashboard unsubscribe, ignores a re-subscribe', () => {
    const base = { type: 'contact.updated', created_at: new Date().toISOString() }
    expect(parseResendWebhookEvent({ ...base, data: { email: 'a@b.co', unsubscribed: true } })).toHaveLength(1)
    expect(parseResendWebhookEvent({ ...base, data: { email: 'a@b.co', unsubscribed: false } })).toEqual([])
  })
  it('ignores other events, invalid emails and non-objects', () => {
    expect(parseResendWebhookEvent({ type: 'email.opened', data: { to: ['a@b.co'] } })).toEqual([])
    expect(parseResendWebhookEvent({ type: 'email.complained', data: { to: ['nope'] } })).toEqual([])
    for (const v of [null, undefined, 'x', 42]) expect(parseResendWebhookEvent(v)).toEqual([])
  })
  it('falls back to now for missing or absurd timestamps', () => {
    const before = Date.now()
    const out = parseResendWebhookEvent({ type: 'email.complained', created_at: '1999-01-01', data: { to: ['a@b.co'] } })
    expect(Date.parse(out[0].at)).toBeGreaterThanOrEqual(before - 1000)
  })
})

describe('POST /api/webhooks/resend', () => {
  beforeEach(() => {
    inserted.length = 0
    ledgerRows = []
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    vi.stubEnv('RESEND_WEBHOOK_SECRET', WEBHOOK_SECRET)
  })
  afterEach(() => vi.unstubAllEnvs())

  it('401 without signature headers', async () => {
    const { POST } = await import('../src/app/api/webhooks/resend/route')
    const res = await POST(req(complaint, {}))
    expect(res.status).toBe(401)
    expect(inserted).toHaveLength(0)
  })

  it('401 with a signature made with another secret', async () => {
    const { POST } = await import('../src/app/api/webhooks/resend/route')
    const res = await POST(req(complaint, signed(complaint, { secret: Buffer.from('other') })))
    expect(res.status).toBe(401)
    expect(inserted).toHaveLength(0)
  })

  it('401 when the body was altered after signing', async () => {
    const { POST } = await import('../src/app/api/webhooks/resend/route')
    const headers = signed(complaint)
    const res = await POST(req(complaint.replace('Jean', 'Eve'), headers))
    expect(res.status).toBe(401)
  })

  it('401 when no webhook secret is configured', async () => {
    vi.stubEnv('RESEND_WEBHOOK_SECRET', '')
    const { POST } = await import('../src/app/api/webhooks/resend/route')
    const res = await POST(req(complaint, signed(complaint)))
    expect(res.status).toBe(401)
  })

  it('writes a resend_webhook withdrawal for an active subscriber', async () => {
    ledgerRows = [
      {
        id: 1, email: 'jean@gmail.com', consent: true, locale: 'fr', source: 'footer',
        consented_at: '2026-10-01T00:00:00Z', confirmed_at: '2026-10-01T00:05:00Z',
        confirmation_sent_at: '2026-10-01T00:00:10Z',
      },
    ]
    const { POST } = await import('../src/app/api/webhooks/resend/route')
    const res = await POST(req(complaint, signed(complaint)))
    expect(res.status).toBe(200)
    expect(inserted).toHaveLength(1)
    expect(inserted[0]).toMatchObject({ email: 'jean@gmail.com', consent: false, source: 'resend_webhook', locale: 'fr' })
  })

  it('writes nothing when the address is already withdrawn or unknown', async () => {
    const { POST } = await import('../src/app/api/webhooks/resend/route')
    const res = await POST(req(complaint, signed(complaint)))
    expect(res.status).toBe(200)
    expect(inserted).toHaveLength(0)
  })
})
