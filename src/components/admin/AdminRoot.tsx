import type { ReactNode } from 'react'
import { admSans } from './font'
import { AdminProviders } from './AdminProviders'

/**
 * Racine visuelle de l'admin v1.1 (DSN-02) : pose `.adm-root` (jetons, police,
 * fond clair, focus visible) qui neutralise les styles globaux du site public,
 * et monte les fournisseurs de toast et de confirmation.
 */
export function AdminRoot({ children }: { children: ReactNode }) {
  return (
    <div className={`adm-root ${admSans.variable}`}>
      {/* Les portails (dialogue, toast) sortent de .adm-root : ils reçoivent jetons et police par cette classe. */}
      <AdminProviders portalClass={`adm-portal ${admSans.variable}`}>{children}</AdminProviders>
    </div>
  )
}
