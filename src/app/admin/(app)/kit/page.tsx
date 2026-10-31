import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { KitClient } from './KitClient'
import './kit.css'

// Page interne (DSN-07) : derrière la garde admin (middleware + layout du shell), sans lien de
// navigation, jamais indexée. Hors développement (NODE_ENV === 'production'), elle répond 404 :
// outil de conception, pas une page d'exploitation.
export const metadata: Metadata = {
  title: 'Kit | Administration Gecko Cabane',
  robots: { index: false, follow: false },
}

export default function AdminKitPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <KitClient />
}
