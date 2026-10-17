/**
 * Pop-up rules (plan 07-06): capping, exclusions, triggers, counter route.
 */

import { describe, it, expect } from 'vitest'
import {
  POPUP_STORAGE_KEY,
  POPUP_TTL_MS,
  DESKTOP_ARM_MS,
  MOBILE_DELAY_MS,
  MOBILE_SCROLL_RATIO,
  isExcludedPath,
  parsePopupMemory,
  buildPopupMemory,
  isPopupSuppressed,
  scrollRatio,
  shouldShowPopup,
} from '../src/utils/newsletter-popup'


describe('constants', () => {
  it('match the decided values', () => {
    expect(POPUP_STORAGE_KEY).toBe('gc_nl_popup')
    expect(POPUP_TTL_MS).toBe(7776000000)
    expect(DESKTOP_ARM_MS).toBe(10000)
    expect(MOBILE_DELAY_MS).toBe(45000)
    expect(MOBILE_SCROLL_RATIO).toBe(0.6)
  })
})

describe('isExcludedPath', () => {
  it.each(['/review', '/newsletter', '/newsletter/confirm', '/newsletter/unsubscribe', '/wifi'])(
    'excludes %s',
    (p) => expect(isExcludedPath(p)).toBe(true),
  )
  it.each(['/', '/menu', '/privacy', '/french-restaurant-krabi', '/reviewer'])('allows %s', (p) =>
    expect(isExcludedPath(p)).toBe(false),
  )
})

describe('parsePopupMemory', () => {
  it.each([null, '', 'garbage', '{"until":"x"}', '{"state":"dismissed"}'])('rejects %s', (raw) =>
    expect(parsePopupMemory(raw)).toBeNull(),
  )
  it('accepts a valid memory', () => {
    expect(parsePopupMemory('{"state":"dismissed","until":5}')).toEqual({ state: 'dismissed', until: 5 })
  })
})

describe('isPopupSuppressed', () => {
  it('handles null, future and past', () => {
    expect(isPopupSuppressed(null, 100)).toBe(false)
    expect(isPopupSuppressed({ state: 'dismissed', until: 101 }, 100)).toBe(true)
    expect(isPopupSuppressed({ state: 'dismissed', until: 100 }, 100)).toBe(false)
  })
})

describe('buildPopupMemory', () => {
  it('stores state with a 90 day expiry', () => {
    expect(JSON.parse(buildPopupMemory('subscribed', 1000))).toEqual({
      state: 'subscribed',
      until: 1000 + 7776000000,
    })
  })
})

describe('scrollRatio', () => {
  it('computes and clamps', () => {
    expect(scrollRatio(300, 700, 1000)).toBe(1)
    expect(scrollRatio(0, 500, 1000)).toBe(0.5)
    expect(scrollRatio(5000, 700, 1000)).toBe(1)
    expect(scrollRatio(-50, 0, 1000)).toBe(0)
    expect(scrollRatio(10, 10, 0)).toBe(1)
  })
})

describe('shouldShowPopup', () => {
  const base = { memory: null, now: 1, pathname: '/', reservationActive: false }
  it('shows by default', () => expect(shouldShowPopup(base)).toBe(true))
  it('hides when suppressed', () =>
    expect(shouldShowPopup({ ...base, memory: { state: 'dismissed', until: 99 } })).toBe(false))
  it('hides on excluded paths', () => expect(shouldShowPopup({ ...base, pathname: '/wifi' })).toBe(false))
  it('hides during reservation', () => expect(shouldShowPopup({ ...base, reservationActive: true })).toBe(false))
})
