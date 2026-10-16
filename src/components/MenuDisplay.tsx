'use client'

import { useState, useEffect } from 'react'
import { Leaf, Flame } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/utils/supabase/client'
import { MenuPage, MenuCategory, MenuItem } from '@/types/database'

type MenuPageWithContent = MenuPage & {
  categories: (MenuCategory & {
    items: MenuItem[]
  })[]
}

export default function MenuDisplay() {
  const t = useTranslations('menuSection')
  const [menuPages, setMenuPages] = useState<MenuPageWithContent[]>([])
  const [activeTab, setActiveTab] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchMenu() {
    const supabase = createClient()
    
    // Fetch active menu pages with categories and items
    const { data: pages, error: pagesError } = await supabase
      .from('gecko_menu_pages')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (pagesError || !pages?.length) {
      setLoading(false)
      return
    }

    // Fetch all categories for active pages
    const pageIds = pages.map(p => p.id)
    const { data: categories } = await supabase
      .from('gecko_menu_categories')
      .select('*')
      .in('menu_page_id', pageIds)
      .order('display_order', { ascending: true })

    // Fetch all items for those categories
    const categoryIds = categories?.map(c => c.id) || []
    const { data: items } = await supabase
      .from('gecko_menu_items')
      .select('*')
      .in('category_id', categoryIds)
      .eq('is_available', true)
      .order('display_order', { ascending: true })

    // Assemble the data
    const pagesWithContent = pages.map(page => ({
      ...page,
      categories: (categories || [])
        .filter(c => c.menu_page_id === page.id)
        .map(category => ({
          ...category,
          items: (items || []).filter(i => i.category_id === category.id)
        }))
    }))

    setMenuPages(pagesWithContent)
    if (pagesWithContent.length > 0) {
      setActiveTab(pagesWithContent[0].id)
    }
    setLoading(false)
  }

  useEffect(() => {
    // fetchMenu is async: state is set after the awaited fetch (initial data load on mount); rule is a false positive here
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMenu()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border border-gc-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (menuPages.length === 0) {
    return null // Don't show section if no menu
  }

  const activePage = menuPages.find(p => p.id === activeTab)

  return (
    <div className="mt-12">
      {/* Tab Navigation */}
      {menuPages.length > 1 && (
        <div className="flex flex-wrap justify-center gap-0 mb-10 border border-gc-aged">
          {menuPages.map(page => (
            <button
              key={page.id}
              onClick={() => setActiveTab(page.id)}
              className={[
                'font-cinzel text-[13px] tracking-[0.15em] uppercase px-8 py-3 transition-all border-r border-gc-aged last:border-r-0',
                activeTab === page.id
                  ? 'bg-gc-text-dark text-gc-gold'
                  : 'bg-transparent text-gc-text-mid hover:text-gc-text-dark hover:bg-gc-aged/30',
              ].join(' ')}
            >
              {page.name}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-center gap-6 mb-8 font-raleway text-[12px] tracking-[0.05em] text-gc-text-mid">
        <span className="inline-flex items-center gap-2">
          <Leaf size={16} strokeWidth={1.75} className="text-gc-celadon" aria-hidden="true" /> {t('vegetarian')}
        </span>
        <span className="inline-flex items-center gap-2">
          <Flame size={16} strokeWidth={1.75} className="text-gc-copper" aria-hidden="true" /> {t('spicy')}
        </span>
      </div>

      {/* Page Description */}
      {activePage?.description && (
        <p className="text-center font-cormorant italic text-[17px] text-gc-text-mid mb-10 max-w-xl mx-auto">
          {activePage.description}
        </p>
      )}

      {/* Categories and Items */}
      {activePage?.categories.map(category => (
        <div key={category.id} className="mb-14">
          <div className="text-center mb-8">
            <h3 className="font-cinzel font-normal text-[20px] text-gc-text-dark tracking-wide mb-2">
              {category.name}
            </h3>
            {category.description && (
              <p className="font-cormorant italic text-[16px] text-gc-text-mid max-w-lg mx-auto">
                {category.description}
              </p>
            )}
            <div className="w-10 h-px bg-gc-gold mx-auto mt-4" />
          </div>

          <div className="max-w-[860px] mx-auto">
            {(category.items || []).map(item => (
              <div
                key={item.id}
                className="flex justify-between items-baseline gap-6 py-4 border-b border-gc-aged/60 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h4 className="font-cormorant italic font-light text-[20px] text-gc-text-dark leading-tight">
                      {item.name}
                    </h4>
                    {item.is_vegetarian && (
                      <Leaf
                        size={18}
                        strokeWidth={1.75}
                        className="text-gc-celadon self-center shrink-0"
                        role="img"
                        aria-label={t('vegetarian')}
                      >
                        <title>{t('vegetarian')}</title>
                      </Leaf>
                    )}
                    {item.is_spicy && (
                      <Flame
                        size={18}
                        strokeWidth={1.75}
                        className="text-gc-copper self-center shrink-0"
                        role="img"
                        aria-label={t('spicy')}
                      >
                        <title>{t('spicy')}</title>
                      </Flame>
                    )}
                  </div>
                  {item.description && (
                    <p className="font-cormorant italic text-[14px] text-gc-text-mid mt-1 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {item.description}
                    </p>
                  )}
                  {item.allergens && (
                    <p className="font-raleway text-[11px] tracking-[0.05em] text-gc-copper mt-1 uppercase">
                      {item.allergens}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {item.price && (
                    <span className="font-cinzel text-[15px] text-gc-gold">
                      {item.price} ฿
                    </span>
                  )}
                  {item.price_label && (
                    <span className="block font-cormorant text-[12px] text-gc-text-mid italic">
                      {item.price_label}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(!category.items || category.items.length === 0) && (
            <p className="text-center font-cormorant italic text-[16px] text-gc-text-mid">
              {t('preparing')}
            </p>
          )}
        </div>
      ))}

      {(!activePage?.categories || activePage.categories.length === 0) && (
        <p className="text-center font-cormorant italic text-[17px] text-gc-text-mid">
          {t('menuPreparing')}
        </p>
      )}
    </div>
  )
}
