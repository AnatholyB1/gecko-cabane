import type { PageKey } from '@/utils/seo'

export type LandingSection = {
  id: string
  paras: 1 | 2 | 3
  image?: string
  cards?: 2 | 3 | 4
  facts?: boolean
  link?: 'reservation' | 'menu' | 'belgian' | 'directions'
}

export type LandingConfig = { heroImage: string; sections: readonly LandingSection[] }

/** Per-page structure for SeoLandingPage; copy lives in the page namespace of messages/*.json. */
export const LANDING: Partial<Record<PageKey, LandingConfig>> = {
  '/romantic-dinner-krabi': {
    heroImage: '/exterior-sign.jpg',
    sections: [
      { id: 'ambiance', paras: 2 },
      { id: 'table', paras: 2, image: '/food-bourguignon.jpg' },
      { id: 'chef', paras: 2, image: '/chef-jariya.jpg' },
      { id: 'occasion', paras: 1, link: 'reservation' },
    ],
  },
}
