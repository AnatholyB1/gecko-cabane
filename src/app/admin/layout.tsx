import type { Metadata } from 'next'

// robots.txt disallow does not de-index; this meta tag does.
export const metadata: Metadata = {
  title: 'Administration | Gecko Cabane',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
