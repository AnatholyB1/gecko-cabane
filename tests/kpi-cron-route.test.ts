import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextRequest } from 'next/server'
import { KPI_COLLECTOR_COLUMNS } from '../src/types/database'

// Route-level tests of the weekly-kpi cron with a fake Supabase and a mocked Resend.
// No network, no database, no real email.

const captureException = vi.fn()
vi.mock('@sentry/nextjs', () => ({ captureException: (...a: unknown[]) => captureException(...a), captureMessage: vi.fn() }))

const sendMock = vi.fn()
let ownerEmail: string | undefined = 'owner@example.com'
let resendClient: { emails: { send: typeof sendMock } } | null = { emails: { send: sendMock } }
vi.mock('../src/utils/resend', () => ({
  getResendClient: () => resendClient,
  RESEND_FROM_EMAIL: 'Gecko <noreply@example.com>',
  get RESTAURANT_NOTIFICATION_EMAIL() {
    return ownerEmail
  },
}))

const state = {
  upserts: [] as { table: string; payload: Record<string, unknown>; options: unknown }[],
  selects: [] as { table: string; cols: string }[],
  updates: [] as { payload: Record<string, unknown> }[],
  rows: {} as Record<string, Record<string, unknown>>,
  upsertError: null as { message: string } | null,
  reservationsError: false,
}

vi.mock('../src/utils/supabase/server', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      let result: { data: unknown; error: unknown; count?: number | null } = { data: [], error: null, count: 0 }
      const b: Record<string, unknown> = {}
      let eqWeek: unknown = null
      let isNullCol: string | null = null
      let updatePayload: Record<string, unknown> | null = null
      let selected = false
      const applyUpdate = () => {
        const row = state.rows[eqWeek as string]
        if (row && (isNullCol === null || row[isNullCol] == null)) {
          Object.assign(row, updatePayload)
          return true
        }
        return false
      }
      for (const m of ['gte', 'lt', 'lte', 'in', 'order', 'range']) b[m] = () => b
      b.eq = (col: string, v: unknown) => {
        if (col === 'week_start') eqWeek = v
        return b
      }
      b.is = (col: string) => {
        isNullCol = col
        return b
      }
      b.select = (cols: string) => {
        state.selects.push({ table, cols })
        selected = true
        if (table === 'gecko_reservations' && state.reservationsError) result = { data: null, error: { message: 'boom' } }
        if (updatePayload && table === 'gecko_weekly_kpis') {
          result = { data: applyUpdate() ? [{ week_start: eqWeek }] : [], error: null }
        }
        return b
      }
      b.update = (payload: Record<string, unknown>) => {
        updatePayload = payload
        state.updates.push({ payload })
        return b
      }
      b.maybeSingle = () =>
        Promise.resolve({
          data: table === 'gecko_weekly_kpis' ? (state.rows[eqWeek as string] ?? null) : null,
          error: null,
        })
      b.upsert = (payload: Record<string, unknown>, options: unknown) => {
        state.upserts.push({ table, payload, options })
        if (!state.upsertError) {
          const k = payload.week_start as string
          state.rows[k] = { ...(state.rows[k] ?? {}), ...payload }
        }
        return Promise.resolve({ error: state.upsertError })
      }
      b.then = (ok: (v: unknown) => unknown, ko?: (e: unknown) => unknown) => {
        // update sans select (release) : applique a l'attente
        if (updatePayload && !selected && table === 'gecko_weekly_kpis') applyUpdate()
        return Promise.resolve(result).then(ok, ko)
      }
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
  state.updates = []
  state.rows = {}
  state.upsertError = null
  state.reservationsError = false
  sendMock.mockReset()
  sendMock.mockResolvedValue({ data: { id: 'x' }, error: null })
  ownerEmail = 'owner@example.com'
  resendClient = { emails: { send: sendMock } }
  delete process.env.KPI_REPORT_MODE
  delete process.env.KPI_REPORT_RECIPIENTS
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

const MONDAY_0805 = new Date('2026-11-02T01:05:00Z')

describe('envoi du rapport', () => {
  it('00:05 UTC lundi: collecte, aucun envoi', async () => {
    const res = await GET(req())
    expect(res.status).toBe(200)
    expect(state.upserts).toHaveLength(1)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('01:05 UTC lundi: collecte puis un envoi [TEST] au proprietaire avec idempotencyKey', async () => {
    vi.setSystemTime(MONDAY_0805)
    const res = await GET(req())
    const body = await res.json()
    expect(state.upserts).toHaveLength(1)
    expect(sendMock).toHaveBeenCalledTimes(1)
    const [msg, opts] = sendMock.mock.calls[0]
    expect(msg.to).toEqual(['owner@example.com'])
    expect(msg.subject.startsWith('[TEST]')).toBe(true)
    expect(opts).toEqual({ idempotencyKey: 'kpi-report-2026-10-26-test' })
    expect(body.data.sent).toBe(true)
    expect(body.data.mode).toBe('test')
    expect(state.updates[0].payload).toMatchObject({ report_mode: 'test' })
    expect(typeof state.updates[0].payload.report_sent_at).toBe('string')
  })

  it('01:05 avec ligne deja collectee: pas de recollecte', async () => {
    vi.setSystemTime(MONDAY_0805)
    state.rows['2026-10-26'] = {
      week_start: '2026-10-26',
      week_end: '2026-11-01',
      collected_at: '2026-11-02T00:05:00Z',
      report_sent_at: null,
    }
    await GET(req())
    expect(state.upserts).toHaveLength(0)
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('seconde livraison: claim vide, aucun envoi', async () => {
    vi.setSystemTime(MONDAY_0805)
    await GET(req())
    sendMock.mockClear()
    vi.setSystemTime(new Date('2026-11-02T01:10:00Z'))
    const res = await GET(req())
    const body = await res.json()
    expect(sendMock).not.toHaveBeenCalled()
    expect(body.data.sent).toBe(false)
    expect(body.data.skipped).toBe(true)
  })

  it('echec d envoi (erreur renvoyee): release, Sentry sans donnees, 200 failed', async () => {
    vi.setSystemTime(MONDAY_0805)
    sendMock.mockResolvedValue({ data: null, error: { message: 'boom' } })
    const res = await GET(req())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.failed).toBe(true)
    expect(state.rows['2026-10-26'].report_sent_at).toBeNull()
    expect(captureException).toHaveBeenCalledTimes(1)
    expect(captureException.mock.calls[0][1]).toEqual({ extra: { week_start: '2026-10-26' } })
  })

  it('echec d envoi (exception): release et nouvelle tentative possible', async () => {
    vi.setSystemTime(MONDAY_0805)
    sendMock.mockRejectedValueOnce(new Error('net'))
    const first = await (await GET(req())).json()
    expect(first.data.failed).toBe(true)
    sendMock.mockResolvedValue({ data: { id: 'y' }, error: null })
    const second = await (await GET(req())).json()
    expect(second.data.sent).toBe(true)
  })

  it('mode live: proprietaire + equipe, cle -live, sans [TEST]', async () => {
    vi.setSystemTime(MONDAY_0805)
    process.env.KPI_REPORT_MODE = 'live'
    process.env.KPI_REPORT_RECIPIENTS = 'team@example.com'
    await GET(req())
    const [msg, opts] = sendMock.mock.calls[0]
    expect(msg.to).toEqual(['owner@example.com', 'team@example.com'])
    expect(opts.idempotencyKey.endsWith('-live')).toBe(true)
    expect(msg.subject).not.toContain('[TEST]')
  })

  it('mode inconnu => test', async () => {
    vi.setSystemTime(MONDAY_0805)
    process.env.KPI_REPORT_MODE = 'LIVE'
    process.env.KPI_REPORT_RECIPIENTS = 'team@example.com'
    await GET(req())
    expect(sendMock.mock.calls[0][0].to).toEqual(['owner@example.com'])
  })

  it('email non configure: 500, aucune claim', async () => {
    vi.setSystemTime(MONDAY_0805)
    ownerEmail = undefined
    const res = await GET(req())
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Email non configuré' })
    expect(state.updates).toHaveLength(0)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('client Resend absent: 500, aucune claim', async () => {
    vi.setSystemTime(MONDAY_0805)
    resendClient = null
    const res = await GET(req())
    expect(res.status).toBe(500)
    expect(state.updates).toHaveLength(0)
  })

  it('dry=1 a 01:05: ni claim ni envoi', async () => {
    vi.setSystemTime(MONDAY_0805)
    await GET(req('?dry=1'))
    expect(state.updates).toHaveLength(0)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('mardi sans send=1: aucun envoi', async () => {
    vi.setSystemTime(new Date('2026-11-03T01:05:00Z'))
    const res = await GET(req())
    const body = await res.json()
    expect(state.updates).toHaveLength(0)
    expect(sendMock).not.toHaveBeenCalled()
    expect(body.data.sent).toBe(false)
  })

  it('mardi avec week & send=1: rattrapage, un envoi', async () => {
    vi.setSystemTime(new Date('2026-11-03T01:05:00Z'))
    await GET(req('?week=2026-10-26&send=1'))
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('dry=1&send=1: aucun envoi', async () => {
    vi.setSystemTime(new Date('2026-11-03T01:05:00Z'))
    await GET(req('?dry=1&send=1'))
    expect(sendMock).not.toHaveBeenCalled()
    expect(state.updates).toHaveLength(0)
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
