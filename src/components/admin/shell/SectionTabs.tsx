'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV, activeChildId, currentSection } from '@/app/admin/(app)/nav'
import { useLocationHash } from './use-location-hash'

/**
 * Onglets de niveau 2 (téléphone et tablette). Masqués à partir de 1024 px par
 * CSS : la sous-navigation de la barre latérale les remplace. Rien n'est rendu
 * hors d'une section qui a des sous-entrées.
 */
export function SectionTabs() {
  const pathname = usePathname() ?? ''
  const hash = useLocationHash()
  const section = currentSection(NAV, pathname)
  if (!section?.children || section.inPageSegments) return null
  const activeId = activeChildId(section, pathname, hash)

  return (
    <nav className="adm-tabs" aria-label={`Sections de ${section.label}`}>
      {section.children.map((c) => (
        <Link key={c.id} href={c.href} prefetch={false} aria-current={activeId === c.id ? 'page' : undefined}>
          {c.label}
        </Link>
      ))}
    </nav>
  )
}
