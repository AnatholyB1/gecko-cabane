'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, CircleAlert, CircleCheck, Ban, TriangleAlert } from 'lucide-react'
import type { ApiResponse, Reservation } from '@/types/database'
import { Button } from '../Button'
import { PageHeader } from '../PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../states'
import { useAdminQuery } from '../use-admin-query'
import { krabiDateLabel } from '../shell/krabi-date'
import { computeToday, parseMaxCovers, type SlotLevel } from '@/utils/today'
import { formatHourFr, krabiClock, krabiTodayYmd, KRABI_TZ_LABEL, SERVICE_SPLIT_MINUTES } from '@/utils/krabi-time'
import { toMinutes, type SettingsMap } from '@/utils/reservation-rules'
import { plural } from '@/utils/reservation-list'
import { CompletCeSoir } from './CompletCeSoir'
import { NewReservationButton, useDayHint, useOnReservationCreated } from './NewReservation'
import { ReservationRow } from './ReservationRow'
import { dayUrl } from './requests'
import { useReservationActions } from './use-reservation-actions'
import { useAutoRefresh, useNow } from './use-clock'
import './reservations.css'

type SettingRow = { key: string; value: string }

function toSettings(rows: readonly SettingRow[] | undefined): SettingsMap {
  const map: SettingsMap = {}
  for (const r of rows ?? []) map[r.key] = r.value
  return map
}

/** Lignes « à confirmer » visibles sans déplier : la carte ne repousse pas les arrivées hors de l'écran. */
const PENDING_PREVIEW = 3

const SPLIT_HOUR = SERVICE_SPLIT_MINUTES / 60

const LEVEL_TEXT: Record<SlotLevel, string> = { free: 'Libre', almost: 'Presque complet', full: 'Complet' }

function Gauge({ label, peak, max, foot }: { label: string; peak: number; max: number; foot: string }) {
  const pct = Math.min(100, max > 0 ? (peak / max) * 100 : 100)
  const level: SlotLevel = max <= 0 || peak >= max ? 'full' : peak >= max * 0.75 ? 'almost' : 'free'
  return (
    <div className="rv-gauge">
      <p className="rv-gauge__label">{label}</p>
      <p className="rv-gauge__n">
        <b>{peak}</b>
        <span>/ {max}</span>
      </p>
      <div
        className={`rv-meter${level === 'free' ? '' : ` rv-meter--${level}`}`}
        role="meter"
        aria-label={`${label}, pic de couverts`}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(peak, Math.max(max, 0))}
        aria-valuetext={`${peak} sur ${max}`}
      >
        <i style={{ width: `${pct}%` }} />
      </div>
      <p className="rv-gauge__foot">
        {level === 'free' ? foot : (
          <>
            {level === 'full' ? <Ban className="i i-sm" aria-hidden="true" focusable="false" /> : <TriangleAlert className="i i-sm" aria-hidden="true" focusable="false" />}
            &nbsp;{LEVEL_TEXT[level]}
          </>
        )}
      </p>
    </div>
  )
}

/**
 * « Aujourd'hui » (TDY-01, TDY-02). Date, heure et hauteur de service : toujours en heure de Krabi.
 * Chiffres calculés par src/utils/today.ts (pic simultané pour les jauges, règle de disponibilité
 * publique pour les créneaux). `initialNowIso` vient du serveur : même premier rendu des deux côtés.
 */
export function TodayView({ initialNowIso }: { initialNowIso: string }) {
  const now = useNow(initialNowIso)
  const [showAllPending, setShowAllPending] = useState(false)

  const today = krabiTodayYmd(now)
  useDayHint(today)
  const res = useAdminQuery<ApiResponse<Reservation[]>>(dayUrl(today))
  const settingsQ = useAdminQuery<{ data?: SettingRow[] }>('/api/settings')
  const refetch = res.refetch
  useOnReservationCreated(refetch)
  const { busy, failures, run, withStatus } = useReservationActions(refetch, res.data)
  // Rechargement silencieux chaque minute et au retour sur la fenêtre (pas pendant une action de statut).
  useAutoRefresh(refetch, Object.keys(busy).length > 0)

  const rows = res.data?.data?.map(withStatus)
  const settings = toSettings(settingsQ.data?.data)
  const maxCovers = parseMaxCovers(settings)
  const summary = rows ? computeToday(rows, settings) : null
  const afterLunch = toMinutes(krabiClock(now)) >= SERVICE_SPLIT_MINUTES
  // Les réservations en attente ne sont listées qu'UNE fois, dans « à confirmer » : pas de doublon dans les arrivées.
  const arrivalGroups = (summary?.arrivals ?? [])
    .map((g) => {
      const kept = g.reservations.filter((r) => r.status !== 'pending')
      return { ...g, reservations: kept, covers: kept.reduce((n, r) => n + r.party_size, 0) }
    })
    .filter((g) => g.reservations.length > 0)
  const shownArrivals = arrivalGroups.reduce((n, g) => n + g.reservations.length, 0)
  const pendingCount = summary?.toConfirm.length ?? 0
  const hiddenPending = pendingCount
  const hiddenOther = rows ? rows.length - shownArrivals - pendingCount : 0

  return (
    <>
      <PageHeader title="Aujourd’hui" description={`${krabiDateLabel(now)} · ${KRABI_TZ_LABEL.replace('Heures', 'heure')}, ${krabiClock(now)}`} />
      <div className="rv-stack" aria-busy={(!summary && res.status === 'loading') || undefined}>
        {!summary && res.status === 'loading' ? <LoadingState variant="table" label="Chargement des réservations du jour…" /> : null}
        {!summary && res.status === 'error' ? <ErrorState error={res.error} title="Impossible de charger les réservations" description="Vérifiez la connexion, puis réessayez. Aucune réservation n'a été modifiée." onRetry={res.refetch} /> : null}
        {summary && rows ? (
          <div className="rv-today">
            <section className="rv-card rv-a-gauges" aria-labelledby="rv-g-t">
              <h2 className="rv-title" id="rv-g-t">Couverts réservés (pic de chaque service)</h2>
              <div className="rv-gauges">
                <Gauge label={`Déjeuner · avant ${SPLIT_HOUR}h`} peak={summary.services.dejeuner.peak} max={maxCovers} foot={`${plural(summary.services.dejeuner.count, 'réservation')}`} />
                <Gauge label={`Dîner · dès ${SPLIT_HOUR}h`} peak={summary.services.diner.peak} max={maxCovers} foot={`${plural(summary.services.diner.count, 'réservation')}`} />
              </div>
              <p className="rv-total">
                <b>{plural(summary.reservedCovers, 'couvert')}</b> sur la journée · capacité {maxCovers} couverts à la fois
                {settingsQ.status === 'error' ? ' (réglages indisponibles : valeur par défaut)' : ''}
              </p>
            </section>

            <section className="rv-card rv-card--flush rv-a-attn" id="a-confirmer" aria-labelledby="rv-at-t">
              {summary.toConfirm.length > 0 ? (
                <>
                  <div className="rv-attn__head">
                    <CircleAlert className="i" aria-hidden="true" focusable="false" />
                    <h2 id="rv-at-t">{summary.toConfirm.length} à confirmer</h2>
                  </div>
                  <div id="a-confirmer-liste">
                    {(showAllPending ? summary.toConfirm : summary.toConfirm.slice(0, PENDING_PREVIEW)).map((r) => (
                      <ReservationRow key={r.id} reservation={r} hideStatus busyTo={busy[r.id]} failure={failures[r.id]} onAction={run} />
                    ))}
                  </div>
                  {summary.toConfirm.length > PENDING_PREVIEW ? (
                    <div className="rv-attn__more">
                      <Button variant="secondary" aria-expanded={showAllPending} aria-controls="a-confirmer-liste" onClick={() => setShowAllPending((v) => !v)}>
                        {showAllPending ? 'Réduire la liste' : `Voir les ${summary.toConfirm.length - PENDING_PREVIEW} autres`}
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <div style={{ padding: 'var(--adm-space-4)' }}>
                  <h2 id="rv-at-t" className="rv-attn__none">
                    <CircleCheck className="i" aria-hidden="true" focusable="false" />
                    Rien à confirmer
                  </h2>
                </div>
              )}
            </section>

            <section className="rv-card rv-a-side" aria-labelledby="rv-c-t">
              <h2 className="rv-title" id="rv-c-t">Couverts occupés par heure</h2>
              {/* Défilement horizontal sur petit écran : la liste doit être atteignable au clavier (axe scrollable-region-focusable). */}
              <ul className="rv-cap" role="list" tabIndex={0} aria-labelledby="rv-c-t">
                {summary.slots.map((s) => (
                  <li key={s.time} className={s.level === 'free' ? (s.used === 0 ? 'is-idle' : '') : `is-${s.level}`}>
                    <span className="rv-cap__flag">
                      {s.level === 'almost' ? <TriangleAlert className="i i-sm" aria-hidden="true" focusable="false" /> : null}
                      {s.level === 'full' ? <Ban className="i i-sm" aria-hidden="true" focusable="false" /> : null}
                    </span>
                    <span className="rv-cap__n">
                      {s.used}
                      <span className="adm-sr-only"> {s.text.replace(/^\d+/, '').trim()}</span>
                    </span>
                    <span className="rv-cap__bar"><i style={{ height: `${Math.min(100, s.max > 0 ? (s.used / s.max) * 100 : 100)}%` }} /></span>
                    <span className="rv-cap__h" aria-hidden="true">{Number(s.time.slice(0, 2))}h</span>
                  </li>
                ))}
              </ul>
              <ul className="rv-legend" role="list">
                <li><span className="rv-sw" />Libre</li>
                <li><span className="rv-sw rv-sw--almost" /><TriangleAlert className="i i-sm" aria-hidden="true" focusable="false" />Presque complet ({Math.ceil(maxCovers * 0.75)} et plus)</li>
                <li><span className="rv-sw rv-sw--full" /><Ban className="i i-sm" aria-hidden="true" focusable="false" />Complet ({maxCovers})</li>
              </ul>
              <p className="rv-total">Barre pleine = {maxCovers} couverts. Une réservation en attente ou confirmée occupe sa place 2 h, comme sur le site.</p>
              <div className="rv-slot-acc03" data-slot="acc-03-complet-ce-soir">
                <CompletCeSoir key={today} date={today} />
              </div>
            </section>

            <section className="rv-a-arr" aria-labelledby="rv-ar-t">
              <h2 className="rv-sect" id="rv-ar-t" style={{ marginBottom: 'var(--adm-space-3)' }}>Arrivées du jour</h2>
              {rows.length === 0 ? (
                <EmptyState
                  title="Aucune réservation ce soir ni ce midi"
                  description="Rien n'est réservé pour aujourd'hui. Les réservations du site apparaîtront ici."
                  action={<NewReservationButton date={today}>+ Réservation</NewReservationButton>}
                />
              ) : (
                <div className="rv-card rv-card--flush">
                  <Arrivals groups={arrivalGroups} afterLunch={afterLunch} busy={busy} failures={failures} run={run} onChanged={refetch} />
                </div>
              )}
              {hiddenPending > 0 || hiddenOther > 0 ? (
                <p className="rv-total" style={{ marginTop: 'var(--adm-space-3)' }}>
                  {hiddenPending > 0 ? <>Les réservations en attente figurent dans « à confirmer » ci-dessus. </> : null}
                  {hiddenOther > 0 ? <>Les réservations annulées ou non présentées ne figurent pas ici : voir <Link href="/admin/reservations">Réservations</Link>.</> : null}
                </p>
              ) : null}
            </section>
          </div>
        ) : null}
        {res.status === 'error' && summary ? (
          <ErrorState error={res.error} title="Actualisation impossible" description="Les chiffres affichés peuvent être périmés. Aucune réservation n'a été modifiée." onRetry={res.refetch} />
        ) : null}
      </div>
    </>
  )
}

type ArrivalGroupView = ReturnType<typeof computeToday<Reservation>>['arrivals'][number]

function Arrivals({
  groups,
  afterLunch,
  busy,
  failures,
  run,
  onChanged,
}: {
  groups: ArrivalGroupView[]
  afterLunch: boolean
  busy: ReturnType<typeof useReservationActions>['busy']
  failures: ReturnType<typeof useReservationActions>['failures']
  run: ReturnType<typeof useReservationActions>['run']
  onChanged: () => void
}) {
  const split = SERVICE_SPLIT_MINUTES / 60
  const isLunch = (hour: string) => Number(hour.slice(0, 2)) < split
  if (groups.length === 0) {
    return <p style={{ padding: 'var(--adm-space-4)' }} className="rv-total">Aucune arrivée prévue.</p>
  }
  const lunch = groups.filter((g) => isLunch(g.hour))
  const folded = afterLunch && lunch.length > 0
  const shown = folded ? groups.filter((g) => !isLunch(g.hour)) : groups
  const renderGroup = (g: (typeof groups)[number]) => (
    <div key={g.hour}>
      <div className="rv-hour">
        <h3>{formatHourFr(g.hour)}</h3>
        <span>{plural(g.reservations.length, 'réservation')} · {plural(g.covers, 'couvert')}</span>
      </div>
      {g.reservations.map((r) => (
        <ReservationRow key={r.id} reservation={r} busyTo={busy[r.id]} failure={failures[r.id]} onAction={run} onChanged={onChanged} />
      ))}
    </div>
  )
  return (
    <>
      {folded ? (
        <details className="rv-past">
          <summary>
            <ChevronRight className="i i-sm" aria-hidden="true" focusable="false" />
            Déjeuner
            <span className="muted">
              {plural(lunch.reduce((n, g) => n + g.reservations.length, 0), 'réservation')} · {plural(lunch.reduce((n, g) => n + g.covers, 0), 'couvert')}
            </span>
          </summary>
          {lunch.map(renderGroup)}
        </details>
      ) : null}
      {shown.map(renderGroup)}
    </>
  )
}
