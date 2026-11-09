/**
 * Page metadata wiring tests (D-10, D-11, D-13)
 *
 * - meta namespace values per locale
 * - generateMetadata wiring in layouts/pages (source scan)
 * - root layout holds only shared values; admin is noindex
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const fr = JSON.parse(read('messages/fr.json'))
const en = JSON.parse(read('messages/en.json'))

describe('meta namespace', () => {
  it('has the exact home titles', () => {
    expect(en.meta.homeTitle).toBe('Gecko Cabane – French-Thai Restaurant in Krabi, Open Daily')
    expect(fr.meta.homeTitle).toBe('Gecko Cabane – Restaurant franco-thaï à Krabi, ouvert 7j/7')
  })

  it('has SEO titles and descriptions of the right size in all 4 locales (home + french-restaurant)', () => {
    const all = { fr, en, de: JSON.parse(read('messages/de.json')), sv: JSON.parse(read('messages/sv.json')) }
    const seen = new Set<string>()
    for (const [loc, m] of Object.entries(all)) {
      for (const k of ['homeTitle', 'frenchRestaurantTitle']) {
        const t: string = m.meta[k]
        expect(t.length, `${loc}.${k}`).toBeLessThanOrEqual(64)
        expect(t, `${loc}.${k}`).toContain('Gecko Cabane')
      }
      for (const k of ['homeDescription', 'frenchRestaurantDescription']) {
        const d: string = m.meta[k]
        expect(d.length, `${loc}.${k}`).toBeGreaterThanOrEqual(150)
        expect(d.length, `${loc}.${k}`).toBeLessThanOrEqual(160)
        expect(d, `${loc}.${k}`).toContain('Jariya')
        expect(d, `${loc}.${k}`).toContain('Krabi')
      }
      for (const k of ['homeTitle', 'homeDescription', 'frenchRestaurantTitle', 'frenchRestaurantDescription']) {
        const v: string = m.meta[k]
        // unique per page and locale
        expect(seen.has(v), `${loc}.${k} duplicated`).toBe(false)
        seen.add(v)
        // no hard-coded hours, ratings or unverifiable superlatives
        expect(v, `${loc}.${k}`).not.toMatch(/\d\s?[h:]\s?\d|\d\s?(am|pm|Uhr)\b|\b\d[.,]\d\b|\bavis\b|reviews?\b|Bewertung|recension/i)
        expect(v, `${loc}.${k}`).not.toMatch(/\b(best|meilleur|beste[rn]?|bäst|bästa)\b/i)
      }
    }
  })

  it('has schemaDescription and an accent-free English namespace', () => {
    expect(fr.meta.schemaDescription).toBeTruthy()
    expect(en.meta.schemaDescription).toBeTruthy()
    for (const v of Object.values(en.meta) as string[]) {
      expect(v).not.toMatch(/[àâçèéêëîïôùû]/i)
    }
  })
})

describe('generateMetadata wiring', () => {
  it('home and privacy use localizedPageMetadata', () => {
    const home = read('src/app/[locale]/page.tsx')
    const privacy = read('src/app/[locale]/privacy/page.tsx')
    for (const src of [home, privacy]) {
      expect(src).toContain('export async function generateMetadata')
      expect(src).toContain('localizedPageMetadata(')
    }
    expect(home).toContain('absoluteTitle: true')
    expect(home).toContain("key: ''")
    expect(privacy).toContain("key: '/privacy'")
  })

  it('landing page uses localizedPageMetadata with the registry key', () => {
    const landing = read('src/app/[locale]/french-restaurant-krabi/page.tsx')
    expect(landing).toContain('export async function generateMetadata')
    expect(landing).toContain('localizedPageMetadata(')
    expect(landing).toContain("'/french-restaurant-krabi'")
    expect(en.meta.frenchRestaurantTitle).toContain('Krabi')
  })

  it('menu page uses localizedPageMetadata', () => {
    const menu = read('src/app/[locale]/menu/page.tsx')
    expect(menu).toContain('export async function generateMetadata')
    expect(menu).toContain('localizedPageMetadata(')
    expect(menu).toContain("key: '/menu'")
    expect(en.meta.menuTitle).toContain('Krabi')
    expect(en.meta.menuTitle).toContain('Gecko Cabane')
  })

  it('locale layout sets defaults but no alternates/canonical', () => {
    const src = read('src/app/[locale]/layout.tsx')
    expect(src).toContain('generateMetadata')
    expect(src).not.toContain('alternates')
    expect(src).not.toContain('canonical')
  })

  it('shared root metadata (src/app/fonts.ts) keeps only shared values', () => {
    const src = read('src/app/fonts.ts')
    for (const banned of ['alternates', 'openGraph', 'twitter', 'keywords', 'application/ld+json', 'aggregateRating']) {
      expect(src).not.toContain(banned)
    }
    expect(src).toContain('new URL(SITE_URL)')
  })

  it('admin layout is noindex', () => {
    expect(existsSync(join(root, 'src/app/admin/layout.tsx'))).toBe(true)
    expect(read('src/app/admin/layout.tsx')).toContain('index: false')
  })
})

describe('reservation CTA above the fold', () => {
  it('home hero and both headers link to the reservation section with a filled button', () => {
    const home = read('src/app/[locale]/page.tsx')
    const hero = home.slice(home.indexOf('HERO'), home.indexOf('SIGNATURE'))
    expect(hero).toContain('href="#reservation"')
    expect(hero).toContain("t(\"common.bookTable\")")
    const nav = home.slice(home.indexOf('NAVIGATION'), home.indexOf('Announcement Banner'))
    expect(nav).toMatch(/href="#reservation"[^>]*bg-gc-gold/)
    const header = read('src/components/SiteHeader.tsx')
    expect(header).toMatch(/href="\/#reservation"[^>]*bg-gc-gold/)
  })
})
