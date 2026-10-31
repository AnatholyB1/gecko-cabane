import { SitePublic } from '@/components/admin/site/SitePublic'

/** Ancienne adresse conservée : même section que l'onglet « Horaires » de /admin/site. */
export default function HoursAdminPage() {
  return <SitePublic initialTab="horaires" />
}
