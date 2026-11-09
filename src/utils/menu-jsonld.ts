/**
 * schema.org Menu JSON-LD (ONP-07), generated from the same menu data as the visible /menu page.
 *
 * Pure module (type-only imports besides seo.ts) so vitest can load it. Nothing is invented:
 * a price appears only when the item has a finite price, the currency is THB, and there is no
 * rating or review of any kind.
 */

import type { MenuPageWithContent } from './menu'
import { SITE_URL, localeUrl, type SeoLocale } from './seo'

export const MENU_CURRENCY = 'THB'

type JsonLdNode = Record<string, unknown>

function cleanText(value: string | null | undefined): string | null {
  const v = (value ?? '').replace(/\s+/g, ' ').trim()
  return v === '' ? null : v
}

function offerFor(price: number | string | null | undefined): JsonLdNode | null {
  if (price === null || price === undefined || price === '') return null
  const n = Number(price)
  if (!Number.isFinite(n) || n < 0) return null
  return {
    '@type': 'Offer',
    price: n.toFixed(2),
    priceCurrency: MENU_CURRENCY,
  }
}

function menuItemNode(item: MenuPageWithContent['categories'][number]['items'][number]): JsonLdNode {
  const description = cleanText(item.description)
  const offer = offerFor(item.price)
  return {
    '@type': 'MenuItem',
    name: cleanText(item.name) ?? '',
    ...(description ? { description } : {}),
    ...(offer ? { offers: offer } : {}),
    ...(item.is_vegetarian ? { suitableForDiet: 'https://schema.org/VegetarianDiet' } : {}),
  }
}

/** Menu > MenuSection (menu page) > MenuSection (category) > MenuItem. Empty sections are skipped. */
export function buildMenuJsonLd(args: { locale: SeoLocale; menu: MenuPageWithContent[] }): JsonLdNode | null {
  const { locale, menu } = args
  const url = localeUrl(locale, '/menu')

  const sections = menu
    .map((page): JsonLdNode | null => {
      const categories = page.categories
        .map((category): JsonLdNode | null => {
          const items = category.items.filter((i) => cleanText(i.name)).map(menuItemNode)
          if (items.length === 0) return null
          const description = cleanText(category.description)
          return {
            '@type': 'MenuSection',
            name: cleanText(category.name) ?? '',
            ...(description ? { description } : {}),
            hasMenuItem: items,
          }
        })
        .filter((c): c is JsonLdNode => c !== null)
      if (categories.length === 0) return null
      const description = cleanText(page.description)
      return {
        '@type': 'MenuSection',
        name: cleanText(page.name) ?? '',
        ...(description ? { description } : {}),
        hasMenuSection: categories,
      }
    })
    .filter((p): p is JsonLdNode => p !== null)

  if (sections.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `${url}#menu`,
    name: 'Gecko Cabane',
    url,
    inLanguage: locale,
    mainEntityOfPage: url,
    provider: { '@id': `${SITE_URL}/#restaurant` },
    hasMenuSection: sections,
  }
}
