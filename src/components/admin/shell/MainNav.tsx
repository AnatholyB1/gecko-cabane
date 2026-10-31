'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ADMIN_HOME_HREF, BRAND_ARIA, BRAND_NAME, NAV, activeChildId, navCurrent } from '@/app/admin/(app)/nav'
import { useLocationHash } from './use-location-hash'

/**
 * Navigation principale (NAV-02). Un seul élément `<nav>` dont la mise en page
 * change par CSS (aucune détection de largeur en JavaScript) :
 *   < 768 px      barre du bas, 5 entrées, icône + libellé
 *   768 à 1023    rail d'icônes à gauche, libellé dessous
 *   >= 1024       barre latérale, sous-entrées de la section active
 * Entrées, icônes, libellés et sous-entrées viennent de `nav.ts`.
 */
export function MainNav() {
  const pathname = usePathname() ?? ''
  const hash = useLocationHash()

  return (
    <nav className="adm-nav" aria-label="Navigation principale">
      <Link className="adm-nav__brand adm-wordmark" href={ADMIN_HOME_HREF} prefetch={false} aria-label={BRAND_ARIA}>
        <span className="adm-wordmark__mark" aria-hidden="true">G</span>
        <span>
          <span className="adm-wordmark__name adm-wordmark__name--side">{BRAND_NAME}</span>
          <span className="adm-wordmark__tag">Administration</span>
        </span>
      </Link>
      <ul className="adm-nav__list">
        {NAV.map((item) => {
          const current = navCurrent(item, pathname)
          const Icon = item.icon
          const childId = current ? activeChildId(item, pathname, hash) : undefined
          return (
            <li key={item.id}>
              <Link className="adm-nav-link" href={item.href} prefetch={false} aria-current={current}>
                <span className="adm-nav-ico" aria-hidden="true">
                  <Icon className="i" aria-hidden="true" focusable="false" strokeWidth={1.75} />
                </span>
                <span className="adm-nav-label">{item.label}</span>
              </Link>
              {item.children && current ? (
                <ul className="adm-subnav">
                  {item.children.map((c) => (
                    <li key={c.id}>
                      <Link href={c.href} prefetch={false} aria-current={childId === c.id ? 'page' : undefined}>
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
