/**
 * schema.org Menu JSON-LD (ONP-07): structural validation of the generated object
 * (the online Rich Results Test is a separate manual step).
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildMenuJsonLd } from '../src/utils/menu-jsonld'
import { serializeJsonLd } from '../src/utils/seo'
import type { MenuPageWithContent } from '../src/utils/menu'

const base = { created_at: '', updated_at: '' }

const MENU: MenuPageWithContent[] = [
  {
    ...base,
    id: 1,
    name: 'Dîner',
    slug: 'diner',
    description: 'Servi chaque soir',
    is_active: true,
    display_order: 1,
    categories: [
      {
        ...base,
        id: 10,
        menu_page_id: 1,
        name: 'Plats',
        description: null,
        display_order: 1,
        items: [
          {
            ...base,
            id: 100,
            category_id: 10,
            name: 'Bœuf bourguignon',
            description: 'Mijoté au vin rouge',
            price: 480,
            price_label: null,
            image_url: null,
            is_available: true,
            is_vegetarian: false,
            is_spicy: false,
            allergens: null,
            display_order: 1,
          },
          {
            ...base,
            id: 101,
            category_id: 10,
            name: 'Curry massaman végétarien',
            description: null,
            price: 320.5,
            price_label: null,
            image_url: null,
            is_available: true,
            is_vegetarian: true,
            is_spicy: true,
            allergens: null,
            display_order: 2,
          },
          {
            ...base,
            id: 102,
            category_id: 10,
            name: 'Plat du jour',
            description: 'Selon le marché',
            price: null,
            price_label: null,
            image_url: null,
            is_available: true,
            is_vegetarian: false,
            is_spicy: false,
            allergens: null,
            display_order: 3,
          },
        ],
      },
    ],
  },
]

type Node = Record<string, unknown>

describe('buildMenuJsonLd', () => {
  const data = buildMenuJsonLd({ locale: 'fr', menu: MENU }) as Node

  it('is a schema.org Menu tied to the localized menu URL and the Restaurant @id', () => {
    expect(data['@context']).toBe('https://schema.org')
    expect(data['@type']).toBe('Menu')
    expect(data.url).toBe('https://geckocabanerestaurant.com/fr/menu')
    expect(data.inLanguage).toBe('fr')
    expect(data.provider).toEqual({ '@id': 'https://geckocabanerestaurant.com/#restaurant' })
  })

  it('nests MenuSection (page) > MenuSection (category) > MenuItem', () => {
    const sections = data.hasMenuSection as Node[]
    expect(sections).toHaveLength(1)
    expect(sections[0]['@type']).toBe('MenuSection')
    expect(sections[0].name).toBe('Dîner')
    const cats = sections[0].hasMenuSection as Node[]
    expect(cats[0]['@type']).toBe('MenuSection')
    expect(cats[0].name).toBe('Plats')
    const items = cats[0].hasMenuItem as Node[]
    expect(items).toHaveLength(3)
    for (const item of items) {
      expect(item['@type']).toBe('MenuItem')
      expect(typeof item.name).toBe('string')
      expect((item.name as string).length).toBeGreaterThan(0)
    }
  })

  it('gives each priced item an Offer in THB with a numeric price string', () => {
    const items = ((data.hasMenuSection as Node[])[0].hasMenuSection as Node[])[0].hasMenuItem as Node[]
    expect(items[0].offers).toEqual({ '@type': 'Offer', price: '480.00', priceCurrency: 'THB' })
    expect(items[1].offers).toEqual({ '@type': 'Offer', price: '320.50', priceCurrency: 'THB' })
    expect(items[0].description).toBe('Mijoté au vin rouge')
  })

  it('invents nothing: no offer without a price, no description without text, no rating or review', () => {
    const items = ((data.hasMenuSection as Node[])[0].hasMenuSection as Node[])[0].hasMenuItem as Node[]
    expect(items[2]).not.toHaveProperty('offers')
    expect(items[1]).not.toHaveProperty('description')
    expect(items[1].suitableForDiet).toBe('https://schema.org/VegetarianDiet')
    expect(items[0]).not.toHaveProperty('suitableForDiet')
    expect(JSON.stringify(data)).not.toMatch(/aggregateRating|ratingValue|"review"|reviewCount/)
  })

  it('serializes to parsable JSON that cannot close the script tag', () => {
    const html = serializeJsonLd(data)
    expect(html).not.toContain('</')
    expect(JSON.parse(html)['@type']).toBe('Menu')
  })

  it('returns null for an empty menu or one with only empty sections', () => {
    expect(buildMenuJsonLd({ locale: 'en', menu: [] })).toBeNull()
    const empty = [{ ...MENU[0], categories: [{ ...MENU[0].categories[0], items: [] }] }]
    expect(buildMenuJsonLd({ locale: 'en', menu: empty })).toBeNull()
  })

  it('uses the localized menu URL per locale', () => {
    expect((buildMenuJsonLd({ locale: 'de', menu: MENU }) as Node).url).toBe('https://geckocabanerestaurant.com/de/menu')
  })
})

describe('menu page wiring', () => {
  const src = readFileSync(join(__dirname, '..', 'src/app/[locale]/menu/page.tsx'), 'utf8')
  it('renders the Menu JSON-LD next to the Restaurant JSON-LD', () => {
    expect(src).toContain('<MenuJsonLd')
    expect(src).toContain('<RestaurantJsonLd')
  })
})
