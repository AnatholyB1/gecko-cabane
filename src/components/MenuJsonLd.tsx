import type { MenuPageWithContent } from '@/utils/menu'
import { buildMenuJsonLd } from '@/utils/menu-jsonld'
import { serializeJsonLd, type SeoLocale } from '@/utils/seo'

/** Menu JSON-LD (ONP-07) built from the menu already loaded by the page; renders nothing when the menu is empty. */
export default function MenuJsonLd({ locale, menu }: { locale: SeoLocale; menu: MenuPageWithContent[] }) {
  const data = buildMenuJsonLd({ locale, menu })
  if (!data) return null
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
}
