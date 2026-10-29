/**
 * Admin WhatsApp review invitation templates (REV-05, D-10)
 */

import { describe, it, expect } from 'vitest'
import {
  REVIEW_WA_LINK,
  REVIEW_WA_TEMPLATES,
  reviewWhatsAppShareUrl,
} from '@/utils/review-whatsapp'

const INCENTIVE = /remise|offert|cadeau|gagner|discount|free|gift|win|reward|rabatt|gratis|geschenk/i
const STARS = /5 étoiles|5 stars|5 sterne/i

describe('review WhatsApp templates', () => {
  it('uses the tracked review link', () => {
    expect(REVIEW_WA_LINK).toBe('https://geckocabanerestaurant.com/review?src=wa')
  })

  it('has fr, en, de in order', () => {
    expect(REVIEW_WA_TEMPLATES.map((t) => t.lang)).toEqual(['fr', 'en', 'de'])
  })

  it('contains the link once, no incentive, no star request', () => {
    for (const t of REVIEW_WA_TEMPLATES) {
      expect(t.text.split(REVIEW_WA_LINK).length - 1).toBe(1)
      expect(t.text).not.toMatch(INCENTIVE)
      expect(t.text).not.toMatch(STARS)
    }
  })

  it('only de needs human review', () => {
    expect(REVIEW_WA_TEMPLATES.filter((t) => t.needsReview).map((t) => t.lang)).toEqual(['de'])
  })

  it('share url lets the owner pick the contact', () => {
    const text = REVIEW_WA_TEMPLATES[0].text
    const url = reviewWhatsAppShareUrl(text)
    expect(url.startsWith('https://wa.me/?text=')).toBe(true)
    expect(decodeURIComponent(url.slice('https://wa.me/?text='.length))).toBe(text)
  })
})
