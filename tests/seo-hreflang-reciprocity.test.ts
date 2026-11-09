/**
 * hreflang reciprocity across the sitemap and the page metadata (ONP-06):
 * every version of a page points to all the others, itself included, plus x-default,
 * and every target is a URL that the sitemap lists.
 */

import { describe, it, expect } from 'vitest'
import sitemap from '../src/app/sitemap'
import {
  PAGES,
  PUBLISHED_PAGES,
  buildPageMetadata,
  localeUrl,
  pageLanguages,
  publishedLocales,
  resolvePageSeo,
  type SeoLocale,
} from '../src/utils/seo'

const entries = sitemap()
const urls = new Set(entries.map((e) => e.url))

type Languages = Record<string, string>
const langsOf = (e: (typeof entries)[number]) => (e.alternates?.languages ?? {}) as Languages

describe('sitemap hreflang reciprocity', () => {
  it('lists exactly one entry per published (page, locale) pair', () => {
    const expected = PUBLISHED_PAGES.flatMap((p) => p.locales.map((l) => localeUrl(l, p.path)))
    expect([...urls].sort()).toEqual([...expected].sort())
    expect(entries).toHaveLength(expected.length)
  })

  for (const page of PUBLISHED_PAGES) {
    describe(`page "${page.path || '/'}"`, () => {
      const group = page.locales.map((l) => localeUrl(l, page.path))

      it('uses a distinct URL per locale', () => {
        expect(new Set(group).size).toBe(group.length)
      })

      for (const locale of page.locales) {
        it(`[${locale}] points to every version of the page, itself included`, () => {
          const entry = entries.find((e) => e.url === localeUrl(locale, page.path))!
          const langs = langsOf(entry)
          for (const l of page.locales) expect(langs[l]).toBe(localeUrl(l, page.path))
          expect(Object.keys(langs).filter((k) => k !== 'x-default').sort()).toEqual([...page.locales].sort())
        })

        it(`[${locale}] has an x-default that is one of the versions`, () => {
          const entry = entries.find((e) => e.url === localeUrl(locale, page.path))!
          const xDefault = langsOf(entry)['x-default']
          expect(group).toContain(xDefault)
          expect(xDefault).toBe(localeUrl(page.locales.includes('fr') ? 'fr' : page.locales[0], page.path))
        })

        it(`[${locale}] page metadata matches the sitemap alternates and canonical`, () => {
          const md = buildPageMetadata({ locale, path: page.path, title: 'T', description: 'D' })
          const entry = entries.find((e) => e.url === localeUrl(locale, page.path))!
          expect(md.alternates?.languages).toEqual(langsOf(entry))
          expect(md.alternates?.canonical).toBe(entry.url)
        })
      }

      it('has the same alternates on every version (reciprocity)', () => {
        const maps = page.locales.map((l) => langsOf(entries.find((e) => e.url === localeUrl(l, page.path))!))
        for (const m of maps) expect(m).toEqual(maps[0])
      })

      it('only references URLs that the sitemap lists', () => {
        for (const e of entries) {
          for (const target of Object.values(langsOf(e))) expect(urls.has(target), target).toBe(true)
        }
      })
    })
  }
})

describe('pages with content but not yet published in a locale', () => {
  for (const page of PAGES) {
    for (const locale of page.contentLocales) {
      if (publishedLocales(page.key).includes(locale)) continue
      it(`"${page.key || '/'}" [${locale}] is noindex, absent from the sitemap and from every hreflang`, () => {
        expect(resolvePageSeo(page.key, locale as SeoLocale).index).toBe(false)
        const own = localeUrl(locale as SeoLocale, page.key)
        expect(urls.has(own)).toBe(false)
        for (const e of entries) expect(Object.values(langsOf(e))).not.toContain(own)
      })
    }
  }
})

describe('ONP-04 / ONP-05 translated pages', () => {
  const cases: [string, Record<SeoLocale, string>][] = [
    [
      '/getting-here-from-ao-nang',
      { fr: '/fr/venir-depuis-ao-nang', en: '/en/getting-here-from-ao-nang', de: '/de/anreise-von-ao-nang', sv: '/sv/resa-fran-ao-nang' },
    ],
    [
      '/wine-belgian-beer-krabi',
      { fr: '/fr/vins-bieres-belges-krabi', en: '/en/wine-belgian-beer-krabi', de: '/de/wein-belgisches-bier-krabi', sv: '/sv/vin-belgisk-ol-krabi' },
    ],
  ]
  for (const [key, paths] of cases) {
    it(`${key} has translated slugs in all four locales`, () => {
      for (const l of ['fr', 'en', 'de', 'sv'] as const) expect(localeUrl(l, key)).toBe(`https://geckocabanerestaurant.com${paths[l]}`)
    })
    it(`${key} is listed in fr and en, hreflang covers exactly those`, () => {
      expect(publishedLocales(key)).toEqual(['fr', 'en'])
      expect(Object.keys(pageLanguages(key, publishedLocales(key))).sort()).toEqual(['en', 'fr', 'x-default'])
    })
  }
})
