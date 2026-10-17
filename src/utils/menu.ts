import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import type { MenuPage, MenuCategory, MenuItem } from '@/types/database'

export const MENU_TAG = 'menu'

export type MenuCategoryWithItems = Omit<MenuCategory, 'items'> & { items: MenuItem[] }
export type MenuPageWithContent = Omit<MenuPage, 'categories'> & { categories: MenuCategoryWithItems[] }

/**
 * Formats a baht price as text: 650 -> '650 ฿', 1200 -> '1,200 ฿'. No trailing .00.
 * Returns null when there is no usable price (nothing is rendered then).
 */
export function formatPrice(price: number | string | null | undefined): string | null {
  if (price === null || price === undefined || price === '') return null
  const n = Number(price)
  if (!Number.isFinite(n)) return null
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} ฿`
}

const byOrder = <T extends { display_order: number }>(a: T, b: T) => a.display_order - b.display_order

/**
 * Builds pages -> categories -> items. Keeps active pages and available items only,
 * drops empty categories and empty pages.
 */
export function assembleMenu(
  pages: MenuPage[],
  categories: MenuCategory[],
  items: MenuItem[],
): MenuPageWithContent[] {
  return pages
    .filter((p) => p.is_active)
    .sort(byOrder)
    .map((p) => ({
      ...p,
      categories: categories
        .filter((c) => c.menu_page_id === p.id)
        .sort(byOrder)
        .map((c) => ({
          ...c,
          items: items
            .filter((i) => i.category_id === c.id && i.is_available)
            .sort(byOrder),
        }))
        .filter((c) => c.items.length > 0),
    }))
    .filter((p) => p.categories.length > 0)
}

/** True only when at least one item is explicitly flagged gluten-free (nothing is inferred). */
export function hasGlutenFree(menu: MenuPageWithContent[]): boolean {
  return menu.some((p) => p.categories.some((c) => c.items.some((i) => i.is_gluten_free === true)))
}

/**
 * Full public menu, cached 1 h under the 'menu' tag.
 * Anon key + public-read RLS: never the cookie-bound client inside a cache scope,
 * never the service role. Throws on error so failures are not cached.
 */
export const getMenu = unstable_cache(
  async (): Promise<MenuPageWithContent[]> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const [pages, categories, items] = await Promise.all([
      supabase.from('gecko_menu_pages').select('*').eq('is_active', true).order('display_order', { ascending: true }),
      supabase.from('gecko_menu_categories').select('*').order('display_order', { ascending: true }),
      supabase.from('gecko_menu_items').select('*').eq('is_available', true).order('display_order', { ascending: true }),
    ])
    if (pages.error) throw pages.error
    if (categories.error) throw categories.error
    if (items.error) throw items.error
    return assembleMenu(
      (pages.data ?? []) as MenuPage[],
      (categories.data ?? []) as MenuCategory[],
      (items.data ?? []) as MenuItem[],
    )
  },
  ['gecko-menu'],
  { tags: [MENU_TAG], revalidate: 3600 },
)

export const ARDOISE_SLUG = 'ardoise'

/**
 * Up to `max` items for the home teaser: the Ardoise page, in category then item order.
 * RESEARCH A6: the Ardoise slug is unverified, so fall back to the first page.
 */
export function pickTeaserItems(menu: MenuPageWithContent[], max = 4): MenuItem[] {
  const source = menu.find((p) => p.slug === ARDOISE_SLUG) ?? menu[0]
  if (!source) return []
  return source.categories.flatMap((c) => c.items).slice(0, max)
}
