import type { Metadata } from 'next'
import { KitClient } from './KitClient'
import './kit.css'

// Internal page (DSN-07): behind the admin gate (middleware + shell layout), no navigation
// link, never indexed (robots inherited from the admin layout, repeated here).
export const metadata: Metadata = {
  title: 'Kit | Administration Gecko Cabane',
  robots: { index: false, follow: false },
}

export default function AdminKitPage() {
  return (
    <KitClient />
  )
}
