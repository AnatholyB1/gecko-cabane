/**
 * Bilingual email template tests (fr default, en on request).
 */

import { describe, it, expect } from 'vitest'
import {
  customerPendingEmail,
  customerStatusEmail,
  restaurantNotificationEmail,
  formatReservationDate,
  reviewInvitationEmail,
  EMAIL_LOCALES,
} from '../src/utils/resend'
import { emailLocaleFor } from '../src/utils/review-invitations'

const r = {
  customer_name: 'Alice',
  customer_email: 'alice@example.com',
  customer_phone: '+447700900123',
  reservation_date: '2026-10-24',
  reservation_time: '19:00',
  party_size: 2,
  occasion: null as string | null,
}

describe('formatReservationDate', () => {
  it('formats in English', () => {
    expect(formatReservationDate('2026-10-24', 'en')).toBe('Saturday 24 October 2026')
  })
  it('keeps French by default', () => {
    expect(formatReservationDate('2026-10-24')).toBe('samedi 24 octobre 2026')
  })
})

describe('customerPendingEmail', () => {
  it('defaults to French', () => {
    const { subject, html } = customerPendingEmail(r)
    expect(subject).toBe('Votre demande de réservation — Gecko Cabane')
    expect(html).toContain('lang="fr"')
    expect(html).toContain('samedi 24 octobre 2026')
  })
  it('renders English', () => {
    const { subject, html } = customerPendingEmail(r, 'en')
    expect(subject).toBe('Your reservation request at Gecko Cabane')
    expect(html).toContain('lang="en"')
    expect(html).toContain('Saturday 24 October 2026')
    expect(html).toContain('WhatsApp')
    expect(html).toContain('+66 81 958 5945')
    expect(html).not.toContain('Merci')
  })
})

describe('customerStatusEmail', () => {
  it('English confirmed and cancelled', () => {
    const c = customerStatusEmail(r, 'confirmed', 'en')
    const x = customerStatusEmail(r, 'cancelled', 'en')
    expect(c.html).toContain('lang="en"')
    expect(c.subject).toBe('Reservation confirmed — Gecko Cabane')
    expect(x.subject).toBe('Reservation cancelled — Gecko Cabane')
  })
  it('French unchanged without locale', () => {
    expect(customerStatusEmail(r, 'confirmed').subject).toBe('Réservation confirmée — Gecko Cabane')
    expect(customerStatusEmail(r, 'cancelled').html).toContain('lang="fr"')
  })
})

describe('restaurantNotificationEmail', () => {
  it('shows guest language, stays French', () => {
    const { html } = restaurantNotificationEmail({ ...r, locale: 'en' })
    expect(html).toContain('Langue du client')
    expect(html).toContain('EN')
    expect(html).toContain('lang="fr"')
  })
})

describe('German email copy (inactive until DE publication, D-09)', () => {
  it('has COPY.de and REVIEW_COPY.de entries', () => {
    const pending = customerPendingEmail(r, 'de')
    expect(pending.html).toContain('lang="de"')
    expect(pending.subject).not.toBe(customerPendingEmail(r, 'en').subject)
    const rev = reviewInvitationEmail('de', 'https://example.com/review?rid=x', 'invite', 'Alice')
    expect(rev.subject).not.toBe(reviewInvitationEmail('en', 'https://example.com/review?rid=x', 'invite', 'Alice').subject)
  })
  it('EMAIL_LOCALES whitelist keeps de on English emails', () => {
    expect([...EMAIL_LOCALES]).toEqual(['fr', 'en'])
    expect(emailLocaleFor('de')).toBe('en')
    expect(emailLocaleFor('fr')).toBe('fr')
    expect(emailLocaleFor('sv')).toBe('en')
  })
})
