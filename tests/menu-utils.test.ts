/**
 * Unit tests for the menu data helpers (plan 03-01): formatPrice, assembleMenu, hasGlutenFree,
 * plus a source scan of the cached anon read.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { formatPrice, assembleMenu, hasGlutenFree } from '../src/utils/menu'
import type { MenuPage, MenuCategory, MenuItem } from '../src/types/database'

// -----------------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------------

const ts = '2026-01-01T00:00:00Z'

const page = (id: number, order: number, active = true): MenuPage => ({
  id, name: `Page ${id}`, slug: `page-${id}`, description: null,
  is_active: active, display_order: order, created_at: ts, updated_at: ts,
})
const cat = (id: number, pageId: number, order: number): MenuCategory => ({
  id, menu_page_id: pageId, name: `Cat ${id}`, description: null,
  display_order: order, created_at: ts, updated_at: ts,
})
const item = (id: number, catId: number, order: number, extra: Partial<MenuItem> = {}): MenuItem => ({
  id, category_id: catId, name: `Item ${id}`, description: null, price: 100, price_label: null,
  image_url: null, is_available: true, is_vegetarian: false, is_spicy: false, allergens: null,
  display_order: order, created_at: ts, updated_at: ts, ...extra,
})

// -----------------------------------------------------------------------------
// formatPrice
// -----------------------------------------------------------------------------

describe('formatPrice', () => {
  it('formats baht without trailing .00', () => {
    expect(formatPrice(650)).toBe('650 ฿')
    expect(formatPrice('650.00')).toBe('650 ฿')
    expect(formatPrice(1200)).toBe('1,200 ฿')
    expect(formatPrice(89.5)).toBe('89.5 ฿')
  })
  it('returns null for missing or invalid prices', () => {
    expect(formatPrice(null)).toBeNull()
    expect(formatPrice(undefined)).toBeNull()
    expect(formatPrice('')).toBeNull()
    expect(formatPrice('abc')).toBeNull()
  })
})

// -----------------------------------------------------------------------------
// assembleMenu
// -----------------------------------------------------------------------------

describe('assembleMenu', () => {
  const pages = [page(2, 2), page(1, 1), page(3, 3, false), page(4, 4)]
  const categories = [cat(10, 1, 2), cat(11, 1, 1), cat(12, 2, 1), cat(13, 3, 1), cat(14, 99, 1)]
  const items = [
    item(100, 10, 1),
    item(101, 11, 2),
    item(102, 11, 1),
    item(103, 11, 3, { is_available: false }),
    item(104, 12, 1),
    item(105, 13, 1),
    item(106, 777, 1),
  ]
  const menu = assembleMenu(pages, categories, items)

  it('keeps active pages sorted by display_order and drops empty pages', () => {
    expect(menu.map((p) => p.id)).toEqual([1, 2])
  })
  it('sorts categories and items, drops unavailable and orphan items', () => {
    expect(menu[0].categories.map((c) => c.id)).toEqual([11, 10])
    expect(menu[0].categories[0].items.map((i) => i.id)).toEqual([102, 101])
  })
  it('drops empty categories and categories of unknown pages', () => {
    const ids = menu.flatMap((p) => p.categories.map((c) => c.id))
    expect(ids).not.toContain(14)
    expect(ids).not.toContain(13)
  })
})

// -----------------------------------------------------------------------------
// hasGlutenFree
// -----------------------------------------------------------------------------

describe('hasGlutenFree', () => {
  const base = [page(1, 1)]
  const cats = [cat(1, 1, 1)]
  it('is false when no item is flagged or the field is undefined', () => {
    expect(hasGlutenFree(assembleMenu(base, cats, [item(1, 1, 1)]))).toBe(false)
    expect(hasGlutenFree(assembleMenu(base, cats, [item(1, 1, 1, { is_gluten_free: false })]))).toBe(false)
  })
  it('is true when at least one item is flagged', () => {
    const m = assembleMenu(base, cats, [item(1, 1, 1), item(2, 1, 2, { is_gluten_free: true })])
    expect(hasGlutenFree(m)).toBe(true)
  })
})

// -----------------------------------------------------------------------------
// Source scan
// -----------------------------------------------------------------------------

describe('menu cache source', () => {
  const src = readFileSync(join(__dirname, '..', 'src/utils/menu.ts'), 'utf8')
  it('uses a tagged unstable_cache with a cookie-free anon client', () => {
    expect(src).toContain("export const MENU_TAG = 'menu'")
    expect(src).toContain('unstable_cache')
    expect(src).toContain('persistSession: false')
    expect(src).toContain('revalidate: 3600')
    expect(src).toContain('tags: [MENU_TAG]')
  })
  it('never uses cookies or the service role', () => {
    expect(src).not.toContain('utils/supabase/server')
    expect(src).not.toContain('SERVICE_ROLE')
    expect(src).not.toContain('createAdminClient')
    expect(src).not.toContain('cookies(')
  })
})
