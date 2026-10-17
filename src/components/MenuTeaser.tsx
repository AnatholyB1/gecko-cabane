import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getMenu, pickTeaserItems, formatPrice } from '@/utils/menu'

type Props = {
  locale: string
}

export default async function MenuTeaser({ locale }: Props) {
  const menu = await getMenu()
  const items = pickTeaserItems(menu)
  const t = await getTranslations({ locale, namespace: 'menuSection' })

  return (
    <div>
      {items.length > 0 && (
        <ul className="grid md:grid-cols-2 gap-4 mb-10 max-w-4xl mx-auto">
          {items.map((item) => {
            const price = formatPrice(item.price)
            return (
              <li key={item.id} className="p-6 border border-gc-aged bg-gc-parchment">
                <div className="flex justify-between items-baseline gap-4">
                  <h3 className="font-cinzel text-[20px] font-semibold text-gc-text-dark">{item.name}</h3>
                  {price && (
                    <span className="font-cinzel text-[18px] text-gc-brass whitespace-nowrap">{price}</span>
                  )}
                </div>
                {item.description && (
                  <p className="font-cormorant text-[16px] text-gc-text-mid leading-relaxed mt-2 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <div className="text-center">
        <Link
          href="/menu"
          className="inline-flex items-center justify-center min-h-11 font-cinzel text-[12px] tracking-[0.15em] uppercase text-gc-text-dark border border-gc-gold px-6 py-3 hover:bg-gc-gold hover:text-gc-void transition-all focus:outline-none focus:ring-1 focus:ring-gc-gold"
        >
          {t('seeFullMenu')} →
        </Link>
      </div>
    </div>
  )
}
