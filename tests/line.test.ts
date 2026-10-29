/**
 * LINE URL validation tests (RESA-05, D-22, T-05-16).
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { LINE_HOSTS, parseLineUrl, getLineUrl } from '../src/utils/line'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('parseLineUrl', () => {
  it.each([
    'https://lin.ee/abc123',
    'https://line.me/R/ti/p/@geckocabane',
    'https://page.line.me/abc',
  ])('accepts %s', (url) => {
    expect(parseLineUrl(url)).toBe(new URL(url).toString())
  })

  it.each([
    undefined,
    null,
    '',
    'http://lin.ee/x',
    'https://evil.com/lin.ee',
    'https://lin.ee.evil.com/x',
    'javascript:alert(1)',
    'https://user:pw@line.me/x',
    'not a url',
  ])('rejects %s', (url) => {
    expect(parseLineUrl(url as string | null | undefined)).toBeNull()
  })

  it('exposes the host allowlist', () => {
    expect(LINE_HOSTS).toEqual(['line.me', 'lin.ee', 'page.line.me'])
  })
})

describe('getLineUrl', () => {
  it('returns null when NEXT_PUBLIC_LINE_URL is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_LINE_URL', '')
    expect(getLineUrl()).toBeNull()
  })

  it('returns the URL when valid', () => {
    vi.stubEnv('NEXT_PUBLIC_LINE_URL', 'https://lin.ee/abc123')
    expect(getLineUrl()).toBe('https://lin.ee/abc123')
  })
})
