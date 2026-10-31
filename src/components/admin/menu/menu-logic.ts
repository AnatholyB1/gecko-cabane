/**
 * Logique pure de l'écran « Carte » (MENU-01), sans React ni réseau : testée par
 * tests/menu-screen-logic.test.ts.
 *
 * - format et lecture des prix en bahts (฿) ;
 * - réordonnancement par flèches haut/bas (même API /api/menu/reorder) ;
 * - transformations immuables de l'arbre pages > catégories > plats ;
 * - édition optimiste avec retour arrière (`runOptimistic`) ;
 * - recherche, compteurs, charges utiles envoyées aux routes menu.
 */
import { formatPrice } from '@/utils/menu'
import type { MenuCategory, MenuItem, MenuPage } from '@/types/database'

// ---------------------------------------------------------------------------
// Prix (bahts)
// ---------------------------------------------------------------------------

/** « 650 ฿ », « 1,200 ฿ » : le même format que le site public (src/utils/menu.ts). */
export const formatBaht = formatPrice

/** Valeur affichée dans le champ de prix : « 350 », « 12.5 », vide si aucun prix. */
export function priceToInput(price: number | string | null | undefined): string {
  if (price === null || price === undefined || price === '') return ''
  const n = Number(price)
  return Number.isFinite(n) ? String(n) : ''
}

export type PriceParse = { ok: true; value: number | null } | { ok: false; error: string }

export const PRICE_MAX = 999999.99

/** Saisie du clavier -> prix. Vide = aucun prix. Accepte « 350 », « 350,5 », « 1 200 », « 350 ฿ ». */
export function parsePriceInput(raw: string): PriceParse {
  const cleaned = raw.replace(/[\s  ]/g, '').replace(/฿/g, '').replace(',', '.')
  if (cleaned === '') return { ok: true, value: null }
  if (cleaned.startsWith('-')) return { ok: false, error: 'Le prix ne peut pas être négatif.' }
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return { ok: false, error: 'Entrez un prix en bahts, par exemple 350.' }
  const value = Number(cleaned)
  if (value > PRICE_MAX) return { ok: false, error: 'Ce prix est trop élevé.' }
  return { ok: true, value }
}

/** Un champ de prix est « modifié » quand sa saisie diffère de la valeur enregistrée. */
export function isPriceDirty(draft: string | null, saved: number | string | null | undefined): boolean {
  if (draft === null) return false
  const p = parsePriceInput(draft)
  if (!p.ok) return true
  const current = saved === null || saved === undefined || saved === '' ? null : Number(saved)
  return p.value !== current
}

// ---------------------------------------------------------------------------
// Libellés
// ---------------------------------------------------------------------------

export function pluralPlats(n: number): string {
  return `${n} plat${n > 1 ? 's' : ''}`
}

export function pluralIndisponibles(n: number): string {
  return `${n} indisponible${n > 1 ? 's' : ''}`
}

/** « 4 plats · 1 indisponible » (en-tête de catégorie). */
export function categoryCountLabel(items: MenuItem[]): string {
  const off = items.filter((i) => !i.is_available).length
  return off > 0 ? `${pluralPlats(items.length)} · ${pluralIndisponibles(off)}` : pluralPlats(items.length)
}

export function countItems(categories: MenuCategory[] | undefined): { total: number; unavailable: number } {
  let total = 0
  let unavailable = 0
  for (const c of categories ?? []) {
    for (const i of c.items ?? []) {
      total += 1
      if (!i.is_available) unavailable += 1
    }
  }
  return { total, unavailable }
}

/** Adresse d'une page de carte à partir de son nom (« Carte du midi » -> « carte-du-midi »). */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ---------------------------------------------------------------------------
// Recherche
// ---------------------------------------------------------------------------

export function normalizeSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function itemMatches(item: MenuItem, query: string): boolean {
  const q = normalizeSearch(query)
  if (q === '') return true
  return normalizeSearch(`${item.name} ${item.description ?? ''}`).includes(q)
}

/** Catégories ne gardant que les plats qui correspondent (les catégories vides sont retirées si une recherche est active). */
export function filterCategories(categories: MenuCategory[], query: string): MenuCategory[] {
  if (normalizeSearch(query) === '') return categories
  return categories
    .map((c) => ({ ...c, items: (c.items ?? []).filter((i) => itemMatches(i, query)) }))
    .filter((c) => (c.items ?? []).length > 0)
}

// ---------------------------------------------------------------------------
// Réordonnancement (flèches haut / bas)
// ---------------------------------------------------------------------------

/** Déplace l'élément d'un cran (-1 vers le haut, +1 vers le bas). `null` si le déplacement est impossible. */
export function moveInList<T>(list: readonly T[], index: number, dir: -1 | 1): T[] | null {
  const target = index + dir
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return null
  const next = list.slice()
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  return next
}

export type ReorderType = 'pages' | 'categories' | 'items'

/** Corps du POST /api/menu/reorder : l'ordre de la liste entière, de 0 à n-1. */
export function reorderBody(type: ReorderType, list: readonly { id: number }[]) {
  return { type, items: list.map((x, i) => ({ id: x.id, display_order: i })) }
}

/** Réapplique `display_order` = rang dans la liste (garde l'état local aligné sur ce qui est envoyé). */
export function withOrder<T extends { display_order: number }>(list: readonly T[]): T[] {
  return list.map((x, i) => ({ ...x, display_order: i }))
}

// ---------------------------------------------------------------------------
// Transformations immuables de l'arbre
// ---------------------------------------------------------------------------

type Pages = MenuPage[]

export function mapCategories(pages: Pages, fn: (c: MenuCategory) => MenuCategory): Pages {
  return pages.map((p) => ({ ...p, categories: (p.categories ?? []).map(fn) }))
}

export function findItem(pages: Pages, itemId: number): MenuItem | undefined {
  for (const p of pages) for (const c of p.categories ?? []) for (const i of c.items ?? []) if (i.id === itemId) return i
  return undefined
}

export function patchItem(pages: Pages, itemId: number, patch: Partial<MenuItem>): Pages {
  return mapCategories(pages, (c) =>
    (c.items ?? []).some((i) => i.id === itemId)
      ? { ...c, items: (c.items ?? []).map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
      : c,
  )
}

export function setCategoryItems(pages: Pages, categoryId: number, items: MenuItem[]): Pages {
  return mapCategories(pages, (c) => (c.id === categoryId ? { ...c, items } : c))
}

export function setPageCategories(pages: Pages, pageId: number, categories: MenuCategory[]): Pages {
  return pages.map((p) => (p.id === pageId ? { ...p, categories } : p))
}

export function addItem(pages: Pages, item: MenuItem): Pages {
  return mapCategories(pages, (c) => (c.id === item.category_id ? { ...c, items: [...(c.items ?? []), item] } : c))
}

export function removeItem(pages: Pages, itemId: number): Pages {
  return mapCategories(pages, (c) => ({ ...c, items: (c.items ?? []).filter((i) => i.id !== itemId) }))
}

export function addCategory(pages: Pages, category: MenuCategory): Pages {
  return pages.map((p) =>
    p.id === category.menu_page_id ? { ...p, categories: [...(p.categories ?? []), { ...category, items: category.items ?? [] }] } : p,
  )
}

export function patchCategory(pages: Pages, categoryId: number, patch: Partial<MenuCategory>): Pages {
  return mapCategories(pages, (c) => (c.id === categoryId ? { ...c, ...patch } : c))
}

export function removeCategory(pages: Pages, categoryId: number): Pages {
  return pages.map((p) => ({ ...p, categories: (p.categories ?? []).filter((c) => c.id !== categoryId) }))
}

export function patchPage(pages: Pages, pageId: number, patch: Partial<MenuPage>): Pages {
  return pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p))
}

export function removePage(pages: Pages, pageId: number): Pages {
  return pages.filter((p) => p.id !== pageId)
}

// ---------------------------------------------------------------------------
// Édition optimiste avec retour arrière
// ---------------------------------------------------------------------------

/**
 * Applique tout de suite `forward` à l'état, lance la requête, et applique `backward` si elle échoue.
 * `backward` est l'inverse PRÉCIS de `forward` (pas une restauration d'instantané) : une autre
 * modification faite entre-temps sur un autre plat n'est jamais écrasée.
 */
export async function runOptimistic<S>(opts: {
  update: (fn: (s: S) => S) => void
  forward: (s: S) => S
  backward: (s: S) => S
  request: () => Promise<unknown>
}): Promise<{ ok: true } | { ok: false; error: unknown }> {
  opts.update(opts.forward)
  try {
    await opts.request()
    return { ok: true }
  } catch (error) {
    opts.update(opts.backward)
    return { ok: false, error }
  }
}

// ---------------------------------------------------------------------------
// Erreurs lisibles (jamais de code HTTP ni de texte technique)
// ---------------------------------------------------------------------------

export function readableError(e: unknown): string {
  const status = typeof e === 'object' && e !== null ? (e as { status?: unknown }).status : undefined
  if (status === 0) return 'Connexion perdue. Vérifiez le réseau, puis réessayez.'
  if (status === 401) return 'Session expirée. Reconnectez-vous, puis réessayez.'
  if (status === 403) return 'Ce compte n’a pas le droit de modifier la carte.'
  if (typeof status === 'number' && status >= 400 && status < 500) return 'Le serveur a refusé cette modification.'
  return 'Le serveur a rencontré un problème. Réessayez dans un instant.'
}

// ---------------------------------------------------------------------------
// Charges utiles des routes /api/menu/*
// ---------------------------------------------------------------------------

export type ItemForm = {
  name: string
  description: string
  price: string
  price_label: string
  image_url: string
  is_available: boolean
  is_vegetarian: boolean
  is_spicy: boolean
  is_gluten_free: boolean
  allergens: string
}

export const EMPTY_ITEM_FORM: ItemForm = {
  name: '',
  description: '',
  price: '',
  price_label: '',
  image_url: '',
  is_available: true,
  is_vegetarian: false,
  is_spicy: false,
  is_gluten_free: false,
  allergens: '',
}

export function itemToForm(item: MenuItem): ItemForm {
  return {
    name: item.name,
    description: item.description || '',
    price: priceToInput(item.price),
    price_label: item.price_label || '',
    image_url: item.image_url || '',
    is_available: item.is_available,
    is_vegetarian: item.is_vegetarian,
    is_spicy: item.is_spicy,
    is_gluten_free: item.is_gluten_free ?? false,
    allergens: item.allergens || '',
  }
}

export function sameForm(a: ItemForm, b: ItemForm): boolean {
  return (Object.keys(a) as (keyof ItemForm)[]).every((k) => a[k] === b[k])
}

/** Corps du PUT /api/menu/items (modification complète depuis « Détails »). */
export function itemUpdateBody(id: number, itemForm: ItemForm, price: number | null) {
  return {
    id,
    name: itemForm.name.trim(),
    description: itemForm.description || null,
    price,
    price_label: itemForm.price_label || null,
    image_url: itemForm.image_url || null,
    is_available: itemForm.is_available,
    is_vegetarian: itemForm.is_vegetarian,
    is_spicy: itemForm.is_spicy,
    is_gluten_free: itemForm.is_gluten_free,
    allergens: itemForm.allergens || null,
  }
}

/** Corps du POST /api/menu/items (ajout rapide : catégorie, nom, prix, disponibilité). */
export function itemCreateBody(categoryId: number, form: Pick<ItemForm, 'name' | 'is_available'>, price: number | null) {
  return { category_id: categoryId, name: form.name.trim(), price, is_available: form.is_available }
}
