/**
 * Review counters (REV-06, D-07, D-08): recordReviewHit helper and the counted
 * redirect route /api/review/go.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextRequest } from 'next/server'

const rpc = vi.fn()
const captureException = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createAdminClient: () => ({ rpc }),
}))
vi.mock('@sentry/nextjs', () => ({
  captureException: (...a: unknown[]) => captureException(...a),
}))

import { recordReviewHit } from '../src/utils/review-stats'
import { GET } from '../src/app/api/review/go/route'
import { googleReviewUrl, tripAdvisorReviewUrl } from '../src/utils/seo'

const req = (qs: string) => new NextRequest(`http://localhost/api/review/go${qs}`)

beforeEach(() => {
  rpc.mockReset()
  captureException.mockReset()
  rpc.mockResolvedValue({ error: null })
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
  it('counts a google click and redirects 302', async () => {
    const res = await GET(req('?t=google&src=wa'))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(googleReviewUrl())
    expect(rpc).toHaveBeenCalledWith('gecko_review_click_hit', { p_source: 'wa', p_kind: 'google' })
    expect(res.headers.get('cache-control')).toContain('no-store')
  })

  it('counts a tripadvisor click', async () => {
    const res = await GET(req('?t=tripadvisor&src=email'))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(tripAdvisorReviewUrl())
    expect(rpc).toHaveBeenCalledWith('gecko_review_click_hit', {
      p_source: 'email',
      p_kind: 'tripadvisor',
    })
  })

  it('maps an arbitrary src to unknown', async () => {
    await GET(req('?t=google&src=evil'))
    expect(rpc).toHaveBeenCalledWith('gecko_review_click_hit', {
      p_source: 'unknown',
      p_kind: 'google',
    })
  })

  it.each(['?t=https://evil.com', '', '?src=qr'])('rejects bad target %j with 400', async (qs) => {
    const res = await GET(req(qs))
    expect(res.status).toBe(400)
    expect(await res.json()).toHaveProperty('error')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('still redirects when the counter fails', async () => {
    rpc.mockRejectedValue(new Error('down'))
    const res = await GET(req('?t=google&src=qr'))
    expect(res.status).toBe(302)
  })
})

describe('route source scan', () => {
  const src = readFileSync(join(__dirname, '..', 'src/app/api/review/go/route.ts'), 'utf8')
  it('uses a fixed target map and no user-supplied URL', () => {
    expect(src).toContain('REVIEW_TARGETS')
    expect(src).toContain("dynamic = 'force-dynamic'")
    expect(src).not.toContain("searchParams.get('url')")
    expect(src).not.toContain('redirect(searchParams')
    const block = src.slice(src.indexOf('REVIEW_TARGETS'))
    expect(block.indexOf('google')).toBeLessThan(block.indexOf('tripadvisor'))
  })
})
