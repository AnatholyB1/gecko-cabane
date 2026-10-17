/**
 * Review report helpers + admin stats route (REV-06, D-09)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

const requireAdmin = vi.fn()
const upsert = vi.fn()
const gteCalls: unknown[][] = []
let tableData: Record<string, unknown[]> = {}

vi.mock('@/utils/auth', () => ({ requireAdmin: (...a: unknown[]) => requireAdmin(...a) }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

import {
  REVIEW_SOURCE_LABELS,
  buildMonthTable,
  totalsEvolution,
  lastMonths,
  parseMonthParam,
  isValidTotal,
} from '@/utils/review-report'
import { GET, PUT } from '@/app/api/review/stats/route'

type Req = import('next/server').NextRequest
const mk = (url: string, init?: RequestInit) => new Request(url, init) as unknown as Req

describe('review-report helpers', () => {
  it('labels', () => {
    expect(REVIEW_SOURCE_LABELS).toEqual({
      email: 'Email',
      qr: 'QR code',
      wa: 'WhatsApp',
      site: 'Site',
      unknown: 'Inconnue',
    })
  })

  it('buildMonthTable aggregates one month with zeros filled', () => {
    const rows = [
      { month: '2026-11-01', source: 'qr', kind: 'visit', hits: 3 },
      { month: '2026-11-01', source: 'qr', kind: 'google', hits: 1 },
      { month: '2026-11-01', source: 'email', kind: 'visit', hits: 2 },
      { month: '2026-11-01', source: 'wa', kind: 'tripadvisor', hits: 1 },
      { month: '2026-10-01', source: 'qr', kind: 'visit', hits: 9 },
    ] as const
    const t = buildMonthTable([...rows], '2026-11')
    expect(t.rows.map((r) => r.source)).toEqual(['email', 'qr', 'wa', 'site', 'unknown'])
    const qr = t.rows.find((r) => r.source === 'qr')!
    expect({ visit: qr.visit, google: qr.google, tripadvisor: qr.tripadvisor }).toEqual({
      visit: 3,
      google: 1,
      tripadvisor: 0,
    })
    expect(t.total).toEqual({ visit: 5, google: 1, tripadvisor: 1 })
    expect(t.isEmpty).toBe(false)
    expect(buildMonthTable([...rows], '2026-09').isEmpty).toBe(true)
  })

  it('lastMonths uses the Asia/Bangkok calendar', () => {
    expect(lastMonths(3, new Date('2026-11-30T20:00:00Z'))).toEqual(['2026-12', '2026-11', '2026-10'])
  })

  it('totalsEvolution newest first with deltas', () => {
    expect(
      totalsEvolution([
        { month: '2026-10-01', platform: 'google', total_reviews: 1062 },
        { month: '2026-11-01', platform: 'google', total_reviews: 1080 },
        { month: '2026-11-01', platform: 'tripadvisor', total_reviews: 900 },
      ])
    ).toEqual([
      { month: '2026-11', google: 1080, tripadvisor: 900, googleDelta: 18, tripadvisorDelta: null },
      { month: '2026-10', google: 1062, tripadvisor: null, googleDelta: null, tripadvisorDelta: null },
    ])
  })

  it('parseMonthParam / isValidTotal', () => {
    expect(parseMonthParam('2026-01')).toBe('2026-01')
    expect(parseMonthParam('2026-12')).toBe('2026-12')
    for (const bad of ['2026-13', '26-01', '2026-1', '', null]) expect(parseMonthParam(bad)).toBeNull()
    expect(isValidTotal(0)).toBe(true)
    expect(isValidTotal(100000)).toBe(true)
    for (const bad of [-1, 100001, 1.5, '12', NaN]) expect(isValidTotal(bad)).toBe(false)
  })
})

const deny = (status: number) => ({
  ok: false,
  response: NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Forbidden' }, { status }),
})

function adminOk() {
  return {
    ok: true,
    user: { id: 'u1' },
    supabase: {
      from: (table: string) => {
        const chain: Record<string, unknown> = {}
        const result = { data: tableData[table] ?? [], error: null }
        chain.select = () => chain
        chain.gte = (...a: unknown[]) => {
          gteCalls.push(a)
          return chain
        }
        chain.order = () => chain
        chain.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res)
        chain.upsert = (...a: unknown[]) => {
          upsert(...a)
          return Promise.resolve({ error: null })
        }
        return chain
      },
    },
  }
}

const put = (body: unknown) =>
  PUT(mk('http://localhost/api/review/stats', { method: 'PUT', body: JSON.stringify(body) }))

describe('/api/review/stats', () => {
  beforeEach(() => {
    requireAdmin.mockReset()
    upsert.mockReset()
    gteCalls.length = 0
    tableData = {}
  })

  it('GET anonymous -> 401, non-admin -> 403', async () => {
    requireAdmin.mockResolvedValue(deny(401))
    expect((await GET(mk('http://localhost/api/review/stats'))).status).toBe(401)
    requireAdmin.mockResolvedValue(deny(403))
    expect((await GET(mk('http://localhost/api/review/stats'))).status).toBe(403)
  })

  it('GET returns clicks and totals and clamps months to 24', async () => {
    requireAdmin.mockResolvedValue(adminOk())
    tableData = {
      gecko_review_clicks: [{ month: '2026-11-01', source: 'qr', kind: 'visit', hits: 1 }],
      gecko_review_monthly_totals: [{ month: '2026-11-01', platform: 'google', total_reviews: 5 }],
    }
    const res = await GET(mk('http://localhost/api/review/stats?months=99'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.clicks).toHaveLength(1)
    expect(json.data.totals).toHaveLength(1)
    const expectedFrom = `${lastMonths(24).at(-1)}-01`
    expect(gteCalls[0][1]).toBe(expectedFrom)
  })

  it('PUT upserts a google total', async () => {
    requireAdmin.mockResolvedValue(adminOk())
    const res = await put({ month: '2026-11', google: 1080 })
    expect(res.status).toBe(200)
    expect(upsert).toHaveBeenCalledTimes(1)
    const [rows, opts] = upsert.mock.calls[0]
    expect(rows).toEqual([
      { month: '2026-11-01', platform: 'google', total_reviews: 1080, updated_at: expect.any(String) },
    ])
    expect(opts).toEqual({ onConflict: 'month,platform' })
  })

  it('PUT validates month, values and presence', async () => {
    requireAdmin.mockResolvedValue(adminOk())
    expect((await put({ month: '2026-13', google: 1 })).status).toBe(400)
    const neg = await put({ month: '2026-11', google: -1 })
    expect(neg.status).toBe(400)
    expect((await neg.json()).error).toBe('Valeur invalide : entrez un nombre entier.')
    expect((await put({ month: '2026-11' })).status).toBe(400)
    expect(upsert).not.toHaveBeenCalled()
  })

  it('PUT anonymous -> 401', async () => {
    requireAdmin.mockResolvedValue(deny(401))
    expect((await put({ month: '2026-11', google: 1 })).status).toBe(401)
  })
})
