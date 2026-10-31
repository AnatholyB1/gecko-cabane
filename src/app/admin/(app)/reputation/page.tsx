import { ReputationView, parseVue } from '@/components/admin/reputation/ReputationView'

/** Réputation : Avis et Rapport KPI en segments (REP-01). `/admin/avis` et `/admin/kpi` rendent les mêmes composants. */
export default async function AdminReputationPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { vue } = await searchParams
  return <ReputationView vue={parseVue(vue)} hub />
}
