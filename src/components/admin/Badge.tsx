import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { ReservationStatus } from '@/types/database'
import { RESERVATION_STATUS_BADGES, type BadgeTone } from './status'

/** Pastille de statut : l'icône est obligatoire (la couleur ne porte jamais seule le sens). */
export function Badge({ tone, icon: Icon, children }: { tone: BadgeTone; icon: LucideIcon; children: ReactNode }) {
  return (
    <span className={`adm-badge adm-badge--${tone}`}>
      <Icon className="i" aria-hidden="true" focusable="false" />
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: ReservationStatus }) {
  const s = RESERVATION_STATUS_BADGES[status]
  return (
    <Badge tone={s.tone} icon={s.icon}>
      {s.label}
    </Badge>
  )
}
