'use client'

import type { KeyboardEvent } from 'react'
import { CalendarDays, Clock, Megaphone, Users, type LucideIcon } from 'lucide-react'
import { PageHeader } from '../PageHeader'
import { useLocationHash } from '../shell/use-location-hash'
import { AnnouncementSection } from './AnnouncementSection'
import { CapacitySection } from './CapacitySection'
import { ExceptionsSection } from './ExceptionsSection'
import { HoursSection } from './HoursSection'
import { DEFAULT_SITE_TAB, SITE_TABS, tabFromHash, type SiteTabId } from './site-logic'
import './site.css'

const TAB_ICONS: Record<SiteTabId, LucideIcon> = {
  horaires: Clock,
  exceptions: CalendarDays,
  annonces: Megaphone,
  capacite: Users,
}

/**
 * Section « Site public » (SITE-01) : en-tête commun, 4 onglets (Horaires, Exceptions, Annonces,
 * Capacité) et, dans chaque onglet, le formulaire + l'aperçu. L'onglet courant est l'ancre de l'URL
 * (`/admin/site#annonces`), partagée avec la navigation latérale. Les anciennes adresses
 * (`/admin/hours`, `/admin/announcement`, `/admin/settings`) rendent ce même composant avec
 * `initialTab` : aucune logique n'est dupliquée.
 */
export function SitePublic({ initialTab = DEFAULT_SITE_TAB }: { initialTab?: SiteTabId }) {
  const hash = useLocationHash()
  const tab = tabFromHash(hash, initialTab)

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const i = SITE_TABS.findIndex((t) => t.id === tab)
    let next = i
    if (e.key === 'ArrowRight') next = (i + 1) % SITE_TABS.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + SITE_TABS.length) % SITE_TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = SITE_TABS.length - 1
    else return
    e.preventDefault()
    // Le focus suit la sélection : le clic synthétique passe par la garde « modifications non enregistrées ».
    const el = e.currentTarget.querySelector<HTMLElement>(`#site-tab-${SITE_TABS[next].id}`)
    el?.focus()
    el?.click()
  }

  return (
    <div className="adm-site">
      <PageHeader title="Site public" description="Ce que voient vos clients sur geckocabanerestaurant.com : horaires, bannière d’annonce et couverts réservables." />
      <div className="adm-site-tabs" role="tablist" aria-label="Sections du site public" onKeyDown={onKeyDown}>
        {SITE_TABS.map((t) => {
          const Icon = TAB_ICONS[t.id]
          const selected = t.id === tab
          return (
            <a
              key={t.id}
              id={`site-tab-${t.id}`}
              role="tab"
              href={`#${t.id}`}
              aria-selected={selected}
              aria-controls="site-panel"
              tabIndex={selected ? 0 : -1}
              className="adm-site-tab"
              onClick={(e) => {
                if (selected) e.preventDefault()
              }}
            >
              <Icon className="i" aria-hidden="true" focusable="false" />
              {t.label}
            </a>
          )
        })}
      </div>
      <div id="site-panel" role="tabpanel" aria-labelledby={`site-tab-${tab}`} key={tab}>
        {tab === 'horaires' ? <HoursSection /> : null}
        {tab === 'exceptions' ? <ExceptionsSection /> : null}
        {tab === 'annonces' ? <AnnouncementSection /> : null}
        {tab === 'capacite' ? <CapacitySection /> : null}
      </div>
    </div>
  )
}
