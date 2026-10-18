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
    expect([...publishedLocales('/french-restaurant-krabi')]).toEqual(['fr', 'en'])
    expect(PUBLISHED_PAGES.find((p) => p.path === '/french-restaurant-krabi')?.locales).toEqual(['fr', 'en'])
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

  it('noindexes unpublished de/sv pages', () => {
    expect(resolvePageSeo('', 'de').index).toBe(false)
    expect(resolvePageSeo('/menu', 'sv').index).toBe(false)
  })

  it('lists no de/sv URL in the sitemap', async () => {
    const sitemap = (await import('../src/app/sitemap')).default
    for (const e of sitemap()) expect(e.url).not.toMatch(/\/(de|sv)(\/|$)/)
  })

  it('switcherTargets on /de/menu returns de current plus published fr/en', () => {
    const t = switcherTargets('/de/menu')
    expect(t.map((x) => x.locale).sort()).toEqual(['de', 'en', 'fr'])
    expect(t.find((x) => x.current)?.locale).toBe('de')
  })

  it('guidesFor de is empty', () => {
    expect(guidesFor('de')).toEqual([])
  })
})
