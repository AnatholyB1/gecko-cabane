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

  // Phase 14 : l'écran unique de la carte vit dans src/components/admin/menu/. Mêmes assertions qu'avant sur
  // la charge utile et le libellé figé, désormais lues dans les fichiers qui les portent.
  it('admin screen has the checkbox and sends the flag', () => {
    const logic = read('src/components/admin/menu/menu-logic.ts')
    const sheet = read('src/components/admin/menu/ItemSheet.tsx')
    expect(logic).toContain('is_gluten_free: itemForm.is_gluten_free')
    expect(logic).toContain('item.is_gluten_free ?? false')
    expect(sheet).toContain('Sans gluten (confirmé par la cheffe)')
    // la feuille Détails utilise bien ces deux fonctions (la charge utile n'est pas du code mort)
    expect(sheet).toContain('itemToForm(item)')
    expect(sheet).toContain('data.updateItem(item.id, itemForm')
    expect(sheet).toContain('checked={itemForm.is_gluten_free}')
  })

  it('les deux adresses de la carte rendent le même écran unique', () => {
    expect(read('src/app/admin/(app)/menu/page.tsx')).toContain('<MenuScreen />')
    expect(read('src/app/admin/(app)/menu/[pageId]/page.tsx')).toContain('<MenuScreen initialPageId=')
  })
})
