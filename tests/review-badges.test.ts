/**
 * Admin review tracking badges (REV-02, D-03, D-04).
 */

import { describe, it, expect } from 'vitest'
import { getReviewBadges, showNoShowDeadline } from '../src/utils/review-badges'

const TODAY = '2026-10-20'
const base = {
  status: 'confirmed' as const,
  reservation_date: '2026-10-15',
  customer_email: 'a@b.co' as string | null,
  review_email_sent_at: null as string | null,
  review_reminder_sent_at: null as string | null,
  review_clicked_at: null as string | null,
}

describe('getReviewBadges', () => {
  it('returns nothing for pending, cancelled, no_show', () => {
    for (const status of ['pending', 'cancelled', 'no_show'] as const) {
      expect(getReviewBadges({ ...base, status }, TODAY)).toEqual([])
    }
  })

  it('flags a missing email', () => {
    const b = getReviewBadges({ ...base, customer_email: null }, TODAY)
    expect(b).toHaveLength(1)
    expect(b[0].label).toBe("Pas d'email : aucune invitation")
    expect(b[0].className).toContain('bg-gray-100 text-gray-600')
  })

  it('announces a planned invitation for today and yesterday only', () => {
    const t = getReviewBadges({ ...base, reservation_date: '2026-10-20' }, TODAY)
    expect(t[0].label).toBe('Invitation prévue demain 11h (Krabi)')
    const y = getReviewBadges({ ...base, reservation_date: '2026-10-19' }, TODAY)
    expect(y[0].label).toBe("Invitation prévue aujourd'hui 11h (Krabi)")
    expect(getReviewBadges(base, TODAY)).toEqual([])
  })

  it('shows invitation sent with Krabi time in the title', () => {
    const b = getReviewBadges({ ...base, review_email_sent_at: '2026-10-18T04:12:00Z' }, TODAY)
    expect(b).toHaveLength(1)
    expect(b[0].label).toContain('Invitation envoyée le')
    expect(b[0].label).toContain('18')
    expect(b[0].className).toContain('bg-blue-100 text-blue-700')
    expect(b[0].title).toContain('11:12')
  })

  it('orders invitation, reminder, clicked', () => {
    const b = getReviewBadges(
      {
        ...base,
        status: 'completed',
        review_email_sent_at: '2026-10-18T04:12:00Z',
        review_reminder_sent_at: '2026-10-22T04:12:00Z',
        review_clicked_at: '2026-10-23T04:12:00Z',
      },
      TODAY
    )
    expect(b.map((x) => x.label.split(' le ')[0])).toEqual([
      'Invitation envoyée',
      'Rappel envoyé',
      'Lien cliqué',
    ])
    expect(b[1].className).toContain('bg-amber-100 text-amber-700')
    expect(b[2].className).toContain('bg-green-100 text-green-700')
  })

  it('never leaks a token', () => {
    const r = { ...base, review_token: 'SECRET-TOKEN', review_email_sent_at: '2026-10-18T04:12:00Z' }
    const json = JSON.stringify(getReviewBadges(r, TODAY))
    expect(json).not.toContain('SECRET-TOKEN')
  })
})

describe('showNoShowDeadline', () => {
  it('is true only for confirmed, today/yesterday, nothing sent', () => {
    expect(showNoShowDeadline({ ...base, reservation_date: '2026-10-20' }, TODAY)).toBe(true)
    expect(showNoShowDeadline({ ...base, reservation_date: '2026-10-19' }, TODAY)).toBe(true)
    expect(showNoShowDeadline({ ...base, reservation_date: '2026-10-18' }, TODAY)).toBe(false)
    expect(showNoShowDeadline({ ...base, status: 'completed', reservation_date: '2026-10-20' }, TODAY)).toBe(false)
    expect(
      showNoShowDeadline(
        { ...base, reservation_date: '2026-10-20', review_email_sent_at: '2026-10-20T04:00:00Z' },
        TODAY
      )
    ).toBe(false)
  })
})
