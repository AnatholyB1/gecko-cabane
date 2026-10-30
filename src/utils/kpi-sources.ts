/**
 * Sources externes du rapport KPI (phase 8) : Search Console et rang TripAdvisor.
 * Les deux sources sont collectees en parallele (allSettled) : une panne ne bloque pas l'autre.
 * Plafond Bright Data (T-08-11) : 1 tentative par semaine, materialisee par
 * tripadvisor_checked_at ; jamais appele en controle a blanc (skipPaid).
 * L'environnement est injecte (pas de lecture directe de l'env ici), pas de log.
 */

import type { KpiSourceState, KpiSourcesStatus, WeeklyKpiRow } from '@/types/database'
import { fetchGscWeek, type GscWeekResult } from './kpi-gsc'
import { fetchTripadvisorRank, isAllowedTripadvisorUrl, type TripadvisorRank } from './kpi-tripadvisor'

export type ExternalKpiEnv = {
  GSC_SERVICE_ACCOUNT_JSON?: string
  GSC_SITE_URL?: string
  BRIGHTDATA_API_KEY?: string
  BRIGHTDATA_ZONE?: string
  TRIPADVISOR_URL?: string
}

type Collected = { values: Partial<WeeklyKpiRow>; state: KpiSourceState }

const GSC_NULL: Partial<WeeklyKpiRow> = {
  gsc_clicks: null,
  gsc_impressions: null,
  gsc_ctr: null,
  gsc_position: null,
  gsc_days_covered: null,
  gsc_partial: null,
}

function gscStep(r: GscWeekResult | null): Collected {
  if (!r) return { values: { ...GSC_NULL }, state: 'unavailable' }
  return {
    values: {
      gsc_clicks: r.clicks,
      gsc_impressions: r.impressions,
      gsc_ctr: r.ctr,
      gsc_position: r.position,
      gsc_days_covered: r.daysCovered,
      gsc_partial: r.partial,
    },
    state: r.partial ? 'partial' : 'ok',
  }
}

export async function collectExternalKpis(
  week: { start: string; end: string },
  existing: WeeklyKpiRow | null,
  env: ExternalKpiEnv,
  deps: { fetchImpl?: typeof fetch; now?: Date; skipPaid?: boolean } = {},
): Promise<{ values: Partial<WeeklyKpiRow>; status: KpiSourcesStatus }> {
  const now = deps.now ?? new Date()
  const alreadyChecked = !!existing?.tripadvisor_checked_at
  const existingState: KpiSourceState = existing?.tripadvisor_rank != null ? 'ok' : 'unavailable'
  const configured = !!(env.BRIGHTDATA_API_KEY && env.BRIGHTDATA_ZONE && isAllowedTripadvisorUrl(env.TRIPADVISOR_URL))

  const tripadvisorStep = async (): Promise<Collected> => {
    // Valeur deja stockee cette semaine, ou controle a blanc : aucun appel payant.
    if (alreadyChecked || deps.skipPaid) return { values: {}, state: existingState }
    let rank: TripadvisorRank | null = null
    try {
      rank = await fetchTripadvisorRank({
        apiKey: env.BRIGHTDATA_API_KEY,
        zone: env.BRIGHTDATA_ZONE,
        url: env.TRIPADVISOR_URL,
        fetchImpl: deps.fetchImpl,
      })
    } catch {
      rank = null
    }
    const values: Partial<WeeklyKpiRow> = {
      tripadvisor_rank: rank?.rank ?? null,
      tripadvisor_total: rank?.total ?? null,
    }
    // Tentative consommee seulement si une requete a pu partir.
    if (configured) values.tripadvisor_checked_at = now.toISOString()
    return { values, state: rank ? 'ok' : 'unavailable' }
  }

  const [gsc, ta] = await Promise.allSettled([
    fetchGscWeek(week, {
      serviceAccountJson: env.GSC_SERVICE_ACCOUNT_JSON,
      siteUrl: env.GSC_SITE_URL,
      fetchImpl: deps.fetchImpl,
      now,
    }).then(gscStep),
    tripadvisorStep(),
  ])

  const g: Collected = gsc.status === 'fulfilled' ? gsc.value : { values: { ...GSC_NULL }, state: 'unavailable' }
  const t: Collected =
    ta.status === 'fulfilled'
      ? ta.value
      : {
          values: { tripadvisor_rank: null, tripadvisor_total: null, ...(configured ? { tripadvisor_checked_at: now.toISOString() } : {}) },
          state: 'unavailable',
        }

  return {
    values: { ...g.values, ...t.values },
    status: { search_console: g.state, tripadvisor: t.state },
  }
}
