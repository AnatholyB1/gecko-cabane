import type { Metadata } from 'next'
import './admin.css'

// robots.txt disallow does not de-index; this meta tag does.
export const metadata: Metadata = {
  title: 'Administration | Gecko Cabane',
  robots: { index: false, follow: false },
}

// admin.css only defines `.adm-*` classes: pages that do not use <AdminRoot>
// keep their current look until phases 12 to 16 migrate them.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
