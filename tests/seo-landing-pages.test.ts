/**
 * Gate tests for every SEO landing page rendered by SeoLandingPage (plan 06-05).
 * Iterates LANDING and PUBLISHED_PAGES so later plans only add config, copy and publication.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LANDING, TRANSPORT_FACTS } from '../src/components/seo/pages.config'
import { PAGES, PUBLISHED_PAGES, relatedFor, isPublished, googleDirectionsUrl, type PageKey } from '../src/utils/seo'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const messages: Record<string, Record<string, Record<string, unknown>>> = {
  fr: JSON.parse(read('messages/fr.json')),
  en: JSON.parse(read('messages/en.json')),
  de: JSON.parse(read('messages/de.json')),
  sv: JSON.parse(read('messages/sv.json')),
}

function values(o: unknown): string[] {
  if (typeof o === 'string') return [o]
  if (typeof o !== 'object' || o === null) return []
  return Object.values(o as Record<string, unknown>).flatMap(values)
}

const landingKeys = Object.keys(LANDING) as PageKey[]
const nsOf = (key: PageKey) => PAGES.find((p) => p.key === key)!.namespace

describe('landing route files', () => {
  it('has at least one landing config', () => {
    expect(landingKeys.length).toBeGreaterThan(0)
  })

  for (const key of landingKeys) {
    it(`route for ${key} is a thin guarded wrapper`, () => {
      const file = `src/app/[locale]${key}/page.tsx`
      expect(existsSync(join(root, file))).toBe(true)
      const src = read(file)
      expect(src).toContain('<SeoLandingPage')
      expect(src).toContain('localizedPageMetadata(')
      expect(src).toContain('contentLocales')
      expect(src.match(/notFound\(\)/g)).toHaveLength(1)
    })

    it(`images of ${key} exist under public/`, () => {
      const cfg = LANDING[key]!
      const images = [cfg.heroImage, ...cfg.sections.flatMap((s) => (s.image ? [s.image] : []))]
      for (const img of images) expect(existsSync(join(root, 'public', img))).toBe(true)
    })
  }
})

describe('SeoLandingPage template', () => {
  const src = read('src/components/seo/SeoLandingPage.tsx')
  it('has a single h1, reservation CTA, related block and next/image', () => {
    expect(src.match(/<h1/g)).toHaveLength(1)
    expect(src).toContain('#reservation')
    expect(src).toContain('<RelatedGuides')
    expect(src).toContain('next/image')
    expect(src).not.toMatch(/aggregateRating/i)
  })
})

describe('landing copy per published locale', () => {
  for (const { path, locales } of PUBLISHED_PAGES) {
    if (!landingKeys.includes(path as PageKey)) continue
    const key = path as PageKey
    const ns = nsOf(key)
    for (const locale of locales) {
      it(`${key} [${locale}] meta, h1, nav and sections`, () => {
        const m = messages[locale]
        const title = m.meta[`${ns}Title`] as string
        const desc = m.meta[`${ns}Description`] as string
        expect(title.length).toBeGreaterThanOrEqual(30)
        expect(title.length).toBeLessThanOrEqual(60)
        expect(title).toContain('Krabi')
        expect(desc.length).toBeGreaterThanOrEqual(120)
        expect(desc.length).toBeLessThanOrEqual(165)
        const h1 = (m[ns] as Record<string, string>).h1
        expect(h1).toBeTruthy()
        expect(h1.match(/Krabi/g)?.length ?? 0).toBeLessThanOrEqual(1)
        expect(h1).toContain('Krabi')
        expect(m.nav[ns]).toBeTruthy()
        expect(m.nav[`${ns}Hint`]).toBeTruthy()
        const sections = (m[ns] as { sections: Record<string, Record<string, string>> }).sections
        for (const s of LANDING[key]!.sections) {
          expect(sections[s.id]?.title).toBeTruthy()
          for (let i = 1; i <= s.paras; i++) expect(sections[s.id][`p${i}`]).toBeTruthy()
        }
      })
    }
  }
})

describe('relatedFor', () => {
  for (const { path, locales } of PUBLISHED_PAGES) {
    for (const locale of locales) {
      it(`${path || 'home'} [${locale}] returns only published related pages`, () => {
        const rel = relatedFor(path as PageKey, locale)
        expect(rel.length).toBeLessThanOrEqual(3)
        expect(rel).not.toContain(path)
        for (const k of rel) expect(isPublished(k, locale)).toBe(true)
      })
    }
  }
})

describe('romantic dinner (D-12)', () => {
  const KEY = '/romantic-dinner-krabi'
  it('is published in fr, en, de and sv (owner-validated DE plan 13, SV plan 15)', () => {
    expect([...(PUBLISHED_PAGES.find((p) => p.path === KEY)?.locales ?? [])].sort()).toEqual(['de', 'en', 'fr', 'sv'])
  })
  it('has an occasion section', () => {
    expect(LANDING[KEY]!.sections.some((s) => s.id === 'occasion')).toBe(true)
  })
  it('copy has no tasting menu, price, formula or rating', () => {
    for (const locale of ['en', 'fr'] as const) {
      for (const v of values(messages[locale].romanticDinner)) {
        expect(v).not.toMatch(/tasting menu|menu d[ée]gustation|set menu|formule|THB|฿|baht|€|\bstars?\b|étoiles?|★/i)
      }
    }
  })
})

describe('where-to-eat (D-11)', () => {
  const KEY = '/where-to-eat-krabi-town'
  it('has a section with 3 cards', () => {
    expect(LANDING[KEY]?.sections.some((s) => s.cards === 3)).toBe(true)
  })
  it('is published in fr, en, de and sv and linked from romantic dinner', () => {
    expect(PUBLISHED_PAGES.find((p) => p.path === KEY)?.locales).toEqual(['fr', 'en', 'de', 'sv'])
    expect(relatedFor('/romantic-dinner-krabi', 'en')).toContain(KEY)
  })
  for (const locale of ['en', 'fr'] as const) {
    const all = () => values(messages[locale].whereToEat)
    it(`[${locale}] mentions the night market and Walking Street`, () => {
      const text = all().join(' ')
      expect(text).toMatch(locale === 'en' ? /night market/i : /marché de nuit/i)
      expect(text).toContain('Walking Street')
    })
    it(`[${locale}] names no competitor, ranking or negative claim`, () => {
      for (const v of all()) {
        expect(v).not.toMatch(/\b(best|worst|top \d|#\d|meilleur|pire|avoid|à éviter)\b/i)
        expect(v.replace(/Restaurant Gecko Cabane/g, '')).not.toMatch(/Restaurant [A-Z][a-z]+/)
      }
    })
  }
})

describe('EN-only pages (D-07, D-10, D-13)', () => {
  const HERE = '/getting-here-from-ao-nang'
  const WINE = '/wine-belgian-beer-krabi'
  const en = messages.en as unknown as Record<string, Record<string, unknown>>

  for (const key of [HERE, WINE]) {
    it(`route ${key} exists with one guarded notFound()`, () => {
      const src = read(`src/app/[locale]${key}/page.tsx`)
      expect(src).toContain('contentLocales')
      expect(src.match(/notFound\(\)/g)).toHaveLength(1)
    })
  }

  it('TRANSPORT_FACTS figures always carry a source', () => {
    for (const f of TRANSPORT_FACTS) {
      if (f.minutes || f.thb) expect((f.source ?? '').trim()).not.toBe('')
    }
  })

  it('gettingHere copy holds no figure with a unit (figures come from TRANSPORT_FACTS)', () => {
    for (const v of values(en.gettingHere)) {
      if (v.includes('{min}')) continue
      expect(v).not.toMatch(/\d\s?(min|minutes|THB|baht|฿)/i)
    }
  })

  it('gettingHere recommends Grab without inventing figures (owner 2026-10-18)', () => {
    const sections = en.gettingHere.sections as Record<string, Record<string, string>>
    expect(sections.options.p3).toContain('Grab')
    expect(sections.options.p3).toContain('Gecko Cabane Restaurant')
    expect(sections.options.p3).not.toMatch(/\d|guarantee/i)
    for (const f of TRANSPORT_FACTS) {
      expect(f.minutes).toBeNull()
      expect(f.thb).toBeNull()
    }
  })

  it('gettingHere has an approximate qualifier', () => {
    expect((en.gettingHere.facts as Record<string, string>).approx).toContain('approximate')
  })

  it('template wires directions and Belgian menu links', () => {
    const src = read('src/components/seo/SeoLandingPage.tsx')
    expect(src).toContain('googleDirectionsUrl(')
    expect(src).toContain('vins-bieres-belges')
  })

  it('googleDirectionsUrl targets the Google place', () => {
    const url = googleDirectionsUrl()
    expect(url.startsWith('https://www.google.com/maps/dir/?api=1')).toBe(true)
    expect(url).toContain('destination_place_id=ChIJozpAo2GUUTARABLcICH3H7I')
  })

  it('wineBeer copy is alcohol-safe (no brand, drink CTA or price)', () => {
    for (const v of values(en.wineBeer)) {
      expect(v).not.toMatch(
        /Chimay|Leffe|Duvel|Hoegaarden|Westmalle|Westvleteren|Orval|Rochefort|Stella|Delirium|Kwak|Chouffe|Karmeliet|Affligem|Grimbergen/i
      )
      expect(v).not.toMatch(/\b(drink up|cheers|happy hour|bottomless|free flow|buy one)\b/i)
      expect(v).not.toMatch(/\d+\s?(THB|baht|฿)/i)
    }
  })

  it('publication state', () => {
    expect(PAGES.find((p) => p.key === WINE)!.contentLocales).toEqual(['en'])
    expect(PUBLISHED_PAGES.find((p) => p.path === WINE)?.locales).toEqual(['en'])
    expect(PUBLISHED_PAGES.find((p) => p.path === HERE)?.locales).toEqual(['en'])
  })

  it('owner review sheet exists with sign-off line', () => {
    const f = 'docs/ph6/review/en/wine-belgian-beer-krabi.md'
    expect(existsSync(join(root, f))).toBe(true)
    expect(read(f)).toMatch(/^- \[x\] Validé par écrit par : .+Date : \d{4}-\d{2}-\d{2}/m)
  })
})
