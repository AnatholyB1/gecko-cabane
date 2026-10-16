/**
 * Middleware matcher / options / root redirect source-scan tests (SEO-06, SEO-05, D-02)
 *
 * The middleware is read as text: importing it would pull next-intl/supabase runtime.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const middlewareSrc = readFileSync(join(root, 'src/middleware.ts'), 'utf8')
const nextConfigSrc = readFileSync(join(root, 'next.config.ts'), 'utf8')

function matcherRegex(): RegExp {
  const m = middlewareSrc.match(/matcher:\s*\[[\s\S]*?'((?:[^'\\]|\\.)*)'/)
  if (!m) throw new Error('matcher not found')
  // TS source escapes: '\\.' in source is '\.' in the runtime string
  const pattern = m[1].replace(/\\\\/g, '\\')
  return new RegExp('^' + pattern + '$')
}

describe('middleware matcher', () => {
  const re = matcherRegex()

  it.each([
    '/sitemap.xml',
    '/robots.txt',
    '/opengraph-image',
    '/manifest.webmanifest',
    '/monitoring',
    '/hero-bg.jpg',
  ])('does not match %s', (p) => {
    expect(re.test(p)).toBe(false)
  })

  it.each([
    '/',
    '/fr',
    '/en',
    '/fr/privacy',
    '/fr/opengraph-image',
    '/admin',
    '/admin/login',
    '/api/hours',
  ])('matches %s', (p) => {
    expect(re.test(p)).toBe(true)
  })
})

describe('middleware options', () => {
  it('disables locale detection and next-intl alternate Link headers', () => {
    expect(middlewareSrc).toContain('localeDetection: false')
    expect(middlewareSrc).toContain('alternateLinks: false')
    expect(middlewareSrc).toContain("localePrefix: 'always'")
  })
})

describe('root redirect', () => {
  it('next.config permanently redirects / to /fr', () => {
    expect(nextConfigSrc).toMatch(/redirects\s*\(/)
    expect(nextConfigSrc).toContain("source: '/'")
    expect(nextConfigSrc).toContain("destination: '/fr'")
    expect(nextConfigSrc).toContain('permanent: true')
  })
})
