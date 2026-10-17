import { describe, it, expect } from 'vitest'
import { reviewInvitationEmail } from '../src/utils/resend'

const URL_ = 'https://geckocabanerestaurant.com/review?rid=abc-123&src=email'
const URL_ESC = 'https://geckocabanerestaurant.com/review?rid=abc-123&amp;src=email'
const PROMO = /\b(remise|offert|cadeau|gagner|discount|free|gift|win|reward)\b/i

const cases = [
  ['fr', 'invite', 'Votre visite au Gecko Cabane'],
  ['en', 'invite', 'Your visit to Gecko Cabane'],
  ['fr', 'reminder', 'Un petit mot sur votre visite ?'],
  ['en', 'reminder', 'A quick word about your visit?'],
] as const

describe('reviewInvitationEmail', () => {
  it.each(cases)('%s %s subject', (locale, kind, subject) => {
    const e = reviewInvitationEmail(locale, URL_, kind, 'Eve')
    expect(e.subject).toBe(subject)
    expect(e.subject.length).toBeLessThanOrEqual(40)
    expect(e.subject).not.toContain('!')
    expect(e.subject).not.toMatch(/[\r\n]/)
  })

  it.each(cases)('%s %s link, lang, copy, no promo', (locale, kind) => {
    const e = reviewInvitationEmail(locale, URL_, kind, 'Eve')
    expect(e.html.split(URL_ESC)).toHaveLength(3)
    expect(e.text).toContain(URL_)
    expect(e.html).toContain(`lang="${locale}"`)
    expect(e.html).toContain(locale === 'fr' ? 'Donner mon avis' : 'Leave a review')
    expect(e.html).toContain(
      locale === 'fr'
        ? 'Vous recevez ce message suite à votre réservation au Gecko Cabane.'
        : 'You are receiving this message following your reservation at Gecko Cabane.'
    )
    expect(e.html).not.toMatch(PROMO)
    expect(e.text).not.toMatch(PROMO)
    expect(e.html).not.toMatch(/5 étoiles|5 stars/i)
    expect(e.text).not.toMatch(/5 étoiles|5 stars/i)
    expect(e.html).not.toContain('<img')
  })

  it('escapes the name and uses the first token only', () => {
    const e = reviewInvitationEmail('fr', URL_, 'invite', '<b>Eve</b> Martin')
    expect(e.html).toContain('&lt;b&gt;Eve&lt;/b&gt;')
    expect(e.html).not.toContain('<b>Eve')
    expect(e.html).not.toContain('Martin')
  })

  it('omits the greeting for empty names', () => {
    for (const n of ['', '   ', null, undefined]) {
      expect(reviewInvitationEmail('fr', URL_, 'invite', n).html).not.toContain('Bonjour ,')
      expect(reviewInvitationEmail('en', URL_, 'invite', n).html).not.toContain('Hello ,')
      expect(reviewInvitationEmail('fr', URL_, 'invite', n).html).not.toContain('Bonjour')
    }
  })
})
