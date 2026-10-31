import type { Metadata } from 'next'
import { AdminRoot } from '@/components/admin/AdminRoot'
import { KitClient } from './KitClient'
import './kit.css'

// Internal page (DSN-07): behind the admin gate of the middleware, no navigation
// link, never indexed (robots inherited from the admin layout, repeated here).
export const metadata: Metadata = {
  title: 'Kit | Administration Gecko Cabane',
  robots: { index: false, follow: false },
}

export default function AdminKitPage() {
  return (
    <AdminRoot>
      <KitClient />
    </AdminRoot>
  )
}
