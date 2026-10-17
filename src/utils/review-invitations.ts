/**
 * Pure review-invitation logic (Phase 4, REV-02/REV-03).
 * No supabase/resend/next imports: the admin client page imports this module.
 */

import { SITE_URL } from '@/utils/seo'
import type { EmailLocale } from '@/utils/resend'

/** Krabi is UTC+7 all year, no DST (D-05). */
const KRABI_OFFSET_MS = 7 * 3600_000

/** Honored by default: anything confirmed and not later cancelled/no-show (D-01, D-02). */
export const REVIEW_ELIGIBLE_STATUSES = ['confirmed', 'completed'] as const

/** Offsets in days relative to Krabi today (D-07). */
export const INVITE_WINDOW = { from: -3, to: -1 }
export const REMIND_WINDOW = { from: -7, to: -5 }

export type ReviewCandidate = {
  id: number
  status: string
  reservation_date: string
  customer_name: string
  customer_email: string | null
  locale: string
  review_token: string
  review_email_sent_at: string | null
  review_reminder_sent_at: string | null
  review_clicked_at: string | null
}

/** Current calendar date (YYYY-MM-DD) in Krabi, independent of the server zone. */
export function krabiToday(now: Date): string {
  return new Date(now.getTime() + KRABI_OFFSET_MS).toISOString().slice(0, 10)
}

/** Adds n days to a YYYY-MM-DD date using UTC arithmetic. */
export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

function isEligible(r: ReviewCandidate): boolean {
  return (
    (REVIEW_ELIGIBLE_STATUSES as readonly string[]).includes(r.status) &&
    !!r.customer_email &&
    r.customer_email.trim() !== ''
  )
}

function inWindow(date: string, today: string, w: { from: number; to: number }): boolean {
  return date >= addDays(today, w.from) && date <= addDays(today, w.to)
}

export function selectReviewInvitations(
  rows: ReviewCandidate[],
  todayKrabi: string
): { invite: ReviewCandidate[]; remind: ReviewCandidate[] } {
  const invite: ReviewCandidate[] = []
  const remind: ReviewCandidate[] = []
  for (const r of rows) {
    if (!isEligible(r)) continue
    if (
      !r.review_email_sent_at &&
      inWindow(r.reservation_date, todayKrabi, INVITE_WINDOW)
    ) {
      invite.push(r)
    } else if (
      r.review_email_sent_at &&
      !r.review_clicked_at &&
      !r.review_reminder_sent_at &&
      inWindow(r.reservation_date, todayKrabi, REMIND_WINDOW)
    ) {
      remind.push(r)
    }
  }
  return { invite, remind }
}

/** fr -> fr; en, de, sv and anything else -> en (D-08). */
export function emailLocaleFor(locale: string): EmailLocale {
  return locale === 'fr' ? 'fr' : 'en'
}

export function buildEmailReviewUrl(token: string): string {
  return `${SITE_URL}/review?rid=${encodeURIComponent(token)}&src=email`
}
