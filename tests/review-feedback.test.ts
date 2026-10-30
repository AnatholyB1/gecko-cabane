/**
 * "Un souci ?" feedback channel (REV-07, D-23): schema, owner email, route pipeline.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const rpc = vi.fn()
const afterCallbacks: Array<() => unknown> = []
const captureException = vi.fn()
const captureMessage = vi.fn()
const send = vi.fn()
let resendClient: { emails: { send: typeof send } } | null = null

vi.mock('@/utils/supabase/server', () => ({
  createAdminClient: vi.fn(() => ({ rpc: (...a: unknown[]) => rpc(...a) })),
  createClient: vi.fn(),
  isGeckoAdmin: vi.fn(),
}))
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return { ...actual, after: (cb: () => unknown) => void afterCallbacks.push(cb) }
})
vi.mock('@/utils/resend', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/resend')>()
  return {
    ...actual,
    getResendClient: () => resendClient,
    RESTAURANT_NOTIFICATION_EMAIL: 'owner@example.com',
  }
})
vi.mock('@sentry/nextjs', () => ({
  captureException: (...a: unknown[]) => captureException(...a),
  captureMessage: (...a: unknown[]) => captureMessage(...a),
}))
const checkLimit = vi.fn()
vi.mock('@/utils/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/rate-limit')>()
  return { ...actual, checkFeedbackRateLimit: (...a: unknown[]) => checkLimit(...a) }
})

import { POST } from '@/app/api/review/feedback/route'
import {
  feedbackRequestSchema,
  feedbackEmail,
  feedbackErrorCode,
} from '../src/utils/review-feedback'

const UUID = '123e4567-e89b-12d3-a456-426614174000'

function code(input: unknown) {
  const r = feedbackRequestSchema.safeParse(input)
  return r.success ? null : feedbackErrorCode(r.error)
}

describe('feedbackRequestSchema', () => {
  it('trims and defaults', () => {
    const r = feedbackRequestSchema.parse({ message: '  La soupe était froide  ' })
    expect(r.message).toBe('La soupe était froide')
    expect(r.email).toBeUndefined()
    expect(r.src).toBeNull()
    expect(r.rid).toBeNull()
    expect(r.locale).toBe('fr')
  })

  it.each(['fr', 'en', 'de', 'sv'])('keeps the real locale %s', (loc) => {
    expect(feedbackRequestSchema.parse({ message: 'hello there', locale: loc }).locale).toBe(loc)
  })

  it('falls back to fr for an unknown locale', () => {
    expect(feedbackRequestSchema.parse({ message: 'hello there', locale: 'xx' }).locale).toBe('fr')
  })

  it('enforces message length', () => {
    expect(code({ message: 'abcd' })).toBe('invalid_message')
    expect(code({ message: 'a'.repeat(1001) })).toBe('invalid_message')
    expect(code({ message: 'a'.repeat(1000) })).toBeNull()
  })

  it('normalizes email', () => {
    expect(feedbackRequestSchema.parse({ message: 'hello there', email: '' }).email).toBeUndefined()
    expect(code({ message: 'hello there', email: 'bad' })).toBe('invalid_email')
    expect(feedbackRequestSchema.parse({ message: 'hello there', email: ' A@B.CO ' }).email).toBe('a@b.co')
  })

  it('allowlists src and rid, strips unknown keys', () => {
    const ok = feedbackRequestSchema.parse({ message: 'hello there', src: 'qr', rid: UUID, extra: 1 })
    expect(ok.src).toBe('qr')
    expect(ok.rid).toBe(UUID)
    expect('extra' in ok).toBe(false)
    const bad = feedbackRequestSchema.parse({ message: 'hello there', src: 'evil', rid: 'x' })
    expect(bad.src).toBeNull()
    expect(bad.rid).toBeNull()
  })
})

describe('feedbackEmail', () => {
  it('escapes HTML and keeps the subject on one line', () => {
    const m = feedbackEmail({
      message: '<script>x</script>\nline2',
      email: 'a@b.co',
      src: 'qr',
      rid: UUID,
      locale: 'en',
    })
    expect(m.html).toContain('&lt;script&gt;')
    expect(m.html).not.toContain('<script>')
    expect(m.subject).not.toMatch(/[\r\n]/)
    expect(m.subject).toContain('qr')
    expect(m.text).toContain('line2')
    expect(m.html).toContain('rid')
  })

  it('labels a missing source as inconnue', () => {
    const m = feedbackEmail({ message: 'hello there', src: null, rid: null, locale: 'fr' })
    expect(m.subject).toContain('inconnue')
    expect(m.html).toContain('absent')
  })
})

describe('POST /api/review/feedback', () => {
  const req = (body: unknown, raw = false) =>
    new Request('http://localhost/api/review/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '1.2.3.4' },
      body: raw ? (body as string) : JSON.stringify(body),
    }) as unknown as import('next/server').NextRequest
  const valid = (extra: Record<string, unknown> = {}) => ({
    message: 'La soupe était froide',
    locale: 'fr',
    company_url: '',
    form_started_at: Date.now() - 10000,
    ...extra,
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-20T03:00:00Z'))
    rpc.mockReset()
    send.mockReset()
    send.mockResolvedValue({})
    captureException.mockReset()
    captureMessage.mockReset()
    checkLimit.mockReset()
    checkLimit.mockResolvedValue({ limited: false })
    afterCallbacks.length = 0
    resendClient = { emails: { send } }
  })
  afterEach(() => vi.useRealTimers())

  it('rejects invalid JSON', async () => {
    const res = await POST(req('{nope', true))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('invalid_body')
  })

  it('fakes success on a filled honeypot without side effects', async () => {
    const res = await POST(req(valid({ company_url: 'http://spam' })))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: { ok: true } })
    expect(checkLimit).not.toHaveBeenCalled()
    expect(afterCallbacks).toHaveLength(0)
  })

  it('rejects a too-fast or missing timestamp', async () => {
    let res = await POST(req(valid({ form_started_at: Date.now() - 500 })))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('too_fast')
    res = await POST(req({ message: 'hello there' }))
    expect(res.status).toBe(400)
  })

  it('does not consume quota on invalid input', async () => {
    const res = await POST(req(valid({ message: 'abc' })))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('invalid_message')
    expect(checkLimit).not.toHaveBeenCalled()
  })

  it('returns 429 when rate limited', async () => {
    checkLimit.mockResolvedValue({ limited: true })
    const res = await POST(req(valid()))
    expect(res.status).toBe(429)
    expect((await res.json()).code).toBe('rate_limited')
    expect(afterCallbacks).toHaveLength(0)
  })

  it.each(['de', 'sv', 'en'])('429 is in English for %s', async (loc) => {
    checkLimit.mockResolvedValue({ limited: true })
    const res = await POST(req(valid({ locale: loc })))
    expect(res.status).toBe(429)
    expect((await res.json()).error).toContain('Too many messages')
  })

  it('tells the owner the real visitor language (sv)', async () => {
    await POST(req(valid({ locale: 'sv' })))
    await afterCallbacks[0]()
    expect(send.mock.calls[0][0].text).toContain('Langue : sv')
  })

  it('emails the owner after the response', async () => {
    const res = await POST(req(valid({ email: 'Guest@Example.com', src: 'qr' })))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: { ok: true } })
    expect(afterCallbacks).toHaveLength(1)
    await afterCallbacks[0]()
    expect(send).toHaveBeenCalledTimes(1)
    const arg = send.mock.calls[0][0]
    expect(arg.to).toBe('owner@example.com')
    expect(arg.replyTo).toBe('guest@example.com')
  })

  it('omits replyTo without a guest email', async () => {
    await POST(req(valid()))
    await afterCallbacks[0]()
    expect('replyTo' in send.mock.calls[0][0]).toBe(false)
  })

  it('reports to Sentry when Resend is not configured', async () => {
    resendClient = null
    await POST(req(valid()))
    await expect(Promise.resolve(afterCallbacks[0]())).resolves.not.toThrow()
    expect(captureMessage).toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })
})

describe('feedback route source', () => {
  const src = readFileSync(join(__dirname, '..', 'src/app/api/review/feedback/route.ts'), 'utf8')
  it('stores nothing and keeps the message out of Sentry', () => {
    expect(src).not.toContain('.from(')
    expect(src).not.toContain('.insert(')
    expect(src).toContain('createAdminClient()')
    expect(src).toContain('Service role')
    expect(src).not.toContain('captureException(message')
    expect(src).not.toContain('extra: { message')
  })
})

describe('feedback copy', () => {
  it('fr success text', () => {
    const fr = JSON.parse(readFileSync(join(__dirname, '..', 'messages/fr.json'), 'utf8'))
    expect(fr.reviewFeedback.success).toBe('Merci, message transmis.')
  })
})
