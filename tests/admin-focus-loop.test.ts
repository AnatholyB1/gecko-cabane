/**
 * QA-02 : la boucle de focus des dialogues modaux. Logique pure (sans DOM) + câblage dans les 3 familles de dialogues.
 * La mesure navigateur (0 arrêt hors dialogue sur 36 Tab) est consignée dans 17c-VERIFICATION.md.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { nextTabTarget, trapTab } from '../src/components/admin/focus-loop'

const root = join(__dirname, '..')
const el = (name: string) => ({ name }) as unknown as HTMLElement

describe('nextTabTarget', () => {
  const a = el('a')
  const b = el('b')
  const c = el('c')
  const items = [a, b, c]
  it('Tab sur le dernier revient au premier ; au milieu, le Tab natif suffit', () => {
    expect(nextTabTarget(items, c as unknown as Element, false)).toBe(a)
    expect(nextTabTarget(items, b as unknown as Element, false)).toBeNull()
  })
  it('Maj+Tab sur le premier va au dernier', () => {
    expect(nextTabTarget(items, a as unknown as Element, true)).toBe(c)
    expect(nextTabTarget(items, b as unknown as Element, true)).toBeNull()
  })
  it('un focus hors de la liste (garde, document) est ramené dans le dialogue', () => {
    expect(nextTabTarget(items, null, false)).toBe(a)
    expect(nextTabTarget(items, el('guard') as unknown as Element, false)).toBe(a)
    expect(nextTabTarget(items, el('guard') as unknown as Element, true)).toBe(c)
  })
  it('liste vide : rien à faire', () => {
    expect(nextTabTarget([], null, false)).toBeNull()
  })
})

describe('trapTab', () => {
  it('ignore les autres touches et les combinaisons', () => {
    const preventDefault = vi.fn()
    const root = { ownerDocument: { activeElement: null }, querySelectorAll: () => [] } as unknown as HTMLElement
    trapTab({ key: 'Enter', shiftKey: false, preventDefault }, root)
    trapTab({ key: 'Tab', shiftKey: false, ctrlKey: true, preventDefault }, root)
    expect(preventDefault).not.toHaveBeenCalled()
  })
})

describe('câblage', () => {
  it.each([
    ['src/components/admin/ConfirmDialog.tsx', 'AlertDialog.Popup'],
    ['src/components/admin/menu/Sheet.tsx', 'Dialog.Popup'],
    ['src/components/admin/reservations/NewReservation.tsx', 'Dialog.Popup'],
  ])('%s boucle le focus', (file, popup) => {
    const src = readFileSync(join(root, file), 'utf8')
    expect(src).toContain('trapTab(e, e.currentTarget)')
    expect(src).toContain(`<${popup}`)
  })
})
