'use client'

import { useCallback, useState } from 'react'
import { adminFetch } from '../admin-fetch'
import { useAdminQuery } from '../use-admin-query'
import { useToast } from '../Toast'
import type { MenuCategory, MenuItem, MenuPage } from '@/types/database'
import {
  addCategory,
  addItem,
  formatBaht,
  itemCreateBody,
  itemUpdateBody,
  moveInList,
  patchCategory,
  patchItem,
  patchPage,
  readableError,
  removeCategory,
  removeItem,
  removePage,
  reorderBody,
  runOptimistic,
  setCategoryItems,
  setPageCategories,
  withOrder,
  type ItemForm,
} from './menu-logic'

/** Résultat d'une action : `message` est déjà lisible (affichable tel quel, sans code HTTP). */
export type ActionResult = { ok: true } | { ok: false; message: string }

type One<T> = { data: T }

/**
 * Données et actions de l'écran Carte. Chaque écriture passe par une route /api/menu/* existante
 * (qui invalide le cache `menu` du site public : MENU-02). L'état local reflète le serveur sans
 * rechargement ; basculer la disponibilité et réordonner sont optimistes avec retour arrière.
 */
export function useMenuData() {
  const query = useAdminQuery<{ data: MenuPage[] }>('/api/menu/pages')
  const toast = useToast()
  const [local, setLocal] = useState<MenuPage[] | null>(null)
  const pages = local ?? query.data?.data ?? null

  const update = useCallback(
    (fn: (s: MenuPage[]) => MenuPage[]) => setLocal((prev) => fn(prev ?? query.data?.data ?? [])),
    [query.data],
  )

  async function write<T>(run: () => Promise<T>, failureTitle: string): Promise<{ ok: true; value: T } | { ok: false; message: string }> {
    try {
      return { ok: true, value: await run() }
    } catch (e) {
      const message = readableError(e)
      toast.error(failureTitle, message)
      return { ok: false, message }
    }
  }

  // --- Plats -------------------------------------------------------------

  async function savePrice(item: MenuItem, value: number | null): Promise<ActionResult> {
    const r = await write(
      () => adminFetch('/api/menu/items', { method: 'PUT', json: { id: item.id, price: value } }),
      'Le prix n’a pas été enregistré.',
    )
    if (!r.ok) return r
    update((s) => patchItem(s, item.id, { price: value }))
    toast.success(value === null ? `Prix de « ${item.name} » retiré.` : `Prix de « ${item.name} » enregistré : ${formatBaht(value)}.`)
    return { ok: true }
  }

  async function setAvailability(item: MenuItem, available: boolean): Promise<ActionResult> {
    const r = await runOptimistic<MenuPage[]>({
      update,
      forward: (s) => patchItem(s, item.id, { is_available: available }),
      backward: (s) => patchItem(s, item.id, { is_available: !available }),
      request: () => adminFetch('/api/menu/items', { method: 'PUT', json: { id: item.id, is_available: available } }),
    })
    if (!r.ok) {
      const message = readableError(r.error)
      toast.error(`La disponibilité de « ${item.name} » n’a pas été modifiée.`, `${message} L’interrupteur est revenu à sa position précédente.`)
      return { ok: false, message }
    }
    toast.success(available ? `« ${item.name} » est de nouveau disponible sur le site.` : `« ${item.name} » est indisponible sur le site.`)
    return { ok: true }
  }

  async function createItem(categoryId: number, form: Pick<ItemForm, 'name' | 'is_available'>, price: number | null): Promise<ActionResult> {
    const r = await write(
      () => adminFetch<One<MenuItem>>('/api/menu/items', { method: 'POST', json: itemCreateBody(categoryId, form, price) }),
      `« ${form.name.trim()} » n’a pas été ajouté.`,
    )
    if (!r.ok) return r
    update((s) => addItem(s, r.value.data))
    toast.success(`« ${form.name.trim()} » ajouté à la carte.`)
    return { ok: true }
  }

  async function updateItem(id: number, form: ItemForm, price: number | null): Promise<ActionResult> {
    const r = await write(
      () => adminFetch<One<MenuItem>>('/api/menu/items', { method: 'PUT', json: itemUpdateBody(id, form, price) }),
      `« ${form.name.trim()} » n’a pas été enregistré.`,
    )
    if (!r.ok) return r
    update((s) => patchItem(s, id, r.value.data))
    toast.success(`« ${form.name.trim()} » enregistré.`)
    return { ok: true }
  }

  async function deleteItem(item: MenuItem): Promise<ActionResult> {
    const r = await write(
      () => adminFetch(`/api/menu/items?id=${item.id}`, { method: 'DELETE' }),
      `« ${item.name} » n’a pas été supprimé.`,
    )
    if (!r.ok) return r
    update((s) => removeItem(s, item.id))
    toast.success(`« ${item.name} » supprimé.`)
    return { ok: true }
  }

  async function uploadImage(file: File): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
    const body = new FormData()
    body.append('file', file)
    try {
      const res = await adminFetch<{ url: string }>('/api/menu/upload', { method: 'POST', body })
      return { ok: true, url: res.url }
    } catch (e) {
      return { ok: false, message: readableError(e) }
    }
  }

  // --- Réordonnancement (flèches) ----------------------------------------

  async function moveItem(page: MenuPage, categoryId: number, index: number, dir: -1 | 1): Promise<void> {
    const category = page.categories?.find((c) => c.id === categoryId)
    const moved = category?.items ? moveInList(category.items, index, dir) : null
    if (!category || !category.items || !moved) return
    const before = category.items
    const after = withOrder(moved)
    const r = await runOptimistic<MenuPage[]>({
      update,
      forward: (s) => setCategoryItems(s, categoryId, after),
      backward: (s) => setCategoryItems(s, categoryId, before),
      request: () => adminFetch('/api/menu/reorder', { method: 'POST', json: reorderBody('items', after) }),
    })
    if (!r.ok) toast.error('L’ordre des plats n’a pas été enregistré.', `${readableError(r.error)} L’ordre précédent est rétabli.`)
  }

  async function moveCategory(page: MenuPage, index: number, dir: -1 | 1): Promise<void> {
    const moved = page.categories ? moveInList(page.categories, index, dir) : null
    if (!page.categories || !moved) return
    const before = page.categories
    const after = withOrder(moved)
    const r = await runOptimistic<MenuPage[]>({
      update,
      forward: (s) => setPageCategories(s, page.id, after),
      backward: (s) => setPageCategories(s, page.id, before),
      request: () => adminFetch('/api/menu/reorder', { method: 'POST', json: reorderBody('categories', after) }),
    })
    if (!r.ok) toast.error('L’ordre des catégories n’a pas été enregistré.', `${readableError(r.error)} L’ordre précédent est rétabli.`)
  }

  async function movePage(index: number, dir: -1 | 1): Promise<void> {
    const current = pages
    const moved = current ? moveInList(current, index, dir) : null
    if (!current || !moved) return
    const after = withOrder(moved)
    const byId = new Map(after.map((p) => [p.id, p.display_order]))
    const r = await runOptimistic<MenuPage[]>({
      update,
      forward: (s) => s.map((p) => ({ ...p, display_order: byId.get(p.id) ?? p.display_order })).sort((a, b) => a.display_order - b.display_order),
      backward: (s) => {
        const prev = new Map(current.map((p) => [p.id, p.display_order]))
        return s.map((p) => ({ ...p, display_order: prev.get(p.id) ?? p.display_order })).sort((a, b) => a.display_order - b.display_order)
      },
      request: () => adminFetch('/api/menu/reorder', { method: 'POST', json: reorderBody('pages', after) }),
    })
    if (!r.ok) toast.error('L’ordre des pages n’a pas été enregistré.', `${readableError(r.error)} L’ordre précédent est rétabli.`)
  }

  // --- Catégories --------------------------------------------------------

  async function createCategory(pageId: number, name: string, description: string): Promise<ActionResult> {
    const r = await write(
      () =>
        adminFetch<One<MenuCategory>>('/api/menu/categories', {
          method: 'POST',
          json: { menu_page_id: pageId, name: name.trim(), description: description.trim() || null },
        }),
      `La catégorie « ${name.trim()} » n’a pas été créée.`,
    )
    if (!r.ok) return r
    update((s) => addCategory(s, r.value.data))
    toast.success(`Catégorie « ${name.trim()} » créée.`)
    return { ok: true }
  }

  async function renameCategory(category: MenuCategory, name: string, description: string): Promise<ActionResult> {
    const r = await write(
      () =>
        adminFetch<One<MenuCategory>>('/api/menu/categories', {
          method: 'PUT',
          json: { id: category.id, name: name.trim(), description: description.trim() || null },
        }),
      `La catégorie « ${category.name} » n’a pas été modifiée.`,
    )
    if (!r.ok) return r
    update((s) => patchCategory(s, category.id, { name: name.trim(), description: description.trim() || null }))
    toast.success(`Catégorie « ${name.trim()} » enregistrée.`)
    return { ok: true }
  }

  async function deleteCategory(category: MenuCategory): Promise<ActionResult> {
    const r = await write(
      () => adminFetch(`/api/menu/categories?id=${category.id}`, { method: 'DELETE' }),
      `La catégorie « ${category.name} » n’a pas été supprimée.`,
    )
    if (!r.ok) return r
    update((s) => removeCategory(s, category.id))
    toast.success(`Catégorie « ${category.name} » supprimée.`)
    return { ok: true }
  }

  // --- Pages de carte (replié sous « Gérer les pages ») -------------------

  async function createPage(form: { name: string; slug: string; description: string }): Promise<{ ok: true; id: number } | { ok: false; message: string }> {
    const r = await write(
      () =>
        adminFetch<One<MenuPage>>('/api/menu/pages', {
          method: 'POST',
          json: { name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim() || null, is_active: true },
        }),
      `La page « ${form.name.trim()} » n’a pas été créée.`,
    )
    if (!r.ok) return r
    update((s) => [...s, { ...r.value.data, categories: [] }])
    toast.success(`Page « ${form.name.trim()} » créée.`)
    return { ok: true, id: r.value.data.id }
  }

  async function updatePage(page: MenuPage, patch: { name: string; slug: string; description: string | null; is_active: boolean }): Promise<ActionResult> {
    const r = await write(
      () => adminFetch('/api/menu/pages', { method: 'PUT', json: { id: page.id, ...patch } }),
      `La page « ${page.name} » n’a pas été modifiée.`,
    )
    if (!r.ok) return r
    update((s) => patchPage(s, page.id, patch))
    toast.success(`Page « ${patch.name} » enregistrée.`)
    return { ok: true }
  }

  async function togglePageActive(page: MenuPage): Promise<ActionResult> {
    const next = !page.is_active
    const r = await runOptimistic<MenuPage[]>({
      update,
      forward: (s) => patchPage(s, page.id, { is_active: next }),
      backward: (s) => patchPage(s, page.id, { is_active: !next }),
      request: () =>
        adminFetch('/api/menu/pages', {
          method: 'PUT',
          json: { id: page.id, name: page.name, slug: page.slug, description: page.description, is_active: next },
        }),
    })
    if (!r.ok) {
      const message = readableError(r.error)
      toast.error(`La page « ${page.name} » n’a pas été modifiée.`, message)
      return { ok: false, message }
    }
    toast.success(next ? `Page « ${page.name} » affichée sur le site.` : `Page « ${page.name} » masquée du site.`)
    return { ok: true }
  }

  async function deletePage(page: MenuPage): Promise<ActionResult> {
    const r = await write(
      () => adminFetch(`/api/menu/pages?id=${page.id}`, { method: 'DELETE' }),
      `La page « ${page.name} » n’a pas été supprimée.`,
    )
    if (!r.ok) return r
    update((s) => removePage(s, page.id))
    toast.success(`Page « ${page.name} » supprimée.`)
    return { ok: true }
  }

  return {
    status: query.status,
    error: query.error,
    refetch: query.refetch,
    pages,
    savePrice,
    setAvailability,
    createItem,
    updateItem,
    deleteItem,
    uploadImage,
    moveItem,
    moveCategory,
    movePage,
    createCategory,
    renameCategory,
    deleteCategory,
    createPage,
    updatePage,
    togglePageActive,
    deletePage,
  }
}

export type MenuData = ReturnType<typeof useMenuData>
