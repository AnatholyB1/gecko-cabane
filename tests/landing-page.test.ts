/**
 * Tests for the EN-only landing page /en/french-restaurant-krabi (plan 03-05, D-12..D-14).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const en = JSON.parse(read('messages/en.json'))
const fr = JSON.parse(read('messages/fr.json'))

const PAGE = 'src/app/[locale]/french-restaurant-krabi/page.tsx'

function flatten(o: unknown, prefix = ''): string[] {
  if (typeof o !== 'object' || o === null) return [prefix]
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) =>
    flatten(v, prefix ? `${prefix}.${k}` : k)
  )
}
function values(o: unknown): string[] {
  if (typeof o === 'string') return [o]
  if (typeof o !== 'object' || o === null) return []
  return Object.values(o as Record<string, unknown>).flatMap(values)
}

describe('landing page source', () => {
  const src = read(PAGE)

  it('is guarded by contentLocales (notFound + early return in metadata)', () => {
    expect(src).toContain('contentLocales')
    expect(src.match(/notFound\(\)/g)).toHaveLength(1)
    expect(src).toContain('return {}')
  })

  it('uses the registry-driven metadata helper', () => {
    expect(src).toContain('export async function generateMetadata')
    expect(src).toContain('localizedPageMetadata(')
    expect(src).toContain("const KEY = '/french-restaurant-krabi'")
    expect(src).not.toContain("locale: 'en'")
  })

  it('has a single h1 and booking/menu links', () => {
    expect(src.match(/<h1/g)).toHaveLength(1)
    expect(src).toContain('#reservation')
    expect(src).toContain('href="/menu')
    expect(src).toContain('vins-bieres-belges')
    expect(src).toContain('availableLocales={publishedLocales(KEY)}')
    expect(src).toContain('getOpeningHours()')
  })

  it('uses only the approved photos', () => {
    for (const f of [
      'food-bourguignon.jpg',
      'food-veloute.jpg',
      'food-poulet-creme.jpg',
      'food-massaman.jpg',
      'chef-jariya.jpg',
      'exterior-entrance.jpg',
    ]) {
      expect(src).toContain(f)
    }
  })

  it('has no rating claim and no romantic angle, safe external link', () => {
    expect(src).not.toMatch(/aggregateRating/i)
    expect(src).not.toMatch(/romantic/i)
    expect(src).toContain('rel="noopener noreferrer"')
  })
})

describe('LanguageSwitcher / SiteHeader', () => {
  it('switcher hides itself with fewer than 2 available locales', () => {
    const s = read('src/components/LanguageSwitcher.tsx')
    expect(s).toContain('availableLocales')
    expect(s).toMatch(/availableLocales\.length < 2/)
  })
  it('header forwards availableLocales', () => {
    expect(read('src/components/SiteHeader.tsx')).toContain('availableLocales={availableLocales}')
  })
})

describe('landing copy', () => {
  it('has the exact EN h1', () => {
    expect(en.frenchRestaurant.h1).toBe('French restaurant in Krabi Town')
  })

  it('EN values are accent-free except velouté and mention no romance', () => {
    for (const v of values(en.frenchRestaurant)) {
      expect(v.replace(/velouté/gi, '')).not.toMatch(/[àâçèéêëîïôùû]/i)
      expect(v).not.toMatch(/romantic/i)
    }
  })

  it('fr.json has the same frenchRestaurant keys', () => {
    expect(flatten(fr.frenchRestaurant).sort()).toEqual(flatten(en.frenchRestaurant).sort())
  })

  it('has landing meta within limits', () => {
    const t: string = en.meta.frenchRestaurantTitle
    const d: string = en.meta.frenchRestaurantDescription
    expect(t.toLowerCase()).toContain('french restaurant')
    expect(t).toContain('Krabi')
    expect(t.length).toBeGreaterThanOrEqual(40)
    expect(t.length).toBeLessThanOrEqual(60)
    expect(d.length).toBeGreaterThanOrEqual(120)
    expect(d.length).toBeLessThanOrEqual(165)
    const ft: string = fr.meta.frenchRestaurantTitle
    const fd: string = fr.meta.frenchRestaurantDescription
    expect(ft.toLowerCase()).toContain('restaurant français')
    expect(ft).toContain('Krabi')
    expect(ft.length).toBeGreaterThanOrEqual(40)
    expect(ft.length).toBeLessThanOrEqual(60)
    expect(fd.length).toBeGreaterThanOrEqual(120)
    expect(fd.length).toBeLessThanOrEqual(165)
  })
})
