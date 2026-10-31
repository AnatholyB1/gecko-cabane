'use client'

import { useState } from 'react'
import type { Reservation, ReservationStatus } from '@/types/database'
import { adminFetch, AdminFetchError } from '../admin-fetch'
import { useConfirm } from '../ConfirmDialog'
import { useToast } from '../Toast'
import { actionAriaLabel, type ReservationAction } from '@/utils/reservation-status'
import { formatReservationTime } from '@/utils/krabi-time'
import { confirmOptionsFor, successMessage } from './actions'
import { RESERVATIONS_URL, statusUpdateBody } from './requests'

export type RowFailure = { action: ReservationAction; message: string }

/**
 * Changement de statut en un tap (RSV-01, RSV-05). Une seule requête par ligne à la fois :
 * pendant la requête la ligne est « occupée » (tous ses boutons désactivés). Un échec laisse la
 * ligne inchangée, affiche un message en ligne avec « Réessayer » et un toast d'erreur persistant.
 * La requête est exactement celle de l'ancienne page : PUT { id, status }.
 */
export function useReservationActions(onChanged: () => void) {
  const confirm = useConfirm()
  const toast = useToast()
  const [busy, setBusy] = useState<Record<number, ReservationStatus>>({})
  const [failures, setFailures] = useState<Record<number, RowFailure>>({})

  async function run(r: Reservation, action: ReservationAction) {
    if (busy[r.id]) return
    const options = confirmOptionsFor(action, r)
    if (options && !(await confirm(options))) return

    setBusy((b) => ({ ...b, [r.id]: action.to }))
    setFailures((f) => {
      if (!(r.id in f)) return f
      const rest = { ...f }
      delete rest[r.id]
      return rest
    })
    try {
      await adminFetch(RESERVATIONS_URL, { method: 'PUT', json: statusUpdateBody(r.id, action.to) })
      toast.success(successMessage(r.customer_name, action.to))
      onChanged()
    } catch (e) {
      const message = e instanceof AdminFetchError ? e.message : 'Erreur lors de la mise à jour.'
      setFailures((f) => ({ ...f, [r.id]: { action, message } }))
      toast.error(
        `${actionAriaLabel(action, r.customer_name, formatReservationTime(r.reservation_time))} : échec`,
        `${message} La réservation n'a pas été modifiée.`,
      )
    } finally {
      setBusy((b) => {
        const rest = { ...b }
        delete rest[r.id]
        return rest
      })
    }
  }

  return { busy, failures, run }
}
