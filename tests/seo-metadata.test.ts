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
  localeUrl,
  buildPageMetadata,
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

  it('exposes only fr/en and the published paths', () => {
    expect([...LOCALES]).toEqual(['fr', 'en'])
    expect([...PUBLISHED_PATHS]).toEqual(['', '/privacy'])
    expect(OG_LOCALE).toEqual({ fr: 'fr_FR', en: 'en_US' })
  })
})

// ---------------------------------------------------------------------------
// buildPageMetadata
// ---------------------------------------------------------------------------

describe.each(LOCALES.flatMap((l) => PUBLISHED_PATHS.map((p) => [l, p] as const)))(
  'buildPageMetadata(%s, "%s")',
  (locale, path) => {
    const other = locale === 'fr' ? 'en' : 'fr'
    const md = buildPageMetadata({ locale, path, title: T, description: D })

    it('has a self-referencing absolute canonical', () => {
      expect(md.alternates?.canonical).toBe(localeUrl(locale, path))
    })

    it('has hreflang fr, en, x-default only (x-default -> fr)', () => {
      const langs = md.alternates?.languages as Record<string, string>
      expect(Object.keys(langs).sort()).toEqual(['en', 'fr', 'x-default'])
      expect(langs['x-default']).toBe(localeUrl('fr', path))
      expect(langs.fr).toBe(localeUrl('fr', path))
      expect(langs.en).toBe(localeUrl('en', path))
      expect(JSON.stringify(md)).not.toMatch(/"(de|sv)"/)
    })

    it('has localized OpenGraph', () => {
      expect(md.openGraph).toMatchObject({
        type: 'website',
        siteName: 'Gecko Cabane',
        url: localeUrl(locale, path),
        locale: OG_LOCALE[locale],
        alternateLocale: [OG_LOCALE[other]],
        title: T,
        description: D,
      })
    })

    it('has a twitter card with the same title/description', () => {
      expect(md.twitter).toMatchObject({ card: 'summary_large_image', title: T, description: D })
    })

    it('never references the legacy domain', () => {
      expect(JSON.stringify(md)).not.toContain('gecko-cabane.com')
    })
  }
)

describe('buildPageMetadata title', () => {
  it('uses { absolute } when absoluteTitle is true', () => {
    const md = buildPageMetadata({ locale: 'en', title: T, description: D, absoluteTitle: true })
    expect(md.title).toEqual({ absolute: T })
    expect(md.alternates?.canonical).toBe('https://geckocabanerestaurant.com/en')
    expect((md.openGraph as { locale: string }).locale).toBe('en_US')
    expect((md.openGraph as { alternateLocale: string[] }).alternateLocale).toEqual(['fr_FR'])
  })

  it('uses a plain string otherwise', () => {
    expect(buildPageMetadata({ locale: 'fr', title: T, description: D }).title).toBe(T)
  })
})
