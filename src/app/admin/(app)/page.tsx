import { TodayView } from '@/components/admin/reservations/TodayView'

/**
 * « Aujourd'hui » (phase 15, TDY-01/02) : la racine de l'admin montre le service du jour.
 * L'heure initiale vient du serveur pour que le premier rendu soit identique des deux côtés.
 */
export const dynamic = 'force-dynamic'

export default function AdminPage() {
  return <TodayView initialNowIso={new Date().toISOString()} />
}
