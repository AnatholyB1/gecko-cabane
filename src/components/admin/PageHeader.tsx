import type { ReactNode } from 'react'

/** Titre de page (le seul emploi du serif), description, actions, filet laiton de 40 px. Un seul `h1` par page. */
export function PageHeader({
  title,
  description,
  actions,
  as: Heading = 'h1',
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** `h2` uniquement pour une démonstration dans une page qui a déjà son `h1` (page kit). */
  as?: 'h1' | 'h2'
}) {
  return (
    <header>
      <div className="adm-pageheader">
        <Heading className="adm-display adm-pageheader__title">{title}</Heading>
        {description ? <p className="adm-pageheader__desc">{description}</p> : null}
        {actions ? <div className="adm-pageheader__actions">{actions}</div> : null}
      </div>
      <hr className="adm-rule adm-rule--brass" />
    </header>
  )
}
