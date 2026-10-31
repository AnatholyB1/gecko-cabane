/**
 * MENU-01 : logique pure de l'écran « Carte » (src/components/admin/menu/menu-logic.ts).
 * Format ฿, lecture des prix, réordonnancement par flèches, édition optimiste avec retour arrière,
 * recherche, charges utiles des routes.
 */
import { describe, expect, it } from 'vitest'
import type { MenuCategory, MenuItem, MenuPage } from '../src/types/database'
import {
  addCategory,
  addItem,
  categoryCountLabel,
  countItems,
  filterCategories,
  formatBaht,
  isPriceDirty,
  itemCreateBody,
  itemToForm,
  itemUpdateBody,
  moveInList,
  parsePriceInput,
  patchItem,
  pluralPlats,
  priceToInput,
  readableError,
  removeCategory,
  removeItem,
  reorderBody,
  runOptimistic,
  sameForm,
  setCategoryItems,
  slugify,
  withOrder,
} from '../src/components/admin/menu/menu-logic'

const T = '2026-10-31T00:00:00Z'
const item = (id: number, name: string, extra: Partial<MenuItem> = {}): MenuItem => ({
  id,
  category_id: 1,
  name,
  description: null,
  price: 100 + id,
  price_label: null,
  image_url: null,
  is_available: true,
  is_vegetarian: false,
  is_spicy: false,
  is_gluten_free: false,
  allergens: null,
  display_order: id,
  created_at: T,
  updated_at: T,
  ...extra,
})
const cat = (id: number, name: string, items: MenuItem[]): MenuCategory => ({
  id,
  menu_page_id: 1,
  name,
  description: null,
  display_order: id,
  created_at: T,
  updated_at: T,
  items,
})
const tree = (): MenuPage[] => [
  {
    id: 1,
    name: 'Déjeuner',
    slug: 'dejeuner',
    description: null,
    is_active: true,
    display_order: 0,
    created_at: T,
    updated_at: T,
    categories: [
      cat(1, 'Entrées', [item(1, 'Nems de crevettes'), item(2, 'Tom Kha Gai', { is_available: false })]),
      cat(2, 'Desserts', [item(3, 'Riz gluant à la mangue', { description: 'Lait de coco, sésame' })]),
    ],
  },
]

describe('format ฿ (identique au site public)', () => {
  it('formate en bahts sans décimales superflues', () => {
    expect(formatBaht(395)).toBe('395 ฿')
    expect(formatBaht('650')).toBe('650 ฿')
    expect(formatBaht(1200)).toBe('1,200 ฿')
    expect(formatBaht(12.5)).toBe('12.5 ฿')
  })
  it('aucun prix = rien', () => {
    expect(formatBaht(null)).toBeNull()
    expect(formatBaht('')).toBeNull()
  })
  it('ne contient jamais le symbole euro', () => {
    expect(formatBaht(350)).not.toContain('€')
  })
  it('priceToInput : valeur brute du champ', () => {
    expect(priceToInput(350)).toBe('350')
    expect(priceToInput('12.50')).toBe('12.5')
    expect(priceToInput(null)).toBe('')
  })
})

describe('lecture de la saisie du prix', () => {
  it('accepte entier, virgule, espaces, symbole ฿', () => {
    expect(parsePriceInput('350')).toEqual({ ok: true, value: 350 })
    expect(parsePriceInput('350,5')).toEqual({ ok: true, value: 350.5 })
    expect(parsePriceInput('1 200')).toEqual({ ok: true, value: 1200 })
    expect(parsePriceInput(' 395 ฿ ')).toEqual({ ok: true, value: 395 })
  })
  it('vide = aucun prix', () => {
    expect(parsePriceInput('')).toEqual({ ok: true, value: null })
    expect(parsePriceInput('   ')).toEqual({ ok: true, value: null })
  })
  it('refuse texte, négatif, trop de décimales, trop grand, avec un message lisible', () => {
    for (const bad of ['abc', '12abc', '1.234', '1.2.3', '-5', '1e3']) {
      const r = parsePriceInput(bad)
      expect(r.ok, bad).toBe(false)
      if (!r.ok) expect(r.error).toMatch(/\.$/)
    }
    expect(parsePriceInput('2000000').ok).toBe(false)
  })
  it('isPriceDirty compare à la valeur enregistrée', () => {
    expect(isPriceDirty(null, 350)).toBe(false)
    expect(isPriceDirty('350', 350)).toBe(false)
    expect(isPriceDirty('350,0', '350')).toBe(false)
    expect(isPriceDirty('395', 350)).toBe(true)
    expect(isPriceDirty('abc', 350)).toBe(true)
    expect(isPriceDirty('', 350)).toBe(true)
    expect(isPriceDirty('', null)).toBe(false)
  })
})

describe('réordonnancement par flèches', () => {
  it('déplace d’un cran vers le haut ou le bas', () => {
    expect(moveInList(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c'])
    expect(moveInList(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b'])
  })
  it('refuse les déplacements hors limites et ne modifie pas la liste d’origine', () => {
    const list = ['a', 'b', 'c']
    expect(moveInList(list, 0, -1)).toBeNull()
    expect(moveInList(list, 2, 1)).toBeNull()
    expect(moveInList(list, 5, -1)).toBeNull()
    moveInList(list, 1, 1)
    expect(list).toEqual(['a', 'b', 'c'])
  })
  it('corps du POST /api/menu/reorder : rangs 0 à n-1 dans le nouvel ordre', () => {
    const moved = moveInList([{ id: 10 }, { id: 20 }, { id: 30 }], 2, -1)!
    expect(reorderBody('items', moved)).toEqual({
      type: 'items',
      items: [
        { id: 10, display_order: 0 },
        { id: 30, display_order: 1 },
        { id: 20, display_order: 2 },
      ],
    })
  })
  it('withOrder aligne display_order sur le rang', () => {
    const out = withOrder([item(5, 'x', { display_order: 9 }), item(6, 'y', { display_order: 3 })])
    expect(out.map((i) => i.display_order)).toEqual([0, 1])
  })
})

describe('transformations de l’arbre (immuables)', () => {
  it('patchItem change un seul plat sans toucher l’original', () => {
    const before = tree()
    const after = patchItem(before, 1, { is_available: false })
    expect(after[0].categories![0].items![0].is_available).toBe(false)
    expect(before[0].categories![0].items![0].is_available).toBe(true)
    expect(after[0].categories![0].items![1]).toBe(before[0].categories![0].items![1])
  })
  it('ajout et suppression d’un plat, d’une catégorie', () => {
    let pages = addItem(tree(), item(9, 'Nouveau', { category_id: 2 }))
    expect(pages[0].categories![1].items!.map((i) => i.id)).toEqual([3, 9])
    pages = removeItem(pages, 9)
    expect(pages[0].categories![1].items!.map((i) => i.id)).toEqual([3])
    pages = addCategory(pages, { ...cat(7, 'Boissons', []), items: undefined })
    expect(pages[0].categories!.map((c) => c.id)).toEqual([1, 2, 7])
    expect(pages[0].categories![2].items).toEqual([])
    expect(removeCategory(pages, 1)[0].categories!.map((c) => c.id)).toEqual([2, 7])
  })
  it('compteurs et libellés', () => {
    const t = tree()
    expect(countItems(t[0].categories)).toEqual({ total: 3, unavailable: 1 })
    expect(categoryCountLabel(t[0].categories![0].items!)).toBe('2 plats · 1 indisponible')
    expect(categoryCountLabel(t[0].categories![1].items!)).toBe('1 plat')
    expect(pluralPlats(0)).toBe('0 plat')
  })
})

describe('édition optimiste avec retour arrière', () => {
  function harness(initial: MenuPage[]) {
    const state = { pages: initial, history: [] as MenuPage[][] }
    const update = (fn: (s: MenuPage[]) => MenuPage[]) => {
      state.pages = fn(state.pages)
      state.history.push(state.pages)
    }
    return { state, update }
  }

  it('succès : l’état est modifié avant la réponse et conservé', async () => {
    const h = harness(tree())
    let seenDuringRequest: boolean | undefined
    const r = await runOptimistic({
      update: h.update,
      forward: (s) => patchItem(s, 1, { is_available: false }),
      backward: (s) => patchItem(s, 1, { is_available: true }),
      request: async () => {
        seenDuringRequest = h.state.pages[0].categories![0].items![0].is_available
      },
    })
    expect(r).toEqual({ ok: true })
    expect(seenDuringRequest).toBe(false) // optimiste : visible AVANT la fin de la requête
    expect(h.state.pages[0].categories![0].items![0].is_available).toBe(false)
  })

  it('échec : retour arrière exact et erreur rendue', async () => {
    const h = harness(tree())
    const boom = Object.assign(new Error('x'), { status: 500 })
    const r = await runOptimistic({
      update: h.update,
      forward: (s) => patchItem(s, 1, { is_available: false }),
      backward: (s) => patchItem(s, 1, { is_available: true }),
      request: async () => {
        throw boom
      },
    })
    expect(r).toEqual({ ok: false, error: boom })
    expect(h.state.pages[0].categories![0].items![0].is_available).toBe(true)
    expect(h.state.history).toHaveLength(2) // avance puis recul
  })

  it('le retour arrière n’écrase pas une autre modification faite pendant la requête', async () => {
    const h = harness(tree())
    const r = await runOptimistic({
      update: h.update,
      forward: (s) => patchItem(s, 1, { is_available: false }),
      backward: (s) => patchItem(s, 1, { is_available: true }),
      request: async () => {
        h.update((s) => patchItem(s, 3, { is_available: false })) // autre plat modifié entre-temps
        throw new Error('réseau')
      },
    })
    expect(r.ok).toBe(false)
    const items = h.state.pages[0].categories!.flatMap((c) => c.items!)
    expect(items.find((i) => i.id === 1)!.is_available).toBe(true) // annulé
    expect(items.find((i) => i.id === 3)!.is_available).toBe(false) // conservé
  })

  it('réordonnancement : une liste déplacée est restaurée si la requête échoue', async () => {
    const h = harness(tree())
    const before = h.state.pages[0].categories![0].items!
    const moved = withOrder(moveInList(before, 0, 1)!)
    const r = await runOptimistic({
      update: h.update,
      forward: (s) => setCategoryItems(s, 1, moved),
      backward: (s) => setCategoryItems(s, 1, before),
      request: async () => {
        throw new Error('réseau')
      },
    })
    expect(r.ok).toBe(false)
    expect(h.state.pages[0].categories![0].items!.map((i) => i.id)).toEqual([1, 2])
    expect(moved.map((i) => i.id)).toEqual([2, 1])
  })
})

describe('erreurs lisibles', () => {
  it('jamais de code HTTP ni de texte technique', () => {
    for (const status of [0, 401, 403, 400, 422, 500, 503]) {
      const msg = readableError(Object.assign(new Error('Internal server error'), { status }))
      expect(msg).not.toMatch(/\b(4\d\d|5\d\d)\b/)
      expect(msg).not.toMatch(/Internal server error|stack/i)
      expect(msg.endsWith('.')).toBe(true)
    }
    expect(readableError(new Error('boom'))).toMatch(/serveur/)
  })
})

describe('recherche', () => {
  it('insensible à la casse et aux accents, sur le nom et la description', () => {
    const c = tree()[0].categories!
    expect(filterCategories(c, 'RIZ').map((x) => x.name)).toEqual(['Desserts'])
    expect(filterCategories(c, 'entree').length).toBe(0) // le nom de catégorie n’est pas cherché
    expect(filterCategories(c, 'sesame').map((x) => x.id)).toEqual([2])
    expect(filterCategories(c, 'tom kha')[0].items!.map((i) => i.id)).toEqual([2])
  })
  it('recherche vide = tout, sans copie', () => {
    const c = tree()[0].categories!
    expect(filterCategories(c, '  ')).toBe(c)
  })
  it('aucun résultat = liste vide', () => {
    expect(filterCategories(tree()[0].categories!, 'zzz')).toEqual([])
  })
})

describe('charges utiles des routes', () => {
  it('le formulaire Détails envoie is_gluten_free booléen et price_label', () => {
    const form = { ...itemToForm(item(1, 'Tom Kha Gai', { price_label: '350 / 520', is_gluten_free: true })) }
    const body = itemUpdateBody(1, form, 380)
    expect(body).toMatchObject({ id: 1, price: 380, price_label: '350 / 520', is_gluten_free: true })
    expect(typeof body.is_gluten_free).toBe('boolean')
  })
  it('un plat sans is_gluten_free (ancienne ligne) devient false, jamais undefined', () => {
    const legacy = { ...item(1, 'x') } as Partial<MenuItem>
    delete legacy.is_gluten_free
    expect(itemToForm(legacy as MenuItem).is_gluten_free).toBe(false)
  })
  it('ajout rapide : catégorie, nom rogné, prix, disponibilité', () => {
    expect(itemCreateBody(4, { name: '  Pad thaï ', is_available: true }, 340)).toEqual({
      category_id: 4,
      name: 'Pad thaï',
      price: 340,
      is_available: true,
    })
  })
  it('sameForm détecte une modification', () => {
    const a = itemToForm(item(1, 'x'))
    expect(sameForm(a, { ...a })).toBe(true)
    expect(sameForm(a, { ...a, allergens: 'lait' })).toBe(false)
  })
  it('slugify : adresse d’une page', () => {
    expect(slugify('Carte du midi')).toBe('carte-du-midi')
    expect(slugify('Déjeuner & Dîner !')).toBe('dejeuner-diner')
  })
})
