/**
 * PUT /api/kpi (plan 08-09, KPI-07, D-03, D-08): saisie manuelle + alerte immédiate
 * note <= 3, et non-régression du retour privé « Un souci ? » (un seul email, pas de doublon).
 * Client Supabase factice, Resend mocké : aucun envoi réel, aucune écriture en base.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextResponse } from 'next/server'

const afterCallbacks: Array<() => unknown> = []
const requireAdmin = vi.fn()
const captureException = vi.fn()
const captureMessage = vi.fn()
const send = vi.fn()
const checkLimit = vi.fn()
let resendClient: { emails: { send: typeof send } } | null = null

vi.mock('@/utils/auth', () => ({ requireAdmin: (...a: unknown[]) => requireAdmin(...a) }))
vi.mock('@/utils/supabase/server', () => ({
  createAdminClient: vi.fn(() => ({ rpc: vi.fn() })),
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
vi.mock('@/utils/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/rate-limit')>()
  return { ...actual, checkFeedbackRateLimit: (...a: unknown[]) => checkLimit(...a) }
})

import { PUT } from '@/app/api/kpi/route'
import { POST as feedbackPOST } from '@/app/api/review/feedback/route'

type Req = import('next/server').NextRequest

const WEEK = '2026-10-26'

const putReq = (body: unknown, raw = false) =>
  new Request('http://localhost/api/kpi', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: raw ? (body as string) : JSON.stringify(body),
  }) as unknown as Req

type Existing = { week_start: string; google_min_rating: number | null } | null

function fakeSupabase(opts: { existing: Existing; writeError?: boolean }) {
  const calls = {
    inserts: [] as Record<string, unknown>[],
    updates: [] as Record<string, unknown>[],
    updateEq: [] as unknown[],
    upsert: vi.fn(),
  }
  const writeResult = () =>
    opts.writeError
      ? { data: null, error: { message: 'secret db detail' } }
      : { data: { week_start: WEEK, google_min_rating: 2 }, error: null }
  const from = vi.fn(() => ({
    select: () => ({
      eq: () => ({ maybeSingle: () => Promise.resolve({ data: opts.existing, error: null }) }),
    }),
    insert: (p: Record<string, unknown>) => {
      calls.inserts.push(p)
      return { select: () => ({ single: () => Promise.resolve(writeResult()) }) }
    },
    update: (p: Record<string, unknown>) => {
      calls.updates.push(p)
      return {
        eq: (...a: unknown[]) => {
          calls.updateEq.push(a)
          return { select: () => ({ single: () => Promise.resolve(writeResult()) }) }
        },
      }
    },
    upsert: calls.upsert,
  }))
  return { supabase: { from }, from, calls }
}

function asAdmin(existing: Existing, writeError = false) {
  const f = fakeSupabase({ existing, writeError })
  requireAdmin.mockResolvedValue({ ok: true, supabase: f.supabase, user: { id: 'u' } })
  return f
}

async function runAfter() {
  for (const cb of afterCallbacks.splice(0)) await cb()
}

beforeEach(() => {
  requireAdmin.mockReset()
  captureException.mockReset()
  captureMessage.mockReset()
  send.mockReset()
  send.mockResolvedValue({})
  checkLimit.mockReset()
  checkLimit.mockResolvedValue({ limited: false })
  afterCallbacks.length = 0
  resendClient = { emails: { send } }
})

describe('PUT /api/kpi guards and validation', () => {
  it('401 anonymous', async () => {
    requireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    expect((await PUT(putReq({ week_start: WEEK }))).status).toBe(401)
  })

  it('403 non admin', async () => {
    requireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    })
    expect((await PUT(putReq({ week_start: WEEK }))).status).toBe(403)
  })

  it('400 on invalid JSON', async () => {
    asAdmin(null)
    const res = await PUT(putReq('{nope', true))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Requête invalide')
  })

  it.each([
    { week_start: WEEK, google_min_rating: 6 },
    { week_start: '2026-10-27' },
    { week_start: WEEK, google_reviews_total: -1 },
    { week_start: WEEK, manual_note: 'a'.repeat(501) },
  ])('400 on invalid input %j', async (body) => {
    const f = asAdmin(null)
    const res = await PUT(putReq(body))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Saisie invalide')
    expect(f.calls.inserts).toHaveLength(0)
    expect(f.calls.updates).toHaveLength(0)
  })
})

describe('PUT /api/kpi persistence', () => {
  it('inserts when the week row is absent, with manual columns only', async () => {
    const f = asAdmin(null)
    const res = await PUT(
      putReq({ week_start: WEEK, google_reviews_total: 100, google_min_rating: 5, report_sent_at: 'x' })
    )
    expect(res.status).toBe(200)
    expect(f.calls.inserts).toHaveLength(1)
    const p = f.calls.inserts[0]
    expect(p.week_start).toBe(WEEK)
    expect(p.week_end).toBe('2026-11-01')
    expect(p.google_reviews_total).toBe(100)
    expect(p).toHaveProperty('manual_updated_at')
    expect(p).not.toHaveProperty('report_sent_at')
    expect(p).not.toHaveProperty('reservations_new')
    expect(f.calls.upsert).not.toHaveBeenCalled()
  })

  it('updates only manual columns when the row exists', async () => {
    const f = asAdmin({ week_start: WEEK, google_min_rating: 5 })
    const res = await PUT(putReq({ week_start: WEEK, google_new_reviews: 3, google_min_rating: 5 }))
    expect(res.status).toBe(200)
    expect(f.calls.updates).toHaveLength(1)
    const p = f.calls.updates[0]
    expect(p).not.toHaveProperty('week_start')
    expect(p).not.toHaveProperty('week_end')
    expect(p).toHaveProperty('manual_updated_at')
    expect(p).toHaveProperty('updated_at')
    expect(f.calls.updateEq[0]).toEqual(['week_start', WEEK])
    expect(f.calls.inserts).toHaveLength(0)
    expect(f.calls.upsert).not.toHaveBeenCalled()
  })

  it('500 generic without leaking the database message', async () => {
    asAdmin(null, true)
    const res = await PUT(putReq({ week_start: WEEK }))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Erreur serveur')
    expect(JSON.stringify(json)).not.toContain('secret db detail')
  })
})

describe('PUT /api/kpi immediate low-rating alert (D-08)', () => {
  it('null -> 2 sends exactly one alert with a per-week-and-rating idempotency key', async () => {
    asAdmin({ week_start: WEEK, google_min_rating: null })
    const res = await PUT(putReq({ week_start: WEEK, google_min_rating: 2, manual_note: 'sec' }))
    expect((await res.json()).data.alerted).toBe(true)
    await runAfter()
    expect(send).toHaveBeenCalledTimes(1)
    const [payload, options] = send.mock.calls[0]
    expect(payload.to).toBe('owner@example.com')
    expect(payload.subject).toMatch(/^Alerte avis/)
    expect(options).toEqual({ idempotencyKey: `kpi-lowrating-${WEEK}-2` })
  })

  it('also alerts on a brand-new row (insert path)', async () => {
    asAdmin(null)
    const res = await PUT(putReq({ week_start: WEEK, google_min_rating: 1 }))
    expect((await res.json()).data.alerted).toBe(true)
    await runAfter()
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('re-entering the same rating sends nothing', async () => {
    asAdmin({ week_start: WEEK, google_min_rating: 2 })
    const res = await PUT(putReq({ week_start: WEEK, google_min_rating: 2 }))
    expect((await res.json()).data.alerted).toBe(false)
    await runAfter()
    expect(send).not.toHaveBeenCalled()
  })

  it('a rating of 4 sends nothing', async () => {
    asAdmin({ week_start: WEEK, google_min_rating: null })
    const res = await PUT(putReq({ week_start: WEEK, google_min_rating: 4 }))
    expect((await res.json()).data.alerted).toBe(false)
    await runAfter()
    expect(send).not.toHaveBeenCalled()
  })

  it('unconfigured Resend: entry is saved (200) and Sentry is told, no content leaked', async () => {
    resendClient = null
    asAdmin({ week_start: WEEK, google_min_rating: null })
    const res = await PUT(putReq({ week_start: WEEK, google_min_rating: 2, manual_note: 'texte privé' }))
    expect(res.status).toBe(200)
    await runAfter()
    expect(captureMessage).toHaveBeenCalledWith('kpi low rating alert not configured', 'error')
    expect(JSON.stringify(captureMessage.mock.calls)).not.toContain('texte privé')
  })

  it('send failure goes to Sentry without the note text', async () => {
    send.mockRejectedValue(new Error('boom'))
    asAdmin({ week_start: WEEK, google_min_rating: null })
    const res = await PUT(putReq({ week_start: WEEK, google_min_rating: 2, manual_note: 'texte privé' }))
    expect(res.status).toBe(200)
    await runAfter()
    expect(captureException).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(captureException.mock.calls)).not.toContain('texte privé')
  })
})

describe('non-regression: private feedback "Un souci ?" (D-08, pitfall 8)', () => {
  it('a valid POST /api/review/feedback sends exactly one owner email', async () => {
    const req = new Request('http://localhost/api/review/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '1.2.3.4' },
      body: JSON.stringify({
        message: 'La soupe était froide',
        locale: 'fr',
        company_url: '',
        form_started_at: Date.now() - 10000,
      }),
    }) as unknown as Req
    const res = await feedbackPOST(req)
    expect(res.status).toBe(200)
    await runAfter()
    expect(send).toHaveBeenCalledTimes(1)
    const [payload] = send.mock.calls[0]
    expect(payload.to).toBe('owner@example.com')
    expect(payload.subject).toMatch(/^Un souci \?/)
  })

  it('the KPI route does not reference the feedback channel', () => {
    const src = readFileSync(join(process.cwd(), 'src/app/api/kpi/route.ts'), 'utf8')
    expect(src).not.toContain('/api/review/feedback')
    expect(src).not.toContain('review-feedback')
  })

  it('the KPI route never upserts', () => {
    const src = readFileSync(join(process.cwd(), 'src/app/api/kpi/route.ts'), 'utf8')
    expect(src).not.toContain('.upsert(')
  })
})

afterEach(() => {
  afterCallbacks.length = 0
})
