import { SitePublic } from '@/components/admin/site/SitePublic'

/** Ancienne adresse conservée : même section que l'onglet « Capacité » de /admin/site. */
export default function AdminSettingsPage() {
  return <SitePublic initialTab="capacite" />
}
