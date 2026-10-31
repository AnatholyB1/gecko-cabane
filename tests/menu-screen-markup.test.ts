/**
 * MENU-01 : balisage et règles de source de l'écran « Carte » (rendu statique, sans navigateur).
 * Le comportement (clavier, toast, échec simulé, tailles) est prouvé en navigateur : 14-VERIFICATION.md.
 */
import { describe, expect, it } from 'vitest'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { MenuItem } from '../src/types/database'
import { Switch } from '../src/components/admin/menu/Switch'
import { ItemRow } from '../src/components/admin/menu/ItemRow'
import type { MenuData } from '../src/components/admin/menu/useMenuData'

const dir = join(__dirname, '..', 'src', 'components', 'admin', 'menu')
const sources = readdirSync(dir)
  .filter((f) => /\.(tsx?|css)$/.test(f))
  .map((f) => [f, readFileSync(join(dir, f), 'utf8')] as const)

const item = (extra: Partial<MenuItem> = {}): MenuItem => ({
  id: 7,
  category_id: 1,
  name: 'Tom Kha Gai',
  description: 'Poulet, lait de coco',
  price: 380,
  price_label: null,
  image_url: null,
  is_available: true,
  is_vegetarian: false,
  is_spicy: true,
  is_gluten_free: true,
  allergens: 'lait',
  display_order: 0,
  created_at: '',
  updated_at: '',
  ...extra,
})

const row = (it: MenuItem, reorder?: { canUp: boolean; canDown: boolean; busy?: boolean }) =>
  renderToStaticMarkup(h(ItemRow, { item: it, data: {} as MenuData, reorder, onDetails: () => {}, onMove: () => {} }))

describe('Switch Disponible / Indisponible', () => {
  it('role=switch, état ET mot (jamais la couleur seule)', () => {
    const on = renderToStaticMarkup(h(Switch, { checked: true, onChange: () => {}, label: 'X', onText: 'Disponible', offText: 'Indisponible' }))
    expect(on).toContain('role="switch"')
    expect(on).toContain('aria-checked="true"')
    expect(on).toContain('aria-label="Disponible, X"')
    expect(on).toContain('>Disponible<')
    const off = renderToStaticMarkup(h(Switch, { checked: false, onChange: () => {}, label: 'x', onText: 'Disponible', offText: 'Indisponible' }))
    expect(off).toContain('aria-checked="false"')
    expect(off).toContain('>Indisponible<')
  })
  it('occupé : aria-busy', () => {
    expect(renderToStaticMarkup(h(Switch, { checked: true, busy: true, onChange: () => {}, label: 'x', onText: 'a', offText: 'b' }))).toContain('aria-busy="true"')
  })
})

describe('ligne de plat', () => {
  it('prix en bahts : étiquette explicite, ฿, pas d’euro, valeur numérique', () => {
    const html = row(item())
    expect(html).toContain('Prix de Tom Kha Gai en bahts')
    expect(html).toContain('inputMode="decimal"')
    expect(html).toContain('value="380"')
    expect(html).toContain('฿')
    expect(html).not.toContain('€')
  })
  it('drapeaux en lecture seule + allergènes + bouton Détails nommé', () => {
    const html = row(item())
    expect(html).toContain('Épicé')
    expect(html).toContain('Sans gluten')
    expect(html).not.toContain('Végétarien')
    expect(html).toContain('Allergènes : lait')
    expect(html).toContain('aria-label="Détails de Tom Kha Gai"')
    expect(html).toContain('>Détails<')
  })
  it('indisponible : classe grisée et interrupteur « Indisponible »', () => {
    const html = row(item({ is_available: false }))
    expect(html).toContain('mn-item--off')
    expect(html).toContain('aria-checked="false"')
  })
  it('le libellé de prix alternatif (price_label) est conservé et visible', () => {
    expect(row(item({ price_label: '350 / 520' }))).toContain('350 / 520')
  })
  it('pas de valeur de prix : champ vide, aucune valeur inventée', () => {
    expect(row(item({ price: null }))).toContain('value=""')
  })
  it('mode Réorganiser : flèches nommées, désactivées aux extrémités', () => {
    const html = row(item(), { canUp: false, canDown: true })
    expect(html).toContain('aria-label="Monter Tom Kha Gai"')
    expect(html).toContain('aria-label="Descendre Tom Kha Gai"')
    expect(html).toMatch(/aria-label="Monter Tom Kha Gai"[^>]*disabled|disabled[^>]*aria-label="Monter Tom Kha Gai"/)
    expect(row(item())).not.toContain('Monter Tom Kha Gai')
  })
  it('réordonnancement en cours : flèches aria-disabled (le focus reste), sinon aucune', () => {
    const busy = row(item(), { canUp: true, canDown: true, busy: true })
    expect(busy.match(/aria-disabled="true"/g)?.length).toBeGreaterThanOrEqual(2)
    expect(busy).not.toMatch(/aria-label="Monter Tom Kha Gai"[^>]*[^-]disabled=""/)
    expect(row(item(), { canUp: true, canDown: true })).not.toContain('aria-disabled')
  })
})

describe('règles de source (D3 §1, §7, §8)', () => {
  it('aucun confirm() natif, aucun alert(), aucun emoji, aucun euro, aucun glisser-déposer', () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
    for (const [name, src] of sources) {
      expect(src, name).not.toMatch(/(?<![\w.$])(window\.)?confirm\(\s*['"`]/)
      expect(src, name).not.toMatch(/\balert\(/)
      expect(src, name).not.toMatch(emoji)
      expect(src, name).not.toContain('€')
      expect(src, name).not.toContain('draggable')
      expect(src, name).not.toContain('console.')
    }
  })
  it('les suppressions passent par useConfirm()', () => {
    const joined = sources.map(([, s]) => s).join('\n')
    expect((joined.match(/useConfirm\(\)/g) ?? []).length).toBeGreaterThanOrEqual(4)
    expect(joined).toContain('Supprimer ce plat ?')
    expect(joined).toContain('Fermer sans enregistrer ?')
  })
  it('le texte minimal est de 14 px (jamais en dessous) dans la feuille de style', () => {
    const css = sources.find(([n]) => n === 'menu.css')![1]
    const sizes = [...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]))
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(14)
  })
  it('toute écriture passe par les routes /api/menu/* existantes', () => {
    const src = sources.find(([n]) => n === 'useMenuData.ts')![1]
    const urls = [...src.matchAll(/'(\/api\/[^'?]*)|`(\/api\/[^`?]*)/g)].map((m) => m[1] ?? m[2])
    expect(urls.length).toBeGreaterThan(5)
    for (const u of urls) expect(u).toMatch(/^\/api\/menu\/(pages|categories|items|reorder|upload)$/)
    expect(src).not.toContain('supabase')
  })
})
