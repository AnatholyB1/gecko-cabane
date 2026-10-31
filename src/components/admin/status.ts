import { CheckCheck, CircleCheck, CircleX, Clock, UserX, type LucideIcon } from 'lucide-react'
import type { ReservationStatus } from '@/types/database'

export type BadgeTone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral'

/** Règle statut (contrat D1 §2.1) : icône + libellé + teinte, jamais la couleur seule. */
export const RESERVATION_STATUS_BADGES: Record<ReservationStatus, { label: string; tone: BadgeTone; icon: LucideIcon }> = {
  pending: { label: 'En attente', tone: 'warn', icon: Clock },
  confirmed: { label: 'Confirmée', tone: 'ok', icon: CircleCheck },
  completed: { label: 'Terminée', tone: 'info', icon: CheckCheck },
  cancelled: { label: 'Annulée', tone: 'danger', icon: CircleX },
  no_show: { label: 'Non présenté', tone: 'neutral', icon: UserX },
}
