'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import type { ApiResponse, Reservation } from '@/types/database'
import { Button } from '../Button'
import { PageHeader } from '../PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../states'
import { useAdminQuery } from '../use-admin-query'
import { addDaysYmd, formatReservationDate, isYmd, krabiTodayYmd, KRABI_TZ_LABEL, relativeDayLabel } from '@/utils/krabi-time'
import {
  daySummary,
  filterReservations,
  groupByService,
  plural,
  statusCounts,
  type StatusFilter,
} from '@/utils/reservation-list'
import { RESERVATION_STATUS_ORDER, STATUS_FILTER_LABELS } from '@/utils/reservation-status'
import { NewReservationButton, useDayHint, useOnReservationCreated } from './NewReservation'
import { ReservationRow } from './ReservationRow'
import { dayUrl } from './requests'
import { useReservationActions } from './use-reservation-actions'
import { useNow } from './use-clock'
import './reservations.css'

const CHIPS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  ...RESERVATION_STATUS_ORDER.map((s) => ({ id: s as StatusFilter, label: STATUS_FILTER_LABELS[s] })),
]

/**
 * « Réservations » (RSV-01, 02, 03, 05) : un jour à la fois (navigation par date), recherche et
 * filtres de statut côté client (aucune requête), liste dense groupée Déjeuner / Dîner.
 * `initialDate` vient du serveur (aujourd'hui à Krabi) : jamais la date UTC du navigateur.
 */
export function ReservationsView({ initialDate }: { initialDate: string }) {
  const [date, setDate] = useState(initialDate)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')
  // Horloge partagée : Hier / Aujourd'hui / Demain suivent minuit à Krabi sans recharger la page.
  const now = useNow()
  const today = krabiTodayYmd(now)
  useDayHint(date)

  const res = useAdminQuery<ApiResponse<Reservation[]>>(dayUrl(date))
  const refetch = res.refetch
  useOnReservationCreated(refetch)
  const { busy, failures, run, withStatus } = useReservationActions(refetch, res.data)

  const rows = res.data?.data?.map(withStatus)
  const counts = rows ? statusCounts(rows) : null
  const shown = rows ? filterReservations(rows, status, query) : []
  const groups = groupByService(shown)
  const sum = rows ? daySummary(rows) : null
  const rel = relativeDayLabel(date, now)

  function go(next: string) {
    if (isYmd(next)) setDate(next)
  }

  return (
    <>
      <PageHeader title="Réservations" description={`${KRABI_TZ_LABEL}. Confirmer, terminer ou annuler en un tap.`} />
      <div className="rv-stack">
        <div className="rv-controls">
          <div className="rv-datebar">
            <Button variant="secondary" iconOnly aria-label="Jour précédent" onClick={() => go(addDaysYmd(date, -1))}>
              <ChevronLeft className="i" aria-hidden="true" focusable="false" />
            </Button>
            <h2 className="rv-datebar__title" aria-live="polite">
              {formatReservationDate(date)}
              {rel ? <small>{rel}</small> : null}
            </h2>
            <Button variant="secondary" iconOnly aria-label="Jour suivant" onClick={() => go(addDaysYmd(date, 1))}>
              <ChevronRight className="i" aria-hidden="true" focusable="false" />
            </Button>
          </div>
          <div className="rv-datebar">
            <div className="rv-seg" role="group" aria-label="Raccourcis de date">
              <button type="button" aria-current={date === addDaysYmd(today, -1) ? 'true' : undefined} onClick={() => go(addDaysYmd(today, -1))}>Hier</button>
              <button type="button" aria-current={date === today ? 'true' : undefined} onClick={() => go(today)}>Aujourd’hui</button>
              <button type="button" aria-current={date === addDaysYmd(today, 1) ? 'true' : undefined} onClick={() => go(addDaysYmd(today, 1))}>Demain</button>
            </div>
            <input
              type="date"
              className="adm-input rv-date"
              aria-label="Choisir une date"
              value={date}
              onChange={(e) => go(e.target.value)}
            />
          </div>
          <div className="rv-search">
            <Search className="i i-sm" aria-hidden="true" focusable="false" />
            <input
              type="search"
              className="adm-input"
              aria-label="Rechercher une réservation"
              placeholder="Nom, téléphone, note…"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="rv-chips" role="group" aria-label="Filtrer par statut">
            {CHIPS.map((c) => (
              <button key={c.id} type="button" className="rv-chip" aria-pressed={status === c.id} onClick={() => setStatus(c.id)}>
                {c.label}
                <b>{counts ? counts[c.id] : '·'}</b>
              </button>
            ))}
          </div>
          {sum ? (
            <p className="rv-summary" role="status">
              {plural(sum.reservations, 'réservation')} · {plural(sum.covers, 'couvert')}
              {sum.cancelled > 0 ? ` · ${sum.cancelled} annulée${sum.cancelled > 1 ? 's' : ''} ou non présentée${sum.cancelled > 1 ? 's' : ''}` : ''} · {KRABI_TZ_LABEL}
            </p>
          ) : null}
        </div>

        {!rows && res.status === 'loading' ? <LoadingState variant="table" label="Chargement des réservations…" /> : null}
        {!rows && res.status === 'error' ? (
          <ErrorState
            error={res.error}
            title="Impossible de charger les réservations"
            description="Vérifiez la connexion, puis réessayez. Aucune réservation n'a été modifiée."
            onRetry={res.refetch}
          />
        ) : null}
        {rows && rows.length === 0 ? (
          <EmptyState
            title="Aucune réservation ce jour"
            description="Rien n'est réservé pour cette date."
            action={
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <NewReservationButton date={date}>+ Réservation</NewReservationButton>
                {date !== today ? <Button variant="secondary" onClick={() => go(today)}>Voir aujourd’hui</Button> : null}
              </div>
            }
          />
        ) : null}
        {rows && rows.length > 0 && shown.length === 0 ? (
          <EmptyState
            title={query.trim() !== '' ? `Aucun résultat pour « ${query.trim()} »` : 'Aucune réservation avec ce statut'}
            description="Modifiez la recherche ou le filtre pour voir les autres réservations de ce jour."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('')
                  setStatus('all')
                }}
              >
                {query.trim() !== '' ? 'Effacer la recherche' : 'Voir toutes les réservations'}
              </Button>
            }
          />
        ) : null}
        {rows && shown.length > 0 ? (
          <div className="rv-card rv-card--flush" aria-busy={res.status === 'loading' || undefined}>
            <div className="rv-colhead" aria-hidden="true">
              <span>Heure</span><span>Client</span><span>Couverts</span><span>Statut</span><span>Contact</span><span>Actions</span>
            </div>
            {groups.map((g) => (
              <section key={g.key} aria-label={g.label}>
                <div className="rv-service">
                  <h2>{g.label}</h2>
                  <span>{plural(g.count, 'réservation')} · {plural(g.covers, 'couvert')}</span>
                </div>
                <div className="rv-list">
                  {g.reservations.map((r) => (
                    <ReservationRow
                      key={r.id}
                      reservation={r}
                      busyTo={busy[r.id]}
                      failure={failures[r.id]}
                      onAction={run}
                      onChanged={refetch}
                      withDetails
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}
        {rows && res.status === 'error' ? (
          <ErrorState error={res.error} title="Actualisation impossible" description="La liste affichée peut être périmée. Aucune réservation n'a été modifiée." onRetry={res.refetch} />
        ) : null}
      </div>
    </>
  )
}
