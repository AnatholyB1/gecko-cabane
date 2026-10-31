import { ReservationsView } from '@/components/admin/reservations/ReservationsView'
import { isYmd, krabiTodayYmd } from '@/utils/krabi-time'

/**
 * Réservations (phase 15). La date par défaut est AUJOURD'HUI À KRABI, calculée côté serveur
 * (l'ancienne page ouvrait sur la date UTC : hier entre 00h et 07h à Krabi). `?date=YYYY-MM-DD` ouvre un jour donné.
 */
export default async function AdminReservationsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams
  const initialDate = date && isYmd(date) ? date : krabiTodayYmd()
  // `key` : un changement de `?date=` sur le composant monté repart de la nouvelle date.
  return <ReservationsView key={initialDate} initialDate={initialDate} />
}
