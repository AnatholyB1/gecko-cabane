/**
 * Review counters (REV-06, D-07, D-08).
 *
 * Server only: never import from a 'use client' file (enforced by
 * tests/review-click-wiring.test.ts).
 *
 * Service role is required because gecko_review_clicks is written only through the
 * security-definer RPC executable by service_role; no personal data is passed.
 * Errors are swallowed: a DB failure never breaks the page or the redirect.
 */

import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import type { ReviewHitKind, ReviewStatSource } from '@/utils/review-links'

export async function recordReviewHit(source: ReviewStatSource, kind: ReviewHitKind): Promise<void> {
  try {
    const { error } = await createAdminClient().rpc('gecko_review_click_hit', {
      p_source: source,
      p_kind: kind,
    })
    if (error) Sentry.captureException(new Error('review click count failed'))
  } catch (err) {
    Sentry.captureException(err)
  }
}
