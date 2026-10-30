/**
 * GET /api/kpi (plan 08-07, KPI-06, D-05): admin-only weekly KPI history.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

const requireAdmin = vi.fn()
const captureException = vi.fn()

vi.mock('@/utils/auth', () => ({ requireAdmin: (...a: unknown[]) => requireAdmin(...a) }))
vi.mock('@sentry/nextjs', () => ({ captureException: (...a: unknown[]) => captureException(...a) }))

import { GET } from '@/app/api/kpi/route'

type Req = import('next/server').NextRequest

const req = (qs = '') => new Request(`http://localhost/api/kpi${qs}`) as unknown as Req

function fakeSupabase(result: { data: unknown; error: unknown }) {
  const calls = { table: '', select: '', order: [] as unknown[], limit: -1 }
  const chain = {
    select: (s: string) => {
      calls.select = s
      return chain
    },
    order: (...a: unknown[]) => {
      calls.order = a
      return chain
    },
    limit: (n: number) => {
      calls.limit = n
      return Promise.resolve(result)
    },
  }
  const from = vi.fn((t: string) => {
    calls.table = t
    return chain
  })
  return { supabase: { from }, from, calls }
}

beforeEach(() => {
  requireAdmin.mockReset()
  captureException.mockReset()
})

describe('GET /api/kpi', () => {
  it('returns 401 without touching Supabase when anonymous', async () => {
    requireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const res = await GET(req())
    expect(res.status).toBe(401)
  })

  it('propagates 403 for a non-admin account', async () => {
    requireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    })
    const res = await GET(req())
    expect(res.status).toBe(403)
  })

  it('queries gecko_weekly_kpis newest first, default limit 12', async () => {
    const f = fakeSupabase({ data: [], error: null })
    requireAdmin.mockResolvedValue({ ok: true, supabase: f.supabase, user: { id: 'u' } })
    const res = await GET(req())
    expect(res.status).toBe(200)
    expect(f.calls.table).toBe('gecko_weekly_kpis')
    expect(f.calls.select).toBe('*')
    expect(f.calls.order).toEqual(['week_start', { ascending: false }])
    expect(f.calls.limit).toBe(12)
    expect(await res.json()).toEqual({ data: { weeks: [], testReportsSent: 0 } })
  })

  it.each([
    ['?weeks=60', 52],
    ['?weeks=abc', 12],
    ['?weeks=0', 1],
    ['?weeks=-5', 1],
    ['?weeks=7', 7],
    ['?weeks=3.9', 3],
  ])('bounds weeks %s to %i', async (qs, expected) => {
    const f = fakeSupabase({ data: [], error: null })
    requireAdmin.mockResolvedValue({ ok: true, supabase: f.supabase, user: { id: 'u' } })
    await GET(req(qs))
    expect(f.calls.limit).toBe(expected)
  })

  it('counts only TEST reports actually sent', async () => {
    const rows = [
      { week_start: '2026-11-09', report_mode: 'test', report_sent_at: '2026-11-09T01:00:00Z' },
      { week_start: '2026-11-02', report_mode: 'test', report_sent_at: null },
      { week_start: '2026-10-26', report_mode: 'live', report_sent_at: '2026-10-26T01:00:00Z' },
      { week_start: '2026-10-19', report_mode: null, report_sent_at: null },
    ]
    const f = fakeSupabase({ data: rows, error: null })
    requireAdmin.mockResolvedValue({ ok: true, supabase: f.supabase, user: { id: 'u' } })
    const json = await (await GET(req())).json()
    expect(json.data.testReportsSent).toBe(1)
    expect(json.data.weeks).toHaveLength(4)
  })

  it('returns a generic 500 and reports to Sentry on Supabase error', async () => {
    const f = fakeSupabase({ data: null, error: { message: 'secret relation detail' } })
    requireAdmin.mockResolvedValue({ ok: true, supabase: f.supabase, user: { id: 'u' } })
    const res = await GET(req())
    expect(res.status).toBe(500)
    const text = JSON.stringify(await res.json())
    expect(text).toContain('Erreur serveur')
    expect(text).not.toContain('secret')
    expect(captureException).toHaveBeenCalled()
  })
})
