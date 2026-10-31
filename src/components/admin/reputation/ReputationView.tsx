import Link from 'next/link'
import { ChartColumn, Star } from 'lucide-react'
import { PageHeader } from '../PageHeader'
import { KpiPanel } from './KpiPanel'
import { ReviewsPanel } from './ReviewsPanel'

export type ReputationVue = 'avis' | 'kpi'

export function parseVue(raw: unknown): ReputationVue {
  return raw === 'kpi' ? 'kpi' : 'avis'
}

const SEGMENTS = [
  { vue: 'avis' as const, label: 'Avis', icon: Star, route: '/admin/avis' },
  { vue: 'kpi' as const, label: 'Rapport KPI', icon: ChartColumn, route: '/admin/kpi' },
]

/**
 * Vue unique « Réputation » (REP-01). Les trois URL rendent ce même composant :
 * `/admin/reputation?vue=…` (segments dans la page) et `/admin/avis`, `/admin/kpi`
 * (conservées : liens d'emails). Changer de segment est une simple navigation de
 * lecture : aucun envoi n'en découle.
 */
export function ReputationView({ vue, hub = false }: { vue: ReputationVue; hub?: boolean }) {
  return (
    <>
      <PageHeader title="Réputation" description="Avis des clients et rapport hebdomadaire des indicateurs, au même endroit." />
      <nav className="adm-rep-seg" aria-label="Sections de Réputation">
        {SEGMENTS.map((s) => (
          <Link
            key={s.vue}
            href={hub ? `/admin/reputation?vue=${s.vue}` : s.route}
            prefetch={false}
            aria-current={s.vue === vue ? 'page' : undefined}
          >
            <s.icon className="i" aria-hidden="true" focusable="false" />
            {s.label}
          </Link>
        ))}
      </nav>
      <div className="adm-rep">{vue === 'kpi' ? <KpiPanel /> : <ReviewsPanel />}</div>
    </>
  )
}
