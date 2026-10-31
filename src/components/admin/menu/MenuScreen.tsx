'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, EyeOff, Search, ArrowUpDown, Plus, Ellipsis } from 'lucide-react'
import type { MenuCategory, MenuItem, MenuPage } from '@/types/database'
import { PageHeader } from '../PageHeader'
import { Button } from '../Button'
import { Badge } from '../Badge'
import { EmptyState, ErrorState, LoadingState } from '../states'
import { AddItemSheet, EditItemSheet } from './ItemSheet'
import { CategorySheet } from './CategorySheet'
import { PagesManager } from './PagesManager'
import { ItemRow } from './ItemRow'
import { useMenuData, type MenuData } from './useMenuData'
import { useToastClearance } from './useToastClearance'
import { categoryCountLabel, countItems, filterCategories, findItem, pluralIndisponibles, pluralPlats } from './menu-logic'
import './menu.css'

type Sheet = { kind: 'add' } | { kind: 'edit'; itemId: number } | { kind: 'category'; categoryId?: number }

/**
 * L'écran « Carte » (MENU-01) : tout se fait ici, sans changer de page. Prix en ligne, interrupteur
 * Disponible / Indisponible, ajout rapide, catégories repliables, recherche, réordonnancement par
 * flèches, gestion des pages repliée. `initialPageId` positionne l'écran sur une page de carte
 * (route /admin/menu/[pageId]).
 */
export function MenuScreen({ initialPageId }: { initialPageId?: number }) {
  const data = useMenuData()

  // Les notifications de cet écran s'affichent en haut, sous l'en-tête : elles ne recouvrent pas la ligne éditée.
  useEffect(() => {
    document.body.dataset.admToast = 'top'
    return () => {
      delete document.body.dataset.admToast
    }
  }, [])

  useToastClearance()

  return (
    <div className="mn-root">
      {data.status === 'loading' && !data.pages ? (
        <>
          <PageHeader title="Carte" description="Prix et disponibilité des plats, visibles sur le site public." />
          <div className="mn-loading" aria-busy="true">
            <LoadingState label="Chargement de la carte…" variant="table" />
            <LoadingState label="Chargement de la carte…" variant="table" />
          </div>
        </>
      ) : data.status === 'error' && !data.pages ? (
        <>
          <PageHeader title="Carte" description="Prix et disponibilité des plats, visibles sur le site public." />
          <ErrorState error={data.error} title="Impossible de charger la carte" description="Rien n’a été modifié. Vérifiez la connexion, puis réessayez." onRetry={data.refetch} />
        </>
      ) : (
        <MenuContent data={data} pages={data.pages ?? []} initialPageId={initialPageId} />
      )}
    </div>
  )
}

function MenuContent({ data, pages, initialPageId }: { data: MenuData; pages: MenuPage[]; initialPageId?: number }) {
  const [selectedId, setSelectedId] = useState<number | null>(initialPageId ?? null)
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})
  const [reorder, setReorder] = useState(false)
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [lastCategoryId, setLastCategoryId] = useState<number | null>(null)

  const page = pages.find((p) => p.id === selectedId) ?? pages[0]
  const categories = page?.categories ?? []
  const effectiveQuery = reorder ? '' : query
  const searching = effectiveQuery.trim() !== ''
  const visible = filterCategories(categories, effectiveQuery)
  const totals = countItems(categories)

  function openAdd() {
    setSheet(categories.length > 0 ? { kind: 'add' } : { kind: 'category' })
  }

  function onTabKey(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const i = pages.findIndex((p) => p.id === page?.id)
    const next = pages[(i + (e.key === 'ArrowRight' ? 1 : -1) + pages.length) % pages.length]
    if (!next) return
    e.preventDefault()
    setSelectedId(next.id)
    document.getElementById(`mn-tab-${next.id}`)?.focus()
  }

  const editing = sheet?.kind === 'edit' ? findItem(pages, sheet.itemId) : undefined
  const categoryForSheet = sheet?.kind === 'category' && sheet.categoryId !== undefined ? categories.find((c) => c.id === sheet.categoryId) : undefined
  const addDefault = categories.find((c) => c.id === lastCategoryId)?.id ?? categories[0]?.id

  return (
    <>
      <PageHeader
        title="Carte"
        description="Prix et disponibilité des plats, visibles sur le site public."
        actions={
          page ? (
            <div className="mn-head-actions">
              <Button variant="secondary" aria-pressed={reorder} onClick={() => setReorder((v) => !v)}>
                <ArrowUpDown className="i i-sm" aria-hidden="true" focusable="false" />
                {reorder ? 'Terminer' : 'Réorganiser'}
              </Button>
              <Button variant="secondary" onClick={openAdd}>
                <Plus className="i i-sm" aria-hidden="true" focusable="false" />
                Ajouter un plat
              </Button>
            </div>
          ) : null
        }
      />

      {pages.length === 0 ? (
        <EmptyState title="Aucune page de carte" description="Créez une première page (par exemple Déjeuner), puis ajoutez-y des catégories et des plats." />
      ) : (
        <>
          <div className="mn-ctrl">
            <div className="mn-tabs" role="tablist" aria-label="Pages de la carte" onKeyDown={onTabKey}>
              {pages.map((p) => {
                const selected = p.id === page?.id
                return (
                  <button
                    key={p.id}
                    id={`mn-tab-${p.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls="mn-panel"
                    tabIndex={selected ? 0 : -1}
                    className="mn-tab"
                    onClick={() => setSelectedId(p.id)}
                  >
                    {p.name}
                    <span className="mn-tab__count">({countItems(p.categories).total})</span>
                    {p.is_active ? null : <span className="mn-tab__count">masquée</span>}
                  </button>
                )
              })}
            </div>
            <div className="mn-search">
              <label className="adm-sr-only" htmlFor="mn-q">
                Rechercher un plat
              </label>
              <Search className="i" aria-hidden="true" focusable="false" />
              <input id="mn-q" type="search" className="adm-input" placeholder="Rechercher un plat" autoComplete="off" disabled={reorder} value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>

          <div id="mn-panel" role="tabpanel" aria-labelledby={page ? `mn-tab-${page.id}` : undefined}>
            <div className="mn-summary">
              <span>{pluralPlats(totals.total)}</span>
              {totals.unavailable > 0 ? (
                <Badge tone="danger" icon={EyeOff}>
                  {pluralIndisponibles(totals.unavailable)}
                </Badge>
              ) : null}
              <Button variant="ghost" size="sm" className="mn-reorder-inline" aria-pressed={reorder} onClick={() => setReorder((v) => !v)}>
                <ArrowUpDown className="i i-sm" aria-hidden="true" focusable="false" />
                {reorder ? 'Terminer' : 'Réorganiser'}
              </Button>
            </div>

            {reorder ? (
              <p className="mn-reorder-note" role="status">
                Utilisez les flèches pour monter ou descendre un plat ou une catégorie. L’ordre est enregistré à chaque flèche.
              </p>
            ) : null}

            {categories.length === 0 ? (
              <EmptyState
                title="Cette page de carte est vide"
                description="Ajoutez une première catégorie (par exemple Entrées), puis vos plats."
                action={
                  <Button variant="primary" onClick={() => setSheet({ kind: 'category' })}>
                    <Plus className="i i-sm" aria-hidden="true" focusable="false" />
                    Ajouter une catégorie
                  </Button>
                }
              />
            ) : searching && visible.length === 0 ? (
              <EmptyState
                title="Aucun plat ne correspond"
                description={`Aucun plat de cette page ne correspond à « ${query.trim()} ». Vérifiez l’orthographe ou essayez un autre mot.`}
                action={
                  <Button variant="secondary" onClick={() => setQuery('')}>
                    Effacer la recherche
                  </Button>
                }
              />
            ) : (
              <div className="mn-cats">
                {visible.map((category) => {
                  const fullIndex = categories.findIndex((c) => c.id === category.id)
                  return (
                    <CategoryBlock
                      key={category.id}
                      category={category}
                      open={searching || !collapsed[category.id]}
                      reorder={reorder ? { canUp: fullIndex > 0, canDown: fullIndex < categories.length - 1, busy: data.reordering } : undefined}
                      data={data}
                      onToggle={() => setCollapsed((c) => ({ ...c, [category.id]: !c[category.id] }))}
                      onOptions={() => setSheet({ kind: 'category', categoryId: category.id })}
                      onMoveCategory={(dir) => data.moveCategory(page, fullIndex, dir)}
                      onDetails={(item) => setSheet({ kind: 'edit', itemId: item.id })}
                      onMoveItem={(item, dir) => {
                        const idx = (categories.find((c) => c.id === category.id)?.items ?? []).findIndex((i) => i.id === item.id)
                        void data.moveItem(page, category.id, idx, dir)
                      }}
                      onAddHere={() => {
                        setLastCategoryId(category.id)
                        setSheet({ kind: 'add' })
                      }}
                    />
                  )
                })}
                <div className="mn-addcat">
                  <Button variant="secondary" onClick={() => setSheet({ kind: 'category' })}>
                    <Plus className="i i-sm" aria-hidden="true" focusable="false" />
                    Ajouter une catégorie
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <PagesManager pages={pages} data={data} onSelect={(id) => setSelectedId(id)} />

      {page ? (
        <div className="mn-addbar">
          <Button variant="primary" block onClick={openAdd}>
            <Plus className="i i-sm" aria-hidden="true" focusable="false" />
            Ajouter un plat
          </Button>
        </div>
      ) : null}

      {sheet?.kind === 'add' && addDefault !== undefined ? (
        <AddItemSheet categories={categories} initialCategoryId={addDefault} data={data} onClose={() => setSheet(null)} onAdded={(id) => setLastCategoryId(id)} />
      ) : null}
      {sheet?.kind === 'edit' && editing ? <EditItemSheet item={editing} data={data} onClose={() => setSheet(null)} /> : null}
      {sheet?.kind === 'category' && page && (sheet.categoryId === undefined || categoryForSheet) ? (
        <CategorySheet pageId={page.id} category={categoryForSheet} data={data} onClose={() => setSheet(null)} />
      ) : null}
    </>
  )
}

function CategoryBlock({
  category,
  open,
  reorder,
  data,
  onToggle,
  onOptions,
  onMoveCategory,
  onDetails,
  onMoveItem,
  onAddHere,
}: {
  category: MenuCategory
  open: boolean
  reorder?: { canUp: boolean; canDown: boolean; busy?: boolean }
  data: MenuData
  onToggle: () => void
  onOptions: () => void
  onMoveCategory: (dir: -1 | 1) => void
  onDetails: (item: MenuItem) => void
  onMoveItem: (item: MenuItem, dir: -1 | 1) => void
  onAddHere: () => void
}) {
  const items = category.items ?? []
  const listId = `mn-cat-${category.id}`
  return (
    <section className="mn-cat" aria-label={category.name}>
      <div className="mn-cat__wrap">
        <h2 className="mn-cat__title">
          <button type="button" className="mn-cat__h" aria-expanded={open} aria-controls={listId} onClick={onToggle}>
            <ChevronDown className={`i mn-chev${open ? ' mn-chev--open' : ''}`} aria-hidden="true" focusable="false" />
            <span className="mn-cat__name">{category.name}</span>
            <span className="mn-cat__count">{categoryCountLabel(items)}</span>
          </button>
        </h2>
        {reorder ? (
          <div className="mn-cat__move">
            <Button variant="secondary" size="sm" iconOnly aria-label={`Monter la catégorie ${category.name}`} disabled={!reorder.canUp} aria-disabled={reorder.busy || undefined} onClick={() => onMoveCategory(-1)}>
              <ArrowUp className="i" aria-hidden="true" focusable="false" />
            </Button>
            <Button variant="secondary" size="sm" iconOnly aria-label={`Descendre la catégorie ${category.name}`} disabled={!reorder.canDown} aria-disabled={reorder.busy || undefined} onClick={() => onMoveCategory(1)}>
              <ArrowDown className="i" aria-hidden="true" focusable="false" />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" iconOnly aria-label={`Options de la catégorie ${category.name}`} onClick={onOptions}>
            <Ellipsis className="i" aria-hidden="true" focusable="false" />
          </Button>
        )}
      </div>
      <div id={listId} hidden={!open}>
        {items.length === 0 ? (
          <div className="mn-cat__empty">
            <p>Aucun plat dans cette catégorie.</p>
            <Button variant="secondary" size="sm" onClick={onAddHere}>
              <Plus className="i i-sm" aria-hidden="true" focusable="false" />
              Ajouter un plat ici
            </Button>
          </div>
        ) : (
          <ul className="mn-items">
            {items.map((item, i) => (
              <ItemRow
                key={item.id}
                item={item}
                data={data}
                reorder={reorder ? { canUp: i > 0, canDown: i < items.length - 1, busy: reorder.busy } : undefined}
                onDetails={onDetails}
                onMove={onMoveItem}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
