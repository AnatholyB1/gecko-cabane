/**
 * ONP-01 / ONP-10: one real, descriptive H1 per public page.
 * Source-level contract (the rendered HTML is audited separately against `next start`).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const count = (src: string, re: RegExp) => (src.match(re) ?? []).length

const H1: Record<string, string> = {
  fr: 'Restaurant franco-thaï à Krabi Town',
  en: 'French-Thai Restaurant in Krabi Town',
  de: 'Französisch-thailändisches Restaurant in Krabi Town',
  sv: 'Fransk-thailändsk restaurang i Krabi Town',
}

describe('home H1 (ONP-01)', () => {
  it('has the decided H1 text in each locale', () => {
    for (const [loc, text] of Object.entries(H1)) {
      expect(JSON.parse(read(`messages/${loc}.json`)).hero.h1, loc).toBe(text)
    }
  })

  it('renders exactly one h1, from hero.h1, and the GECKO CABANE logo is not a heading', () => {
    const home = read('src/app/[locale]/page.tsx')
    expect(count(home, /<h1[\s>]/g)).toBe(1)
    expect(home).toMatch(/<h1[^>]*>\s*\{t\('hero\.h1'\)\}\s*<\/h1>/)
    expect(home).toMatch(/<p[^>]*font-cinzel-decorative[^>]*>\s*GECKO CABANE\s*<\/p>/)
    expect(home).not.toMatch(/<h1[^>]*>\s*GECKO CABANE/)
  })
})

describe('one h1 per public page (ONP-10)', () => {
  const dirs: string[] = []
  const walk = (d: string) => {
    for (const name of readdirSync(join(root, d))) {
      const rel = `${d}/${name}`
      if (statSync(join(root, rel)).isDirectory()) walk(rel)
      else if (name === 'page.tsx') dirs.push(rel)
    }
  }
  walk('src/app/[locale]')

  it('finds the public pages', () => {
    expect(dirs.length).toBeGreaterThanOrEqual(12)
  })

  it('every public page has exactly one h1 in its source, or delegates to SeoLandingPage / UtilityCard (one h1 each)', () => {
    for (const c of ['src/components/seo/SeoLandingPage.tsx', 'src/components/ui/UtilityCard.tsx']) {
      expect(count(read(c), /<h1[\s>]/g), c).toBe(1)
    }
    for (const rel of dirs) {
      const src = read(rel)
      const own = count(src, /<h1[\s>]/g)
      const delegates = /SeoLandingPage|UtilityCard/.test(src)
      expect(own + (delegates ? 1 : 0), rel).toBeGreaterThanOrEqual(1)
      expect(own, `${rel} must not declare several h1`).toBeLessThanOrEqual(1)
    }
  })
})
