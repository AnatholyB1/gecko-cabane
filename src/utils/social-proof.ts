/**
 * Social proof configuration (plan 05-03, CONV-01).
 *
 * D-11: reviews are copied verbatim from real Google / TripAdvisor reviews, chosen and
 *       validated by the owner. Never invented, rewritten or paraphrased. First name + country only.
 * D-13: each review is shown in its original language (no translation), with a link to the original.
 * D-14: aggregateRating in the Restaurant JSON-LD mirrors these constants. Google's review-snippet
 *       policy discourages self-controlled LocalBusiness ratings and aggregated third-party ratings
 *       (stars are usually not shown), so SHOW_AGGREGATE_RATING is the single off-switch
 *       (see OWNER-CHECKLIST).
 *
 * Owner gate: `reviews` ships empty. It is filled by plan 05-13 after the owner's choice in 05-12.
 * To add a review: append an object to `reviews` below and commit. At most MAX_REVIEWS are shown.
 *
 * This file must stay pure and must not import seo.ts (seo.ts imports it).
 */

export type SocialReview = {
  name: string
  country: string
  lang: string
  source: 'google' | 'tripadvisor'
  url: string
  text: string
  rating: number
}

export const MAX_REVIEWS = 4

export const SOCIAL_PROOF = {
  // Owner-supplied real figures (2026-10-30): Google 4.7 from 1065 reviews, TripAdvisor 4.7 from 814 reviews.
  // Each rating is displayed with its own source name; never merge or relabel them.
  ratings: {
    google: { rating: 4.7, reviewCount: 1065 },
    tripadvisor: { rating: 4.7, reviewCount: 814 },
  },
  // The schema.org aggregateRating mirrors the Google figures only (one source, never summed).
  rating: 4.7,
  reviewCount: 1065,
  bestRating: 5,
  ratingSource: 'google' as const,
  // The year stays null until the owner confirms it; the badge renders without a year.
  travellersChoice: { awarded: true, year: null as number | null },
  // Owner-validated on 2026-10-18 (05-12 REVIEW-CANDIDATES.md). Verbatim TripAdvisor reviews, original language.
  reviews: [
    {
      name: 'David C',
      country: 'Bahrain',
      lang: 'en',
      source: 'tripadvisor',
      url: 'https://www.tripadvisor.com/ShowUserReviews-g297927-d2413872-r1057914879-Gecko_Cabane_Restaurant_krabi-Krabi_Town_Krabi_Province.html',
      rating: 5,
      text: "Unexpected gem of a restaurant within Krabi Town affording an authentic French experience. Welcoming but unobtrusive French owner willing to offer guidance but not impose !\n\nBroad choice of either French or Thai dishes with a fine selection of wines and liqueurs and Belgian beer.\n\nWe fully enjoyed a well prepared boeuf bourguignon and pork chop main course together with the bananas flambéed.\n\nGood ambience notwithstanding the limited number of guests.\n\nRecommended - well worth the additional cost !",
    },
    {
      name: 'Jean-Louis305',
      country: 'Mexico',
      lang: 'fr',
      source: 'tripadvisor',
      url: 'https://www.tripadvisor.com/ShowUserReviews-g297927-d2413872-r1048507597-Gecko_Cabane_Restaurant_krabi-Krabi_Town_Krabi_Province.html',
      rating: 5,
      text: 'Un superbe restaurant qui réussit parfaitement le mariage entre la cuisine française et de savoureuses recettes thaïlandaises. Tout a été excellent de l’entrée au dessert, avec des produits frais et une exécution soignée. Que ce soit les plats français ou thaïs, chaque assiette est pleine de goût et de justesse. Mention spéciale pour l’excellente carte des vins, rare et très appréciable dans la région. Une très belle expérience culinaire que l’on recommande sans hésiter.',
    },
    {
      name: 'Swen S',
      country: 'Germany',
      lang: 'de',
      source: 'tripadvisor',
      url: 'https://www.tripadvisor.com/ShowUserReviews-g297927-d2413872-r1049536470-Gecko_Cabane_Restaurant_krabi-Krabi_Town_Krabi_Province.html',
      rating: 5,
      text: 'Wir hatten einen wunderbaren Besuch im Gecko Canaveral Restaurant in Krabi. Vom ersten Moment an haben wir uns sehr wohlgefühlt. Besonders hervorheben möchten wir den freundlichen Service und die angenehme, herzliche Art des Inhabers – man merkt sofort, mit wie viel Leidenschaft hier gearbeitet wird.\n\nDas Essen war hervorragend und geschmacklich absolut überzeugend. Frisch zubereitet, liebevoll angerichtet und einfach rundum lecker.\n\nWir kommen sehr gerne wieder und können das Restaurant uneingeschränkt weiterempfehlen. Vielen Dank',
    },
  ] as readonly SocialReview[],
}

export type SocialProofConfig = typeof SOCIAL_PROOF

// D-14 locked: single switch for the structured-data rating.
// Policy note: Google's review-snippet guidelines ignore (and may penalise with a manual action)
// aggregateRating that a business marks up about ITSELF on its own LocalBusiness/Restaurant page
// ("self-serving reviews"), and ratings aggregated from third-party sites. Stars are therefore
// unlikely to appear in search results and the markup carries a small risk. The figures are real
// and visibly displayed on the page (SocialProof), so the markup is not a hidden claim; flip this
// to false to remove it without touching the visible badge.
export const SHOW_AGGREGATE_RATING = true

const ALLOWED_HOSTS = ['www.google.com', 'google.com', 'g.page', 'maps.app.goo.gl']

function isAllowedUrl(raw: string): boolean {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return false
  }
  if (u.protocol !== 'https:') return false
  const host = u.hostname.toLowerCase()
  if (ALLOWED_HOSTS.includes(host)) return true
  return /(^|\.)tripadvisor\.[a-z.]+$/.test(host)
}

export function isValidSocialReview(r: SocialReview): boolean {
  if (!r) return false
  const filled = (s: unknown) => typeof s === 'string' && s.trim().length > 0
  return (
    filled(r.name) &&
    filled(r.country) &&
    filled(r.text) &&
    typeof r.lang === 'string' &&
    /^[a-z]{2}$/.test(r.lang) &&
    (r.source === 'google' || r.source === 'tripadvisor') &&
    typeof r.url === 'string' &&
    isAllowedUrl(r.url) &&
    Number.isInteger(r.rating) &&
    r.rating >= 1 &&
    r.rating <= 5
  )
}

export function visibleReviews(cfg: SocialProofConfig = SOCIAL_PROOF): SocialReview[] {
  return cfg.reviews.filter(isValidSocialReview).slice(0, MAX_REVIEWS)
}

export type AggregateRating = {
  '@type': 'AggregateRating'
  ratingValue: number
  reviewCount: number
  bestRating: number
  worstRating: number
}

/** D-14: emitted only when enabled and at least one validated review is displayed. */
export function aggregateRatingFor(
  cfg: SocialProofConfig = SOCIAL_PROOF,
  enabled: boolean = SHOW_AGGREGATE_RATING,
): AggregateRating | null {
  if (!enabled || visibleReviews(cfg).length === 0) return null
  return {
    '@type': 'AggregateRating',
    ratingValue: cfg.rating,
    reviewCount: cfg.reviewCount,
    bestRating: 5,
    worstRating: 1,
  }
}
