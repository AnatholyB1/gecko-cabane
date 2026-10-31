/**
 * DSN-03 / DSN-04 : primitives et états de src/components/admin/, vérifiés par rendu statique
 * (balisage et ARIA ; Vitest tourne sans DOM).
 */
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import type { ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Button, buttonClass } from '../src/components/admin/Button'
import { Field, fieldAria } from '../src/components/admin/Field'
import { Input, Select, Textarea } from '../src/components/admin/Input'
import { Card, CardHeader } from '../src/components/admin/Card'
import { Badge, StatusBadge } from '../src/components/admin/Badge'
import { RESERVATION_STATUS_BADGES } from '../src/components/admin/status'
import { DataTable, type DataTableColumn } from '../src/components/admin/DataTable'
import { PageHeader } from '../src/components/admin/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../src/components/admin/states'
import { AdminFetchError } from '../src/components/admin/admin-fetch'
import type { ReservationStatus } from '../src/types/database'

const render = renderToStaticMarkup
/** createElement tolérant : les props sont vérifiées par tsc dans src/, ici on teste le balisage. */
const h = (type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) =>
  createElement(type as ComponentType<Record<string, unknown>>, props, ...(children as never[]))

describe('DSN-03 Button', () => {
  it('classes : variantes, taille sm, icône seule, bloc', () => {
    expect(buttonClass()).toBe('adm-btn')
    expect(buttonClass({ variant: 'primary' })).toBe('adm-btn adm-btn--primary')
    expect(buttonClass({ variant: 'danger', size: 'sm' })).toBe('adm-btn adm-btn--danger adm-btn--sm')
    expect(buttonClass({ variant: 'danger-outline' })).toBe('adm-btn adm-btn--danger-outline')
    expect(buttonClass({ iconOnly: true, block: true })).toBe('adm-btn adm-btn--icon adm-btn--block')
  })

  it('repos : type="button" par défaut (jamais de soumission accidentelle)', () => {
    const html = render(h(Button, null, 'Annuler'))
    expect(html).toContain('type="button"')
    expect(html).not.toContain('aria-busy')
  })

  it('chargement : aria-busy, aria-disabled, spinner, libellé de chargement conservé', () => {
    const html = render(h(Button, { loading: true, loadingLabel: 'Enregistrement…' }, 'Enregistrer'))
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('aria-disabled="true"')
    expect(html).toContain('adm-spin')
    expect(html).toContain('Enregistrement…')
    expect(html).not.toContain('>Enregistrer<')
  })

  it('désactivé : attribut disabled', () => {
    expect(render(h(Button, { disabled: true }, 'Supprimer'))).toContain('disabled=""')
  })

  it('icône seule : aria-label transmis', () => {
    const html = render(h(Button, { iconOnly: true, 'aria-label': 'Rechercher' }, 'x'))
    expect(html).toContain('aria-label="Rechercher"')
    expect(html).toContain('adm-btn--icon')
  })
})

describe('DSN-03 Field / Input / Select / Textarea', () => {
  it('fieldAria relie aide et erreur et marque le champ invalide', () => {
    expect(fieldAria('f', {})).toEqual({ id: 'f', 'aria-describedby': undefined, 'aria-invalid': undefined })
    const a = fieldAria('f', { hint: 'aide', error: 'erreur' })
    expect(a['aria-describedby']).toBe('f-error f-hint')
    expect(a['aria-invalid']).toBe(true)
  })

  it('Input : libellé relié par for/id, aide en aria-describedby', () => {
    const html = render(h(Input, { label: 'Nom du client', id: 'nom', hint: 'Tel qu’il apparaîtra.' }))
    expect(html).toContain('<label class="adm-label" for="nom">Nom du client</label>')
    expect(html).toContain('id="nom"')
    expect(html).toContain('aria-describedby="nom-hint"')
    expect(html).toContain('id="nom-hint"')
    expect(html).not.toContain('aria-invalid')
  })

  it('Input en erreur : aria-invalid, message relié par aria-describedby (sans role="alert", F-11), icône', () => {
    const html = render(h(Input, { label: 'Téléphone', id: 'tel', error: 'Numéro incomplet.' }))
    expect(html).toContain('aria-invalid="true"')
    expect(html).toContain('aria-describedby="tel-error"')
    expect(html).toMatch(/<p class="adm-error" id="tel-error"><svg[^>]*aria-hidden="true"/)
    expect(html).not.toContain('role="alert"')
    expect(html).toContain('Numéro incomplet.')
  })

  it('identifiant automatique quand `id` est absent (label et contrôle restent liés)', () => {
    const html = render(h(Input, { label: 'Heure', type: 'time' }))
    const id = /for="([^"]+)"/.exec(html)?.[1]
    expect(id).toBeTruthy()
    expect(html).toContain(`id="${id}"`)
    expect(html).toContain('type="time"')
  })

  it('facultatif et désactivé', () => {
    const html = render(h(Textarea, { label: 'Note', optional: true, disabled: true, id: 'n' }))
    expect(html).toContain('(facultatif)')
    expect(html).toContain('disabled=""')
    expect(html).toContain('adm-textarea')
  })

  it('Select natif : classe adm-select et options', () => {
    const html = render(h(Select, { label: 'Couverts', id: 'c' }, h('option', null, '4')))
    expect(html).toContain('<select')
    expect(html).toContain('adm-select')
  })

  it('Field seul pour un contrôle personnalisé', () => {
    const html = render(h(Field, { id: 'x', label: 'Libellé', hint: 'aide' }, h('div', { id: 'x' })))
    expect(html).toContain('for="x"')
    expect(html).toContain('id="x-hint"')
  })
})

describe('DSN-03 Card / Badge', () => {
  it('Card ne s’imbrique pas : une section avec sa classe, variante flush', () => {
    expect(render(h(Card, null, 'a'))).toBe('<section class="adm-card">a</section>')
    expect(render(h(Card, { flush: true }, 'a'))).toContain('adm-card--flush')
    expect(render(h(CardHeader, { title: 'Horaires' }))).toContain('<h2 class="adm-h2">Horaires</h2>')
  })

  it('chaque statut de réservation : icône (aria-hidden) + libellé + teinte', () => {
    const expected: Record<ReservationStatus, [string, string]> = {
      pending: ['En attente', 'warn'],
      confirmed: ['Confirmée', 'ok'],
      completed: ['Terminée', 'info'],
      cancelled: ['Annulée', 'danger'],
      no_show: ['Non présenté', 'neutral'],
    }
    for (const status of Object.keys(expected) as ReservationStatus[]) {
      const html = render(h(StatusBadge, { status }))
      expect(html, status).toContain(`adm-badge--${expected[status][1]}`)
      expect(html, status).toContain(expected[status][0])
      expect(html, status).toMatch(/<svg[^>]*aria-hidden="true"/)
      expect(RESERVATION_STATUS_BADGES[status].icon, status).toBeTruthy()
    }
    expect(Object.keys(RESERVATION_STATUS_BADGES).sort()).toEqual(Object.keys(expected).sort())
  })

  it('Badge générique exige une icône', () => {
    const html = render(h(Badge, { tone: 'info', icon: RESERVATION_STATUS_BADGES.pending.icon }, 'Info'))
    expect(html).toContain('adm-badge--info')
    expect(html).toContain('<svg')
  })
})

type Row = { id: number; name: string; party: number }
const COLUMNS: DataTableColumn<Row>[] = [
  { key: 'name', header: 'Client', role: 'name', cell: (r) => r.name },
  { key: 'party', header: 'Couverts', role: 'num', cell: (r) => r.party },
  { key: 'x', header: 'Actions', role: 'actions', cell: () => 'ok' },
]

describe('DSN-03 DataTable', () => {
  const html = render(h(DataTable, { columns: COLUMNS, rows: [{ id: 1, name: 'Martin L.', party: 4 }], rowKey: (r: Row) => r.id, caption: '1 réservation' }))

  it('balisage sémantique : caption, th scope="col", colonne d’actions à en-tête masqué', () => {
    expect(html).toContain('<caption>1 réservation</caption>')
    expect(html.match(/<th scope="col"/g)).toHaveLength(3)
    expect(html).toContain('<span class="adm-sr-only">Actions</span>')
  })

  it('rôles de tableau explicites (F-06) : la sémantique survit au display: block mobile', () => {
    expect(html).toContain('<table class="adm-table" role="table">')
    expect(html).toContain('<thead role="rowgroup"><tr role="row">')
    expect(html).toContain('role="columnheader"')
    expect(html).toContain('<tbody role="rowgroup"><tr role="row">')
  })

  it('chaque cellule porte data-label et la classe de son rôle (mise en carte sous 768 px)', () => {
    expect(html).toContain('<td role="cell" class="t-name" data-label="Client">Martin L.</td>')
    expect(html).toContain('<td role="cell" class="t-num adm-num" data-label="Couverts">4</td>')
    expect(html).toContain('t-actions')
  })
})

describe('DSN-03 PageHeader', () => {
  it('un seul h1, description et actions, filet laiton', () => {
    const html = render(h(PageHeader, { title: 'Horaires', description: 'Desc', actions: h('button', null, 'Enregistrer') }))
    expect(html.match(/<h1/g)).toHaveLength(1)
    expect(html).toContain('adm-display')
    expect(html).toContain('adm-pageheader__actions')
    expect(html).toContain('adm-rule--brass')
  })

  it('niveau h2 pour une démonstration', () => {
    expect(render(h(PageHeader, { title: 'T', as: 'h2' }))).toContain('<h2')
  })
})

describe('DSN-04 LoadingState / EmptyState / ErrorState', () => {
  it('chargement : role="status", aria-busy, libellé pour lecteurs d’écran', () => {
    const html = render(h(LoadingState, { label: 'Chargement de la liste…' }))
    expect(html).toContain('role="status"')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('<span class="adm-sr-only">Chargement de la liste…</span>')
  })

  it('chargement par défaut : « Chargement… »', () => {
    expect(render(h(LoadingState, null))).toContain('Chargement…')
  })

  it('vide : titre, phrase, action', () => {
    const html = render(h(EmptyState, { title: 'Aucune réservation ce jour', description: 'Elles apparaîtront ici.', action: h('button', null, 'Réservation') }))
    expect(html).toContain('<h2>Aucune réservation ce jour</h2>')
    expect(html).toContain('Elles apparaîtront ici.')
    expect(html).toContain('<button>Réservation</button>')
  })

  it('erreur : role="alert", Réessayer seulement si onRetry, texte tiré de l’erreur', () => {
    const withRetry = render(h(ErrorState, { error: new AdminFetchError('Connexion perdue.', 0), onRetry: () => {} }))
    expect(withRetry).toContain('role="alert"')
    expect(withRetry).toContain('Connexion perdue')
    expect(withRetry).toContain('Réessayer')
    expect(render(h(ErrorState, { error: new Error('x') }))).not.toContain('Réessayer')
  })

  it('401 : lien « Se reconnecter » vers /admin/login (F-14), absent pour les autres statuts', () => {
    const expired = render(h(ErrorState, { error: new AdminFetchError('Session expirée. Reconnectez-vous.', 401) }))
    expect(expired).toMatch(/<a [^>]*href="\/admin\/login"[^>]*>Se reconnecter<\/a>/)
    expect(render(h(ErrorState, { error: new AdminFetchError('x', 500) }))).not.toContain('Se reconnecter')
  })
})
