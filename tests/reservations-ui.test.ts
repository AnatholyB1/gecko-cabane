/**
 * Phase 15 : interface « Aujourd'hui » / « Réservations » (TDY-01/02, RSV-01..05).
 * Rendu serveur de la ligne, logique pure de la liste, câblage par lecture du source.
 * Le comportement navigateur (focus, dialogue, mesures) est prouvé par la passe Chromium (15-VERIFICATION.md).
 */
import { describe, expect, it } from 'vitest'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ReservationRow } from '../src/components/admin/reservations/ReservationRow'
import { confirmOptionsFor, successMessage } from '../src/components/admin/reservations/actions'
import { validateManualForm } from '../src/components/admin/reservations/ManualReservationForm'
import {
  daySummary,
  filterReservations,
  groupByService,
  matchesQuery,
  statusCounts,
  type ListReservation,
} from '../src/utils/reservation-list'
import { nextActions } from '../src/utils/reservation-status'
import type { Reservation } from '../src/types/database'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

function res(over: Partial<Reservation> = {}): Reservation {
  return {
    id: 1,
    customer_name: 'Anna Schmidt',
    customer_email: 'anna@example.com',
    customer_phone: '+66800000113',
    reservation_date: '2026-10-31',
    reservation_time: '19:00:00',
    party_size: 2,
    occasion: null,
    status: 'pending',
    admin_notes: null,
    created_at: '2026-10-30T10:00:00Z',
    updated_at: '2026-10-30T10:00:00Z',
    confirmed_at: null,
    cancelled_at: null,
    locale: 'de',
    review_token: 'x',
    review_email_sent_at: null,
    review_reminder_sent_at: null,
    review_clicked_at: null,
    source: 'site',
    utm_source: null,
    utm_medium: null,
    ref: null,
    ...over,
  }
}

const row = (r: Reservation, props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(h(ReservationRow, { reservation: r, onAction: () => {}, ...props }))

describe('RSV-01 actions en un tap selon nextActions', () => {
  it('en attente : Confirmer (primaire) et Annuler', () => {
    const html = row(res())
    expect(html).toContain('Confirmer')
    expect(html).toContain('aria-label="Confirmer la réservation de Anna Schmidt, 19:00"')
    expect(html).toContain('aria-label="Annuler la réservation de Anna Schmidt, 19:00"')
    expect(html).toContain('adm-btn--primary')
    expect(html).not.toContain('Terminer')
  })
  it('confirmée : Terminer, Absent, Annuler', () => {
    const html = row(res({ status: 'confirmed' }))
    for (const l of ['Terminer', 'Absent', 'Annuler']) expect(html).toContain(`>${l}<`)
  })
  it.each(['completed', 'cancelled', 'no_show'] as const)('%s : aucune action, pas de « Rétablir »', (status) => {
    const html = row(res({ status }))
    expect(html).not.toContain('rv-row__actions')
    expect(html).not.toContain('Rétablir')
  })
  it('no_show est affiché « Non présenté », le bouton s’appelle « Absent » (décision propriétaire)', () => {
    expect(row(res({ status: 'no_show' }))).toContain('Non présenté')
    expect(nextActions('confirmed').find((a) => a.to === 'no_show')?.label).toBe('Absent')
  })
  it('« à confirmer » n’est pas répété : le badge peut être masqué sur la carte dédiée', () => {
    expect(row(res())).toContain('En attente')
    expect(row(res(), { hideStatus: true })).not.toContain('En attente')
    expect(row(res())).not.toContain('À confirmer')
  })
  it('annulation et « Absent » demandent une confirmation, Confirmer et Terminer non', () => {
    const subject = res({ customer_email: 'a@b.co' })
    const byTo = (to: string) => [...nextActions('pending'), ...nextActions('confirmed')].find((a) => a.to === to)!
    expect(confirmOptionsFor(byTo('confirmed'), subject)).toBeNull()
    expect(confirmOptionsFor(byTo('completed'), subject)).toBeNull()
    const cancel = confirmOptionsFor(byTo('cancelled'), subject)!
    expect(cancel.title).toBe('Annuler cette réservation ?')
    expect(cancel.cancelLabel).toBe('Garder la réservation')
    expect(cancel.confirmLabel).toBe('Annuler la réservation')
    expect(String(cancel.description)).toContain('a@b.co')
    expect(String(cancel.description)).toContain('samedi 31 octobre 2026 à 19h')
    const noMail = confirmOptionsFor(byTo('cancelled'), res({ customer_email: null }))!
    expect(String(noMail.description)).toContain('Aucun email ne sera envoyé')
    const absent = confirmOptionsFor(byTo('no_show'), subject)!
    expect(absent.confirmLabel).toBe('Marquer non présenté')
    expect(absent.tone).toBe('danger')
  })
  it('message de succès nominatif', () => {
    expect(successMessage('Anna Schmidt', 'confirmed')).toBe('Réservation de Anna Schmidt confirmée.')
  })
})

describe('RSV-05 ligne occupée et heures de Krabi', () => {
  it('pendant la requête : ligne aria-busy, tous les boutons aria-disabled (focus conservé), le bouton pressé affiche son libellé progressif', () => {
    const html = row(res({ status: 'confirmed' }), { busyTo: 'completed' })
    expect(html).toContain('aria-busy="true"')
    const buttons = html.match(/<button[^>]*>/g) ?? []
    expect(buttons.length).toBe(3)
    // aria-disabled et non disabled : un bouton disabled perd le focus clavier (audit P15)
    for (const b of buttons) {
      expect(b).toContain('aria-disabled="true"')
      expect(b).not.toContain(' disabled=""')
    }
    expect(html).toContain('Clôture…')
  })
  it('sans requête en cours : aucun bouton désactivé', () => {
    const html = row(res({ status: 'confirmed' }))
    expect(html).not.toContain('disabled=""')
  })
  it('l’heure affichée est la valeur stockée, sans Date ni fuseau', () => {
    expect(row(res({ reservation_time: '19:30:00' }))).toContain('>19:30<')
    expect(row(res({ reservation_time: '07:05' }))).toContain('>07:05<')
  })
  it('échec : message en ligne avec Réessayer, la ligne reste inchangée', () => {
    const failure = { action: nextActions('pending')[0], message: 'Erreur serveur.' }
    const html = row(res(), { failure })
    expect(html).toContain('role="alert"')
    expect(html).toContain('Erreur serveur.')
    expect(html).toContain('La réservation n&#x27;a pas été modifiée.')
    expect(html).toContain('Réessayer')
    expect(html).toContain('En attente')
  })
})

describe('RSV-03 appel, WhatsApp, occasion / allergies / notes', () => {
  it('liens tel: et wa.me avec le nom dans l’étiquette, WhatsApp dans un nouvel onglet', () => {
    const html = row(res({ customer_phone: '+66 80 000 0113' }))
    expect(html).toContain('href="tel:+66800000113"')
    expect(html).toContain('aria-label="Appeler Anna Schmidt"')
    expect(html).toContain('href="https://wa.me/66800000113"')
    expect(html).toContain('aria-label="WhatsApp Anna Schmidt (nouvel onglet)"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })
  it('numéro invalide ou absent : pas de lien factice', () => {
    for (const p of ['', 'abc', '0812345678']) {
      const html = row(res({ customer_phone: p }))
      expect(html).not.toContain('tel:')
      expect(html).not.toContain('wa.me')
    }
  })
  it('occasion, allergies et note sont visibles sans ouvrir de détails', () => {
    const html = row(res({ occasion: 'Anniversaire', allergies: 'Arachides', admin_notes: 'Table calme' }))
    expect(html).toContain('Anniversaire')
    expect(html).toContain('Arachides')
    expect(html).toContain('Table calme')
    expect(html).toContain('rv-tag--allergy')
  })
  it('sans allergie (colonne absente avant la migration) : aucune pastille, pas d’erreur', () => {
    const html = row(res())
    expect(html).not.toContain('rv-tag--allergy')
    expect(html).not.toContain('rv-row__notes')
  })
  it('jamais de texte inférieur à 14 px ni de classe text-xs dans la ligne', () => {
    expect(row(res({ occasion: 'x', allergies: 'y', admin_notes: 'z' }))).not.toMatch(/text-xs|text-\[1[0-3]px\]/)
  })
})

describe('RSV-02 recherche et filtres côté client', () => {
  const rows: ListReservation[] = [
    { id: 1, customer_name: 'Anna Schmidt', customer_phone: '+66800000113', reservation_time: '12:30', party_size: 4, status: 'confirmed', admin_notes: 'Sans gluten' },
    { id: 2, customer_name: 'Élodie Martin', customer_phone: '+66811111111', reservation_time: '19:00', party_size: 2, status: 'pending', occasion: 'Anniversaire' },
    { id: 3, customer_name: 'Sven Lindqvist', customer_phone: '+66822222222', reservation_time: '20:00:00', party_size: 3, status: 'cancelled', allergies: 'Arachides' },
    { id: 4, customer_name: 'Tom', customer_phone: '', reservation_time: '15:59', party_size: 5, status: 'no_show' },
  ]
  it('recherche insensible à la casse et aux accents', () => {
    expect(matchesQuery(rows[1], 'elodie')).toBe(true)
    expect(matchesQuery(rows[1], 'ÉLODIE')).toBe(true)
    expect(matchesQuery(rows[0], 'gluten')).toBe(true)
    expect(matchesQuery(rows[1], 'anniv')).toBe(true)
    expect(matchesQuery(rows[2], 'arachide')).toBe(true)
    expect(matchesQuery(rows[0], 'zzz')).toBe(false)
  })
  it('recherche par téléphone en ignorant la mise en forme', () => {
    expect(matchesQuery(rows[0], '0800 000 113')).toBe(true)
    expect(matchesQuery(rows[0], '+66 80')).toBe(true)
    expect(matchesQuery(rows[1], '0000')).toBe(false)
  })
  it('filtre de statut + recherche combinés ; les compteurs ignorent le filtre', () => {
    expect(filterReservations(rows, 'pending', '').map((r) => r.id)).toEqual([2])
    expect(filterReservations(rows, 'all', 'sven').map((r) => r.id)).toEqual([3])
    expect(filterReservations(rows, 'confirmed', 'sven')).toEqual([])
    expect(statusCounts(rows)).toEqual({ all: 4, pending: 1, confirmed: 1, completed: 0, cancelled: 1, no_show: 1 })
  })
  it('regroupe Déjeuner / Dîner (coupure 16h) avec sous-totaux actifs', () => {
    const g = groupByService(rows)
    expect(g.map((x) => [x.label, x.reservations.map((r) => r.id), x.count, x.covers])).toEqual([
      ['Déjeuner', [1, 4], 1, 4],
      ['Dîner', [2, 3], 1, 2],
    ])
  })
  it('synthèse du jour : annulées et non présentées hors total', () => {
    expect(daySummary(rows)).toEqual({ reservations: 2, covers: 6, cancelled: 2 })
  })
})

describe('RSV-04 saisie manuelle : validation côté client', () => {
  const fd = (o: Record<string, string>) => {
    const f = new FormData()
    for (const [k, v] of Object.entries(o)) f.set(k, v)
    return f
  }
  const ok = { source: 'telephone', customer_name: 'Somchai', customer_phone: '+66812345678', reservation_date: '2026-11-03', reservation_time: '19:30', party_size: '4' }
  it('formulaire valide : aucune erreur', () => expect(validateManualForm(fd(ok))).toEqual({}))
  it('formulaire vide : une erreur par champ requis, téléphone compris', () => {
    expect(Object.keys(validateManualForm(fd({ party_size: '' }))).sort()).toEqual(
      ['customer_name', 'customer_phone', 'party_size', 'reservation_date', 'reservation_time', 'source'].sort(),
    )
  })
  it('« Sans réservation » : téléphone facultatif', () => {
    expect(validateManualForm(fd({ ...ok, source: 'sans_reservation', customer_phone: '' }))).toEqual({})
  })
  it('couverts hors 1 à 50 refusés', () => {
    for (const n of ['0', '51', '2.5']) expect(validateManualForm(fd({ ...ok, party_size: n })).party_size).toBeTruthy()
  })
})

describe('câblage', () => {
  it('« Aujourd’hui » est la page /admin, « Réservations » est un composant client', () => {
    expect(read('src/app/admin/(app)/page.tsx')).toContain('<TodayView')
    const page = read('src/app/admin/(app)/reservations/page.tsx')
    expect(page).toContain('<ReservationsView')
    expect(page).toContain('krabiTodayYmd()')
    expect(page).not.toMatch(/toISOString\(\)\.split|new Date\(\)\.toISOString/)
  })
  it('l’ancien formulaire a été déplacé, plus aucun confirm() natif', () => {
    expect(() => read('src/app/admin/(app)/reservations/ManualReservationForm.tsx')).toThrow()
    for (const f of ['ReservationRow.tsx', 'ReservationDetails.tsx', 'ReservationsView.tsx', 'TodayView.tsx', 'NewReservation.tsx', 'use-reservation-actions.ts']) {
      expect(read(`src/components/admin/reservations/${f}`)).not.toMatch(/(?<![\w.$])confirm\(\s*['"`]|window\.confirm\(/)
    }
    expect(read('src/components/admin/reservations/ReservationDetails.tsx')).toContain('useConfirm')
  })
  it('« + Réservation » est global : lien de l’en-tête, fournisseur sous AdminProviders, ?nouvelle=1', () => {
    expect(read('src/components/admin/shell/TopBar.tsx')).toContain('<NewReservationLink')
    expect(read('src/components/admin/AdminProviders.tsx')).toContain('<NewReservationProvider')
    const np = read('src/components/admin/reservations/NewReservation.tsx')
    expect(np).toContain("get('nouvelle') !== '1'")
    expect(np).toContain('<Dialog.Root')
    expect(np).toContain('useOnReservationCreated')
  })
  it('max_covers vient des réglages, jamais codé en dur dans la vue du jour (TDY-01)', () => {
    const src = read('src/components/admin/reservations/TodayView.tsx')
    expect(src).toContain('parseMaxCovers(settings)')
    expect(src).toContain('/api/settings')
    expect(src).not.toMatch(/\b40\b/)
    expect(src).toContain('computeToday(rows, settings)')
  })
  it('le bouton « Complet ce soir » n’existe pas encore (phase 17) : emplacement vide seulement', () => {
    const src = read('src/components/admin/reservations/TodayView.tsx')
    expect(src).not.toMatch(/Complet ce soir<|>Complet ce soir/)
    expect(src).toContain('data-slot="acc-03-complet-ce-soir"')
  })
  it('lecture seule des routes d’API et des emails : aucun fichier gelé touché', () => {
    expect(read('src/utils/resend.ts')).not.toMatch(/allergies/) // contenu complet comparé à c6bc779 dans tests/p15-audit-fixes.test.ts
  })
})
