import { PageHeader } from '@/components/admin/PageHeader'
import { SectionCards } from '@/components/admin/shell/HomeCards'
import { NAV } from '../nav'

/** Entrée de section « Site public » : les sous-pages viennent de nav.ts, aucune URL existante ne change. */
export default function AdminSitePage() {
  const section = NAV.find((n) => n.id === 'site')
  return (
    <>
      <PageHeader title={section?.label ?? ''} description={section?.description} />
      <SectionCards items={section?.children ?? []} />
    </>
  )
}
