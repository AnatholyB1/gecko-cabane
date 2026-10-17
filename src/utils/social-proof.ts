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
  rating: 4.7,
  reviewCount: 1062,
  bestRating: 5,
  ratingSource: 'google' as const,
  // The year stays null until the owner confirms it; the badge renders without a year.
  travellersChoice: { awarded: true, year: null as number | null },
  reviews: [] as readonly SocialReview[],
}

export type SocialProofConfig = typeof SOCIAL_PROOF

// D-14 locked: single switch for the structured-data rating.
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
