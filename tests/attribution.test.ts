/** Attribution capture tests (RESA-06, D-05) - unit with a hand-stubbed window. */

import { describe, it, expect, afterEach } from 'vitest'
import {
  ATTRIBUTION_STORAGE_KEY,
  parseAttribution,
  captureAttribution,
  readAttribution,
} from '../src/utils/attribution'

const g = globalThis as unknown as { window?: unknown }
const originalWindow = g.window

function stubWindow(search: string, initial?: string, throws = false) {
  const store = new Map<string, string>()
  if (initial !== undefined) store.set(ATTRIBUTION_STORAGE_KEY, initial)
  g.window = {
    location: { search },
    sessionStorage: {
      getItem: (k: string) => {
        if (throws) throw new Error('denied')
        return store.get(k) ?? null
      },
      setItem: (k: string, v: string) => {
        if (throws) throw new Error('denied')
        store.set(k, v)
      },
    },
  }
  return store
}

afterEach(() => {
  if (originalWindow === undefined) delete g.window
  else g.window = originalWindow
})

describe('parseAttribution', () => {
  it('parses utm params', () => {
    expect(parseAttribution('?utm_source=google&utm_medium=gbp')).toEqual({
      utm_source: 'google',
      utm_medium: 'gbp',
    })
  })
  it('parses ref', () => {
    expect(parseAttribution('?ref=newsletter')).toEqual({ ref: 'newsletter' })
  })
  it('returns null without known keys', () => {
    expect(parseAttribution('')).toBeNull()
    expect(parseAttribution('?foo=1')).toBeNull()
  })
  it('trims, drops empty and truncates', () => {
    expect(parseAttribution('?utm_source=%20a%20&utm_medium=')).toEqual({ utm_source: 'a' })
    const r = parseAttribution('?ref=' + 'x'.repeat(150))
    expect(r?.ref).toHaveLength(100)
  })
  it('never exposes unknown keys', () => {
    expect(parseAttribution('?ref=a&evil=1')).toEqual({ ref: 'a' })
  })
})

describe('captureAttribution', () => {
  it('stores when params exist', () => {
    const store = stubWindow('?utm_source=google')
    captureAttribution()
    expect(JSON.parse(store.get(ATTRIBUTION_STORAGE_KEY)!)).toEqual({ utm_source: 'google' })
  })
  it('does not overwrite without params', () => {
    const store = stubWindow('', '{"ref":"old"}')
    captureAttribution()
    expect(store.get(ATTRIBUTION_STORAGE_KEY)).toBe('{"ref":"old"}')
  })
  it('does not write when nothing parsed', () => {
    const store = stubWindow('?foo=1')
    captureAttribution()
    expect(store.has(ATTRIBUTION_STORAGE_KEY)).toBe(false)
  })
  it('overwrites on new params (last touch)', () => {
    const store = stubWindow('?ref=new', '{"ref":"old"}')
    captureAttribution()
    expect(JSON.parse(store.get(ATTRIBUTION_STORAGE_KEY)!)).toEqual({ ref: 'new' })
  })
})

describe('readAttribution', () => {
  it('returns {} when empty', () => {
    stubWindow('')
    expect(readAttribution()).toEqual({})
  })
  it('returns {} on invalid JSON', () => {
    stubWindow('', 'not json')
    expect(readAttribution()).toEqual({})
  })
  it('returns {} when storage throws', () => {
    stubWindow('', undefined, true)
    expect(readAttribution()).toEqual({})
  })
  it('drops invalid values', () => {
    stubWindow('', JSON.stringify({ utm_source: 5, utm_medium: 'x'.repeat(101), ref: 'ok', other: 'z' }))
    expect(readAttribution()).toEqual({ ref: 'ok' })
  })
})
