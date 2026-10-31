/**
 * Static wiring checks for plan 08-07 (page KPI de l'admin, français fixe, admin seulement,
 * aucune exposition publique), mis à jour en phase 16 : /admin/kpi, /admin/avis et
 * /admin/reputation rendent les MÊMES composants (src/components/admin/reputation/).
 * Le fond des assertions est conservé : libellés TEST/live, jamais 0 pour une valeur absente,
 * état de chargement, aucun module serveur importé, aucun lien public vers /admin/kpi.
 */

import { describe, it, expect, vi } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
// Import dynamique à froid de la page : dépasse 5 s quand la machine est chargée.
vi.setConfig({ testTimeout: 30_000 })

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf-8')
const count = (src: string, needle: string) => src.split(needle).length - 1

const PAGE = 'src/app/admin/(app)/kpi/page.tsx'
const PANEL = 'src/components/admin/reputation/KpiPanel.tsx'
const GUARD = 'src/components/admin/reputation/kpi-guard.ts'

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

describe('/admin/kpi page', () => {
  it('exists and renders the shared Réputation view (same component as the tab)', () => {
    expect(existsSync(join(root, PAGE))).toBe(true)
    const src = read(PAGE)
    expect(src).toContain('ReputationView')
    expect(src).toContain('vue="kpi"')
    expect(read('src/app/admin/(app)/reputation/page.tsx')).toContain('ReputationView')
    expect(read('src/app/admin/(app)/avis/page.tsx')).toContain('ReputationView')
  })

  it('is a French-fixed client panel fetching /api/kpi', () => {
    const src = read(PANEL)
    expect(src.trimStart().startsWith("'use client'")).toBe(true)
    expect(src).toContain("'/api/kpi?weeks=12'")
    expect(src).toContain("'/api/kpi', { method: 'PUT'")
    expect(src).toContain("from './kpi-guard'")
    expect(read(GUARD)).toContain("from '@/utils/kpi-format'")
    expect(src).not.toMatch(/next-intl|useTranslations/)
  })

  it('imports no server-only module and no unsafe rendering', () => {
    for (const f of [PANEL, GUARD, 'src/components/admin/reputation/ReviewsPanel.tsx']) {
      const src = read(f)
      expect(src, f).not.toContain('@/utils/resend')
      expect(src, f).not.toContain('@/utils/supabase/server')
      expect(src, f).not.toContain('@/utils/kpi-manual')
      expect(src, f).not.toContain('dangerouslySetInnerHTML')
      expect(src, f).not.toMatch(/bg-\[var|border-\[var|text-\[var/)
      expect(src.toLowerCase(), f).not.toContain('n8n')
    }
  })

  it('shows the required labels', () => {
    const src = read(PANEL) + read(GUARD)
    expect(src).toContain('Rapports TEST envoyés')
    expect(src).toContain('Sources non disponibles')
    expect(src).toMatch(/UNAVAILABLE_LABEL|formatKpiValue/)
    expect(src).toContain('KPI hebdomadaires')
    expect(src).toContain('Comparaison à la semaine précédente')
    expect(src).toContain('Lecture et actions')
    expect(src).toContain('Actions recommandées')
    expect(src).toContain('Saisie manuelle de la semaine')
    expect(src).toContain('Enregistrer la saisie')
    expect(src).toContain('texte de repli sans IA')
    expect(src).toContain('Impossible de charger les KPI. Réessayez ou rechargez la page.')
    expect(src).toContain('Aucune semaine enregistrée')
    expect(src).toContain('Le premier relevé apparaîtra ici après la collecte du lundi.')
    expect(src).toContain('Saisie enregistrée')
    expect(src).toContain('Saisie enregistrée — alerte envoyée au propriétaire')
    expect(src).toContain('partiel')
  })
})

describe('admin navigation', () => {
  it('reaches /admin/kpi from nav.ts (single source for nav bar, tabs and home cards)', () => {
    const nav = read('src/app/admin/(app)/nav.ts')
    expect(count(nav, "href: '/admin/kpi'")).toBe(1)
    // the old hand-written home page no longer carries admin links: the home cards come from nav.ts
    expect(read('src/app/admin/(app)/page.tsx')).not.toContain('/admin/kpi')
  })
})

describe('/admin/kpi initial render (loading state, no data yet)', () => {
  it('renders the loading state and the TEST counter without crashing', async () => {
    const { createElement } = await import('react')
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { AdminProviders } = await import('../src/components/admin/AdminProviders')
    const { KpiPanel } = await import('../src/components/admin/reputation/KpiPanel')
    const html = renderToStaticMarkup(createElement(AdminProviders, null, createElement(KpiPanel)))
    expect(html).toContain('KPI hebdomadaires')
    expect(html).toContain('Chargement')
    expect(html).toContain('Rapports TEST envoyés')
    expect(html).not.toContain('Aucune semaine enregistrée')
  })
})

describe('no public exposure', () => {
  it('no public page links to /admin/kpi or /api/kpi', () => {
    const offenders = walk(join(root, 'src/app/[locale]'))
      .concat(walk(join(root, 'src/components')))
      .filter((f) => !f.includes(join('src', 'components', 'admin')))
      .filter((f) => /\.(tsx?|jsx?)$/.test(f))
      .filter((f) => /\/(admin\/kpi|api\/kpi)/.test(readFileSync(f, 'utf-8')))
    expect(offenders).toEqual([])
  })
})
