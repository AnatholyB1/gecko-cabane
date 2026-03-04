'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { MenuPage, MenuCategory, MenuItem } from '@/types/database'

type MenuPageWithContent = MenuPage & {
  categories: (MenuCategory & {
    items: MenuItem[]
  })[]
}

export default function MenuDisplay() {
  const [menuPages, setMenuPages] = useState<MenuPageWithContent[]>([])
  const [activeTab, setActiveTab] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMenu()
  }, [])

  async function fetchMenu() {
    const supabase = createClient()
    
    // Fetch active menu pages with categories and items
    const { data: pages, error: pagesError } = await supabase
      .from('menu_pages')
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
      .from('menu_categories')
      .select('*')
      .in('menu_page_id', pageIds)
      .order('display_order', { ascending: true })

    // Fetch all items for those categories
    const categoryIds = categories?.map(c => c.id) || []
    const { data: items } = await supabase
      .from('menu_items')
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    )
  }

  if (menuPages.length === 0) {
    return null // Don't show section if no menu
  }

  const activePage = menuPages.find(p => p.id === activeTab)

  return (
    <div className="mt-16">
      {/* Tab Navigation */}
      {menuPages.length > 1 && (
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {menuPages.map(page => (
            <button
              key={page.id}
              onClick={() => setActiveTab(page.id)}
              className={`px-6 py-3 rounded-full font-[family-name:var(--font-lora)] transition-all ${
                activeTab === page.id
                  ? 'bg-[var(--primary)] text-white shadow-lg'
                  : 'bg-white text-[var(--warm-gray)] hover:bg-[var(--accent-light)] shadow-md'
              }`}
            >
              {page.name}
            </button>
          ))}
        </div>
      )}

      {/* Page Description */}
      {activePage?.description && (
        <p className="text-center text-[var(--warm-gray)] font-[family-name:var(--font-lora)] mb-10 max-w-2xl mx-auto italic">
          {activePage.description}
        </p>
      )}

      {/* Categories and Items */}
      {activePage?.categories.map(category => (
        <div key={category.id} className="mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-[var(--primary-dark)] mb-2">
              {category.name}
            </h3>
            {category.description && (
              <p className="text-[var(--warm-gray)] font-[family-name:var(--font-lora)] max-w-xl mx-auto">
                {category.description}
              </p>
            )}
            <div className="w-16 h-1 bg-[var(--warm-gold)] mx-auto mt-4"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {(category.items || []).map(item => (
              <div 
                key={item.id} 
                className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow border-l-4 border-[var(--tropical)]"
              >
                <div className="flex gap-4">
                  {item.image_url && (
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="text-lg font-bold text-[var(--primary-dark)] leading-tight">
                        {item.name}
                        {item.is_vegetarian && <span className="ml-2 text-green-600">🥬</span>}
                        {item.is_spicy && <span className="ml-1 text-red-500">🌶️</span>}
                      </h4>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[var(--warm-gold)] font-bold">
                          {item.price ? `${item.price} ฿` : ''}
                        </span>
                        {item.price_label && (
                          <span className="block text-xs text-[var(--warm-gray)]">
                            {item.price_label}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-sm text-[var(--warm-gray)] font-[family-name:var(--font-lora)] leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    {item.allergens && (
                      <p className="text-xs text-amber-600 mt-2">
                        ⚠️ {item.allergens}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(!category.items || category.items.length === 0) && (
            <p className="text-center text-[var(--warm-gray)] italic">
              Aucun plat disponible dans cette catégorie
            </p>
          )}
        </div>
      ))}

      {(!activePage?.categories || activePage.categories.length === 0) && (
        <p className="text-center text-[var(--warm-gray)] italic">
          Ce menu est en cours de préparation
        </p>
      )}
    </div>
  )
}
