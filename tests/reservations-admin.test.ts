/**
 * Admin guards on /api/reservations (SEC-01, SEC-03, D-14)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

const requireAdmin = vi.fn()
const createAdminClient = vi.fn()
const update = vi.fn()

vi.mock('@/utils/auth', () => ({ requireAdmin: (...a: unknown[]) => requireAdmin(...a) }))
vi.mock('@/utils/supabase/server', () => ({
  createAdminClient: (...a: unknown[]) => createAdminClient(...a),
  createClient: vi.fn(),
  isGeckoAdmin: vi.fn(),
}))
vi.mock('@/utils/resend', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/resend')>()
  return { ...actual, getResendClient: () => null }
})
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

import { GET, PUT, DELETE } from '@/app/api/reservations/route'

type Req = import('next/server').NextRequest
const mk = (url: string, init?: RequestInit) => new Request(url, init) as unknown as Req

const deny = (status: number) => ({
  ok: false,
  response: NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Forbidden' }, { status }),
})

function adminOk() {
  const chain: Record<string, unknown> = {}
  chain.update = (u: unknown) => {
    update(u)
    return chain
  }
  chain.eq = () => chain
  chain.select = () => chain
  chain.single = async () => ({
    data: { id: 5, status: 'confirmed', customer_name: 'A', customer_email: null, locale: 'fr' },
    error: null,
  })
  return { ok: true, supabase: { from: () => chain }, user: { id: 'u1' } }
}

describe('reservations admin handlers', () => {
  beforeEach(() => {
    requireAdmin.mockReset()
    createAdminClient.mockReset()
    update.mockReset()
  })

  it('GET anonymous -> 401 and no service-role client', async () => {
    requireAdmin.mockResolvedValue(deny(401))
    const res = await GET(mk('http://localhost/api/reservations'))
    expect(res.status).toBe(401)
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('GET ?phone= anonymous -> 401 (no lookup branch)', async () => {
    requireAdmin.mockResolvedValue(deny(401))
    const res = await GET(mk('http://localhost/api/reservations?phone=%2B66812345678'))
    expect(res.status).toBe(401)
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('GET non-admin -> 403', async () => {
    requireAdmin.mockResolvedValue(deny(403))
    const res = await GET(mk('http://localhost/api/reservations'))
    expect(res.status).toBe(403)
  })

  it('PUT only writes whitelisted columns', async () => {
    requireAdmin.mockResolvedValue(adminOk())
    const res = await PUT(
      mk('http://localhost/api/reservations', {
        method: 'PUT',
        body: JSON.stringify({ id: 5, status: 'confirmed', admin_notes: 'ok', customer_phone: '+1', party_size: 99 }),
      })
    )
    expect(res.status).toBe(200)
    expect(update).toHaveBeenCalledTimes(1)
    const allowed = ['status', 'admin_notes', 'confirmed_at', 'cancelled_at', 'updated_at']
    for (const k of Object.keys(update.mock.calls[0][0])) expect(allowed).toContain(k)
  })

  it('PUT with an invalid status -> 400', async () => {
    requireAdmin.mockResolvedValue(adminOk())
    const res = await PUT(
      mk('http://localhost/api/reservations', { method: 'PUT', body: JSON.stringify({ id: 5, status: 'hacked' }) })
    )
    expect(res.status).toBe(400)
    expect(update).not.toHaveBeenCalled()
  })

  it('DELETE non-admin -> 403', async () => {
    requireAdmin.mockResolvedValue(deny(403))
    const res = await DELETE(mk('http://localhost/api/reservations?id=5', { method: 'DELETE' }))
    expect(res.status).toBe(403)
  })
})
