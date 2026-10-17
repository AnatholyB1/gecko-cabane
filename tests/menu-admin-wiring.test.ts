/**
 * Source-scan wiring checks for plan 03-03: menu admin writes revalidate the
 * 'menu' cache tag and the gluten-free flag is wired from admin to API.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const read = (p: string) => readFileSync(join(__dirname, '..', p), 'utf-8')
const count = (src: string, needle: string) => src.split(needle).length - 1

const ROUTES: Record<string, number> = {
  'src/app/api/menu/items/route.ts': 3,
  'src/app/api/menu/pages/route.ts': 3,
  'src/app/api/menu/categories/route.ts': 3,
  'src/app/api/menu/reorder/route.ts': 1,
}

describe('menu admin routes revalidate the menu tag', () => {
  for (const [file, expected] of Object.entries(ROUTES)) {
    it(`${file} revalidates after each mutating handler`, () => {
      const src = read(file)
      expect(src).toContain("import { revalidateTag } from 'next/cache'")
      expect(src).toContain("import { MENU_TAG } from '@/utils/menu'")
      expect(count(src, "revalidateTag(MENU_TAG, 'max')")).toBe(expected)
    })
  }
})

describe('is_gluten_free wiring', () => {
  it('items route whitelists and validates is_gluten_free', () => {
    const src = read('src/app/api/menu/items/route.ts')
    expect(src).toContain('is_gluten_free: is_gluten_free ?? false')
    expect(src).toContain('updateData.is_gluten_free = is_gluten_free')
    expect(count(src, "typeof is_gluten_free !== 'boolean'")).toBe(2)
    expect(src).toMatch(/is_gluten_free must be a boolean[\s\S]{0,40}status: 400/)
  })

  it('admin page has the checkbox and sends the flag', () => {
    const src = read('src/app/admin/menu/[pageId]/page.tsx')
    expect(src).toContain('is_gluten_free: itemForm.is_gluten_free')
    expect(src).toContain('item.is_gluten_free ?? false')
    expect(src).toContain('Sans gluten (confirmé par la cheffe)')
  })
})
