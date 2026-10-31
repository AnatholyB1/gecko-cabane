/**
 * Admin review tracking badges (Phase 4, REV-02, D-03, D-04).
 * Pure and client-safe: imports only date helpers and a type. Never handles review_token.
 */

import { addDays } from '@/utils/review-invitations'
import type { Reservation } from '@/types/database'

/** Ton sémantique (jetons --adm-*). Seul consommateur : ReservationDetails (libellé et titre). */
export type ReviewBadgeTone = 'neutral' | 'info' | 'warn' | 'ok'
export type ReviewBadge = { label: string; tone: ReviewBadgeTone; title?: string }

type BadgeInput = Pick<
  Reservation,
  | 'status'
  | 'reservation_date'
  | 'customer_email'
  | 'review_email_sent_at'
  | 'review_reminder_sent_at'
  | 'review_clicked_at'
>

const TZ = 'Asia/Bangkok'

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: TZ })
}

function fullTitle(prefix: string, iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ })
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ })
  return `${prefix} le ${date} à ${time}`
}

function isEligibleStatus(status: string): boolean {
  return status === 'confirmed' || status === 'completed'
}

export function getReviewBadges(r: BadgeInput, todayKrabi: string): ReviewBadge[] {
  if (!isEligibleStatus(r.status)) return []

  if (!r.customer_email || r.customer_email.trim() === '') {
    return [{ label: "Pas d'email : aucune invitation", tone: 'neutral' }]
  }

  const badges: ReviewBadge[] = []

  if (r.review_email_sent_at) {
    badges.push({
      label: `Invitation envoyée le ${shortDate(r.review_email_sent_at)}`,
      tone: 'info',
      title: fullTitle('Envoyée', r.review_email_sent_at),
    })
  } else if (r.reservation_date === todayKrabi || r.reservation_date === addDays(todayKrabi, -1)) {
    // UI-SPEC shows "demain" for both cases; for a service dated yesterday the send
    // happens today, so the label says "aujourd'hui" (accuracy fix, same style).
    const when = r.reservation_date === todayKrabi ? 'demain' : "aujourd'hui"
    badges.push({
      label: `Invitation prévue ${when} 11h (Krabi)`,
      tone: 'neutral',
    })
  }

  if (r.review_reminder_sent_at) {
    badges.push({
      label: `Rappel envoyé le ${shortDate(r.review_reminder_sent_at)}`,
      tone: 'warn',
      title: fullTitle('Envoyé', r.review_reminder_sent_at),
    })
  }

  if (r.review_clicked_at) {
    badges.push({
      label: `Lien cliqué le ${shortDate(r.review_clicked_at)}`,
      tone: 'ok',
      title: fullTitle('Cliqué', r.review_clicked_at),
    })
  }

  return badges.slice(0, 3)
}

/** D-03: confirmed, service today or yesterday (Krabi), invitation not yet sent. */
export function showNoShowDeadline(r: BadgeInput, todayKrabi: string): boolean {
  return (
    r.status === 'confirmed' &&
    !r.review_email_sent_at &&
    (r.reservation_date === todayKrabi || r.reservation_date === addDays(todayKrabi, -1))
  )
}
