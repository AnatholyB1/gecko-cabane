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

export type TransportFact = {
  mode: 'taxi' | 'songthaew' | 'transfer' | 'scooter'
  minutes: [number, number] | null
  thb: [number, number] | null
  source: string | null
}

/**
 * Transport figures Ao Nang -> Krabi Town (D-10). Only owner/public-sourced figures may be
 * filled in (plan 12); rows with no data are never rendered.
 */
export const TRANSPORT_FACTS: readonly TransportFact[] = [
  { mode: 'taxi', minutes: null, thb: null, source: null },
  { mode: 'songthaew', minutes: null, thb: null, source: null },
  { mode: 'transfer', minutes: null, thb: null, source: null },
  { mode: 'scooter', minutes: null, thb: null, source: null },
]

/** Pairing card ids; copy lives in wineBeer.sections.pairings.cards (dish -> style). */
export const PAIRINGS: readonly { id: string }[] = [
  { id: 'bourguignon' },
  { id: 'pouletCreme' },
  { id: 'massaman' },
  { id: 'veloute' },
]

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
  '/where-to-eat-krabi-town': {
    heroImage: '/exterior-entrance.jpg',
    sections: [
      { id: 'intro', paras: 2 },
      { id: 'areas', paras: 1, cards: 3 },
      { id: 'when', paras: 2 },
      { id: 'dinner', paras: 2, image: '/food-massaman.jpg', link: 'reservation' },
    ],
  },
  '/getting-here-from-ao-nang': {
    heroImage: '/exterior-entrance.jpg',
    sections: [
      { id: 'overview', paras: 2 },
      { id: 'options', paras: 2, facts: true },
      { id: 'arrive', paras: 2, image: '/exterior-sign.jpg', link: 'directions' },
      { id: 'back', paras: 1, link: 'reservation' },
    ],
  },
  '/wine-belgian-beer-krabi': {
    heroImage: '/food-bourguignon.jpg',
    sections: [
      { id: 'intro', paras: 2 },
      { id: 'belgian', paras: 2 },
      { id: 'pairings', paras: 1, cards: 4 },
      { id: 'list', paras: 1, link: 'belgian' },
    ],
  },
}
