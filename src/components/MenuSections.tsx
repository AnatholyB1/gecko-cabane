import { Leaf, Flame, WheatOff } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { formatPrice, hasGlutenFree, type MenuPageWithContent } from '@/utils/menu'

type Props = {
  locale: string
  menu: MenuPageWithContent[]
}

// Dish, category and page names are shown in French as stored in the DB (D-08).
// DB text is rendered as React children only (auto-escaped).
export default async function MenuSections({ locale, menu }: Props) {
  const t = await getTranslations({ locale, namespace: 'menuPage' })
  const tSection = await getTranslations({ locale, namespace: 'menuSection' })
  const showGlutenFree = hasGlutenFree(menu)

  const picto = (Icon: typeof Leaf, label: string, colorClass: string) => (
    <span role="img" aria-label={label} className="inline-flex items-center">
      <Icon size={16} strokeWidth={1.75} className={`${colorClass} shrink-0`} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )

  return (
    <div>
      <div className="bg-gc-parchment border border-gc-aged p-4 mb-12">
        <p className="font-raleway text-[12px] uppercase tracking-[0.15em] text-gc-text-dark mb-2">
          {t('legendTitle')}
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 font-raleway text-[12px] tracking-[0.05em] text-gc-text-mid">
          <li className="inline-flex items-center gap-1">
            <Leaf size={16} strokeWidth={1.75} className="text-gc-celadon" aria-hidden="true" />
            {tSection('vegetarian')}
          </li>
          <li className="inline-flex items-center gap-1">
            <Flame size={16} strokeWidth={1.75} className="text-gc-copper" aria-hidden="true" />
            {tSection('spicy')}
          </li>
          {showGlutenFree && (
            <li className="inline-flex items-center gap-1">
              <WheatOff size={16} strokeWidth={1.75} className="text-gc-brass" aria-hidden="true" />
              {tSection('glutenFree')}
            </li>
          )}
        </ul>
        <p className="font-raleway text-[12px] uppercase tracking-[0.15em] text-gc-text-mid mt-3">
          {t('allergyNote')}
        </p>
      </div>

      {menu.map((page) => (
        <section key={page.id} id={page.slug} className="scroll-mt-28 border-t border-gc-aged pt-12 mb-12">
          <h2 className="font-cinzel font-normal text-[32px] leading-[1.2] text-gc-text-dark">
            {page.name}
          </h2>
          {page.description && (
            <p className="font-cormorant italic text-[16px] leading-normal text-gc-text-mid mt-2">
              {page.description}
            </p>
          )}

          {page.categories.map((category) => (
            <div key={category.id} className="mt-8">
              <h3 className="font-cinzel font-semibold text-[20px] leading-[1.2] tracking-wide text-gc-text-dark">
                {category.name}
              </h3>
              {category.description && (
                <p className="font-cormorant italic text-[16px] leading-normal text-gc-text-mid mt-1">
                  {category.description}
                </p>
              )}

              <ul className="mt-6 space-y-4">
                {category.items.map((item) => {
                  const price = formatPrice(item.price)
                  return (
                    <li key={item.id}>
                      <div className="flex items-baseline gap-2">
                        <h4 className="font-cinzel font-semibold text-[20px] leading-[1.2] text-gc-text-dark min-w-0">
                          {item.name}
                        </h4>
                        <span className="inline-flex items-center gap-2 self-center shrink-0">
                          {item.is_vegetarian && picto(Leaf, tSection('vegetarian'), 'text-gc-celadon')}
                          {item.is_spicy && picto(Flame, tSection('spicy'), 'text-gc-copper')}
                          {item.is_gluten_free === true && picto(WheatOff, tSection('glutenFree'), 'text-gc-brass')}
                        </span>
                        {price && (
                          <>
                            <span className="flex-1 border-b border-dotted border-gc-aged translate-y-[-4px]" aria-hidden="true" />
                            <span className="font-cormorant text-[16px] text-gc-text-dark text-right whitespace-nowrap tabular-nums">
                              {price}
                            </span>
                          </>
                        )}
                      </div>
                      {item.price_label && (
                        <p className="font-raleway text-[12px] uppercase tracking-[0.15em] text-gc-text-mid text-right">
                          {item.price_label}
                        </p>
                      )}
                      {item.description && (
                        <p className="font-cormorant italic text-[16px] leading-normal text-gc-text-mid mt-1">
                          {item.description}
                        </p>
                      )}
                      {item.allergens && (
                        <p className="font-raleway text-[12px] tracking-[0.05em] text-gc-text-mid mt-1">
                          {`${t('allergensPrefix')} ${item.allergens}`}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
