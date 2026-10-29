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
    '/gcm/js/script.js',
    '/gcm/api/event',
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
    '/review',
    '/avis',
    '/bewertung',
  ])('matches %s', (p) => {
    expect(re.test(p)).toBe(true)
  })
})

describe('middleware options', () => {
  it('disables locale detection and next-intl alternate Link headers', () => {
    const routingSrc = readFileSync(join(root, 'src/i18n/routing.ts'), 'utf8')
    expect(routingSrc).toContain('localeDetection: false')
    expect(routingSrc).toContain('alternateLinks: false')
    expect(routingSrc).toContain("localePrefix: 'always'")
    expect(routingSrc).toContain('pathnames: buildPathnames()')
    expect(middlewareSrc).toContain('createIntlMiddleware(routing)')
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

describe('review alias pass-through', () => {
  it('lists the three aliases before the Supabase client is created', () => {
    const passIdx = middlewareSrc.indexOf('REVIEW_ALIASES.has(pathname)')
    expect(passIdx).toBeGreaterThan(-1)
    expect(middlewareSrc).toContain("'/review'")
    expect(middlewareSrc).toContain("'/avis'")
    expect(middlewareSrc).toContain("'/bewertung'")
    expect(passIdx).toBeLessThan(middlewareSrc.indexOf('createServerClient('))
  })
})

describe('newsletter alias pass-through and pdf exclusion', () => {
  it('lists /newsletter and /wifi before the Supabase client is created', () => {
    const passIdx = middlewareSrc.indexOf('NEWSLETTER_ALIASES.has(pathname)')
    expect(passIdx).toBeGreaterThan(-1)
    expect(middlewareSrc).toContain("'/newsletter'")
    expect(middlewareSrc).toContain("'/wifi'")
    expect(passIdx).toBeLessThan(middlewareSrc.indexOf('createServerClient('))
  })

  it('does not match pdf files in public/', () => {
    expect(matcherRegex().test('/guide-gourmand-krabi-town-fr.pdf')).toBe(false)
    expect(middlewareSrc).toContain('pdf')
  })
})
