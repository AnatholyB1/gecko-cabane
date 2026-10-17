/**
 * Review link tracking (REV-01, REV-03, D-13, D-14).
 *
 * Server only: never import from a 'use client' file (enforced by
 * tests/review-click-wiring.test.ts; the 'server-only' package is not a dependency).
 *
 * Service role is required because gecko_reservations has no public policy
 * (customer PII). Only the locale column is read and only review_clicked_at is
 * written, keyed by the random review_token; nothing is returned to the client.
 *
 * Known limitation (accepted, RESEARCH Pitfall 2): email security scanners that
 * pre-fetch links may mark a click and suppress one reminder.
 */

import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'

/** Locale stored on the reservation for this token, or null (unknown token or DB error). */
export async function lookupReviewLocale(token: string): Promise<string | null> {
  try {
    const { data, error } = await createAdminClient()
      .from('gecko_reservations')
      .select('locale')
      .eq('review_token', token)
      .maybeSingle()
    if (error) {
      Sentry.captureException(new Error('review locale lookup failed'))
      return null
    }
    return data?.locale ?? null
  } catch (err) {
    Sentry.captureException(err)
    return null
  }
}

/** Marks the first click only. Errors are swallowed: a DB failure never blocks the page (D-13). */
export async function markReviewClicked(token: string): Promise<void> {
  try {
    const { error } = await createAdminClient()
      .from('gecko_reservations')
      .update({ review_clicked_at: new Date().toISOString() })
      .eq('review_token', token)
      .is('review_clicked_at', null)
    if (error) Sentry.captureException(new Error('review click mark failed'))
  } catch (err) {
    Sentry.captureException(err)
  }
}
