import { SitePublic } from '@/components/admin/site/SitePublic'

/** Ancienne adresse conservée : même section que l'onglet « Annonces » de /admin/site. */
export default function AnnouncementAdminPage() {
  return <SitePublic initialTab="annonces" />
}
