/**
 * « Complet ce soir » (ACC-03, phase 17).
 *
 * Preuve par la logique RÉELLE : la route service-closure écrit dans une base en mémoire ; la vraie route
 * POST /api/reservations (figée, non modifiée) lit la même base et applique son checkSlot ; le formulaire
 * public utilise availableSlotsForDate (même checkSlot). Horloge figée : 2026-11-02 12:00 à Krabi.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextResponse } from 'next/server'

type Row = Record<string, unknown>
const db: Record<string, Row[]> = {}
let failUpsertOn: string | null = null
let onUpsertFail: (() => void) | null = null
let nextId = 100

function table(name: string) {
  const rows = () => (db[name] ??= [])
  const query = (filters: [string, unknown][] = []) => {
    const run = () => rows().filter((r) => filters.every(([k, v]) => r[k] === v)).map((r) => ({ ...r }))
    const q = {
      eq: (k: string, v: unknown) => query([...filters, [k, v]]),
      maybeSingle: () => Promise.resolve({ data: run()[0] ?? null, error: null }),
      then: (resolve: (v: unknown) => unknown) => resolve({ data: run(), error: null }),
    }
    return q
  }
  return {
    select: () => query(),
    upsert: (row: Row, opts: { onConflict: string }) => {
      if (failUpsertOn === name) {
        onUpsertFail?.()
        return Promise.resolve({ error: { message: 'boom' } })
      }
      const i = rows().findIndex((r) => r[opts.onConflict] === row[opts.onConflict])
      if (i >= 0) rows()[i] = { ...rows()[i], ...row }
      else rows().push({ id: nextId++, ...row })
      return Promise.resolve({ error: null })
    },
    delete: () => ({
      eq: (k: string, v: unknown) => {
        db[name] = rows().filter((r) => r[k] !== v)
        return Promise.resolve({ error: null })
      },
    }),
  }
}
const fakeClient = { from: (name: string) => table(name), rpc: vi.fn() }

const requireAdmin = vi.fn()
vi.mock('@/utils/auth', () => ({ requireAdmin: (...a: unknown[]) => requireAdmin(...a) }))
vi.mock('@/utils/supabase/server', () => ({
  createAdminClient: vi.fn(() => fakeClient),
  createClient: vi.fn(),
  isGeckoAdmin: vi.fn(),
}))
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return { ...actual, after: () => undefined }
})
vi.mock('@/utils/resend', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/resend')>()
  return { ...actual, getResendClient: () => null }
})
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }))
vi.mock('@/utils/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/rate-limit')>()
  return { ...actual, checkReservationRateLimits: async () => ({ limited: false }) }
})

import { GET, POST, DELETE } from '@/app/api/service-closure/route'
import { POST as createReservation } from '@/app/api/reservations/route'
import { availableSlotsForDate, TIME_SLOTS, type HoursRow } from '@/utils/reservation-rules'
import {
  CLOSURE_TITLE,
  checkClosureDate,
  memoryKey,
  parseMemory,
  planClose,
  planReopen,
  serializeMemory,
} from '@/utils/service-closure'

const DATE = '2026-11-03' // mardi
const OTHER = '2026-11-04'

const weekly = (d: number, open = true) => ({ day_of_week: d, is_open: open, open_time: '12:00:00', close_time: '22:00:00' })

function reset(opts: { special?: Row[]; closedDow?: number } = {}) {
  for (const k of Object.keys(db)) delete db[k]
  db.gecko_opening_hours = [0, 1, 2, 3, 4, 5, 6].map((d) => weekly(d, d !== opts.closedDow))
  db.gecko_special_hours = (opts.special ?? []).map((r, i) => ({ id: i + 1, ...r }))
  db.gecko_restaurant_settings = [
    { key: 'max_covers', value: '40' },
    { key: 'table_block_duration_minutes', value: '120' },
  ]
  failUpsertOn = null
  onUpsertFail = null
}
/** État de la base sans `updated_at` (horodatage de dernière écriture, non restituable par nature). */
const snapshot = () =>
  JSON.parse(JSON.stringify(db, (k, v) => (k === 'updated_at' ? undefined : v)))

const jreq = (method: string, body?: unknown, qs = '') =>
  new Request(`http://localhost/api/service-closure${qs}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
const close = (date: unknown = DATE) => POST(jreq('POST', { date }))
const reopen = (date: string = DATE) => DELETE(jreq('DELETE', undefined, `?date=${date}`))
const state = async (date: string = DATE) => (await (await GET(jreq('GET', undefined, `?date=${date}`))).json()).data

function book(date: string, time: string) {
  return createReservation(
    new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '1.2.3.4' },
      body: JSON.stringify({
        customer_name: 'Jane Doe',
        customer_email: 'jane@example.com',
        customer_phone: '07911 123456',
        phone_country: 'GB',
        reservation_date: date,
        reservation_time: time,
        party_size: 2,
        locale: 'en',
        marketing_consent: false,
        company_url: '',
        form_started_at: Date.now() - 10000,
      }),
    }) as unknown as import('next/server').NextRequest,
  )
}

function slotsFor(date: string) {
  return availableSlotsForDate({
    date,
    regular: db.gecko_opening_hours as (HoursRow & { day_of_week: number })[],
    special: db.gecko_special_hours as (HoursRow & { date: string })[],
    settings: { max_covers: '40', table_block_duration_minutes: '120' },
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-02T05:00:00Z'))
  reset()
  requireAdmin.mockReset()
  requireAdmin.mockResolvedValue({ ok: true, supabase: fakeClient, user: { id: 'u' } })
  fakeClient.rpc.mockReset()
  fakeClient.rpc.mockResolvedValue({ data: [{ reservation_id: 7, reservation_status: 'pending', is_full: false }], error: null })
})
afterEach(() => vi.useRealTimers())

describe('public availability and direct creation', () => {
  it('open: dinner slots are offered and a dinner booking goes through the frozen route', async () => {
    expect(slotsFor(DATE).filter((s) => s >= '15:00').length).toBeGreaterThan(0)
    const res = await book(DATE, '19:00')
    expect(res.status).toBe(201)
  })

  it('closed: the form offers no dinner slot (lunch kept) and a direct POST on a dinner slot is refused', async () => {
    const lunchBefore = slotsFor(DATE).filter((s) => s < '15:00')
    expect(lunchBefore.length).toBeGreaterThan(0)

    expect((await close()).status).toBe(200)
    expect(await state()).toEqual({ date: DATE, closed: true })

    const after = slotsFor(DATE)
    expect(after.filter((s) => s >= '15:00')).toEqual([])
    expect(after).toEqual(lunchBefore)

    fakeClient.rpc.mockClear()
    for (const time of TIME_SLOTS.filter((s) => s >= '18:00')) {
      const res = await book(DATE, time)
      expect(res.status, time).toBe(422)
      expect(await res.json()).toMatchObject({ code: 'slot_unavailable' })
    }
    expect(fakeClient.rpc).not.toHaveBeenCalled()

    // le déjeuner de la même date reste réservable ; les autres dates ne sont pas touchées
    expect((await book(DATE, '12:30')).status).toBe(201)
    expect((await book(OTHER, '19:00')).status).toBe(201)
    expect(slotsFor(OTHER).some((s) => s >= '18:00')).toBe(true)
  })

  it('closed: every slot the form offers is accepted by the server (same checkSlot)', async () => {
    await close()
    for (const time of slotsFor(DATE)) expect((await book(DATE, time)).status, time).toBe(201)
  })
})

describe('reversibility', () => {
  it('no previous exception: close then reopen restores the database exactly', async () => {
    const before = snapshot()
    await close()
    expect(db.gecko_special_hours).toHaveLength(1)
    expect(db.gecko_special_hours[0]).toMatchObject({ date: DATE, title: CLOSURE_TITLE, is_open: true, close_time: '16:00:00' })
    expect(db.gecko_restaurant_settings.some((r) => r.key === memoryKey(DATE))).toBe(true)

    expect((await reopen()).status).toBe(200)
    expect(snapshot()).toEqual(before)
    expect(await state()).toEqual({ date: DATE, closed: false })
    expect(slotsFor(DATE).some((s) => s >= '18:00')).toBe(true)
  })

  it('pre-existing exceptional hours come back identical after reopening', async () => {
    const prior = { date: DATE, title: 'Soirée privée', is_open: true, open_time: '11:00:00', close_time: '23:00:00', note: 'Menu spécial' }
    reset({ special: [prior] })
    const before = snapshot()

    await close()
    expect(db.gecko_special_hours[0]).toMatchObject({ title: CLOSURE_TITLE, open_time: '11:00:00', close_time: '16:00:00', note: null })
    expect(slotsFor(DATE).some((s) => s >= '15:00')).toBe(false)

    await reopen()
    expect(snapshot()).toEqual(before)
  })

  it('an evening-only exception closes the whole day, then restores', async () => {
    const prior = { date: DATE, title: 'Dîner de gala', is_open: true, open_time: '18:00:00', close_time: '22:00:00', note: null }
    reset({ special: [prior] })
    const before = snapshot()
    await close()
    expect(db.gecko_special_hours[0]).toMatchObject({ is_open: false, open_time: null, close_time: null })
    expect(slotsFor(DATE)).toEqual([])
    await reopen()
    expect(snapshot()).toEqual(before)
  })

  it('other dates and other exceptions are never modified', async () => {
    const other = { date: OTHER, title: 'Autre', is_open: true, open_time: '12:00:00', close_time: '22:00:00', note: 'x' }
    reset({ special: [other] })
    await close()
    expect(db.gecko_special_hours.find((r) => r.date === OTHER)).toMatchObject(other)
    await reopen()
    expect(db.gecko_special_hours.find((r) => r.date === OTHER)).toMatchObject(other)
  })

  it('lost or corrupt memory falls back to removing the closure row (weekly hours)', async () => {
    await close()
    db.gecko_restaurant_settings = db.gecko_restaurant_settings.map((r) => (r.key === memoryKey(DATE) ? { ...r, value: '{oops' } : r))
    expect((await reopen()).status).toBe(200)
    expect(db.gecko_special_hours).toHaveLength(0)
    expect(db.gecko_restaurant_settings.some((r) => String(r.key).startsWith('service_closure_prev:'))).toBe(false)
  })
})

describe('idempotence', () => {
  it('closing twice leaves one state, and the memory still holds the ORIGINAL exception', async () => {
    const prior = { date: DATE, title: 'Soirée privée', is_open: true, open_time: '11:00:00', close_time: '23:00:00', note: 'N' }
    reset({ special: [prior] })
    const before = snapshot()
    expect((await close()).status).toBe(200)
    const once = snapshot()
    expect((await close()).status).toBe(200)
    expect(snapshot()).toEqual(once)
    await reopen()
    expect(snapshot()).toEqual(before)
  })

  it('reopening twice, or reopening a date that was never closed, changes nothing', async () => {
    const before = snapshot()
    expect((await reopen()).status).toBe(200)
    expect(snapshot()).toEqual(before)
    await close()
    await reopen()
    const after = snapshot()
    expect((await reopen()).status).toBe(200)
    expect(snapshot()).toEqual(after)
  })
})

describe('validation and errors', () => {
  it('refuses a past date, today stays allowed', async () => {
    const res = await close('2026-11-01')
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Cette date est déjà passée' })
    expect((await close('2026-11-02')).status).toBe(200)
    expect((await reopen('2026-11-01')).status).toBe(400)
  })

  it.each([undefined, null, 20261103, '', '2026-13-40', '03/11/2026', '2026-11-03T00:00:00Z', "2026-11-03'; drop"])(
    'refuses an invalid date %j',
    async (d) => {
      const res = await POST(jreq('POST', { date: d }))
      expect(res.status).toBe(400)
      expect(typeof (await res.json()).error).toBe('string')
      expect(db.gecko_special_hours).toHaveLength(0)
    },
  )

  it('refuses a date more than 180 days ahead and non-object bodies', async () => {
    expect((await close('2027-06-01')).status).toBe(400)
    expect((await POST(jreq('POST', '[]'))).status).toBe(400)
    expect((await POST(jreq('POST', 'not json'))).status).toBe(400)
  })

  it('answers 409 when the day has no dinner service (closed day, already closed exception)', async () => {
    reset({ closedDow: 2 })
    expect((await close()).status).toBe(409)
    reset({ special: [{ date: DATE, title: 'Fermé', is_open: false, open_time: null, close_time: null, note: null }] })
    const res = await close()
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: "Aucun service du soir n'est ouvert à cette date" })
    reset({ special: [{ date: DATE, title: 'Midi', is_open: true, open_time: '11:00:00', close_time: '15:00:00', note: null }] })
    expect((await close()).status).toBe(409)
  })

  it('rolls the memory back when the closure cannot be written, and never leaks details', async () => {
    reset()
    failUpsertOn = 'gecko_special_hours'
    const res = await close()
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal server error' })
    expect(db.gecko_restaurant_settings.some((r) => String(r.key).startsWith('service_closure_prev:'))).toBe(false)
    expect(db.gecko_special_hours).toHaveLength(0)
  })

  it('is admin only: anonymous and non-admin get 401/403 and nothing is read or written', async () => {
    const before = snapshot()
    for (const [status, label] of [[401, 'Unauthorized'], [403, 'Forbidden']] as const) {
      requireAdmin.mockResolvedValue({ ok: false, response: NextResponse.json({ error: label }, { status }) })
      expect((await close()).status).toBe(status)
      expect((await reopen()).status).toBe(status)
      expect((await GET(jreq('GET', undefined, `?date=${DATE}`))).status).toBe(status)
    }
    expect(snapshot()).toEqual(before)
  })
})

describe('final audit: explicit marker, concurrency, origin', () => {
  const handMade = { date: DATE, title: CLOSURE_TITLE, is_open: true, open_time: '12:00:00', close_time: '22:00:00', note: 'créée à la main' }
  const memoryRows = () => db.gecko_restaurant_settings.filter((r) => String(r.key).startsWith('service_closure_prev:'))

  it('a hand-made exception titled « Dîner complet » (no memory key) is not a closure', async () => {
    reset({ special: [handMade] })
    expect(await state()).toEqual({ date: DATE, closed: false })
    const before = snapshot()
    expect((await reopen()).status).toBe(200) // noop : l'exception n'est ni supprimée ni modifiée
    expect(snapshot()).toEqual(before)
    // la fermer la traite comme une exception ordinaire (mémorisée) et la rouvrir la restitue
    expect((await close()).status).toBe(200)
    expect(await state()).toEqual({ date: DATE, closed: true })
    expect(db.gecko_special_hours[0]).toMatchObject({ close_time: '16:00:00', note: null })
    await reopen()
    expect(snapshot()).toEqual(before)
  })

  it('the marker is the memory key: closure row + key = closed; the key alone = open', async () => {
    await close()
    expect(await state()).toEqual({ date: DATE, closed: true })
    db.gecko_special_hours = []
    expect(await state()).toEqual({ date: DATE, closed: false })
  })

  it('a failed closure does not erase the memory of a concurrent successful closure', async () => {
    reset()
    failUpsertOn = 'gecko_special_hours'
    onUpsertFail = () => {
      // l'autre requête réussit entre-temps : sa ligne et sa mémoire existent
      db.gecko_special_hours.push({ id: 900, date: DATE, title: CLOSURE_TITLE, is_open: true, open_time: '12:00:00', close_time: '16:00:00', note: null })
    }
    expect((await close()).status).toBe(500)
    expect(memoryRows()).toHaveLength(1)
    failUpsertOn = null
    expect((await reopen()).status).toBe(200)
    expect(db.gecko_special_hours).toHaveLength(0)
    expect(memoryRows()).toHaveLength(0)
  })

  it('POST requires a same-origin request and a JSON content type; DELETE a same-origin request', async () => {
    const before = snapshot()
    const post = (headers: Record<string, string>, body = JSON.stringify({ date: DATE })) =>
      POST(new Request('http://localhost/api/service-closure', { method: 'POST', headers, body }))
    expect((await post({ 'Content-Type': 'application/json', Origin: 'https://evil.example' })).status).toBe(403)
    expect((await post({ 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'cross-site' })).status).toBe(403)
    expect((await post({ 'Content-Type': 'text/plain' })).status).toBe(400)
    expect((await post({})).status).toBe(400)
    const del = DELETE(new Request(`http://localhost/api/service-closure?date=${DATE}`, { method: 'DELETE', headers: { Origin: 'https://evil.example' } }))
    expect((await del).status).toBe(403)
    expect(snapshot()).toEqual(before)
    expect((await post({ 'Content-Type': 'application/json', Origin: 'http://localhost' })).status).toBe(200)
  })
})

describe('pure planning', () => {
  const regular = [0, 1, 2, 3, 4, 5, 6].map((d) => weekly(d))
  const now = new Date('2026-11-02T05:00:00Z')

  it('checkClosureDate', () => {
    expect(checkClosureDate('2026-11-02', now)).toEqual({ ok: true })
    expect(checkClosureDate('2026-11-01', now)).toEqual({ ok: false, code: 'date_past' })
    expect(checkClosureDate('2026-02-30', now)).toEqual({ ok: false, code: 'invalid_date' })
    expect(checkClosureDate('2027-06-01', now)).toEqual({ ok: false, code: 'date_too_far' })
  })

  it('planClose / planReopen round trip', () => {
    const plan = planClose({ date: DATE, regular, special: null, now })
    expect(plan).toMatchObject({ ok: true, alreadyClosed: false, prev: null })
    const row = { date: DATE, ...(plan as { next: Row }).next } as never
    expect(planClose({ date: DATE, regular, special: row, memoryRaw: serializeMemory(null), now })).toEqual({ ok: true, alreadyClosed: true })
    expect(planReopen(row, serializeMemory(null))).toEqual({ action: 'delete' })
    expect(planReopen(null, serializeMemory(null))).toEqual({ action: 'noop' })
  })

  it('parseMemory is strict', () => {
    expect(parseMemory(serializeMemory(null))).toEqual({ prev: null })
    expect(parseMemory(undefined)).toBeUndefined()
    expect(parseMemory('{}')).toBeUndefined()
    expect(parseMemory('{"prev":{"title":1}}')).toBeUndefined()
    expect(parseMemory('{"prev":{"title":null,"is_open":true,"open_time":"25:99","close_time":null,"note":null}}')).toBeUndefined()
  })
})

describe('wiring', () => {
  const read = (f: string) => readFileSync(join(process.cwd(), f), 'utf-8')

  it('the public form derives its slots from availableSlotsForDate and sends only an offered time', () => {
    const src = read('src/components/ReservationForm.tsx')
    expect(src).toContain('availableSlotsForDate')
    expect(src).toContain('/api/special-hours')
    expect(src).toMatch(/reservation_time:\s*selectedTime/)
  })

  it('the frozen reservation route still applies checkSlot to the special hours of the requested date', () => {
    const src = read('src/app/api/reservations/route.ts')
    expect(src).toMatch(/from\('gecko_special_hours'\)[\s\S]*\.eq\('date', r\.reservation_date\)/)
    expect(src).toContain('checkSlot(')
  })

  it('the Today screen mounts the component in the reserved slot, with no native confirm()', () => {
    const today = read('src/components/admin/reservations/TodayView.tsx')
    expect(today).toMatch(/data-slot="acc-03-complet-ce-soir"[\s\S]*<CompletCeSoir/)
    expect(read('src/components/admin/reservations/CompletCeSoir.tsx')).not.toMatch(/window\.confirm|[^.\w]confirm\(\s*['"`]/)
  })

  it('the route never uses the service role', () => {
    expect(read('src/app/api/service-closure/route.ts')).not.toContain('createAdminClient')
  })
})
