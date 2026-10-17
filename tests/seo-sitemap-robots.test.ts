/**
 * Sitemap and robots route tests (SEO-06, D-14)
 */

import { describe, it, expect } from 'vitest'
import sitemap from '../src/app/sitemap'
import robots from '../src/app/robots'
import { localeUrl, SITE_URL } from '../src/utils/seo'

describe('sitemap', () => {
  const entries = sitemap()

  it('lists exactly the 6 published URLs', () => {
    const expected = [
      localeUrl('fr'),
      localeUrl('fr', '/privacy'),
      localeUrl('fr', '/menu'),
      localeUrl('en'),
      localeUrl('en', '/privacy'),
      localeUrl('en', '/menu'),
    ].sort()
    expect(entries.map((e) => e.url).sort()).toEqual(expected)
  })

  it('declares fr, en and x-default alternates per path', () => {
    for (const e of entries) {
      const path = e.url.replace(/^https:\/\/geckocabanerestaurant\.com\/(fr|en)/, '')
      expect(e.alternates?.languages).toEqual({
        fr: localeUrl('fr', path),
        en: localeUrl('en', path),
        'x-default': localeUrl('fr', path),
      })
    }
  })

  it('uses only the canonical domain and no unpublished locale', () => {
    const all: string[] = entries.flatMap((e) => [e.url, ...Object.values(e.alternates?.languages ?? {}).filter((x): x is string => typeof x === 'string')])
    for (const u of all) {
      expect(u.startsWith('https://geckocabanerestaurant.com/')).toBe(true)
      expect(u).not.toMatch(/\/de|\/sv|gecko-cabane\.com/)
    }
  })

  it('has no fabricated lastModified, changeFrequency or priority', () => {
    for (const e of entries) {
      expect(e).not.toHaveProperty('lastModified')
      expect(e).not.toHaveProperty('changeFrequency')
      expect(e).not.toHaveProperty('priority')
    }
  })
})

describe('robots', () => {
  it('allows / and disallows private areas, with sitemap', () => {
    const r = robots()
    expect(r.rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/auth', '/monitoring'],
    })
    expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`)
    expect(r.sitemap).toBe('https://geckocabanerestaurant.com/sitemap.xml')
  })
})
