/**
 * requireAdmin() guard tests
 *
 * - anonymous caller        -> 401 { error: 'Unauthorized' }
 * - user not in gecko_admins -> 403 { error: 'Forbidden' }
 * - gecko admin             -> ok, same supabase client + user returned
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUser = vi.fn()
const supabaseClient = { auth: { getUser } }
const isGeckoAdmin = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => supabaseClient),
  isGeckoAdmin: (...args: unknown[]) => isGeckoAdmin(...args),
}))

import { requireAdmin } from '@/utils/auth'

describe('requireAdmin', () => {
  beforeEach(() => {
    getUser.mockReset()
    isGeckoAdmin.mockReset()
  })

  it('returns 401 when there is no user', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    const result = await requireAdmin()
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.response.status).toBe(401)
    expect(await result.response.json()).toEqual({ error: 'Unauthorized' })
    expect(isGeckoAdmin).not.toHaveBeenCalled()
  })

  it('returns 403 when the user is not a gecko admin', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    isGeckoAdmin.mockResolvedValue(false)
    const result = await requireAdmin()
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.response.status).toBe(403)
    expect(await result.response.json()).toEqual({ error: 'Forbidden' })
  })

  it('returns ok with client and user for a gecko admin', async () => {
    const user = { id: 'u1' }
    getUser.mockResolvedValue({ data: { user } })
    isGeckoAdmin.mockResolvedValue(true)
    const result = await requireAdmin()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.supabase).toBe(supabaseClient)
    expect(result.user).toBe(user)
  })
})
