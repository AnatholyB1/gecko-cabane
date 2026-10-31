/**
 * MENU-02 : une modification faite dans l'écran « Carte » apparaît sur /menu public.
 *
 * Le site public lit la carte via `getMenu`, mis en cache sous l'étiquette MENU_TAG. L'écran d'admin
 * n'écrit QUE par les routes /api/menu/*, qui appellent `revalidateTag(MENU_TAG, 'max')` après une
 * écriture réussie. Ce test exécute les vrais gestionnaires de route (Supabase simulé) et vérifie :
 *  1. le cache de la carte publique est étiqueté MENU_TAG ;
 *  2. chaque écriture réussie des écrans (prix, disponibilité, ajout, suppression, ordre) invalide cette étiquette ;
 *  3. une écriture refusée ou en échec n'invalide rien (pas de cache vidé pour rien).
 * Ce que ce test ne prouve pas : le rendu de /menu par Next.js après invalidation (voir 14-VERIFICATION.md).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  cacheOptions: [] as { tags?: string[]; revalidate?: number }[],
  result: { data: { id: 1 }, error: null } as { data: unknown; error: unknown },
  admin: true,
}))

vi.mock('next/cache', () => ({
  revalidateTag: h.revalidateTag,
  unstable_cache: (fn: unknown, _keys: unknown, opts: { tags?: string[]; revalidate?: number }) => {
    h.cacheOptions.push(opts)
    return fn
  },
}))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/utils/supabase/server', () => ({ createClient: async () => ({ from: () => chain() }) }))
vi.mock('@/utils/auth', () => ({
  requireAdmin: async () =>
    h.admin
      ? { ok: true, supabase: { from: () => chain() }, user: { id: 'u' } }
      : { ok: false, response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) },
}))

function chain() {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'limit']) c[m] = () => c
  c.single = async () => h.result
  c.then = (resolve: (v: unknown) => unknown) => resolve(h.result)
  return c
}

const json = (method: string, body: unknown, url = 'http://localhost/api/menu/items') =>
  new Request(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

beforeEach(() => {
  h.revalidateTag.mockClear()
  h.result = { data: { id: 1 }, error: null }
  h.admin = true
})

describe('le cache de la carte publique est étiqueté MENU_TAG', () => {
  it('getMenu est mis en cache sous l’étiquette que l’admin invalide', async () => {
    const { MENU_TAG } = await import('../src/utils/menu')
    expect(MENU_TAG).toBe('menu')
    expect(h.cacheOptions.some((o) => o.tags?.includes(MENU_TAG))).toBe(true)
  })
})

describe('les écritures de l’écran Carte invalident le cache', () => {
  it('prix : PUT /api/menu/items { id, price }', async () => {
    const { PUT } = await import('../src/app/api/menu/items/route')
    const res = await PUT(json('PUT', { id: 1, price: 395 }))
    expect(res.status).toBe(200)
    expect(h.revalidateTag).toHaveBeenCalledTimes(1)
    expect(h.revalidateTag).toHaveBeenCalledWith('menu', 'max')
  })

  it('disponibilité : PUT /api/menu/items { id, is_available }', async () => {
    const { PUT } = await import('../src/app/api/menu/items/route')
    expect((await PUT(json('PUT', { id: 1, is_available: false }))).status).toBe(200)
    expect(h.revalidateTag).toHaveBeenCalledWith('menu', 'max')
  })

  it('ajout rapide : POST /api/menu/items', async () => {
    const { POST } = await import('../src/app/api/menu/items/route')
    expect((await POST(json('POST', { category_id: 1, name: 'Pad thaï', price: 340, is_available: true }))).status).toBe(200)
    expect(h.revalidateTag).toHaveBeenCalledWith('menu', 'max')
  })

  it('suppression : DELETE /api/menu/items?id=1', async () => {
    const { DELETE } = await import('../src/app/api/menu/items/route')
    const res = await DELETE(new Request('http://localhost/api/menu/items?id=1', { method: 'DELETE' }))
    expect(res.status).toBe(200)
    expect(h.revalidateTag).toHaveBeenCalledWith('menu', 'max')
  })

  it('ordre (flèches) : POST /api/menu/reorder', async () => {
    const { POST } = await import('../src/app/api/menu/reorder/route')
    const res = await POST(json('POST', { type: 'items', items: [{ id: 1, display_order: 0 }, { id: 2, display_order: 1 }] }, 'http://localhost/api/menu/reorder'))
    expect(res.status).toBe(200)
    expect(h.revalidateTag).toHaveBeenCalledWith('menu', 'max')
  })

  it('catégories et pages : POST/PUT/DELETE invalident aussi', async () => {
    const cat = await import('../src/app/api/menu/categories/route')
    const pg = await import('../src/app/api/menu/pages/route')
    await cat.POST(json('POST', { menu_page_id: 1, name: 'Boissons' }, 'http://localhost/api/menu/categories'))
    await cat.PUT(json('PUT', { id: 1, name: 'Boissons' }, 'http://localhost/api/menu/categories'))
    await cat.DELETE(new Request('http://localhost/api/menu/categories?id=1', { method: 'DELETE' }))
    await pg.POST(json('POST', { name: 'Dîner', slug: 'diner' }, 'http://localhost/api/menu/pages'))
    await pg.PUT(json('PUT', { id: 1, name: 'Dîner', slug: 'diner', is_active: false }, 'http://localhost/api/menu/pages'))
    await pg.DELETE(new Request('http://localhost/api/menu/pages?id=1', { method: 'DELETE' }))
    expect(h.revalidateTag).toHaveBeenCalledTimes(6)
  })
})

describe('aucune invalidation sans écriture réussie', () => {
  it('base en erreur : réponse 500 lisible, pas de revalidateTag, pas de texte technique', async () => {
    h.result = { data: null, error: { message: 'duplicate key value violates unique constraint "x"' } }
    const { PUT } = await import('../src/app/api/menu/items/route')
    const res = await PUT(json('PUT', { id: 1, price: 395 }))
    expect(res.status).toBe(500)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('Internal server error')
    expect(body.error).not.toMatch(/duplicate|constraint/)
    expect(h.revalidateTag).not.toHaveBeenCalled()
  })

  it('non connecté : 401, pas de revalidateTag', async () => {
    h.admin = false
    const { PUT } = await import('../src/app/api/menu/items/route')
    expect((await PUT(json('PUT', { id: 1, price: 1 }))).status).toBe(401)
    const { POST } = await import('../src/app/api/menu/reorder/route')
    expect((await POST(json('POST', { type: 'items', items: [] }, 'http://localhost/api/menu/reorder'))).status).toBe(401)
    expect(h.revalidateTag).not.toHaveBeenCalled()
  })

  it('is_gluten_free non booléen : 400, pas de revalidateTag', async () => {
    const { PUT } = await import('../src/app/api/menu/items/route')
    expect((await PUT(json('PUT', { id: 1, is_gluten_free: 'oui' }))).status).toBe(400)
    expect(h.revalidateTag).not.toHaveBeenCalled()
  })
})
