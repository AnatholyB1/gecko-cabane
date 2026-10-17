/**
 * Source-scan of the /menu page wiring (plan 03-01): server components, no hover-only
 * content, metadata, and i18n keys in fr and en.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const PAGE = 'src/app/[locale]/menu/page.tsx'

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

describe('/menu page', () => {
  it('exists', () => {
    expect(existsSync(join(root, PAGE))).toBe(true)
  })
  const src = existsSync(join(root, PAGE)) ? read(PAGE) : ''
  it('is a server component with metadata and a single h1', () => {
    expect(src).not.toContain("'use client'")
    expect(src).toContain('export async function generateMetadata')
    expect(src).toContain('localizedPageMetadata(')
    expect(src).toContain("key: '/menu'")
    expect(src).toContain('menuTitle')
    expect(src).toContain('menuDescription')
    expect(src).toContain('getMenu()')
    expect(src.split('<h1').length - 1).toBe(1)
  })
})

// -----------------------------------------------------------------------------
// Components
// -----------------------------------------------------------------------------

describe('menu components', () => {
  const read2 = (p: string) => (existsSync(join(root, p)) ? read(p) : '')
  const sections = read2('src/components/MenuSections.tsx')
  const nav = read2('src/components/MenuAnchorNav.tsx')

  for (const [name, src] of [['MenuSections', sections], ['MenuAnchorNav', nav]] as const) {
    it(`${name} is static server markup without hover-only content`, () => {
      expect(src.length).toBeGreaterThan(0)
      expect(src).not.toContain("'use client'")
      expect(src).not.toContain('useState')
      expect(src).not.toContain('opacity-0')
      expect(src).not.toContain('group-hover')
      expect(src).not.toContain('dangerouslySetInnerHTML')
    })
  }

  it('MenuSections renders prices, pictos, sections and allergens', () => {
    for (const needle of [
      'formatPrice(', 'sr-only', 'WheatOff', 'Leaf', 'Flame', 'hasGlutenFree(',
      '<section', 'scroll-mt-28', 'allergens',
    ]) {
      expect(sections).toContain(needle)
    }
  })
  it('MenuAnchorNav is a sticky labelled nav of plain anchors', () => {
    for (const needle of ['sticky', 'aria-label', 'href={`#${page.slug}`}']) {
      expect(nav).toContain(needle)
    }
  })
})

// -----------------------------------------------------------------------------
// Messages
// -----------------------------------------------------------------------------

describe('menu messages', () => {
  const fr = JSON.parse(read('messages/fr.json'))
  const en = JSON.parse(read('messages/en.json'))
  const keys = [
    'eyebrow', 'title', 'intro', 'legendTitle', 'allergyNote', 'allergensPrefix',
    'anchorNavLabel', 'backToTop', 'emptyTitle', 'emptyBody',
  ]
  const ACCENTED = /[àâäçéèêëîïôöùûüœÀÂÉÈÊËÎÏÔÙÛÜÇŒ]/

  for (const [label, m] of [['fr', fr], ['en', en]] as const) {
    it(`${label} has every menuPage key and shared keys`, () => {
      for (const k of keys) expect(typeof m.menuPage?.[k]).toBe('string')
      expect(typeof m.menuSection.glutenFree).toBe('string')
      expect(typeof m.common.reserveShort).toBe('string')
      expect(typeof m.meta.menuTitle).toBe('string')
      expect(typeof m.meta.menuDescription).toBe('string')
    })
    it(`${label} meta lengths and keywords`, () => {
      expect(m.meta.menuTitle.length).toBeGreaterThanOrEqual(40)
      expect(m.meta.menuTitle.length).toBeLessThanOrEqual(60)
      expect(m.meta.menuTitle).toContain('Gecko Cabane')
      expect(m.meta.menuTitle).toContain('Krabi')
      expect(m.meta.menuDescription.length).toBeGreaterThanOrEqual(120)
      expect(m.meta.menuDescription.length).toBeLessThanOrEqual(165)
    })
  }

  it('en values contain no French accents', () => {
    const values = [
      ...keys.map((k) => en.menuPage[k]),
      en.menuSection.glutenFree, en.common.reserveShort, en.meta.menuTitle, en.meta.menuDescription,
    ]
    for (const v of values) expect(ACCENTED.test(v)).toBe(false)
  })
})
