/**
 * Social proof (plan 05-03, CONV-01, D-11..D-15).
 * Config validation, aggregateRating rules, placement and SOCIAL fold (source scans).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  SOCIAL_PROOF,
  SHOW_AGGREGATE_RATING,
  MAX_REVIEWS,
  aggregateRatingFor,
  visibleReviews,
  isValidSocialReview,
  type SocialReview,
} from '../src/utils/social-proof'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

// Local fixture, only to exercise the functions; never part of the shipped config.
const fixture: SocialReview = {
  name: 'Test',
  country: 'France',
  lang: 'fr',
  source: 'google',
  url: 'https://www.google.com/maps/place/?q=place_id:X',
  text: 'x',
  rating: 5,
}

describe('social-proof config', () => {
  it('has the rating constants', () => {
    expect(SOCIAL_PROOF.rating).toBe(4.7)
    expect(SOCIAL_PROOF.reviewCount).toBe(1065)
    expect(SOCIAL_PROOF.bestRating).toBe(5)
    expect(typeof SHOW_AGGREGATE_RATING).toBe('boolean')
  })

  it('carries the owner-supplied figures per source; schema mirrors Google only', () => {
    expect(SOCIAL_PROOF.ratings.google).toEqual({ rating: 4.7, reviewCount: 1065 })
    expect(SOCIAL_PROOF.ratings.tripadvisor).toEqual({ rating: 4.7, reviewCount: 814 })
    expect(SOCIAL_PROOF.ratingSource).toBe('google')
    expect(SOCIAL_PROOF.reviewCount).toBe(SOCIAL_PROOF.ratings.google.reviewCount)
  })

  it('documents the Google self-serving review-snippet policy next to the flag', () => {
    const src = readFileSync(join(__dirname, '..', 'src/utils/social-proof.ts'), 'utf8')
    expect(src).toMatch(/self-serving/)
  })

  it('every shipped review is valid and within the cap', () => {
    for (const r of SOCIAL_PROOF.reviews) expect(isValidSocialReview(r)).toBe(true)
    expect(SOCIAL_PROOF.reviews.length).toBeLessThanOrEqual(MAX_REVIEWS)
    expect(MAX_REVIEWS).toBe(4)
  })

  it('isValidSocialReview accepts the fixture and rejects bad input', () => {
    expect(isValidSocialReview(fixture)).toBe(true)
    expect(isValidSocialReview({ ...fixture, url: 'http://www.google.com/maps/x' })).toBe(false)
    expect(isValidSocialReview({ ...fixture, url: 'https://evil.example.com/x' })).toBe(false)
    expect(isValidSocialReview({ ...fixture, text: '' })).toBe(false)
    expect(isValidSocialReview({ ...fixture, lang: 'english' })).toBe(false)
    expect(isValidSocialReview({ ...fixture, rating: 6 })).toBe(false)
    expect(isValidSocialReview({ ...fixture, source: 'yelp' as never })).toBe(false)
  })

  it('visibleReviews caps at 4 in config order', () => {
    const reviews = Array.from({ length: 6 }, (_, i) => ({ ...fixture, name: `N${i}` }))
    const out = visibleReviews({ ...SOCIAL_PROOF, reviews })
    expect(out.map((r) => r.name)).toEqual(['N0', 'N1', 'N2', 'N3'])
  })

  // Phase 5 D-14: aggregateRating reintroduced from social-proof.ts
  it('aggregateRatingFor follows the D-14 rules', () => {
    expect(aggregateRatingFor({ ...SOCIAL_PROOF, reviews: [] }, true)).toBeNull()
    const cfg = { ...SOCIAL_PROOF, reviews: [fixture] }
    expect(aggregateRatingFor(cfg, true)).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.7,
      reviewCount: 1065,
      bestRating: 5,
      worstRating: 1,
    })
    expect(aggregateRatingFor(cfg, false)).toBeNull()
  })
})

describe('owner-selected reviews (05-12/05-13)', () => {
  const candidates = read('.planning/workstreams/conversion/phases/05-conversion-et-mesure/REVIEW-CANDIDATES.md').replace(/\r\n/g, '\n')
  const selection = candidates.split('## Sélection du propriétaire')[1] ?? ''
  const deferred = /report|refus/i.test(selection) && !/\[x\]/i.test(selection)

  it('ships 3-4 verbatim owner-selected reviews and emits aggregateRating', () => {
    if (deferred) {
      expect(SOCIAL_PROOF.reviews.length).toBe(0)
      expect(aggregateRatingFor()).toBeNull()
      return
    }
    expect(SOCIAL_PROOF.reviews.length).toBeGreaterThanOrEqual(3)
    expect(SOCIAL_PROOF.reviews.length).toBeLessThanOrEqual(4)
    for (const r of SOCIAL_PROOF.reviews) {
      expect(isValidSocialReview(r)).toBe(true)
      const text = r.text.replace(/\r\n/g, '\n')
      expect(candidates, `text of ${r.name}`).toContain(text)
      // name and url must belong to the same candidate block as the text
      const block = candidates.split('## Candidat ').find((b) => b.includes(text)) ?? ''
      expect(block).toContain(`Prénom : ${r.name}`)
      expect(block).toContain(r.url)
      expect(block).toContain(`Pays : ${r.country}`)
    }
    expect(aggregateRatingFor()).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.7,
      reviewCount: 1065,
      bestRating: 5,
      worstRating: 1,
    })
  })
})

describe('socialProof messages', () => {
  const keys = [
    'eyebrow', 'title', 'ratingAria', 'countLabel', 'travellersChoice', 'travellersChoiceYear',
    'originalLanguage', 'viewSource', 'starsSr', 'leaveReview', 'googleReviews',
    'tripadvisorReviews', 'facebook',
  ]
  it('has all keys in fr and en without incentive words', () => {
    for (const l of ['fr', 'en']) {
      const m = JSON.parse(read(`messages/${l}.json`))
      for (const k of keys) {
        expect(m.socialProof?.[k], `${l}.socialProof.${k}`).toBeTruthy()
        expect(m.socialProof[k]).not.toMatch(/remise|offert|cadeau|gagner|discount|free|gift|win|reward/i)
      }
    }
  })
})

describe('SocialProof wiring', () => {
  const page = read('src/app/[locale]/page.tsx')
  const comp = read('src/components/SocialProof.tsx')

  it('is placed after #hours and before #reservation', () => {
    const i = page.indexOf('<SocialProof')
    expect(i).toBeGreaterThan(-1)
    expect(i).toBeGreaterThan(page.indexOf('id="hours"'))
    expect(i).toBeLessThan(page.indexOf('<section id="reservation"'))
  })

  it('component is a safe server component', () => {
    expect(comp).not.toContain('use client')
    for (const s of [
      "src: 'site'", 'prefetch={false}', 'lang={', 'target="_blank"', 'rel="noopener noreferrer"',
      'SAME_AS', 'facebook.com', 'SOCIAL_PROOF', 'visibleReviews',
    ]) {
      expect(comp).toContain(s)
    }
    expect(comp).not.toContain('dangerouslySetInnerHTML')
    for (const n of ['4,7', '4.7', '1062', '1065', '814']) expect(comp).not.toContain(n)
  })

  it('displays one rating block per source with its true name and own figures', () => {
    expect(comp).toContain('SOCIAL_PROOF.ratings[key]')
    expect(comp).toContain("'Google'")
    expect(comp).toContain("'TripAdvisor'")
    expect(comp).toContain('data-rating-source')
    // Travellers' Choice is a TripAdvisor badge: only inside the TripAdvisor block
    expect(comp).toContain("s.key === 'tripadvisor' && travellersChoice.awarded")
  })

  // Phase 5: SOCIAL block folded into SocialProof, rating shown once
  it('old SOCIAL block is folded (no duplicate rating)', () => {
    expect(page).not.toContain('SOCIAL ═══')
    expect(page).not.toContain("t('home.reviewsLine')")
    expect(page).not.toContain("t('social.tripAdvisorText')")
    expect(page).not.toContain('fr.tripadvisor.be')
  })
})
