'use client'

import { useId, useState } from 'react'
import { ChevronDown, MessageCircle, Phone, RefreshCw, TriangleAlert, Users, CircleAlert, PartyPopper, NotebookText } from 'lucide-react'
import type { Reservation } from '@/types/database'
import { Button, buttonClass } from '../Button'
import { StatusBadge } from '../Badge'
import { formatReservationTime } from '@/utils/krabi-time'
import { phoneLinks } from '@/utils/phone-links'
import { SOURCE_LABELS } from '@/utils/reservation-source'
import { actionAriaLabel, nextActions, type ReservationAction } from '@/utils/reservation-status'
import { contactLabels } from './actions'
import { ReservationDetails } from './ReservationDetails'
import type { RowFailure } from './use-reservation-actions'

const VARIANT = { primary: 'primary', secondary: 'secondary', 'danger-outline': 'danger-outline' } as const

/**
 * Une réservation, en ligne dense (D2 §5.2). Heure, nom, couverts, statut, appel et WhatsApp en
 * tête ; occasion, allergie et note toujours visibles ; actions selon `nextActions` ; le reste
 * (email, source, notes admin, suppression) derrière « Détails » (liste seulement).
 * `hideStatus` : sur la carte « à confirmer » tout est en attente, le badge ne serait que répétition.
 */
export function ReservationRow({
  reservation: r,
  busyTo,
  failure,
  onAction,
  onChanged,
  hideStatus = false,
  withDetails = false,
}: {
  reservation: Reservation
  /** Statut en cours d'envoi pour cette ligne (ligne occupée). */
  busyTo?: Reservation['status']
  failure?: RowFailure
  onAction: (r: Reservation, action: ReservationAction) => void
  onChanged?: () => void
  hideStatus?: boolean
  withDetails?: boolean
}) {
  const [open, setOpen] = useState(false)
  const detailId = useId()
  const time = formatReservationTime(r.reservation_time)
  const actions = nextActions(r.status)
  const links = phoneLinks(r.customer_phone)
  const labels = contactLabels(r.customer_name)
  const busy = busyTo !== undefined
  const meta = [SOURCE_LABELS[r.source ?? 'site'], r.locale?.toUpperCase(), r.customer_phone].filter(Boolean).join(' · ')
  const hasNotes = Boolean(r.occasion || r.allergies || r.admin_notes)

  return (
    <article
      className={`rv-row${actions.length === 0 ? ' rv-row--noactions' : ''}`}
      data-status={r.status}
      data-reservation-id={r.id}
      aria-busy={busy || undefined}
    >
      <div className="rv-row__time">{time}</div>
      <div className="rv-row__id">
        <h3 className="rv-row__name">{r.customer_name}</h3>
        <p className="rv-row__meta" title={meta}>{meta}</p>
      </div>
      <div className="rv-row__sub">
        {hideStatus ? null : (
          <span className="rv-row__status">
            <StatusBadge status={r.status} />
          </span>
        )}
        <div className="rv-row__party" role="img" aria-label={`${r.party_size} couvert${r.party_size > 1 ? 's' : ''}`}>
                <Users className="i i-sm" aria-hidden="true" focusable="false" />
                {r.party_size}
              </div>
      </div>
      <div className="rv-row__contact">
        {links.tel ? (
          <a className={buttonClass({ variant: 'secondary', iconOnly: true })} href={links.tel} aria-label={labels.tel}>
            <Phone className="i" aria-hidden="true" focusable="false" />
          </a>
        ) : null}
        {links.whatsapp ? (
          <a className={buttonClass({ variant: 'secondary', iconOnly: true })} href={links.whatsapp} target="_blank" rel="noopener noreferrer" aria-label={labels.whatsapp}>
            <MessageCircle className="i" aria-hidden="true" focusable="false" />
          </a>
        ) : null}
        {withDetails ? (
          <Button
            variant="ghost"
            iconOnly
            aria-label={`Détails de la réservation de ${r.customer_name}`}
            aria-expanded={open}
            aria-controls={detailId}
            onClick={() => setOpen((v) => !v)}
          >
            <ChevronDown className="i" aria-hidden="true" focusable="false" style={{ transform: open ? 'rotate(180deg)' : undefined }} />
          </Button>
        ) : null}
      </div>
      {hasNotes && !failure ? (
        <div className="rv-row__notes">
          {r.allergies ? (
            <span className="rv-tag rv-tag--allergy">
              <TriangleAlert className="i i-sm" aria-hidden="true" focusable="false" />
              <span><span className="adm-sr-only">Allergies : </span>{r.allergies}</span>
            </span>
          ) : null}
          {r.occasion ? (
            <span className="rv-tag">
              <PartyPopper className="i i-sm" aria-hidden="true" focusable="false" />
              <span><span className="adm-sr-only">Occasion : </span>{r.occasion}</span>
            </span>
          ) : null}
          {r.admin_notes ? (
            <span className="rv-tag rv-tag--note">
              <NotebookText className="i i-sm" aria-hidden="true" focusable="false" />
              <span><span className="adm-sr-only">Note : </span>{r.admin_notes}</span>
            </span>
          ) : null}
        </div>
      ) : null}
      {failure ? (
        <div className="rv-row__fail" role="alert">
          <span>
            <CircleAlert className="i i-sm" aria-hidden="true" focusable="false" />
            {failure.message} La réservation n&apos;a pas été modifiée.
          </span>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => onAction(r, failure.action)}>
            <RefreshCw className="i i-sm" aria-hidden="true" focusable="false" />
            Réessayer
          </Button>
        </div>
      ) : null}
      {actions.length > 0 ? (
        <div className="rv-row__actions">
          {actions.map((a) => {
            const pressed = busyTo === a.to
            return (
              <Button
                key={a.to}
                variant={VARIANT[a.emphasis]}
                disabled={busy}
                loading={pressed}
                loadingLabel={a.busyLabel}
                aria-label={actionAriaLabel(a, r.customer_name, time)}
                onClick={() => onAction(r, a)}
              >
                {a.label}
              </Button>
            )
          })}
        </div>
      ) : null}
      {withDetails && open ? (
        <div className="rv-row__detail" id={detailId}>
          <ReservationDetails reservation={r} disabled={busy} onChanged={onChanged ?? (() => {})} />
        </div>
      ) : null}
    </article>
  )
}
