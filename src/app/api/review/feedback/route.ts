import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/utils/supabase/server'
import type { ApiResponse } from '@/types/database'
import { isHoneypotFilled, checkFillTime } from '@/utils/anti-bot'
import { checkFeedbackRateLimit, getClientIp } from '@/utils/rate-limit'
import {
  feedbackRequestSchema,
  feedbackErrorCode,
  feedbackEmail,
  type FeedbackErrorCode,
} from '@/utils/review-feedback'
import { getResendClient, RESEND_FROM_EMAIL, RESTAURANT_NOTIFICATION_EMAIL } from '@/utils/resend'

// POST: private "Un souci ?" message to the owner (public, nothing stored — D-23)
export async function POST(request: NextRequest) {
  const fail = (error: string, code: FeedbackErrorCode, status: number) =>
    NextResponse.json<ApiResponse<never>>({ error, code }, { status })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('Requête invalide', 'invalid_body', 400)
  }
  const input = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>

  // Honeypot: fake success, no DB, no email.
  if (isHoneypotFilled(input.company_url)) {
    return NextResponse.json<ApiResponse<{ ok: true }>>({ data: { ok: true } })
  }

  if (!checkFillTime(input.form_started_at, Date.now())) {
    return fail('Envoi trop rapide, merci de réessayer.', 'too_fast', 400)
  }

  try {
    const parsed = feedbackRequestSchema.safeParse(body)
    if (!parsed.success) {
      return fail('Message invalide', feedbackErrorCode(parsed.error), 400)
    }
    const r = parsed.data

    // Service role: gecko_rate_limit_hit is executable by service_role only; no other table is touched (D-23: nothing stored)
    const admin = createAdminClient()
    const limits = await checkFeedbackRateLimit(admin, getClientIp(request.headers))
    if (limits.limited) {
      return NextResponse.json<ApiResponse<never>>(
        {
          error:
            r.locale === 'fr'
              ? 'Trop de messages depuis votre connexion. Écrivez-nous directement sur WhatsApp : +66 81 958 5945.'
              : 'Too many messages from your connection. Message us directly on WhatsApp: +66 81 958 5945.',
          code: 'rate_limited',
        },
        { status: 429 }
      )
    }

    after(async () => {
      try {
        const resend = getResendClient()
        if (!resend || !RESTAURANT_NOTIFICATION_EMAIL) {
          Sentry.captureMessage('review feedback email not configured', 'error')
          return
        }
        const mail = feedbackEmail({
          message: r.message,
          email: r.email,
          src: r.src,
          rid: r.rid,
          locale: r.locale,
        })
        await resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: RESTAURANT_NOTIFICATION_EMAIL,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          ...(r.email ? { replyTo: r.email } : {}),
        })
      } catch (e) {
        Sentry.captureException(e)
      }
    })

    return NextResponse.json<ApiResponse<{ ok: true }>>({ data: { ok: true } })
  } catch (e) {
    Sentry.captureException(e)
    return fail('Erreur serveur', 'server_error', 500)
  }
}
