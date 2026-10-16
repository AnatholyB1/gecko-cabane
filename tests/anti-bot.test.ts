/**
 * Anti-bot helpers (D-09): honeypot + minimum / maximum fill time.
 */

import { describe, it, expect } from 'vitest'
import { isHoneypotFilled, checkFillTime, MIN_FILL_MS, MAX_FILL_MS } from '../src/utils/anti-bot'

describe('isHoneypotFilled', () => {
  it('is false for empty, blank or non-string values', () => {
    expect(isHoneypotFilled('')).toBe(false)
    expect(isHoneypotFilled('  ')).toBe(false)
    expect(isHoneypotFilled(undefined)).toBe(false)
    expect(isHoneypotFilled(null)).toBe(false)
    expect(isHoneypotFilled(42)).toBe(false)
  })

  it('is true when a bot filled the field', () => {
    expect(isHoneypotFilled('http://spam')).toBe(true)
  })
})

describe('checkFillTime', () => {
  const now = 1_800_000_000_000

  it('accepts a human fill time', () => {
    expect(checkFillTime(now - 5000, now)).toBe(true)
    expect(checkFillTime(now - MIN_FILL_MS, now)).toBe(true)
    expect(checkFillTime(now - MAX_FILL_MS, now)).toBe(true)
  })

  it('rejects too fast, future, too old, wrong type or missing values', () => {
    expect(checkFillTime(now - 1000, now)).toBe(false)
    expect(checkFillTime(now + 10, now)).toBe(false)
    expect(checkFillTime(now - 25 * 60 * 60 * 1000, now)).toBe(false)
    expect(checkFillTime('123', now)).toBe(false)
    expect(checkFillTime(undefined, now)).toBe(false)
    expect(checkFillTime(Number.NaN, now)).toBe(false)
    expect(checkFillTime(Number.POSITIVE_INFINITY, now)).toBe(false)
  })
})
