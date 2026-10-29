import { describe, it, expect } from 'vitest'
import {
  krabiToday,
  addDays,
  selectReviewInvitations,
  emailLocaleFor,
  buildEmailReviewUrl,
  REVIEW_ELIGIBLE_STATUSES,
  type ReviewCandidate,
} from '../src/utils/review-invitations'

function makeRow(overrides: Partial<ReviewCandidate> = {}): ReviewCandidate {
  return {
    id: 1,
    status: 'confirmed',
    reservation_date: '2026-10-19',
    customer_name: 'Eve Martin',
    customer_email: 'eve@example.com',
    locale: 'fr',
    review_token: '3f0c1b7e-0000-4000-8000-000000000001',
    review_email_sent_at: null,
    review_reminder_sent_at: null,
    review_clicked_at: null,
    ...overrides,
  }
}

const SENT = '2026-10-16T04:00:00Z'
const TODAY = '2026-10-20'

describe('krabiToday', () => {
  it('uses UTC+7 regardless of server zone', () => {
    expect(krabiToday(new Date('2026-10-17T16:59:59Z'))).toBe('2026-10-17')
    expect(krabiToday(new Date('2026-10-17T17:00:00Z'))).toBe('2026-10-18')
    expect(krabiToday(new Date('2026-10-17T04:30:00Z'))).toBe('2026-10-17')
  })
})

describe('addDays', () => {
  it('handles month, year and leap boundaries', () => {
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29')
  })
})

describe('REVIEW_ELIGIBLE_STATUSES', () => {
  it('is confirmed and completed only', () => {
    expect([...REVIEW_ELIGIBLE_STATUSES]).toEqual(['confirmed', 'completed'])
  })
})

describe('selectReviewInvitations - invite', () => {
  it('includes J+1..J+3 confirmed/completed with email and no send', () => {
    const rows = [
      makeRow({ id: 1, reservation_date: '2026-10-19' }),
      makeRow({ id: 2, reservation_date: '2026-10-18', status: 'completed' }),
      makeRow({ id: 3, reservation_date: '2026-10-17' }),
    ]
    expect(selectReviewInvitations(rows, TODAY).invite.map((r) => r.id)).toEqual([1, 2, 3])
  })

  it('excludes out-of-window, bad status, no email, already sent', () => {
    const rows = [
      makeRow({ id: 1, reservation_date: '2026-10-20' }),
      makeRow({ id: 2, reservation_date: '2026-10-16' }),
      makeRow({ id: 3, status: 'pending' }),
      makeRow({ id: 4, status: 'cancelled' }),
      makeRow({ id: 5, status: 'no_show' }),
      makeRow({ id: 6, customer_email: null }),
      makeRow({ id: 7, customer_email: '   ' }),
      makeRow({ id: 8, review_email_sent_at: SENT }),
    ]
    expect(selectReviewInvitations(rows, TODAY).invite).toEqual([])
  })
})

describe('selectReviewInvitations - remind', () => {
  const base = { review_email_sent_at: SENT }

  it('includes J+5..J+7 with invite sent, not clicked, not reminded', () => {
    const rows = [
      makeRow({ id: 1, reservation_date: '2026-10-15', ...base }),
      makeRow({ id: 2, reservation_date: '2026-10-14', status: 'completed', ...base }),
      makeRow({ id: 3, reservation_date: '2026-10-13', ...base }),
    ]
    expect(selectReviewInvitations(rows, TODAY).remind.map((r) => r.id)).toEqual([1, 2, 3])
  })

  it('excludes clicked, reminded, never invited, bad status, out-of-window', () => {
    const rows = [
      makeRow({ id: 1, reservation_date: '2026-10-15', ...base, review_clicked_at: SENT }),
      makeRow({ id: 2, reservation_date: '2026-10-15', ...base, review_reminder_sent_at: SENT }),
      makeRow({ id: 3, reservation_date: '2026-10-15' }),
      makeRow({ id: 4, reservation_date: '2026-10-15', ...base, status: 'no_show' }),
      makeRow({ id: 5, reservation_date: '2026-10-15', ...base, status: 'cancelled' }),
      makeRow({ id: 6, reservation_date: '2026-10-16', ...base }),
      makeRow({ id: 7, reservation_date: '2026-10-12', ...base }),
    ]
    expect(selectReviewInvitations(rows, TODAY).remind).toEqual([])
  })

  it('never lists a row in both and keeps input order', () => {
    const rows = [
      makeRow({ id: 9, reservation_date: '2026-10-18' }),
      makeRow({ id: 4, reservation_date: '2026-10-14', ...base }),
      makeRow({ id: 2, reservation_date: '2026-10-19' }),
    ]
    const r = selectReviewInvitations(rows, TODAY)
    expect(r.invite.map((x) => x.id)).toEqual([9, 2])
    expect(r.remind.map((x) => x.id)).toEqual([4])
  })
})

describe('emailLocaleFor', () => {
  it('maps fr/en/de/sv to themselves and everything else to en', () => {
    expect(emailLocaleFor('fr')).toBe('fr')
    expect(emailLocaleFor('de')).toBe('de')
    expect(emailLocaleFor('sv')).toBe('sv')
    for (const l of ['en', '', 'xx']) expect(emailLocaleFor(l)).toBe('en')
  })
})

describe('buildEmailReviewUrl', () => {
  it('builds the tracked review link', () => {
    const t = '3f0c1b7e-0000-4000-8000-000000000001'
    expect(buildEmailReviewUrl(t)).toBe(
      `https://geckocabanerestaurant.com/review?rid=${t}&src=email`
    )
  })
})
