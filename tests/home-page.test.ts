/**
 * Tests for the home page (plan 03-04): menu teaser helper, source-scan wiring.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { pickTeaserItems, ARDOISE_SLUG } from '../src/utils/menu'
import type { MenuPageWithContent } from '../src/utils/menu'
import type { MenuItem } from '../src/types/database'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

// -----------------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------------

const ts = '2026-01-01T00:00:00Z'
const item = (id: number, catId: number, order: number): MenuItem => ({
  id, category_id: catId, name: `Item ${id}`, description: null, price: 100, price_label: null,
  image_url: null, is_available: true, is_vegetarian: false, is_spicy: false, allergens: null,
  display_order: order, created_at: ts, updated_at: ts,
})
const mkPage = (id: number, slug: string, cats: number[][]): MenuPageWithContent => ({
  id, name: `Page ${id}`, slug, description: null, is_active: true, display_order: id,
  created_at: ts, updated_at: ts,
  categories: cats.map((ids, ci) => ({
    id: id * 100 + ci, menu_page_id: id, name: `Cat ${ci}`, description: null,
    display_order: ci, created_at: ts, updated_at: ts,
    items: ids.map((n, k) => item(n, id * 100 + ci, k)),
  })),
})

// -----------------------------------------------------------------------------
// pickTeaserItems
// -----------------------------------------------------------------------------

describe('pickTeaserItems', () => {
  it('uses the ardoise page and caps at 4 in category then item order', () => {
    const menu = [mkPage(1, 'carte', [[1, 2]]), mkPage(2, ARDOISE_SLUG, [[10, 11, 12], [13, 14]])]
    expect(pickTeaserItems(menu, 4).map((i) => i.id)).toEqual([10, 11, 12, 13])
  })
  it('falls back to the first page when no ardoise', () => {
    const menu = [mkPage(1, 'carte', [[1, 2]]), mkPage(2, 'autre', [[5]])]
    expect(pickTeaserItems(menu).map((i) => i.id)).toEqual([1, 2])
  })
  it('returns [] for an empty menu', () => {
    expect(pickTeaserItems([])).toEqual([])
  })
})

// -----------------------------------------------------------------------------
// Source scans
// -----------------------------------------------------------------------------

describe('home menu teaser wiring', () => {
  const page = read('src/app/[locale]/page.tsx')
  it('page mounts MenuTeaser, not MenuDisplay', () => {
    expect(page).not.toContain('MenuDisplay')
    expect(page).toContain('<MenuTeaser')
    expect(page).toContain('id="menu"')
    expect(existsSync(join(root, 'src/components/MenuDisplay.tsx'))).toBe(false)
  })
  it('MenuTeaser is a server component linking to /menu', () => {
    const src = read('src/components/MenuTeaser.tsx')
    expect(src).not.toContain("'use client'")
    expect(src).toContain('getMenu()')
    expect(src).toContain('pickTeaserItems(')
    expect(src).toContain('formatPrice(')
    expect(src).toContain('href="/menu"')
  })
  it('seeFullMenu exists in fr and en', () => {
    for (const l of ['fr', 'en']) {
      const m = JSON.parse(read(`messages/${l}.json`))
      expect(m.menuSection.seeFullMenu).toBeTruthy()
    }
  })
})
