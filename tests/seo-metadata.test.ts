/**
 * SEO metadata helper tests
 *
 * Ensures localeUrl/buildPageMetadata derive canonical, hreflang and
 * OpenGraph/Twitter data from a single SITE_URL (fr, en, x-default only).
 */

import { describe, it, expect } from 'vitest'
import {
  SITE_URL,
  LOCALES,
  OG_LOCALE,
  PUBLISHED_PATHS,
  PUBLISHED_PAGES,
  localeUrl,
  buildPageMetadata,
  publishedLocales,
} from '../src/utils/seo'

const T = 'Titre test'
const D = 'Description test'

// ---------------------------------------------------------------------------
// localeUrl
// ---------------------------------------------------------------------------

describe('localeUrl', () => {
  it('builds absolute URLs on the main domain', () => {
    expect(SITE_URL).toBe('https://geckocabanerestaurant.com')
    expect(localeUrl('fr')).toBe('https://geckocabanerestaurant.com/fr')
    expect(localeUrl('en', '/privacy')).toBe('https://geckocabanerestaurant.com/en/privacy')
  })

  it('exposes the four locales and the published paths', () => {
    expect([...LOCALES]).toEqual(['fr', 'en', 'de', 'sv'])
    expect([...PUBLISHED_PATHS]).toEqual(PUBLISHED_PAGES.filter((p) => p.locales.includes('fr') && p.locales.includes('en')).map((p) => p.path))
    expect(OG_LOCALE).toEqual({ fr: 'fr_FR', en: 'en_US', de: 'de_DE', sv: 'sv_SE' })
  })
})

// ---------------------------------------------------------------------------
// buildPageMetadata
// ---------------------------------------------------------------------------

describe.each((['fr', 'en'] as const).flatMap((l) => PUBLISHED_PATHS.map((p) => [l, p] as const)))(
  'buildPageMetadata(%s, "%s")',
  (locale, path) => {
    const published = publishedLocales(path)
    const others = published.filter((l) => l !== locale)
    const md = buildPageMetadata({ locale, path, title: T, description: D })

    it('has a self-referencing absolute canonical', () => {
      expect(md.alternates?.canonical).toBe(localeUrl(locale, path))
    })

    it('has hreflang for the published locales plus x-default (x-default -> fr)', () => {
      const langs = md.alternates?.languages as Record<string, string>
      expect(Object.keys(langs).sort()).toEqual([...published, 'x-default'].sort())
      expect(langs['x-default']).toBe(localeUrl('fr', path))
      expect(langs.fr).toBe(localeUrl('fr', path))
      expect(langs.en).toBe(localeUrl('en', path))
      expect(JSON.stringify(md)).not.toMatch(/"sv"/)
      if (published.includes('de')) expect(langs.de).toBe(localeUrl('de', path))
    })

    it('has localized OpenGraph', () => {
      expect(md.openGraph).toMatchObject({
        type: 'website',
        siteName: 'Gecko Cabane',
        url: localeUrl(locale, path),
        locale: OG_LOCALE[locale],
        alternateLocale: others.map((l) => OG_LOCALE[l]),
        title: T,
        description: D,
      })
    })

    it('has a twitter card with the same title/description', () => {
      expect(md.twitter).toMatchObject({ card: 'summary_large_image', title: T, description: D })
    })

    it('never references the legacy domain', () => {
      expect(JSON.stringify(md)).not.toContain(['gecko-cabane', 'com'].join('.'))
    })
  }
)

describe('buildPageMetadata title', () => {
  it('uses { absolute } when absoluteTitle is true', () => {
    const md = buildPageMetadata({ locale: 'en', title: T, description: D, absoluteTitle: true })
    expect(md.title).toEqual({ absolute: T })
    expect(md.alternates?.canonical).toBe('https://geckocabanerestaurant.com/en')
    expect((md.openGraph as { locale: string }).locale).toBe('en_US')
    expect((md.openGraph as { alternateLocale: string[] }).alternateLocale).toEqual(['fr_FR', 'de_DE'])
  })

  it('uses a plain string otherwise', () => {
    expect(buildPageMetadata({ locale: 'fr', title: T, description: D }).title).toBe(T)
  })
})

describe('EN-only page', () => {
  const path = '/french-restaurant-krabi'
  const md = buildPageMetadata({ locale: 'en', path, locales: ['en'], title: T, description: D })

  it('has a self-referencing canonical and en + x-default hreflang only', () => {
    expect(md.alternates?.canonical).toBe(localeUrl('en', path))
    const langs = md.alternates?.languages as Record<string, string>
    expect(Object.keys(langs).sort()).toEqual(['en', 'x-default'])
    expect(langs.en).toBe(localeUrl('en', path))
    expect(langs['x-default']).toBe(localeUrl('en', path))
  })

  it('has no FR reference and no alternateLocale', () => {
    const og = md.openGraph as { locale: string; alternateLocale?: string[] }
    expect(og.locale).toBe('en_US')
    expect(og.alternateLocale ?? []).toEqual([])
    const json = JSON.stringify(md)
    expect(json).not.toContain('/fr/french-restaurant-krabi')
    expect(json).not.toContain('fr_FR')
  })
})

describe('PUBLISHED_PAGES', () => {
  it('declares per-page locales and keeps PUBLISHED_PATHS as the bilingual subset', () => {
    expect(PUBLISHED_PAGES.find((p) => p.path === '/french-restaurant-krabi')?.locales).toEqual(['fr', 'en', 'de'])
    const bilingual = PUBLISHED_PAGES.filter((p) => p.locales.includes('fr') && p.locales.includes('en')).map((p) => p.path)
    expect([...PUBLISHED_PATHS]).toEqual(bilingual)
  })
})
