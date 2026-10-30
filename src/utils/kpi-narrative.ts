/**
 * Lecture et actions du rapport KPI hebdomadaire (phase 8, KPI-04, D-07).
 * L'API Claude recoit uniquement des chiffres agreges en liste blanche
 * (aucune donnee personnelle, aucun texte libre : la note manuelle, la date
 * d'envoi et la lecture precedente en sont exclues). En cas d'echec (cle,
 * modele, reseau, format), un texte de repli deterministe est produit.
 * Module serveur : ne jamais l'importer depuis un composant 'use client'.
 */

import { z } from 'zod'
import type { KpiAlert, KpiNarrative, WeeklyKpiRow } from '@/types/database'
import type { KpiComparison, MetricComparison } from './kpi-alerts'
import { KPI_METRICS, formatDelta, formatKpiValue } from './kpi-format'

export const NARRATIVE_INPUT_KEYS = [
  'week_start',
  'week_end',
  'firstWeek',
  'metrics',
  'alerts',
  'sources_unavailable',
  'gsc_partial',
  'review_clicks_week',
] as const

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

export function buildNarrativeInput(
  row: WeeklyKpiRow,
  comparison: KpiComparison,
  alerts: KpiAlert[],
): Record<string, unknown> {
  const sources = row.sources_status ?? {}
  return {
    week_start: row.week_start,
    week_end: row.week_end,
    firstWeek: comparison.firstWeek,
    metrics: comparison.metrics.map((m) => ({
      key: m.key,
      current: m.current,
      previous: m.previous,
      deltaPct: m.deltaPct,
    })),
    alerts: alerts.map((a) => ({
      code: a.code,
      metric: a.metric,
      current: a.current,
      previous: a.previous,
    })),
    sources_unavailable: Object.entries(sources)
      .filter(([, v]) => v === 'unavailable')
      .map(([k]) => k),
    gsc_partial: row.gsc_partial ?? null,
    review_clicks_week: row.review_clicks_week ?? null,
  }
}

export function buildPrompt(input: Record<string, unknown>): { system: string; user: string } {
  const system = [
    'Tu es analyste pour le restaurant Gecko Cabane (cuisine franco-thaïlandaise, Krabi).',
    'Tu reçois en JSON les indicateurs agrégés de la semaine et leur comparaison à la semaine précédente.',
    'Réponds uniquement par un objet JSON de la forme {"lecture": [3 chaînes], "actions": [3 chaînes]}.',
    'lecture : 3 phrases en français qui expliquent ce que disent les chiffres.',
    'actions : 3 actions concrètes et réalisables dans la semaine, en français.',
    'Ne cite que les chiffres fournis, n\'invente aucune donnée. Écris « non disponible » pour toute valeur null.',
    'Chaque chaîne fait 300 caractères au maximum. Aucun HTML, aucun texte hors du JSON.',
  ].join('\n')
  return { system, user: JSON.stringify(input) }
}

const narrativeSchema = z.object({
  lecture: z.array(z.string().min(1).max(300)).length(3),
  actions: z.array(z.string().min(1).max(300)).length(3),
})

const stripTags = (s: string) => s.replace(/<[^>]*>/g, '').trim()

export function parseNarrative(text: string): KpiNarrative | null {
  if (typeof text !== 'string') return null
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  let raw: unknown
  try {
    raw = JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
  if (!raw || typeof raw !== 'object') return null
  const r = raw as { lecture?: unknown; actions?: unknown }
  const clean = (v: unknown) => (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? stripTags(x) : x)) : v)
  const parsed = narrativeSchema.safeParse({ lecture: clean(r.lecture), actions: clean(r.actions) })
  if (!parsed.success) return null
  return { lecture: parsed.data.lecture, actions: parsed.data.actions, source: 'ai' }
}

// --------------------------------------------------------------------------
// Repli deterministe
// --------------------------------------------------------------------------

const ACTION_BY_CODE: Record<string, string> = {
  reservations_drop: 'Relancer la visibilité des réservations : vérifier le formulaire et publier une offre ou une photo sur les réseaux.',
  no_show_high: 'Réduire les no-show : confirmer chaque réservation par message la veille.',
  gsc_clicks_drop: 'Contrôler les pages qui perdent des clics dans la Search Console et corriger titres et descriptions.',
  gsc_position_worse: 'Vérifier l\'indexation et la vitesse des pages principales, puis renforcer leur contenu.',
  tripadvisor_rank_worse: 'Demander un avis TripAdvisor aux clients satisfaits cette semaine.',
  unsubscribes_exceed: 'Relire le contenu et la fréquence de la newsletter avant le prochain envoi.',
  low_rating: 'Répondre sans délai à l\'avis négatif et traiter la cause avec l\'équipe.',
  source_unavailable: 'Rétablir la source de données indisponible (clé, accès ou configuration).',
}

const GENERIC_ACTIONS = [
  'Relire ce rapport avec l\'équipe et fixer un objectif chiffré pour la semaine.',
  'Demander un avis Google aux clients satisfaits en fin de service.',
  'Publier une actualité ou un plat du moment sur les réseaux sociaux.',
]

function metric(c: KpiComparison, key: string): MetricComparison | undefined {
  return c.metrics.find((m) => m.key === key)
}

function line(c: KpiComparison, key: string): string {
  const def = KPI_METRICS.find((m) => m.key === key)
  const m = metric(c, key)
  return `${def?.label ?? key} : ${formatKpiValue(m?.current ?? null, def?.kind ?? 'int')}`
}

export function fallbackNarrative(comparison: KpiComparison, alerts: KpiAlert[]): KpiNarrative {
  const lecture: string[] = []
  lecture.push(`Cette semaine : ${line(comparison, 'reservations_new')}, ${line(comparison, 'covers')}.`)

  if (comparison.firstWeek) {
    lecture.push('C\'est la première semaine de suivi : elle sert de référence, aucune comparaison n\'est possible.')
  } else {
    const res = metric(comparison, 'reservations_new')
    const clicks = metric(comparison, 'gsc_clicks')
    const resKind = KPI_METRICS.find((m) => m.key === 'reservations_new')!.kind
    const clKind = KPI_METRICS.find((m) => m.key === 'gsc_clicks')!.kind
    lecture.push(
      `Par rapport à la semaine précédente : réservations ${formatDelta(res?.current ?? null, res?.previous ?? null, resKind)}, clics Google ${formatDelta(clicks?.current ?? null, clicks?.previous ?? null, clKind)}.`,
    )
  }

  if (alerts.length > 0) {
    const first = alerts
      .slice(0, 2)
      .map((a) => a.message)
      .join(' ')
    lecture.push(`${alerts.length} point${alerts.length > 1 ? 's' : ''} d'attention : ${first}`.slice(0, 300))
  } else {
    lecture.push('Aucune alerte cette semaine : les indicateurs suivis restent dans les seuils.')
  }

  const actions: string[] = []
  for (const a of alerts) {
    const t = ACTION_BY_CODE[a.code]
    if (t && !actions.includes(t)) actions.push(t)
    if (actions.length === 3) break
  }
  for (const g of GENERIC_ACTIONS) {
    if (actions.length === 3) break
    if (!actions.includes(g)) actions.push(g)
  }

  return { lecture: lecture.map((s) => s.slice(0, 300)), actions, source: 'fallback' }
}

// --------------------------------------------------------------------------
// Appel Claude
// --------------------------------------------------------------------------

type InputMetric = { key: string; current: number | null; previous: number | null; deltaPct: number | null }
type InputAlert = { code: string; metric: string; current: number | null; previous: number | null }

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/** Reconstruit comparaison et alertes depuis l'entree (qui ne contient que des agregats). */
function fromInput(input: Record<string, unknown>): { cmp: KpiComparison; alerts: KpiAlert[] } {
  const ms = Array.isArray(input.metrics) ? (input.metrics as InputMetric[]) : []
  const as = Array.isArray(input.alerts) ? (input.alerts as InputAlert[]) : []
  const cmp: KpiComparison = {
    firstWeek: input.firstWeek === true,
    metrics: ms.map((m) => {
      const c = num(m.current)
      const p = num(m.previous)
      return {
        key: String(m.key),
        current: c,
        previous: p,
        delta: c !== null && p !== null ? c - p : null,
        deltaPct: num(m.deltaPct),
      }
    }),
  }
  const alerts: KpiAlert[] = as.map((a) => ({
    code: String(a.code),
    severity: a.code === 'low_rating' ? 'critical' : 'warning',
    metric: String(a.metric),
    message: `Alerte « ${a.code} » sur ${a.metric}.`,
    current: num(a.current),
    previous: num(a.previous),
  }))
  return { cmp, alerts }
}

export async function generateNarrative(
  input: Record<string, unknown>,
  opts: { apiKey?: string; model?: string; fetchImpl?: typeof fetch; timeoutMs?: number },
): Promise<KpiNarrative> {
  const { cmp, alerts } = fromInput(input)
  const fallback = () => fallbackNarrative(cmp, alerts)
  try {
    if (!opts.apiKey || !opts.model) return fallback()
    const f = opts.fetchImpl ?? fetch
    const { system, user } = buildPrompt(input)
    const res = await f(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': opts.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: 800,
        system,
        messages: [{ role: 'user', content: user }],
      }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 20_000),
    })
    if (!res.ok) return fallback()
    const data = (await res.json()) as { content?: { text?: unknown }[] }
    const text = data?.content?.[0]?.text
    if (typeof text !== 'string') return fallback()
    return parseNarrative(text) ?? fallback()
  } catch {
    return fallback()
  }
}
