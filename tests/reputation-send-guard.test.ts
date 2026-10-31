/**
 * REP-01, REP-02, REP-03 (phase 16) : garde-fou d'envoi et regroupement Réputation.
 *
 * - l'enregistrement qui déclenche l'alerte email (note minimale <= 3) n'a lieu qu'après confirmation ;
 * - ni l'ouverture de page, ni un changement de segment, ni un changement de semaine n'appelle une route d'envoi ;
 * - les libellés TEST / live, « Rapports TEST envoyés : N / 2 » et la phrase de garde sont inchangés ;
 * - aucun bouton « Passer en live » ; aucun `confirm()` natif ;
 * - /admin/avis, /admin/kpi et /admin/reputation rendent les mêmes composants.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { AdminProviders } from '../src/components/admin/AdminProviders'
import { GuardBanner, KpiPanel, SendPanel } from '../src/components/admin/reputation/KpiPanel'
import { ReviewsPanel } from '../src/components/admin/reputation/ReviewsPanel'
import { ReputationView, parseVue } from '../src/components/admin/reputation/ReputationView'
import {
  GUARD_PHRASE,
  LIVE_PASSAGE_SENTENCE,
  criticalAlerts,
  deltaView,
  liveConditions,
  serverModeOf,
  savedMessage,
  shouldConfirmAlert,
  submitManualEntry,
  type ManualPayload,
} from '../src/components/admin/reputation/kpi-guard'
import type { WeeklyKpiRow } from '../src/types/database'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf-8')
const REP_DIR = 'src/components/admin/reputation'
const flat = (html: string) => html.replace(/<!-- -->/g, '')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

afterEach(() => vi.unstubAllGlobals())

const payload = (rating: number | null): ManualPayload => ({
  week_start: '2026-10-19',
  google_reviews_total: 187,
  google_new_reviews: 6,
  google_min_rating: rating,
  manual_note: '',
})

describe('REP-02 : dialogue d\'alerte (note minimale <= 3)', () => {
  it('ne demande confirmation que pour une note <= 3 nouvelle ou modifiée (même règle que le serveur)', () => {
    expect(shouldConfirmAlert(null, 3)).toBe(true)
    expect(shouldConfirmAlert(5, 1)).toBe(true)
    expect(shouldConfirmAlert(3, 3)).toBe(false) // inchangée : le serveur n'alerte pas
    expect(shouldConfirmAlert(null, 4)).toBe(false)
    expect(shouldConfirmAlert(2, null)).toBe(false)
  })

  it('confirmation AVANT l\'enregistrement ; le PUT n\'a lieu qu\'après « oui »', async () => {
    const order: string[] = []
    const confirm = vi.fn(async () => (order.push('confirm'), true))
    const save = vi.fn(async () => (order.push('save'), { alerted: true }))
    const r = await submitManualEntry({ payload: payload(3), previousMinRating: null, confirm, save })
    expect(order).toEqual(['confirm', 'save'])
    expect(r).toEqual({ status: 'saved', alerted: true })
  })

  it('un refus annule tout : le PUT n\'est jamais appelé', async () => {
    const confirm = vi.fn(async () => false)
    const save = vi.fn(async () => ({ alerted: true }))
    const r = await submitManualEntry({ payload: payload(2), previousMinRating: 5, confirm, save })
    expect(r).toEqual({ status: 'cancelled' })
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(save).not.toHaveBeenCalled()
  })

  it('sans alerte (note > 3) : pas de dialogue, enregistrement direct', async () => {
    const confirm = vi.fn(async () => true)
    const save = vi.fn(async () => ({ alerted: false }))
    const r = await submitManualEntry({ payload: payload(4), previousMinRating: 3, confirm, save })
    expect(confirm).not.toHaveBeenCalled()
    expect(save).toHaveBeenCalledTimes(1)
    expect(r).toEqual({ status: 'saved', alerted: false })
  })

  it('le formulaire passe par useConfirm avec les libellés D4 (focus initial sur Annuler : ConfirmDialog)', () => {
    const src = read(`${REP_DIR}/KpiPanel.tsx`)
    expect(src).toContain("useConfirm")
    expect(src).toContain("Enregistrer et envoyer l'alerte ?")
    expect(src).toContain("confirmLabel: \"Enregistrer et envoyer l'alerte\"")
    expect(src).toContain("cancelLabel: 'Annuler'")
    expect(src).toContain("Une note de 3 ou moins déclenche un email d'alerte immédiat au propriétaire.")
    // l'appel réseau vit dans le callback `save` de submitManualEntry, jamais dans un effet ou au rendu
    expect(src).toContain('submitManualEntry')
    const cd = read('src/components/admin/ConfirmDialog.tsx')
    expect(cd).toContain('initialFocus={cancelRef}')
  })
})

describe('REP-02 : aucun envoi sans bouton nommé et confirmation', () => {
  it('aucun appel réseau au rendu d\'un panneau ou d\'une vue (ouverture de page)', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const views = [
      h(KpiPanel),
      h(ReviewsPanel),
      h(ReputationView, { vue: 'kpi' as const }),
      h(ReputationView, { vue: 'avis' as const, hub: true }),
    ]
    for (const v of views) renderToStaticMarkup(h(AdminProviders, null, v))
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('les segments sont de simples liens de lecture : aucun gestionnaire, aucun bouton, aucune route d\'envoi', () => {
    for (const hub of [true, false]) {
      const html = renderToStaticMarkup(h(AdminProviders, null, h(ReputationView, { vue: 'kpi', hub })))
      const nav = html.slice(html.indexOf('adm-rep-seg'), html.indexOf('</nav>', html.indexOf('adm-rep-seg')))
      expect(nav).toContain('href=')
      expect(nav).not.toContain('<button')
      expect(nav).not.toMatch(/onclick|formaction|method=/i)
      const hrefs = [...nav.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
      expect(hrefs).toEqual(
        hub ? ['/admin/reputation?vue=avis', '/admin/reputation?vue=kpi'] : ['/admin/avis', '/admin/kpi'],
      )
      expect(nav).toContain('aria-current="page"')
    }
  })

  it('le code de Réputation ne contient qu\'une écriture réseau vers /api/kpi (PUT) et une vers /api/review/stats (PUT)', () => {
    const files = walk(join(root, REP_DIR)).filter((f) => /\.tsx?$/.test(f))
    const writes: string[] = []
    for (const f of files) {
      const src = readFileSync(f, 'utf-8')
      expect(src, f).not.toMatch(/\/api\/cron|\/api\/newsletter|\/api\/webhooks|resend|sendReport|send_report/i)
      expect(src, f).not.toMatch(/method:\s*['"](POST|DELETE|PATCH)['"]/)
      for (const m of src.matchAll(/method:\s*['"]PUT['"]/g)) writes.push(`${f}:${m.index}`)
      expect(src, f).not.toMatch(/(?<![\w.$])confirm\(\s*['"`]|window\.confirm\(/)
    }
    expect(writes).toHaveLength(2)
  })

  it('aucun effet ne déclenche d\'écriture : les PUT sont dans des gestionnaires de formulaire', () => {
    for (const f of ['KpiPanel.tsx', 'ReviewsPanel.tsx']) {
      const src = read(`${REP_DIR}/${f}`)
      expect(src, f).not.toContain('useEffect')
      expect(src, f).toContain('onSubmit={')
    }
  })

  it('aucun bouton « Passer en live » ni activation du mode live depuis l\'admin', () => {
    const all = walk(join(root, REP_DIR)).map((f) => readFileSync(f, 'utf-8')).join('\n')
    expect(all).not.toMatch(/Passer en live/i)
    expect(all).not.toMatch(/process\.env|resolveReportMode|kpi-mode/)
    const html = flat(renderToStaticMarkup(h(AdminProviders, null, h(KpiPanel))))
    expect(html).not.toMatch(/Passer en live/i)
    expect(html).not.toMatch(/<button[^>]*>[^<]*(Envoyer|live)/i)
  })
})

describe('REP-02 : libellés TEST / live conservés', () => {
  it('la garde et le compteur s\'affichent même pendant le chargement', () => {
    const html = flat(renderToStaticMarkup(h(AdminProviders, null, h(KpiPanel))))
    expect(html).toContain('Rapports TEST envoyés : — / 2')
    expect(html).toContain(`Passage en live : décision du propriétaire après 2 rapports TEST vérifiés (au plus tôt mi-novembre 2026).`)
    expect(html).toContain('Aucun envoi live avant le 2026-11-16 et sans accord du propriétaire.')
    // Mode serveur pas encore lu : état neutre, ni « TEST » ni « live verrouillé » ne sont affirmés.
    expect(html).toContain('mode inconnu')
    expect(html).not.toContain('>TEST<')
    expect(html).not.toContain('live verrouillé')
    expect(html).toContain('Mode actuel')
    expect(html).toContain('Rien n&#x27;est envoyé en ouvrant cette page. Chaque envoi demande une action et une confirmation.')
    expect(html).toContain('Le mode live n&#x27;est jamais activable depuis cette page : il se règle côté serveur, après accord du propriétaire.')
  })

  it('constantes inchangées', () => {
    expect(GUARD_PHRASE).toBe('Aucun envoi live avant le 2026-11-16 et sans accord du propriétaire.')
    expect(LIVE_PASSAGE_SENTENCE).toBe(
      'Passage en live : décision du propriétaire après 2 rapports TEST vérifiés (au plus tôt mi-novembre 2026).',
    )
    expect(savedMessage(false)).toBe('Saisie enregistrée')
    expect(savedMessage(true)).toBe('Saisie enregistrée — alerte envoyée au propriétaire')
  })

  it('mode : celui du SERVEUR (champ `mode` de GET /api/kpi), inconnu sinon, jamais TEST par défaut', () => {
    expect(serverModeOf('test')).toBe('test')
    expect(serverModeOf('live')).toBe('live')
    for (const bad of [undefined, null, '', 'TEST', 'Live', 0, {}]) expect(serverModeOf(bad), String(bad)).toBeNull()
  })

  it('pastille : TEST / live selon le serveur ; mode inconnu = neutre, sans « live verrouillé »', () => {
    const render = (mode: 'test' | 'live' | null) =>
      flat(renderToStaticMarkup(h(AdminProviders, null, h('div', null, h(GuardBanner, { mode, testReportsSent: 1 }), h(SendPanel, { mode, testReportsSent: 1 })))))
    const test = render('test')
    expect(test).toContain('>TEST<')
    expect(test).toContain('live verrouillé')
    expect(test).not.toContain('mode inconnu')
    const live = render('live')
    expect(live).toContain('>live<')
    expect(live).not.toContain('>TEST<')
    expect(live).not.toContain('live verrouillé')
    const unknown = render(null)
    expect(unknown).toContain('mode inconnu')
    expect(unknown).not.toContain('>TEST<')
    expect(unknown).not.toContain('live verrouillé')
    expect(unknown).not.toContain('>live<')
    expect(unknown).toContain('Rapports TEST envoyés : 1 / 2')
  })

  it('conditions du passage en live : date au plus tôt le 2026-11-16, accord jamais déduit', () => {
    const before = liveConditions(1, '2026-10-31')
    expect(before.map((c) => c.done)).toEqual([false, false, false])
    expect(before[0].detail).toBe('1 sur 2, à remplir.')
    // La date est un repère : le libellé ne laisse pas croire qu'elle verrouille quoi que ce soit.
    expect(before[1].label).toBe('Date indicative')
    expect(before[1].detail).toMatch(/non vérifié par le serveur/)
    const after = liveConditions(2, '2026-11-16')
    expect(after.map((c) => c.done)).toEqual([true, true, false])
    expect(liveConditions(null, '2026-10-31')[0].detail).toBe('— sur 2, à remplir.')
  })
})

describe('REP-01 : regroupement Réputation', () => {
  it('un seul h1 « Réputation » ; segments Avis et Rapport KPI ; aria-current sur le segment actif', () => {
    for (const vue of ['avis', 'kpi'] as const) {
      const html = renderToStaticMarkup(h(AdminProviders, null, h(ReputationView, { vue, hub: true })))
      expect(html.match(/<h1/g)).toHaveLength(1)
      expect(html).toContain('>Réputation</h1>')
      expect(html).toContain('Avis')
      expect(html).toContain('Rapport KPI')
      expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    }
  })

  it('parseVue : tout ce qui n\'est pas « kpi » ouvre Avis', () => {
    expect(parseVue('kpi')).toBe('kpi')
    expect(parseVue('avis')).toBe('avis')
    expect(parseVue(undefined)).toBe('avis')
    expect(parseVue('send')).toBe('avis')
  })

  it('les trois routes rendent les mêmes composants', () => {
    expect(read('src/app/admin/(app)/avis/page.tsx')).toContain('<ReputationView vue="avis" />')
    expect(read('src/app/admin/(app)/kpi/page.tsx')).toContain('<ReputationView vue="kpi" />')
    expect(read('src/app/admin/(app)/reputation/page.tsx')).toContain('<ReputationView vue={parseVue(vue)} hub />')
  })

  it('états chargement / vide / erreur via les primitives P11', () => {
    for (const f of ['KpiPanel.tsx', 'ReviewsPanel.tsx']) {
      const src = read(`${REP_DIR}/${f}`)
      expect(src, f).toContain('LoadingState')
      expect(src, f).toContain('EmptyState')
      expect(src, f).toContain('ErrorState')
      expect(src, f).toContain('useAdminQuery')
    }
    const html = flat(renderToStaticMarkup(h(AdminProviders, null, h(ReviewsPanel))))
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('Chargement')
  })

  it('la note moyenne et la répartition sont masquées : aucun chiffre inventé', () => {
    const src = read(`${REP_DIR}/ReviewsPanel.tsx`)
    expect(src).not.toMatch(/Note moyenne|Répartition des notes|exemple/i)
    expect(flat(renderToStaticMarkup(h(AdminProviders, null, h(ReviewsPanel))))).not.toMatch(/Note moyenne|Répartition/)
  })
})

describe('REP-03 : saisie manuelle des totaux gardée', () => {
  it('libellés conservés', () => {
    const src = read(`${REP_DIR}/ReviewsPanel.tsx`)
    for (const s of [
      'Suivi mensuel',
      'Total TripAdvisor du mois (saisie manuelle)',
      'Enregistrer le total',
      'Aucune donnée pour ce mois',
      'Impossible de charger les statistiques. Réessayez ou rechargez la page.',
      'Total enregistré.',
      'Valeur invalide : entrez un nombre entier.',
      'à relire',
      'Copier',
      'Ouvrir WhatsApp',
      "Message WhatsApp (invitation d&apos;avis)",
    ]) {
      expect(src, s).toContain(s)
    }
    expect(src).toContain("'/api/review/stats', { method: 'PUT'")
  })
})

describe('détails KPI', () => {
  const base = { alerts: [{ code: 'x', severity: 'critical', metric: 'm', message: 'Avis bas', current: 3, previous: null }] }
  it('alerte critique remontée en haut', () => {
    expect(criticalAlerts({ ...base } as unknown as WeeklyKpiRow)).toHaveLength(1)
    expect(criticalAlerts(undefined)).toEqual([])
  })
  it('écart : flèche + texte, favorable selon le sens', () => {
    expect(deltaView(10, 5, 'int', 'up')).toMatchObject({ direction: 'up', tone: 'good' })
    expect(deltaView(10, 5, 'int', 'down')).toMatchObject({ direction: 'up', tone: 'bad' })
    expect(deltaView(14, 15, 'rank', 'down')).toMatchObject({ direction: 'down', tone: 'good' })
    expect(deltaView(null, 5, 'int', 'up')).toMatchObject({ direction: 'na', tone: 'neutral', text: '—' })
  })
})
