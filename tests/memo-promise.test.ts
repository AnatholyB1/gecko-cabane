import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { memoizeUntilRejected } from '../src/utils/memo-promise'

describe('memoizeUntilRejected', () => {
  it('caches a successful load', async () => {
    const load = vi.fn().mockResolvedValue('lib')
    const get = memoizeUntilRejected(load)
    await expect(get()).resolves.toBe('lib')
    await expect(get()).resolves.toBe('lib')
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('forgets a rejection so the next call retries', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('chunk failed')).mockResolvedValueOnce('lib')
    const get = memoizeUntilRejected(load)
    await expect(get()).rejects.toThrow('chunk failed')
    await Promise.resolve()
    await expect(get()).resolves.toBe('lib')
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('shares one in-flight load between concurrent callers', async () => {
    const load = vi.fn().mockResolvedValue('lib')
    const get = memoizeUntilRejected(load)
    await Promise.all([get(), get()])
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('ReservationForm uses it for libphonenumber', () => {
    const src = readFileSync(join(__dirname, '..', 'src/components/ReservationForm.tsx'), 'utf8')
    expect(src).toContain("memoizeUntilRejected(() => import('libphonenumber-js/min'))")
    expect(src).not.toContain('phoneLibPromise')
  })
})
