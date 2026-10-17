/**
 * "Un souci ?" private feedback (REV-07, D-23): request schema and owner email.
 * Server-side only; the client form never imports this module.
 */

import { z } from 'zod'
import { escapeHtml, stripLineBreaks } from './html'
import { isReviewToken, sanitizeReviewSource, type ReviewSource } from './review-links'

export const FEEDBACK_MESSAGE_MIN = 5
export const FEEDBACK_MESSAGE_MAX = 1000

export type FeedbackErrorCode =
  | 'invalid_body'
  | 'invalid_message'
  | 'invalid_email'
  | 'too_fast'
  | 'rate_limited'
  | 'server_error'

export const feedbackRequestSchema = z.object({
  message: z.string().trim().min(FEEDBACK_MESSAGE_MIN).max(FEEDBACK_MESSAGE_MAX),
  email: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().toLowerCase().pipe(z.email().max(254)).optional()
  ),
  src: z.unknown().transform((v) => sanitizeReviewSource(typeof v === 'string' ? v : null)),
  rid: z
    .unknown()
    .transform((v) => (typeof v === 'string' && isReviewToken(v) ? v : null)),
  locale: z.enum(['fr', 'en']).catch('fr'),
  company_url: z.string().max(200).optional(),
  form_started_at: z.number().int().optional(),
})

export function feedbackErrorCode(error: z.ZodError): FeedbackErrorCode {
  const field = error.issues[0]?.path[0]
  if (field === 'email') return 'invalid_email'
  if (field === 'message') return 'invalid_message'
  return 'invalid_body'
}

export function feedbackEmail(args: {
  message: string
  email?: string
  src: ReviewSource | null
  rid: string | null
  locale: 'fr' | 'en'
}): { subject: string; html: string; text: string } {
  const source = args.src ?? 'inconnue'
  const subject = stripLineBreaks(`Un souci ? Message reçu depuis /review (source : ${source})`)
  const ridLine = args.rid ? `présent (${args.rid})` : 'absent'
  const contact = args.email ?? 'non fourni'

  const html = `<div style="font-family:Arial,sans-serif;color:#222">
<h2 style="margin:0 0 12px">Un souci ? Nouveau message d'un client</h2>
<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(args.message)}</pre>
<p>Source : ${escapeHtml(source)}<br>
Langue : ${escapeHtml(args.locale)}<br>
Lien d'invitation (rid) : ${escapeHtml(ridLine)}<br>
Email : ${escapeHtml(contact)}</p>
</div>`

  const text = [
    "Un souci ? Nouveau message d'un client",
    '',
    args.message,
    '',
    `Source : ${source}`,
    `Langue : ${args.locale}`,
    `Lien d'invitation (rid) : ${ridLine}`,
    `Email : ${contact}`,
  ].join('\n')

  return { subject, html, text }
}
