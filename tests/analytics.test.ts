/** Analytics helper tests (KPI-01, RESA-06, D-01..D-03) - unit. */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { EVENTS, track, getPlausibleScriptId } from '../src/utils/analytics'

const g = globalThis as unknown as { window?: unknown }
const originalWindow = g.window

afterEach(() => {
  vi.unstubAllEnvs()
  if (originalWindow === undefined) delete g.window
  else g.window = originalWindow
})

describe('EVENTS', () => {
  it('has stable names', () => {
    expect(EVENTS).toEqual({
      reservationSent: 'Reservation Sent',
      whatsappClick: 'WhatsApp Click',
      lineClick: 'LINE Click',
    })
  })
})

describe('track', () => {
  it('does not throw without window', () => {
    delete g.window
    expect(() => track('X')).not.toThrow()
  })

  it('does not throw when window.plausible is absent', () => {
    g.window = {}
    expect(() => track('X')).not.toThrow()
  })

  it('passes props when given', () => {
    const fn = vi.fn()
    g.window = { plausible: fn }
    track('X', { locale: 'fr' })
    expect(fn).toHaveBeenCalledWith('X', { props: { locale: 'fr' } })
  })

  it('passes undefined options without props', () => {
    const fn = vi.fn()
    g.window = { plausible: fn }
    track('X')
    expect(fn).toHaveBeenCalledWith('X', undefined)
  })

  it('swallows errors', () => {
    g.window = {
      plausible: () => {
        throw new Error('boom')
      },
    }
    expect(() => track('X')).not.toThrow()
  })
})

describe('getPlausibleScriptId', () => {
  it('returns null when unset', () => {
    vi.stubEnv('NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID', '')
    expect(getPlausibleScriptId()).toBeNull()
  })

  it.each(['abc', 'pa-', 'pa-x y', 'pa-<script>'])('rejects %s', (v) => {
    vi.stubEnv('NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID', v)
    expect(getPlausibleScriptId()).toBeNull()
  })

  it('accepts a valid id', () => {
    vi.stubEnv('NEXT_PUBLIC_PLAUSIBLE_SCRIPT_ID', 'pa-AbC_12-x')
    expect(getPlausibleScriptId()).toBe('pa-AbC_12-x')
  })
})
