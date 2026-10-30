/**
 * Gabarit de l'email du rapport KPI hebdomadaire (phase 8). Français fixe.
 * Tout contenu dynamique est échappé (escapeHtml) ; aucune donnée personnelle.
 */

import type { KpiReportMode, WeeklyKpiRow } from '@/types/database'
import { escapeHtml } from '@/utils/html'
import { KPI_METRICS, UNAVAILABLE_LABEL, formatDelta, formatKpiValue } from '@/utils/kpi-format'
import { reportSubject } from '@/utils/kpi-mode'

const NO_ALERT = 'Aucune alerte cette semaine'
const NO_NARRATIVE = 'Lecture non disponible cette semaine'
const FIRST_WEEK = 'Aucune semaine précédente : première semaine de suivi.'
const CLICKS_NOTE = 'approximation : compteurs mensuels'

const TD = 'padding:6px 8px;border-bottom:1px solid #E8DCC8;font-size:14px;color:#5C4A3A;'
const H2 = 'color:#0C3C2D;font-size:16px;margin:24px 0 8px;'
const P = 'color:#5C4A3A;font-size:14px;line-height:1.6;margin:0 0 8px;'

function clicksLines(clicks: Record<string, number> | null): string[] {
  if (!clicks || Object.keys(clicks).length === 0) return [UNAVAILABLE_LABEL]
  return Object.entries(clicks).map(([source, n]) => `${source} : ${n}`)
}

export function weeklyReportEmail(input: {
  row: WeeklyKpiRow
  previous: WeeklyKpiRow | null
  mode: KpiReportMode
  adminUrl: string
}): { subject: string; html: string; text: string } {
  const { row, previous, mode, adminUrl } = input
  const subject = reportSubject(mode, { start: row.week_start, end: row.week_end })
  const isTest = mode !== 'live'

  const lecture = row.narrative?.lecture ?? []
  const actions = row.narrative?.actions ?? []
  const alerts = row.alerts ?? []
  const unavailable = Object.entries(row.sources_status ?? {})
    .filter(([, state]) => state === 'unavailable')
    .map(([key]) => key)
  const metrics = KPI_METRICS.map((m) => ({
    label: m.label,
    week: formatKpiValue(row[m.key] as number | null, m.kind),
    prev: previous ? formatKpiValue(previous[m.key] as number | null, m.kind) : UNAVAILABLE_LABEL,
    delta: previous ? formatDelta(row[m.key] as number | null, previous[m.key] as number | null, m.kind) : '—',
  }))
  const gscNote = row.gsc_partial ? `Search Console : données partielles, ${row.gsc_days_covered ?? 0} jours` : null
  const clicks = clicksLines(row.review_clicks_week)
  // Free-text note may hold customer data (review text, names): owner-only test report, never the live list.
  const note = isTest && row.manual_note?.trim() ? row.manual_note.trim() : null

  // ---------- HTML ----------
  const list = (items: string[]) =>
    `<ol style="${P}padding-left:20px;">${items.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>`
  const parts: string[] = []
  if (isTest) {
    parts.push(
      `<div style="background:#B45309;color:#fff;padding:10px 12px;font-size:14px;font-weight:bold;margin:0 0 16px;">MODE TEST : ce rapport n'est envoyé qu'au propriétaire.</div>`
    )
  }
  parts.push(`<h1 style="color:#0C3C2D;font-size:20px;margin:0 0 4px;">Rapport KPI hebdomadaire</h1>`)
  parts.push(`<p style="${P}">Semaine du ${escapeHtml(row.week_start)} au ${escapeHtml(row.week_end)}</p>`)
  parts.push(`<h2 style="${H2}">Lecture</h2>`)
  parts.push(lecture.length ? list(lecture) : `<p style="${P}">${NO_NARRATIVE}</p>`)
  parts.push(`<h2 style="${H2}">Actions recommandées</h2>`)
  parts.push(actions.length ? list(actions) : `<p style="${P}">${NO_NARRATIVE}</p>`)
  parts.push(`<h2 style="${H2}">Alertes</h2>`)
  parts.push(
    alerts.length
      ? `<ul style="${P}padding-left:20px;">${alerts
          .map((a) => `<li><strong>${escapeHtml(a.severity)}</strong> : ${escapeHtml(a.message)}</li>`)
          .join('')}</ul>`
      : `<p style="${P}">${NO_ALERT}</p>`
  )
  parts.push(`<h2 style="${H2}">Chiffres de la semaine</h2>`)
  if (!previous) parts.push(`<p style="${P}">${escapeHtml(FIRST_WEEK)}</p>`)
  parts.push(
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">` +
      `<tr><th align="left" style="${TD}">Indicateur</th><th align="right" style="${TD}">Semaine</th><th align="right" style="${TD}">S-1</th><th align="right" style="${TD}">Évolution</th></tr>` +
      metrics
        .map(
          (m) =>
            `<tr><td style="${TD}">${escapeHtml(m.label)}</td><td align="right" style="${TD}">${escapeHtml(m.week)}</td><td align="right" style="${TD}">${escapeHtml(m.prev)}</td><td align="right" style="${TD}">${escapeHtml(m.delta)}</td></tr>`
        )
        .join('') +
      `</table>`
  )
  parts.push(`<h2 style="${H2}">Clics /review de la semaine</h2>`)
  parts.push(`<p style="${P}">${escapeHtml(clicks.join(' · '))} (${CLICKS_NOTE})</p>`)
  if (gscNote) parts.push(`<p style="${P}">${escapeHtml(gscNote)}</p>`)
  if (unavailable.length) {
    parts.push(`<h2 style="${H2}">Sources non disponibles</h2>`)
    parts.push(`<p style="${P}">${escapeHtml(unavailable.join(', '))}</p>`)
  }
  if (note) {
    parts.push(`<h2 style="${H2}">Note manuelle</h2>`)
    parts.push(`<p style="${P}">${escapeHtml(note)}</p>`)
  }
  parts.push(
    `<p style="${P}margin-top:24px;"><a href="${escapeHtml(adminUrl)}" style="color:#0C3C2D;">Ouvrir le tableau de bord KPI</a></p>`
  )
  const html = `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:24px;background:#FAF0E6;font-family:Arial,Helvetica,sans-serif;"><div style="max-width:640px;margin:0 auto;background:#fff;padding:24px;">${parts.join('\n')}</div></body></html>`

  // ---------- Texte ----------
  const t: string[] = []
  if (isTest) t.push("MODE TEST : ce rapport n'est envoyé qu'au propriétaire.", '')
  t.push(`Rapport KPI hebdomadaire - semaine du ${row.week_start} au ${row.week_end}`, '')
  t.push('LECTURE')
  t.push(...(lecture.length ? lecture.map((s, i) => `${i + 1}. ${s}`) : [NO_NARRATIVE]), '')
  t.push('ACTIONS RECOMMANDÉES')
  t.push(...(actions.length ? actions.map((s, i) => `${i + 1}. ${s}`) : [NO_NARRATIVE]), '')
  t.push('ALERTES')
  t.push(...(alerts.length ? alerts.map((a) => `- [${a.severity}] ${a.message}`) : [NO_ALERT]), '')
  t.push('CHIFFRES DE LA SEMAINE (Semaine | S-1 | Évolution)')
  if (!previous) t.push(FIRST_WEEK)
  t.push(...metrics.map((m) => `${m.label} : ${m.week} | ${m.prev} | ${m.delta}`), '')
  t.push('CLICS /REVIEW DE LA SEMAINE', `${clicks.join(' · ')} (${CLICKS_NOTE})`)
  if (gscNote) t.push(gscNote)
  if (unavailable.length) t.push('', 'SOURCES NON DISPONIBLES', unavailable.join(', '))
  if (note) t.push('', 'NOTE MANUELLE', note)
  t.push('', `Tableau de bord : ${adminUrl}`)

  return { subject, html, text: t.join('\n') }
}
