/**
 * Slug registry, pathnames, noindex resolver and hreflang reciprocity (PAGE-08, D-01, D-02, D-05)
 */

import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  PAGES,
  PUBLISHED_PAGES,
  slugFor,
  localeUrl,
  localePath,
  isPublished,
  publishedLocales,
  resolvePageSeo,
  buildPathnames,
  pageLanguages,
  toSeoLocale,
  LOCALES,
  guidesFor,
  switcherTargets,
} from '../src/utils/seo'
import { routing } from '../src/i18n/routing'

const KEYS = [
  '',
  '/privacy',
  '/menu',
  '/french-restaurant-krabi',
  '/romantic-dinner-krabi',
  '/where-to-eat-krabi-town',
  '/getting-here-from-ao-nang',
  '/wine-belgian-beer-krabi',
]

describe('PAGES registry', () => {
  it('has exactly the expected keys', () => {
    expect(PAGES.map((p) => p.key)).toEqual(KEYS)
  })

  it('keeps the EN slug identical to the key (D-02)', () => {
    for (const p of PAGES) expect(slugFor(p.key, 'en')).toBe(p.key)
  })

  it('translates FR slugs (D-01)', () => {
    expect(slugFor('/french-restaurant-krabi', 'fr')).toBe('/restaurant-francais-krabi')
    expect(slugFor('/romantic-dinner-krabi', 'fr')).toBe('/diner-romantique-krabi')
    expect(slugFor('/where-to-eat-krabi-town', 'fr')).toBe('/ou-manger-krabi-town')
    expect(slugFor('/menu', 'fr')).toBe('/menu')
  })

  it('uses ASCII lowercase hyphenated slugs, unique per locale', () => {
    for (const locale of ['fr', 'en', 'de', 'sv'] as const) {
      const seen = new Set<string>()
      for (const p of PAGES) {
        if (p.key === '') continue
        const s = slugFor(p.key, locale)
        expect(s).toMatch(/^\/[a-z0-9]+(-[a-z0-9]+)*$/)
        expect(seen.has(s)).toBe(false)
        seen.add(s)
      }
    }
  })

  it('has valid related entries', () => {
    const keys = new Set<string>(KEYS)
    for (const p of PAGES) {
      for (const r of p.related) {
        expect(keys.has(r)).toBe(true)
        expect(r).not.toBe(p.key)
      }
    }
    for (const k of KEYS.slice(3)) {
      const n = PAGES.find((p) => p.key === k)!.related.length
      expect(n).toBeGreaterThanOrEqual(2)
      expect(n).toBeLessThanOrEqual(3)
    }
  })

  it('toSeoLocale falls back to fr', () => {
    expect(toSeoLocale('en')).toBe('en')
    expect(toSeoLocale('xx')).toBe('fr')
  })
})

describe('localeUrl / localePath', () => {
  it('keeps the EN URL byte-identical', () => {
    expect(localeUrl('en', '/french-restaurant-krabi')).toBe(
      'https://geckocabanerestaurant.com/en/french-restaurant-krabi'
    )
  })
  it('uses the FR slug', () => {
    expect(localeUrl('fr', '/french-restaurant-krabi')).toBe(
      'https://geckocabanerestaurant.com/fr/restaurant-francais-krabi'
    )
    expect(localePath('fr', '/menu')).toBe('/fr/menu')
    expect(localePath('fr', '/french-restaurant-krabi')).toBe('/fr/restaurant-francais-krabi')
  })
})

describe('buildPathnames / routing', () => {
  it('has no en entry and the FR rewrite', () => {
    const p = buildPathnames()
    for (const v of Object.values(p)) expect(v).not.toHaveProperty('en')
    expect(p['/french-restaurant-krabi']).toEqual({
      fr: '/restaurant-francais-krabi',
      de: '/franzoesisches-restaurant-krabi',
      sv: '/fransk-restaurang-krabi',
    })
  })
  it('routing.pathnames equals buildPathnames()', () => {
    expect(routing.pathnames).toEqual(buildPathnames())
  })
})

describe('resolvePageSeo', () => {
  it('noindexes unpublished pairs', () => {
    expect(resolvePageSeo('/wine-belgian-beer-krabi', 'fr').index).toBe(false)
    expect(resolvePageSeo('/wine-belgian-beer-krabi', 'en').index).toBe(true)
  })

  it('indexes the FR landing with hreflang', () => {
    const r = resolvePageSeo('/french-restaurant-krabi', 'fr')
    expect(r).toEqual({
      index: true,
      canonical: localeUrl('fr', '/french-restaurant-krabi'),
      languages: {
        fr: localeUrl('fr', '/french-restaurant-krabi'),
        en: localeUrl('en', '/french-restaurant-krabi'),
        de: localeUrl('de', '/french-restaurant-krabi'),
        sv: localeUrl('sv', '/french-restaurant-krabi'),
        'x-default': localeUrl('fr', '/french-restaurant-krabi'),
      },
    })
  })

  it('has reciprocal hreflang for every published pair', () => {
    for (const page of PUBLISHED_PAGES) {
      const expectedKeys = [...page.locales, 'x-default'].sort()
      let reference: Record<string, string> | null = null
      for (const locale of page.locales) {
        expect(isPublished(page.path, locale)).toBe(true)
        const r = resolvePageSeo(page.path, locale)
        expect(r.index).toBe(true)
        if (!r.index) continue
        expect(Object.keys(r.languages).sort()).toEqual(expectedKeys)
        expect(Object.values(r.languages)).toContain(r.languages['x-default'])
        expect(r.languages['x-default']).toBe(
          localeUrl(page.locales.includes('fr') ? 'fr' : page.locales[0], page.path)
        )
        if (reference) expect(r.languages).toEqual(reference)
        reference = r.languages
        expect(r.languages).toEqual(pageLanguages(page.path, page.locales))
      }
    }
  })

  it('has a route file for every published page', () => {
    for (const page of PUBLISHED_PAGES) {
      const file = page.path === ''
        ? join(__dirname, '../src/app/[locale]/page.tsx')
        : join(__dirname, '../src/app/[locale]', page.path, 'page.tsx')
      expect(existsSync(file)).toBe(true)
    }
  })

  it('publishes the French landing in fr and en (PAGE-08)', () => {
    expect([...publishedLocales('/french-restaurant-krabi')]).toEqual(['fr', 'en', 'de', 'sv'])
    expect(PUBLISHED_PAGES.find((p) => p.path === '/french-restaurant-krabi')?.locales).toEqual(['fr', 'en', 'de', 'sv'])
  })
})

describe('de/sv locales (D-05)', () => {
  it('registers four locales', () => {
    expect([...LOCALES]).toEqual(['fr', 'en', 'de', 'sv'])
  })

  it('has the DE/SV slugs', () => {
    expect(slugFor('/french-restaurant-krabi', 'de')).toBe('/franzoesisches-restaurant-krabi')
    expect(slugFor('/french-restaurant-krabi', 'sv')).toBe('/fransk-restaurang-krabi')
    expect(slugFor('/romantic-dinner-krabi', 'de')).toBe('/romantisches-abendessen-krabi')
    expect(slugFor('/romantic-dinner-krabi', 'sv')).toBe('/romantisk-middag-krabi')
    expect(slugFor('/where-to-eat-krabi-town', 'de')).toBe('/wo-essen-krabi-town')
    expect(slugFor('/where-to-eat-krabi-town', 'sv')).toBe('/var-ata-krabi-town')
    expect(slugFor('/menu', 'de')).toBe('/menu')
    expect(slugFor('', 'sv')).toBe('')
  })

  it('indexes validated de pages and noindexes unpublished de/sv pages', () => {
    expect(resolvePageSeo('', 'de').index).toBe(true)
    expect(resolvePageSeo('/privacy', 'de').index).toBe(false)
    expect(resolvePageSeo('', 'sv').index).toBe(true)
    expect(resolvePageSeo('/menu', 'sv').index).toBe(true)
    expect(resolvePageSeo('/privacy', 'sv').index).toBe(false)
    expect(resolvePageSeo('/getting-here-from-ao-nang', 'sv').index).toBe(false)
    expect(resolvePageSeo('/wine-belgian-beer-krabi', 'sv').index).toBe(false)
  })

  it('lists de/sv URLs of validated pages and no sv URL for unpublished pages', async () => {
    const sitemap = (await import('../src/app/sitemap')).default
    const urls = sitemap().map((e) => e.url)
    const svAllowed = new Set(
      PUBLISHED_PAGES.filter((p) => p.locales.includes('sv')).map((p) => localeUrl('sv', p.path))
    )
    for (const u of urls.filter((x) => /\/sv(\/|$)/.test(x))) expect(svAllowed.has(u), u).toBe(true)
    for (const p of svAllowed) expect(urls).toContain(p)
    expect(urls.some((u) => u.includes('/sv/privacy'))).toBe(false)
    expect(urls).toContain(localeUrl('de', '/menu'))
    expect(urls).toContain(localeUrl('de'))
    expect(urls.some((u) => u.includes('/de/privacy'))).toBe(false)
  })

  it('switcherTargets on /sv/menu returns sv current plus published fr/en/de', () => {
    const t = switcherTargets('/sv/menu')
    expect(t.map((x) => x.locale).sort()).toEqual(['de', 'en', 'fr', 'sv'])
    expect(t.find((x) => x.current)?.locale).toBe('sv')
  })

  it('switcherTargets on /de/menu returns de current plus published fr/en/sv', () => {
    const t = switcherTargets('/de/menu')
    expect(t.map((x) => x.locale).sort()).toEqual(['de', 'en', 'fr', 'sv'])
    expect(t.find((x) => x.current)?.locale).toBe('de')
  })

  it('guidesFor de lists the three validated guides (no EN-only pages)', () => {
    expect(guidesFor('de').map((g) => g.key)).toEqual([
      '/french-restaurant-krabi',
      '/romantic-dinner-krabi',
      '/where-to-eat-krabi-town',
    ])
    expect(guidesFor('sv').map((g) => g.key)).toEqual([
      '/french-restaurant-krabi',
      '/romantic-dinner-krabi',
      '/where-to-eat-krabi-town',
    ])
  })
})
