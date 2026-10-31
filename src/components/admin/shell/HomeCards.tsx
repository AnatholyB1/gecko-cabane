import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { NAV, homeSpans, type NavChild, type NavItem } from '@/app/admin/(app)/nav'

function Arrow() {
  return (
    <span className="adm-navcard__go" aria-hidden="true">
      <ArrowRight className="i" aria-hidden="true" focusable="false" strokeWidth={1.75} />
    </span>
  )
}

/**
 * Cartes de navigation de l'accueil, générées depuis `nav.ts`. Une carte est un
 * seul lien (aucun lien imbriqué) ; les sous-sections sont du texte.
 */
export function HomeCards({ items = NAV }: { items?: NavItem[] }) {
  const spans = homeSpans(items.length)
  return (
    <div className="adm-home">
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <Link key={item.id} href={item.href} prefetch={false} className={`adm-navcard ${spans[i]}`}>
            <span className="adm-navcard__ico" aria-hidden="true">
              <Icon className="i" aria-hidden="true" focusable="false" strokeWidth={1.75} />
            </span>
            <h2 className="adm-navcard__title">{item.label}</h2>
            <Arrow />
            <p className="adm-navcard__desc">{item.description}</p>
            {item.children ? <p className="adm-navcard__sub">{item.children.map((c) => c.label).join(' · ')}</p> : null}
          </Link>
        )
      })}
    </div>
  )
}

/** Cartes d'une page d'entrée de section (`/admin/site`, `/admin/reputation`) : les sous-pages de `nav.ts`. */
export function SectionCards({ items }: { items: NavChild[] }) {
  return (
    <div className="adm-home adm-home--section">
      {items.map((c) => (
        <Link key={c.id} href={c.href} prefetch={false} className="adm-navcard">
          <h2 className="adm-navcard__title">{c.label}</h2>
          <Arrow />
          <p className="adm-navcard__desc">{c.description}</p>
        </Link>
      ))}
    </div>
  )
}
