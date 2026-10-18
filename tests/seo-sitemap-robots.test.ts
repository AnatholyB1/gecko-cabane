/**
 * Sitemap and robots route tests (SEO-06, D-14)
 */

import { describe, it, expect } from 'vitest'
import sitemap from '../src/app/sitemap'
import robots from '../src/app/robots'
import { localeUrl, pageLanguages, SITE_URL, PUBLISHED_PAGES } from '../src/utils/seo'

describe('sitemap', () => {
  const entries = sitemap()

  it('lists exactly the published URLs from PUBLISHED_PAGES', () => {
    const expected = PUBLISHED_PAGES.flatMap((page) =>
      page.locales.map((l) => localeUrl(l, page.path))
    ).sort()
    expect(entries.map((e) => e.url).sort()).toEqual(expected)
    expect(entries.map((e) => e.url)).toContain('https://geckocabanerestaurant.com/fr/restaurant-francais-krabi')
  })

  it('declares alternates per entry from PUBLISHED_PAGES', () => {
    const expected = PUBLISHED_PAGES.flatMap((page) =>
      page.locales.map((l) => ({ url: localeUrl(l, page.path), languages: pageLanguages(page.path, page.locales) }))
    )
    for (const e of entries) {
      const exp = expected.find((x) => x.url === e.url)!
      expect(e.alternates?.languages).toEqual(exp.languages)
    }
  })

  it('never lists the untranslated FR landing URL', () => {
    const all = entries.flatMap((e) => [e.url, ...Object.values(e.alternates?.languages ?? {})])
    expect(all.join(' ')).not.toContain('/fr/french-restaurant-krabi')
  })

  it('uses only the canonical domain and no sv locale', () => {
    const all: string[] = entries.flatMap((e) => [e.url, ...Object.values(e.alternates?.languages ?? {}).filter((x): x is string => typeof x === 'string')])
    for (const u of all) {
      expect(u.startsWith('https://geckocabanerestaurant.com/')).toBe(true)
      expect(u).not.toMatch(/\/sv|gecko-cabane\.com/)
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
