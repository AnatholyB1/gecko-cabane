import { describe, it, expect, vi, beforeEach } from 'vitest'

// Orchestrateur des sources externes : modules GSC et TripAdvisor mockes, aucun reseau.

const fetchGscWeek = vi.fn()
const fetchTripadvisorRank = vi.fn()
vi.mock('../src/utils/kpi-gsc', () => ({ fetchGscWeek: (...a: unknown[]) => fetchGscWeek(...a) }))
vi.mock('../src/utils/kpi-tripadvisor', () => ({
  fetchTripadvisorRank: (...a: unknown[]) => fetchTripadvisorRank(...a),
  isAllowedTripadvisorUrl: (u?: string) => !!u && u.startsWith('https://www.tripadvisor.'),
}))

import { collectExternalKpis } from '../src/utils/kpi-sources'
import type { WeeklyKpiRow } from '../src/types/database'

const week = { start: '2026-10-26', end: '2026-11-01' }
const now = new Date('2026-11-02T00:05:00Z')
const env = {
  GSC_SERVICE_ACCOUNT_JSON: '{}',
  GSC_SITE_URL: 'sc-domain:example.com',
  BRIGHTDATA_API_KEY: 'k',
  BRIGHTDATA_ZONE: 'z',
  TRIPADVISOR_URL: 'https://www.tripadvisor.com/Restaurant_Review-x.html',
}
const full = { clicks: 10, impressions: 100, ctr: 0.1, position: 5, daysCovered: 7, partial: false }

beforeEach(() => {
  fetchGscWeek.mockReset()
  fetchTripadvisorRank.mockReset()
  fetchGscWeek.mockResolvedValue(full)
  fetchTripadvisorRank.mockResolvedValue({ rank: 3, total: 40 })
})

describe('Search Console', () => {
  it('resultat complet => colonnes gsc_* et status ok', async () => {
    const { values, status } = await collectExternalKpis(week, null, env, { now })
    expect(values).toMatchObject({
      gsc_clicks: 10,
      gsc_impressions: 100,
      gsc_ctr: 0.1,
      gsc_position: 5,
      gsc_days_covered: 7,
      gsc_partial: false,
    })
    expect(status.search_console).toBe('ok')
  })
  it('resultat partiel => status partial', async () => {
    fetchGscWeek.mockResolvedValue({ ...full, daysCovered: 5, partial: true })
    const { values, status } = await collectExternalKpis(week, null, env, { now })
    expect(values.gsc_partial).toBe(true)
    expect(status.search_console).toBe('partial')
  })
  it('null => colonnes null et unavailable', async () => {
    fetchGscWeek.mockResolvedValue(null)
    const { values, status } = await collectExternalKpis(week, null, env, { now })
    expect(values.gsc_clicks).toBeNull()
    expect(values.gsc_partial).toBeNull()
    expect(status.search_console).toBe('unavailable')
  })
  it('rejet inattendu de GSC: TripAdvisor non affecte (allSettled)', async () => {
    fetchGscWeek.mockRejectedValue(new Error('x'))
    const { values, status } = await collectExternalKpis(week, null, env, { now })
    expect(status.search_console).toBe('unavailable')
    expect(values.tripadvisor_rank).toBe(3)
    expect(status.tripadvisor).toBe('ok')
  })
})

describe('TripAdvisor (Bright Data, 1 tentative par semaine)', () => {
  it('premier passage: 1 appel, rank/total/checked_at', async () => {
    const { values, status } = await collectExternalKpis(week, null, env, { now })
    expect(fetchTripadvisorRank).toHaveBeenCalledTimes(1)
    expect(values).toMatchObject({ tripadvisor_rank: 3, tripadvisor_total: 40, tripadvisor_checked_at: now.toISOString() })
    expect(status.tripadvisor).toBe('ok')
  })
  it('echec: null mais tentative consommee', async () => {
    fetchTripadvisorRank.mockResolvedValue(null)
    const { values, status } = await collectExternalKpis(week, null, env, { now })
    expect(values.tripadvisor_rank).toBeNull()
    expect(values.tripadvisor_total).toBeNull()
    expect(values.tripadvisor_checked_at).toBe(now.toISOString())
    expect(status.tripadvisor).toBe('unavailable')
  })
  it('rejet inattendu: traite comme echec, GSC non affecte', async () => {
    fetchTripadvisorRank.mockRejectedValue(new Error('x'))
    const { values, status } = await collectExternalKpis(week, null, env, { now })
    expect(status.tripadvisor).toBe('unavailable')
    expect(values.gsc_clicks).toBe(10)
  })
  it('deja verifie cette semaine: 0 appel, valeurs conservees (non reecrites)', async () => {
    const existing = { tripadvisor_rank: 4, tripadvisor_total: 41, tripadvisor_checked_at: '2026-11-02T00:05:00Z' } as WeeklyKpiRow
    const { values, status } = await collectExternalKpis(week, existing, env, { now })
    expect(fetchTripadvisorRank).not.toHaveBeenCalled()
    expect('tripadvisor_rank' in values).toBe(false)
    expect('tripadvisor_checked_at' in values).toBe(false)
    expect(status.tripadvisor).toBe('ok')
  })
  it('deja verifie avec rang null => unavailable, toujours 0 appel', async () => {
    const existing = { tripadvisor_rank: null, tripadvisor_total: null, tripadvisor_checked_at: '2026-11-02T00:05:00Z' } as WeeklyKpiRow
    const { status } = await collectExternalKpis(week, existing, env, { now })
    expect(fetchTripadvisorRank).not.toHaveBeenCalled()
    expect(status.tripadvisor).toBe('unavailable')
  })
  it('ligne existante sans checked_at: 1 appel', async () => {
    const existing = { tripadvisor_rank: null, tripadvisor_total: null, tripadvisor_checked_at: null } as WeeklyKpiRow
    await collectExternalKpis(week, existing, env, { now })
    expect(fetchTripadvisorRank).toHaveBeenCalledTimes(1)
  })
})

describe('URL TripAdvisor refusee', () => {
  it('tentative non consommee (pas de tripadvisor_checked_at)', async () => {
    const { values } = await collectExternalKpis(week, null, { ...env, TRIPADVISOR_URL: 'https://evil.example.com/x' }, { now })
    expect('tripadvisor_checked_at' in values).toBe(false)
  })
})

describe('skipPaid (contrôle à blanc)', () => {
  it('0 appel Bright Data, pas de colonnes tripadvisor_*, GSC appele', async () => {
    const { values, status } = await collectExternalKpis(week, null, env, { now, skipPaid: true })
    expect(fetchTripadvisorRank).not.toHaveBeenCalled()
    expect(fetchGscWeek).toHaveBeenCalledTimes(1)
    for (const k of ['tripadvisor_rank', 'tripadvisor_total', 'tripadvisor_checked_at']) expect(k in values).toBe(false)
    expect(status.tripadvisor).toBe('unavailable')
  })
  it('skipPaid avec valeur existante: status ok', async () => {
    const existing = { tripadvisor_rank: 4, tripadvisor_total: 41, tripadvisor_checked_at: 'x' } as WeeklyKpiRow
    const { status } = await collectExternalKpis(week, existing, env, { now, skipPaid: true })
    expect(status.tripadvisor).toBe('ok')
  })
})

describe('sans configuration', () => {
  it('aucune variable: deux sources unavailable, tentative non consommee', async () => {
    fetchGscWeek.mockResolvedValue(null)
    fetchTripadvisorRank.mockResolvedValue(null)
    const { values, status } = await collectExternalKpis(week, null, {}, { now })
    expect(status).toEqual({ search_console: 'unavailable', tripadvisor: 'unavailable' })
    expect(values.tripadvisor_checked_at).toBeUndefined()
  })
})
