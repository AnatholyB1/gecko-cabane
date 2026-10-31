import type { ReactNode } from 'react'
import { MainNav } from './MainNav'
import { SectionTabs } from './SectionTabs'
import { TopBar } from './TopBar'

/**
 * Cadre commun des pages d'admin (NAV-02) : lien d'évitement, navigation
 * principale, en-tête global, zone de contenu (un seul `main`).
 */
export function AdminShell({
  email,
  logoutAction,
  children,
}: {
  email: string
  logoutAction: () => void | Promise<void>
  children: ReactNode
}) {
  return (
    <div className="adm-app">
      <a className="adm-skip" href="#adm-main">Aller au contenu</a>
      <MainNav />
      <div className="adm-col">
        <TopBar email={email} logoutAction={logoutAction} />
        <main className="adm-main" id="adm-main" tabIndex={-1}>
          <SectionTabs />
          {children}
        </main>
      </div>
    </div>
  )
}
