/**
 * Manual (admin) reservation entry — RESA-06, D-06
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

const requireAdmin = vi.fn()
const insert = vi.fn()
let singleResult: { data: unknown; error: unknown } = { data: { id: 77 }, error: null }

vi.mock('@/utils/auth', () => ({ requireAdmin: (...a: unknown[]) => requireAdmin(...a) }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

import { MANUAL_SOURCES, validateManualReservation } from '@/utils/manual-reservation'
import { POST } from '@/app/api/reservations/manual/route'

type Req = import('next/server').NextRequest
const mk = (body: string) =>
  new Request('http://localhost/api/reservations/manual', { method: 'POST', body }) as unknown as Req

const deny = (status: number) => ({
  ok: false,
  response: NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Forbidden' }, { status }),
})

function adminOk() {
  const chain: Record<string, unknown> = {}
  chain.insert = (p: unknown) => {
    insert(p)
    return chain
  }
  chain.select = () => chain
  chain.single = async () => singleResult
  return { ok: true, supabase: { from: () => chain }, user: { id: 'u1' } }
}

const valid = {
  customer_name: ' Somchai ',
  customer_phone: '+66 81 234 5678',
  reservation_date: '2026-11-03',
  reservation_time: '19:30',
  party_size: 4,
  source: 'whatsapp',
}

const err = (patch: Record<string, unknown>) => {
  const r = validateManualReservation({ ...valid, ...patch })
  return r.ok ? null : r.error
}

describe('validateManualReservation', () => {
  it('MANUAL_SOURCES excludes site', () => {
    expect([...MANUAL_SOURCES]).toEqual(['whatsapp', 'telephone', 'sans_reservation'])
  })

  it('accepts a complete body and normalizes', () => {
    const r = validateManualReservation(valid)
    expect(r).toEqual({
      ok: true,
      value: {
        customer_name: 'Somchai',
        customer_phone: '+66812345678',
        customer_email: null,
        reservation_date: '2026-11-03',
        reservation_time: '19:30',
        party_size: 4,
        admin_notes: null,
        locale: 'fr',
        source: 'whatsapp',
      },
    })
  })

  it('rejects invalid sources', () => {
    expect(err({ source: 'site' })).toBe('Source invalide')
    expect(err({ source: 'email' })).toBe('Source invalide')
    expect(err({ source: undefined })).toBe('Source invalide')
  })

  it('phone rules', () => {
    expect(err({ customer_phone: '', source: 'telephone' })).toBe('Téléphone invalide')
    const r = validateManualReservation({ ...valid, customer_phone: '', source: 'sans_reservation' })
    expect(r.ok && r.value.customer_phone).toBe('')
  })

  it('email rules', () => {
    expect(err({ customer_email: 'not-an-email' })).toBe('Email invalide')
    const a = validateManualReservation({ ...valid, customer_email: '' })
    expect(a.ok && a.value.customer_email).toBeNull()
    const b = validateManualReservation({ ...valid, customer_email: ' A@B.CO ' })
    expect(b.ok && b.value.customer_email).toBe('a@b.co')
  })

  it('field rules', () => {
    for (const p of [0, 51, 2.5, '4']) expect(err({ party_size: p })).toBe('Nombre de personnes invalide')
    expect(err({ reservation_date: '2026-13-01' })).toBe('Date invalide')
    expect(err({ reservation_date: 'tomorrow' })).toBe('Date invalide')
    expect(err({ reservation_date: '2026-10-01' })).toBeNull()
    expect(err({ reservation_time: '25:00' })).toBe('Heure invalide')
    expect(err({ customer_name: 'A' })).toBe('Nom invalide')
    expect(err({ admin_notes: 'x'.repeat(2001) })).toBe('Notes invalides')
  })

  it('never carries unknown keys', () => {
    const r = validateManualReservation({
      ...valid,
      status: 'completed',
      id: 1,
      review_token: 'x',
      utm_source: 'g',
      confirmed_at: 'now',
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      for (const k of ['status', 'id', 'review_token', 'utm_source', 'confirmed_at'])
        expect(Object.keys(r.value)).not.toContain(k)
    }
  })
})

describe('POST /api/reservations/manual', () => {
  beforeEach(() => {
    requireAdmin.mockReset()
    insert.mockReset()
    singleResult = { data: { id: 77 }, error: null }
  })

  it('anonymous -> 401, non-admin -> 403, no insert', async () => {
    requireAdmin.mockResolvedValue(deny(401))
    expect((await POST(mk(JSON.stringify(valid)))).status).toBe(401)
    requireAdmin.mockResolvedValue(deny(403))
    expect((await POST(mk(JSON.stringify(valid)))).status).toBe(403)
    expect(insert).not.toHaveBeenCalled()
  })

  it('invalid JSON -> 400 invalid_body', async () => {
    requireAdmin.mockResolvedValue(adminOk())
    const res = await POST(mk('{nope'))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('invalid_body')
  })

  it('invalid fields -> 400 invalid_fields', async () => {
    requireAdmin.mockResolvedValue(adminOk())
    const res = await POST(mk(JSON.stringify({ ...valid, source: 'site' })))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('invalid_fields')
    expect(insert).not.toHaveBeenCalled()
  })

  it('valid -> 201 with whitelisted confirmed insert', async () => {
    requireAdmin.mockResolvedValue(adminOk())
    const res = await POST(mk(JSON.stringify({ ...valid, status: 'completed', id: 9, review_token: 'x' })))
    expect(res.status).toBe(201)
    expect((await res.json()).data).toEqual({ id: 77 })
    const payload = insert.mock.calls[0][0]
    const allowed = [
      'customer_name', 'customer_phone', 'customer_email', 'reservation_date', 'reservation_time',
      'party_size', 'admin_notes', 'locale', 'source', 'status', 'confirmed_at',
    ]
    for (const k of Object.keys(payload)) expect(allowed).toContain(k)
    expect(payload.status).toBe('confirmed')
  })

  it('insert error -> 500 generic', async () => {
    requireAdmin.mockResolvedValue(adminOk())
    singleResult = { data: null, error: { message: 'secret db detail' } }
    const res = await POST(mk(JSON.stringify(valid)))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: 'Erreur serveur', code: 'server_error' })
  })

  it('route source avoids service role, email and rate limit', () => {
    const src = readFileSync(join(process.cwd(), 'src/app/api/reservations/manual/route.ts'), 'utf-8')
    expect(src).not.toContain('createAdminClient')
    expect(src).not.toContain('getResendClient')
    expect(src).not.toContain('checkReservationRateLimits')
  })
})
