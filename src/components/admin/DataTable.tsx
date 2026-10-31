import type { ReactNode } from 'react'

/**
 * Rôle d'une colonne : pilote la mise en page en cartes sous 768 px
 * (heure en tête, statut à droite, nom pleine largeur, nombres et texte libellés, actions en bas).
 */
export type ColumnRole = 'time' | 'name' | 'status' | 'num' | 'text' | 'actions'

export type DataTableColumn<T> = {
  key: string
  /** En-tête (la colonne d'actions : texte lisible seulement par les lecteurs d'écran). */
  header: string
  role?: ColumnRole
  cell: (row: T) => ReactNode
}

const ROLE_CLASS: Record<ColumnRole, string> = {
  time: 't-time adm-num',
  name: 't-name',
  status: 't-status',
  num: 't-num adm-num',
  text: 't-text',
  actions: 't-actions',
}

/**
 * Tableau de données : `<table>` dès 768 px, cartes empilées en dessous (même balisage).
 * Rôles ARIA de tableau explicites : sous 768 px le CSS passe `table`, `tr`, `td` en `display: block`,
 * ce qui fait perdre la sémantique à certains lecteurs d'écran (audit F-06) ; les rôles la conservent.
 * Les états chargement / vide / erreur sont rendus par la page avec LoadingState,
 * EmptyState, ErrorState, jamais ici.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  scrollLabel,
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  caption: ReactNode
  /**
   * Phase 16 : tableau large. Quand le contenu dépasse (768 à 1023 px), le conteneur défile
   * horizontalement et devient une région focalisable au clavier, nommée par ce libellé.
   */
  scrollLabel?: string
}) {
  return (
    <div
      className="adm-tablewrap"
      {...(scrollLabel ? { tabIndex: 0, role: 'region', 'aria-label': scrollLabel, 'data-scroll': '' } : {})}
    >
      <table className="adm-table" role="table">
        <caption>{caption}</caption>
        <thead role="rowgroup">
          <tr role="row">
            {columns.map((c) => (
              <th key={c.key} scope="col" role="columnheader" className={c.role === 'num' ? 't-num' : undefined}>
                {c.role === 'actions' ? <span className="adm-sr-only">{c.header}</span> : c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row) => (
            <tr key={rowKey(row)} role="row">
              {columns.map((c) => (
                <td key={c.key} role="cell" className={ROLE_CLASS[c.role ?? 'text']} data-label={c.header}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
