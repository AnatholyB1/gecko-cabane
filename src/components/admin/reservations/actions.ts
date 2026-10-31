import type { ReservationStatus } from '@/types/database'
import type { ConfirmOptions } from '../ConfirmDialog'
import { formatHourFr, formatReservationDate } from '@/utils/krabi-time'
import { plural } from '@/utils/reservation-list'
import type { ReservationAction } from '@/utils/reservation-status'

export type ActionSubject = {
  customer_name: string
  customer_email?: string | null
  reservation_date: string
  reservation_time: string
  party_size: number
}

function recap(r: ActionSubject): string {
  return `${r.customer_name} · ${formatReservationDate(r.reservation_date)} à ${formatHourFr(r.reservation_time)} · ${plural(r.party_size, 'couvert')}.`
}

/**
 * Dialogue de confirmation d'une action (null = un seul tap). Annulation et « Absent » seulement
 * (décision du propriétaire 2026-10-31 : « Absent » demande une confirmation, il n'y a pas de « Rétablir »).
 * Le texte de l'annulation dit la vérité sur l'email : PUT n'en envoie un que si une adresse existe.
 */
export function confirmOptionsFor(action: ReservationAction, r: ActionSubject): ConfirmOptions | null {
  if (!action.needsConfirm) return null
  if (action.to === 'cancelled') {
    const mail = r.customer_email
      ? `Un email d'annulation sera envoyé à ${r.customer_email}.`
      : "Aucun email ne sera envoyé : aucune adresse n'est renseignée."
    return {
      title: 'Annuler cette réservation ?',
      description: `${recap(r)} ${mail} Cette action ne peut pas être défaite ici.`,
      confirmLabel: 'Annuler la réservation',
      cancelLabel: 'Garder la réservation',
      tone: 'danger',
    }
  }
  return {
    title: 'Marquer ce client comme non présenté ?',
    description: `${recap(r)} Il ne recevra pas l'invitation à laisser un avis le lendemain. Cette action ne peut pas être défaite ici.`,
    confirmLabel: 'Marquer non présenté',
    cancelLabel: 'Garder la réservation',
    tone: 'danger',
  }
}

const DONE: Record<ReservationStatus, string> = {
  pending: 'remise en attente',
  confirmed: 'confirmée',
  completed: 'terminée',
  cancelled: 'annulée',
  no_show: 'marquée non présentée',
}

/** Toast de succès : « Réservation de Anna Schmidt confirmée. » */
export function successMessage(name: string, to: ReservationStatus): string {
  return `Réservation de ${name} ${DONE[to]}.`
}

/** Libellé accessible court d'un bouton de contact. */
export function contactLabels(name: string) {
  return { tel: `Appeler ${name}`, whatsapp: `WhatsApp ${name} (nouvel onglet)` }
}
