import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { isValidTotal } from '../src/utils/review-report'
import { buildTotalsPayload, latestCollectedGoogle } from '../src/utils/review-totals'

const root = join(__dirname, '..')

describe('REP-03 : le total Google n\'est plus saisi (décision 2026-10-31)', () => {
  it('le payload ne contient que le mois et TripAdvisor, et reste valide pour la route inchangée', () => {
    const r = buildTotalsPayload('2026-10', '412')
    expect(r).toEqual({ ok: true, payload: { month: '2026-10', tripadvisor: 412 } })
    if (!r.ok) return
    expect(Object.keys(r.payload)).not.toContain('google')
    // Mêmes règles que le PUT : mois AAAA-MM, au moins une plateforme, entier valide.
    expect(r.payload.month).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/)
    expect(isValidTotal(r.payload.tripadvisor)).toBe(true)
  })

  it('refuse vide et valeurs invalides côté écran', () => {
    expect(buildTotalsPayload('2026-10', '')).toEqual({ ok: false, reason: 'empty' })
    expect(buildTotalsPayload('2026-10', '1.5')).toEqual({ ok: false, reason: 'invalid' })
    expect(buildTotalsPayload('2026-10', '-3')).toEqual({ ok: false, reason: 'invalid' })
  })

  it('la route accepte un corps sans clé google (aucune modification d\'API)', () => {
    const src = readFileSync(join(root, 'src/app/api/review/stats/route.ts'), 'utf8')
    expect(src).toContain('if (value === undefined || value === null) continue')
    expect(src).toContain("if (rows.length === 0)")
  })

  it('l\'écran n\'a plus de champ Google et affiche la collecte en lecture seule', () => {
    const src = readFileSync(join(root, 'src/components/admin/reputation/ReviewsPanel.tsx'), 'utf8')
    expect(src).not.toContain('id="total-google"')
    expect(src).toContain('id="total-tripadvisor"')
    expect(src).toContain('collecte automatique, lecture seule')
    expect(src).toContain('Collecté le')
  })

  it('le dernier total Google collecté et sa date', () => {
    expect(latestCollectedGoogle([])).toBeNull()
    const rows = [
      { week_start: '2026-10-19', week_end: '2026-10-25', collected_at: '2026-10-26T01:00:00Z', google_reviews_total: 201 },
      { week_start: '2026-10-26', week_end: '2026-11-01', collected_at: null, google_reviews_total: null },
      { week_start: '2026-10-12', week_end: '2026-10-18', collected_at: null, google_reviews_total: 198 },
    ]
    expect(latestCollectedGoogle(rows)).toEqual({ total: 201, weekStart: '2026-10-19', collectedOn: '2026-10-26' })
  })
})
