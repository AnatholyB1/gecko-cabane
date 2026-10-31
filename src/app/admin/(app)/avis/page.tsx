import { ReputationView } from '@/components/admin/reputation/ReputationView'

/** URL conservée (REP-01). Même composant que le segment « Avis » de /admin/reputation. */
export default function AdminAvisPage() {
  return <ReputationView vue="avis" />
}
