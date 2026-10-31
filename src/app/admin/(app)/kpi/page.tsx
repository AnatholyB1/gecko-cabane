import { ReputationView } from '@/components/admin/reputation/ReputationView'

/** URL conservée (liens des emails d'alerte et de rapport). Même composant que le segment « Rapport KPI ». */
export default function AdminKpiPage() {
  return <ReputationView vue="kpi" />
}
