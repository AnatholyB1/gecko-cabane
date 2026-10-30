/**
 * Saisie manuelle hebdomadaire des avis Google (KPI-07, D-03) et alerte immédiate
 * pour un avis <= 3 étoiles (D-08). Module serveur uniquement : la page admin
 * n'importe pas ce fichier (validation côté serveur).
 */

import { z } from 'zod'
import { ALERT_THRESHOLDS } from './kpi-alerts'
import { escapeHtml, stripLineBreaks } from './html'
import { parseWeekParam } from './kpi-week'

export const MANUAL_NOTE_MAX = 500

/** Entier optionnel borné ; '', null, absent => null. */
const boundedInt = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.number().int().min(min).max(max).nullable()
  )

export const manualKpiSchema = z.object({
  week_start: z
    .string()
    .refine((v) => parseWeekParam(v) !== null, { message: 'week_start must be a valid Monday' }),
  google_reviews_total: boundedInt(0, 100000),
  google_new_reviews: boundedInt(0, 1000),
  google_min_rating: boundedInt(1, 5),
  manual_note: z.preprocess(
    (v) => {
      if (v === undefined || v === null) return null
      if (typeof v !== 'string') return v
      const t = v.trim()
      return t === '' ? null : t
    },
    z.string().max(MANUAL_NOTE_MAX).nullable()
  ),
})

export type ManualKpiInput = z.infer<typeof manualKpiSchema>

/** Alerte uniquement pour une note basse nouvelle ou modifiée. */
export function shouldAlertLowRating(
  previous: number | null | undefined,
  next: number | null,
  max: number = ALERT_THRESHOLDS.lowRatingMax
): boolean {
  return next !== null && next <= max && next !== previous
}

export function lowRatingAlertEmail(input: {
  weekStart: string
  rating: number
  note: string | null
  adminUrl: string
}): { subject: string; html: string; text: string } {
  const subject = stripLineBreaks(
    `Alerte avis ${input.rating}/5 saisi pour la semaine du ${input.weekStart}`
  )
  const noteText = input.note ?? 'Aucune note libre.'
  const noteLine = input.note ? input.note : 'Aucune note libre.'
  const reminder =
    'Pensez à répondre à l’avis sous 48 h (modèles : docs/ph6/review-replies.md).'

  const html = `<div style="font-family:Arial,sans-serif;color:#222">
<h2 style="margin:0 0 12px">Alerte avis : ${escapeHtml(String(input.rating))}/5</h2>
<p>Semaine du ${escapeHtml(input.weekStart)}</p>
<p>Note libre :</p>
<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(noteLine)}</pre>
<p>${escapeHtml(reminder)}</p>
<p><a href="${escapeHtml(input.adminUrl)}">Ouvrir le tableau de bord KPI</a></p>
</div>`

  const text = [
    `Alerte avis : ${input.rating}/5`,
    `Semaine du ${input.weekStart}`,
    '',
    `Note libre : ${noteText}`,
    '',
    reminder,
    `Tableau de bord KPI : ${input.adminUrl}`,
  ].join('\n')

  return { subject, html, text }
}
