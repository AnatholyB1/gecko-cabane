'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import type { Reservation } from '@/types/database'
import { adminFetch, AdminFetchError } from '../admin-fetch'
import { useConfirm } from '../ConfirmDialog'
import { useToast } from '../Toast'
import { actionAriaLabel } from '@/utils/reservation-status'
import { formatReservationTime } from '@/utils/krabi-time'
import { confirmOptionsFor, successMessage } from './actions'
import { RESERVATIONS_URL, statusUpdateBody } from './requests'
import { createActionController, withAppliedStatus, type RowFailure } from './action-controller'

export type { RowFailure }

/**
 * Changement de statut en un tap (RSV-01, RSV-05). Une seule requête par ligne à la fois : la ligne
 * reste « occupée » (boutons inertes) jusqu'à la FIN du rechargement de la liste, pas seulement du
 * PUT, sinon un second tap renverrait un second PUT donc un second email client. Un échec laisse
 * la ligne inchangée, avec message en ligne, « Réessayer » et toast d'erreur persistant.
 * La requête est exactement celle de l'ancienne page : PUT { id, status }.
 *
 * `refresh` : recharge la liste et résout `true` si les données sont fraîches.
 * `data` : la liste chargée ; quand elle change, les statuts locaux sont remplacés par les siens.
 */
export function useReservationActions(refresh: () => Promise<boolean>, data?: unknown) {
  const confirm = useConfirm()
  const toast = useToast()

  const [controller] = useState(() => createActionController())
  useEffect(() => {
    controller.setDeps({
      send: async (r, action) => {
        await adminFetch(RESERVATIONS_URL, { method: 'PUT', json: statusUpdateBody(r.id, action.to) })
      },
      refresh,
      confirmFor: (r, action) => {
        const options = confirmOptionsFor(action, r)
        return options ? confirm(options) : null
      },
      messageOf: (e) => (e instanceof AdminFetchError ? e.message : 'Erreur lors de la mise à jour.'),
      onSuccess: (r, action) => toast.success(successMessage(r.customer_name, action.to)),
      onFailure: (r, action, message) =>
        toast.error(
          `${actionAriaLabel(action, r.customer_name, formatReservationTime(r.reservation_time))} : échec`,
          `${message} La réservation n'a pas été modifiée.`,
        ),
      onStale: (r) =>
        toast.error(
          `${r.customer_name} : statut enregistré`,
          "La liste n'a pas pu être actualisée : les chiffres affichés peuvent être périmés. Rechargez la page.",
        ),
    })
  })

  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState)

  const reconcile = controller.reconcile
  useEffect(() => {
    reconcile()
  }, [data, reconcile])

  return {
    busy: state.busy,
    failures: state.failures,
    run: controller.run,
    /** Applique le statut local confirmé par le serveur à une réservation de la liste. */
    withStatus: <T extends Pick<Reservation, 'id' | 'status'>>(r: T): T => withAppliedStatus(r, state.applied),
  }
}
