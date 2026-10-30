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

const ENV_KEYS = [
  'BRIGHTDATA_API_KEY',
  'BRIGHTDATA_ZONE',
  'TRIPADVISOR_URL',
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_MODEL',
]
const AI_TEXT = JSON.stringify({
  lecture: ['Lecture un.', 'Lecture deux.', 'Lecture trois.'],
  actions: ['Action un.', 'Action deux.', 'Action trois.'],
})
let fetchMock: ReturnType<typeof vi.fn>
const callsTo = (prefix: string) => fetchMock.mock.calls.filter((c) => String(c[0]).startsWith(prefix))
const BRIGHT = 'https://api.brightdata.com'
const ANTHROPIC = 'https://api.anthropic.com'
const setBright = () => {
  process.env.BRIGHTDATA_API_KEY = 'bd-key'
  process.env.BRIGHTDATA_ZONE = 'zone'
  process.env.TRIPADVISOR_URL = 'https://www.tripadvisor.com/Restaurant_Review-g1-d2-Reviews-Gecko.html'
}
const setAi = () => {
  process.env.ANTHROPIC_API_KEY = 'ai-key'
  process.env.ANTHROPIC_MODEL = 'model-x'
}

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
  for (const k of ENV_KEYS) delete process.env[k]
  fetchMock = vi.fn(async (url: unknown) => {
    const u = String(url)
    if (u.startsWith('https://api.brightdata.com')) {
      return new Response('<span>#3 of 40 Restaurants in Krabi</span>', { status: 200 })
    }
    if (u.startsWith('https://api.anthropic.com')) {
      return new Response(JSON.stringify({ content: [{ text: AI_TEXT }] }), { status: 200 })
    }
    return new Response('{}', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  for (const k of ENV_KEYS) delete process.env[k]
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
    const claim = state.updates.find((u) => 'report_sent_at' in u.payload && u.payload.report_sent_at !== null)
    expect(claim?.payload).toMatchObject({ report_mode: 'test' })
    expect(typeof claim?.payload.report_sent_at).toBe('string')
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

describe('sources externes et lecture (08-11)', () => {
  const sentRow = (extra: Record<string, unknown> = {}) => ({
    week_start: '2026-10-26',
    week_end: '2026-11-01',
    collected_at: '2026-11-02T00:05:00Z',
    report_sent_at: null,
    ...extra,
  })

  it('collecte: TripAdvisor dans l upsert unique, status fusionne', async () => {
    setBright()
    await GET(req())
    expect(state.upserts).toHaveLength(1)
    const p = state.upserts[0].payload
    expect(p).toMatchObject({ tripadvisor_rank: 3, tripadvisor_total: 40 })
    expect(typeof p.tripadvisor_checked_at).toBe('string')
    expect('gsc_clicks' in p).toBe(true)
    const st = p.sources_status as Record<string, string>
    expect(st.tripadvisor).toBe('ok')
    expect(st.search_console).toBe('unavailable')
    expect(st.reservations).toBeDefined()
    expect(callsTo(BRIGHT)).toHaveLength(1)
  })

  it('second passage de collecte: 0 appel Bright Data', async () => {
    setBright()
    await GET(req())
    fetchMock.mockClear()
    await GET(req())
    expect(callsTo(BRIGHT)).toHaveLength(0)
    expect(state.rows['2026-10-26'].tripadvisor_rank).toBe(3)
  })

  it('envoi: alertes et narrative stockees avant la claim, repli sans cle IA, 0 appel anthropic', async () => {
    vi.setSystemTime(MONDAY_0805)
    await GET(req())
    const row = state.rows['2026-10-26'] as { narrative: { source: string; actions: string[] }; alerts: unknown[] }
    expect(row.narrative.source).toBe('fallback')
    expect(Array.isArray(row.alerts)).toBe(true)
    expect(callsTo(ANTHROPIC)).toHaveLength(0)
    const readingIdx = state.updates.findIndex((u) => 'narrative' in u.payload)
    const claimIdx = state.updates.findIndex((u) => 'report_sent_at' in u.payload)
    expect(readingIdx).toBeGreaterThanOrEqual(0)
    expect(readingIdx).toBeLessThan(claimIdx)
    const text = sendMock.mock.calls[0][0].text as string
    for (const a of row.narrative.actions) expect(text).toContain(a)
  })

  it('cle + modele: narrative ai, corps Claude sans manual_note ni texte de note', async () => {
    vi.setSystemTime(MONDAY_0805)
    setAi()
    state.rows['2026-10-26'] = sentRow({ manual_note: 'Note secrete Dupont', google_min_rating: 2 })
    await GET(req())
    expect((state.rows['2026-10-26'].narrative as { source: string }).source).toBe('ai')
    const calls = callsTo(ANTHROPIC)
    expect(calls).toHaveLength(1)
    const body = String((calls[0][1] as { body: string }).body)
    expect(body).not.toContain('manual_note')
    expect(body).not.toContain('Note secrete')
    expect((state.rows['2026-10-26'].alerts as { code: string }[]).some((a) => a.code === 'low_rating')).toBe(true)
  })

  it('Claude en echec (fetch rejete): envoi quand meme avec le repli riche', async () => {
    vi.setSystemTime(MONDAY_0805)
    setAi()
    state.rows['2026-10-26'] = sentRow({ google_min_rating: 2 })
    fetchMock.mockImplementation(async (url: unknown) => {
      if (String(url).startsWith(ANTHROPIC)) throw new Error('timeout')
      return new Response('{}', { status: 404 })
    })
    const body = await (await GET(req())).json()
    expect(body.data.sent).toBe(true)
    const n = state.rows['2026-10-26'].narrative as { source: string; lecture: string[] }
    expect(n.source).toBe('fallback')
    // repli riche: message d alerte reel, pas le texte generique de generateNarrative
    expect(n.lecture.join(' ')).not.toMatch(/Alerte «/)
  })

  it('0 appel anthropic au second passage et lors d un ?send=1 manuel; lecture non ecrasee', async () => {
    vi.setSystemTime(MONDAY_0805)
    setAi()
    await GET(req())
    expect(callsTo(ANTHROPIC)).toHaveLength(1)
    const before = JSON.stringify(state.rows['2026-10-26'].narrative)
    fetchMock.mockClear()
    sendMock.mockClear()
    vi.setSystemTime(new Date('2026-11-02T01:10:00Z'))
    const second = await (await GET(req())).json()
    const manual = await (await GET(req('?week=2026-10-26&send=1'))).json()
    expect(callsTo(ANTHROPIC)).toHaveLength(0)
    expect(second.data.skipped).toBe(true)
    expect(manual.data.skipped).toBe(true)
    expect(sendMock).not.toHaveBeenCalled()
    expect(JSON.stringify(state.rows['2026-10-26'].narrative)).toBe(before)
  })

  it('?dry=1 a 00:05: 0 appel Bright Data, 0 appel anthropic, aucune ecriture', async () => {
    setBright()
    setAi()
    const body = await (await GET(req('?dry=1'))).json()
    expect(callsTo(BRIGHT)).toHaveLength(0)
    expect(callsTo(ANTHROPIC)).toHaveLength(0)
    expect(state.upserts).toHaveLength(0)
    expect(state.updates).toHaveLength(0)
    expect(body.data.narrative.source).toBe('fallback')
    expect(Array.isArray(body.data.alerts)).toBe(true)
    expect('tripadvisor_rank' in body.data.values).toBe(false)
  })

  it('?dry=1 a 01:05: alerts et narrative calculees sans ecriture ni envoi ni appel payant', async () => {
    vi.setSystemTime(MONDAY_0805)
    setBright()
    setAi()
    const body = await (await GET(req('?dry=1'))).json()
    expect(body.data.narrative.actions).toHaveLength(3)
    expect(callsTo(BRIGHT)).toHaveLength(0)
    expect(callsTo(ANTHROPIC)).toHaveLength(0)
    expect(state.updates).toHaveLength(0)
    expect(state.upserts).toHaveLength(0)
    expect(sendMock).not.toHaveBeenCalled()
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
