import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextRequest } from 'next/server'
import { KPI_COLLECTOR_COLUMNS } from '../src/types/database'

// Route-level tests of the weekly-kpi cron with a fake Supabase. No network, no database.

const captureException = vi.fn()
vi.mock('@sentry/nextjs', () => ({ captureException: (...a: unknown[]) => captureException(...a), captureMessage: vi.fn() }))

const state = {
  upserts: [] as { table: string; payload: Record<string, unknown>; options: unknown }[],
  selects: [] as { table: string; cols: string }[],
  upsertError: null as { message: string } | null,
  reservationsError: false,
}

vi.mock('../src/utils/supabase/server', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      let result: { data: unknown; error: unknown; count?: number | null } = { data: [], error: null, count: 0 }
      const b: Record<string, unknown> = {}
      for (const m of ['gte', 'lt', 'lte', 'in', 'order', 'eq', 'range']) b[m] = () => b
      b.select = (cols: string) => {
        state.selects.push({ table, cols })
        if (table === 'gecko_reservations' && state.reservationsError) result = { data: null, error: { message: 'boom' } }
        return b
      }
      b.maybeSingle = () => Promise.resolve({ data: null, error: null })
      b.upsert = (payload: Record<string, unknown>, options: unknown) => {
        state.upserts.push({ table, payload, options })
        return Promise.resolve({ error: state.upsertError })
      }
      b.then = (ok: (v: unknown) => unknown, ko?: (e: unknown) => unknown) => Promise.resolve(result).then(ok, ko)
      return b
    },
  }),
}))

import { GET } from '../src/app/api/cron/weekly-kpi/route'

const auth = { authorization: 'Bearer test-secret' }
const req = (qs = '', headers: Record<string, string> = auth) =>
  new NextRequest(`http://localhost/api/cron/weekly-kpi${qs}`, { headers })

beforeEach(() => {
  process.env.CRON_SECRET = 'test-secret'
  vi.useFakeTimers().setSystemTime(new Date('2026-11-02T00:05:00Z'))
  state.upserts = []
  state.selects = []
  state.upsertError = null
  state.reservationsError = false
  captureException.mockClear()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('garde', () => {
  it('401 sans header', async () => {
    const res = await GET(req('', {}))
    expect(res.status).toBe(401)
    expect(state.selects).toHaveLength(0)
  })
  it('401 mauvais Bearer', async () => {
    expect((await GET(req('', { authorization: 'Bearer nope' }))).status).toBe(401)
  })
  it('401 si CRON_SECRET absent', async () => {
    delete process.env.CRON_SECRET
    expect((await GET(req('', { authorization: 'Bearer undefined' }))).status).toBe(401)
    expect(state.selects).toHaveLength(0)
  })
  it('400 si ?week= n est pas un lundi', async () => {
    const res = await GET(req('?week=2026-10-27'))
    expect(res.status).toBe(400)
    expect(state.upserts).toHaveLength(0)
  })
})

describe('collecte', () => {
  it('dry=1: chiffres, aucun upsert', async () => {
    const res = await GET(req('?dry=1'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.week_start).toBe('2026-10-26')
    expect(body.data.dryRun).toBe(true)
    expect(state.upserts).toHaveLength(0)
  })

  it('appel normal: un upsert onConflict week_start, colonnes collecteur seulement', async () => {
    const res = await GET(req())
    expect(res.status).toBe(200)
    expect(state.upserts).toHaveLength(1)
    const [u] = state.upserts
    expect(u.table).toBe('gecko_weekly_kpis')
    expect(u.options).toEqual({ onConflict: 'week_start' })
    const allowed = new Set<string>([
      ...KPI_COLLECTOR_COLUMNS,
      'week_start',
      'week_end',
      'sources_status',
      'collected_at',
      'updated_at',
    ])
    for (const key of Object.keys(u.payload)) expect(allowed.has(key), key).toBe(true)
    // colonnes de saisie manuelle jamais ecrasees
    for (const key of ['google_reviews_total', 'google_new_reviews', 'google_min_rating', 'manual_note']) {
      expect(key in u.payload).toBe(false)
    }
    expect(u.payload.week_start).toBe('2026-10-26')
    expect(u.payload.week_end).toBe('2026-11-01')
  })

  it('?week= lundi valide est utilise', async () => {
    await GET(req('?week=2026-10-19'))
    expect(state.upserts[0].payload.week_start).toBe('2026-10-19')
  })

  it('source en erreur: null + unavailable, jamais 0', async () => {
    state.reservationsError = true
    const res = await GET(req())
    expect(res.status).toBe(200)
    const p = state.upserts[0].payload
    expect(p.reservations_new).toBeNull()
    expect((p.sources_status as Record<string, string>).reservations).toBe('unavailable')
  })

  it('aucune colonne PII selectionnee sur gecko_reservations', async () => {
    await GET(req())
    const cols = state.selects.filter((s) => s.table === 'gecko_reservations').map((s) => s.cols)
    expect(cols.length).toBeGreaterThan(0)
    for (const c of cols) expect(c).not.toMatch(/customer_(name|email|phone)/)
  })

  it('erreur d upsert: 500 generique + Sentry', async () => {
    state.upsertError = { message: 'secret db detail' }
    const res = await GET(req())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: 'Erreur serveur' })
    expect(JSON.stringify(body)).not.toContain('secret db detail')
    expect(captureException).toHaveBeenCalled()
  })
})

describe('vercel.json', () => {
  it('declare les deux planifications du lundi', () => {
    const cfg = JSON.parse(readFileSync(join(__dirname, '..', 'vercel.json'), 'utf8')) as {
      crons: { path: string; schedule: string }[]
    }
    expect(cfg.crons).toContainEqual({ path: '/api/cron/weekly-kpi', schedule: '0 0 * * 1' })
    expect(cfg.crons).toContainEqual({ path: '/api/cron/weekly-kpi', schedule: '0 1 * * 1' })
    expect(cfg.crons).toContainEqual({ path: '/api/cron/review-invitations', schedule: '0 4 * * *' })
  })
})
