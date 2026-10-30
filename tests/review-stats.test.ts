/**
 * Review counters (REV-06, D-07, D-08): recordReviewHit helper and the counted
 * redirect route /api/review/go (non-blocking, throttled, rid-verified).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextRequest } from 'next/server'

const rpc = vi.fn()
const maybeSingle = vi.fn()
const captureException = vi.fn()
const afterCallbacks: Array<() => unknown> = []
const flush = async () => {
  for (const cb of afterCallbacks.splice(0)) await cb()
}
const RID = '0b6f1a52-3c1e-4c1b-9d2a-7a1f2a9e4b10'

vi.mock('@/utils/supabase/server', () => ({
  createAdminClient: () => ({
    rpc,
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}))
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return { ...actual, after: (cb: () => unknown) => void afterCallbacks.push(cb) }
})
vi.mock('@sentry/nextjs', () => ({
  captureException: (...a: unknown[]) => captureException(...a),
  captureMessage: vi.fn(),
}))

import { recordReviewHit } from '../src/utils/review-stats'
import { GET } from '../src/app/api/review/go/route'
import { googleReviewUrl, tripAdvisorReviewUrl } from '../src/utils/seo'

const req = (qs: string) => new NextRequest(`http://localhost/api/review/go${qs}`)
const hits = () => rpc.mock.calls.filter((c) => c[0] === 'gecko_review_click_hit')

beforeEach(() => {
  rpc.mockReset()
  maybeSingle.mockReset()
  captureException.mockReset()
  afterCallbacks.length = 0
  rpc.mockResolvedValue({ data: true, error: null })
  maybeSingle.mockResolvedValue({ data: { locale: 'fr' }, error: null })
})

describe('recordReviewHit', () => {
  it('calls the RPC with the allowlisted values', async () => {
    await recordReviewHit('qr', 'visit')
    expect(rpc).toHaveBeenCalledWith('gecko_review_click_hit', { p_source: 'qr', p_kind: 'visit' })
  })

  it('swallows an rpc error and reports it', async () => {
    rpc.mockResolvedValue({ error: { message: 'boom' } })
    await expect(recordReviewHit('wa', 'google')).resolves.toBeUndefined()
    expect(captureException).toHaveBeenCalled()
  })

  it('swallows a thrown error and reports it', async () => {
    rpc.mockRejectedValue(new Error('down'))
    await expect(recordReviewHit('site', 'visit')).resolves.toBeUndefined()
    expect(captureException).toHaveBeenCalled()
  })
})

describe('GET /api/review/go', () => {
  it('redirects immediately and counts a google click after the response', async () => {
    const res = await GET(req('?t=google&src=wa'))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(googleReviewUrl())
    expect(res.headers.get('cache-control')).toContain('no-store')
    expect(rpc).not.toHaveBeenCalled() // nothing awaited before the redirect
    await flush()
    expect(rpc).toHaveBeenCalledWith('gecko_review_click_hit', { p_source: 'wa', p_kind: 'google' })
  })

  it('credits email only when the rid really exists', async () => {
    const res = await GET(req(`?t=tripadvisor&src=email&rid=${RID}`))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(tripAdvisorReviewUrl())
    await flush()
    expect(hits()).toEqual([['gecko_review_click_hit', { p_source: 'email', p_kind: 'tripadvisor' }]])
  })

  it('does not credit email for a well-formed but unknown rid', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    await GET(req(`?t=google&src=email&rid=${RID}`))
    await flush()
    expect(hits()).toEqual([['gecko_review_click_hit', { p_source: 'unknown', p_kind: 'google' }]])
  })

  it('does not credit a bare src=email without rid', async () => {
    await GET(req('?t=google&src=email'))
    await flush()
    expect(hits()).toEqual([['gecko_review_click_hit', { p_source: 'unknown', p_kind: 'google' }]])
  })

  it('does not credit email when the rid lookup fails (db error)', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'down' } })
    await GET(req(`?t=google&rid=${RID}`))
    await flush()
    expect(hits()[0][1]).toMatchObject({ p_source: 'unknown' })
  })

  it('maps an arbitrary src to unknown', async () => {
    await GET(req('?t=google&src=evil'))
    await flush()
    expect(hits()).toEqual([['gecko_review_click_hit', { p_source: 'unknown', p_kind: 'google' }]])
  })

  it('throttles: a limited caller is redirected but not counted', async () => {
    rpc.mockImplementation(async (name: string) =>
      name === 'gecko_rate_limit_hit' ? { data: false, error: null } : { data: null, error: null },
    )
    const res = await GET(req('?t=google&src=qr'))
    expect(res.status).toBe(302)
    await flush()
    expect(hits()).toHaveLength(0)
  })

  it('throttle outage skips the count but still redirects', async () => {
    rpc.mockImplementation(async (name: string) =>
      name === 'gecko_rate_limit_hit' ? { data: null, error: { message: 'x' } } : { data: null, error: null },
    )
    const res = await GET(req('?t=google&src=qr'))
    expect(res.status).toBe(302)
    await flush()
    expect(hits()).toHaveLength(0)
  })

  it.each(['?t=https://evil.com', '', '?src=qr'])('rejects bad target %j with 400', async (qs) => {
    const res = await GET(req(qs))
    expect(res.status).toBe(400)
    expect(await res.json()).toHaveProperty('error')
    expect(afterCallbacks).toHaveLength(0)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('still redirects when every write fails', async () => {
    rpc.mockRejectedValue(new Error('down'))
    maybeSingle.mockRejectedValue(new Error('down'))
    const res = await GET(req(`?t=google&src=qr&rid=${RID}`))
    expect(res.status).toBe(302)
    await expect(flush()).resolves.toBeUndefined()
  })
})

describe('route source scan', () => {
  const src = readFileSync(join(__dirname, '..', 'src/app/api/review/go/route.ts'), 'utf8')
  it('uses a fixed target map, no user-supplied URL and never awaits the write before redirecting', () => {
    expect(src).toContain('REVIEW_TARGETS')
    expect(src).toContain("dynamic = 'force-dynamic'")
    expect(src).not.toContain("searchParams.get('url')")
    expect(src).not.toContain('redirect(searchParams')
    expect(src).not.toMatch(/await\s+recordReviewHit\(/)
    expect(src).not.toMatch(/await\s+recordReviewHitThrottled\([^)]*\)\s*\n\s*const res/)
    expect(src).toContain('after(')
    const block = src.slice(src.indexOf('REVIEW_TARGETS'))
    expect(block.indexOf('google')).toBeLessThan(block.indexOf('tripadvisor'))
  })
})
