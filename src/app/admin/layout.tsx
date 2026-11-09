import type { Metadata } from 'next'
import { BODY_CLASS, ROOT_METADATA } from '../fonts'
import '../globals.css'
import './admin.css'

// robots.txt disallow does not de-index; this meta tag does.
export const metadata: Metadata = {
  ...ROOT_METADATA,
  title: 'Administration | Gecko Cabane',
  robots: { index: false, follow: false },
}

// admin.css only defines `.adm-*` classes: pages that do not use <AdminRoot>
// keep their current look until phases 12 to 16 migrate them.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Root layout of the admin area (there is no app/layout.tsx): admin stays French, fixed.
  return (
    <html lang="fr">
      <body className={BODY_CLASS}>{children}</body>
    </html>
  )
}
