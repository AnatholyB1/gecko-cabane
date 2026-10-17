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
    expect(en.meta.homeTitle).toBe('Gecko Cabane – French-Thai Restaurant in Krabi Town')
    expect(fr.meta.homeTitle).toBe('Gecko Cabane – Restaurant franco-thaï à Krabi Town')
  })

  it('has home descriptions of 120-165 chars mentioning Jariya, 40 and Maharat', () => {
    for (const m of [fr, en]) {
      const d: string = m.meta.homeDescription
      expect(d.length).toBeGreaterThanOrEqual(120)
      expect(d.length).toBeLessThanOrEqual(165)
      expect(d).toContain('Jariya')
      expect(d).toContain('40')
      expect(d).toContain('Maharat')
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
  it('home and privacy use buildPageMetadata', () => {
    const home = read('src/app/[locale]/page.tsx')
    const privacy = read('src/app/[locale]/privacy/page.tsx')
    for (const src of [home, privacy]) {
      expect(src).toContain('export async function generateMetadata')
      expect(src).toContain('buildPageMetadata(')
    }
    expect(home).toContain('absoluteTitle: true')
    expect(privacy).toContain("path: '/privacy'")
  })

  it('menu page uses buildPageMetadata', () => {
    const menu = read('src/app/[locale]/menu/page.tsx')
    expect(menu).toContain('export async function generateMetadata')
    expect(menu).toContain('buildPageMetadata(')
    expect(menu).toContain("path: '/menu'")
    expect(en.meta.menuTitle).toContain('Krabi')
    expect(en.meta.menuTitle).toContain('Gecko Cabane')
  })

  it('locale layout sets defaults but no alternates/canonical', () => {
    const src = read('src/app/[locale]/layout.tsx')
    expect(src).toContain('generateMetadata')
    expect(src).not.toContain('alternates')
    expect(src).not.toContain('canonical')
  })

  it('root layout keeps only shared values', () => {
    const src = read('src/app/layout.tsx')
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
