'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, CircleAlert, CircleCheck, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import type { MenuPage } from '@/types/database'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Input } from '../Input'
import { useConfirm } from '../ConfirmDialog'
import { Sheet } from './Sheet'
import { Switch } from './Switch'
import type { MenuData } from './useMenuData'
import { countItems, pluralPlats, slugify } from './menu-logic'

function PageSheet({ page, data, onClose, onCreated }: { page?: MenuPage; data: MenuData; onClose: () => void; onCreated: (id: number) => void }) {
  const confirm = useConfirm()
  const [name, setName] = useState(page?.name ?? '')
  const [slug, setSlug] = useState(page?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(page))
  const [description, setDescription] = useState(page?.description ?? '')
  const [nameError, setNameError] = useState<string | null>(null)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [failure, setFailure] = useState<{ title: string; message: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const dirty = name !== (page?.name ?? '') || slug !== (page?.slug ?? '') || description !== (page?.description ?? '')

  async function requestClose() {
    if (!dirty) return onClose()
    const leave = await confirm({
      title: 'Fermer sans enregistrer ?',
      description: 'Les modifications de cette page ne seront pas enregistrées.',
      confirmLabel: 'Fermer sans enregistrer',
      cancelLabel: 'Rester ici',
    })
    if (leave) onClose()
  }

  async function save() {
    setFailure(null)
    const nErr = name.trim() === '' ? 'Entrez le nom de la page.' : null
    const finalSlug = slug.trim() || slugify(name)
    const sErr = finalSlug === '' ? 'Entrez une adresse (lettres, chiffres et tirets).' : /^[a-z0-9-]+$/.test(finalSlug) ? null : 'Utilisez seulement des lettres minuscules, des chiffres et des tirets.'
    setNameError(nErr)
    setSlugError(sErr)
    if (nErr || sErr) {
      document.getElementById(nErr ? 'mn-page-name' : 'mn-page-slug')?.focus()
      return
    }
    setSaving(true)
    let r: { ok: true } | { ok: false; message: string }
    if (page) {
      r = await data.updatePage(page, { name: name.trim(), slug: finalSlug, description: description.trim() || null, is_active: page.is_active })
    } else {
      const created = await data.createPage({ name, slug: finalSlug, description })
      if (created.ok) onCreated(created.id)
      r = created
    }
    setSaving(false)
    if (!r.ok) {
      setFailure({ title: `La page « ${name.trim()} » n’a pas été enregistrée.`, message: r.message })
      return
    }
    onClose()
  }

  return (
    <Sheet
      open
      onRequestClose={requestClose}
      title={page ? 'Modifier la page' : 'Nouvelle page de carte'}
      footer={
        <>
          <Button variant="primary" block loading={saving} loadingLabel="Enregistrement…" onClick={save}>
            {page ? 'Enregistrer' : 'Créer la page'}
          </Button>
          <Button variant="secondary" block disabled={saving} onClick={requestClose}>
            Annuler
          </Button>
        </>
      }
    >
      {failure ? (
        <div className="mn-alert mn-alert--err" role="alert">
          <CircleAlert className="i" aria-hidden="true" focusable="false" />
          <div>
            <strong>{failure.title}</strong>
            <p>{failure.message} Votre saisie est conservée ci-dessous : rien n’est perdu.</p>
          </div>
        </div>
      ) : null}
      <Input
        id="mn-page-name"
        label="Nom de la page"
        value={name}
        placeholder="Carte du midi, Boissons"
        autoComplete="off"
        readOnly={saving}
        error={nameError}
        onChange={(e) => {
          setName(e.target.value)
          if (!slugTouched) setSlug(slugify(e.target.value))
        }}
      />
      <Input
        id="mn-page-slug"
        label="Adresse de la page"
        value={slug}
        hint="Utilisée dans l’adresse du site. Elle est créée à partir du nom."
        autoComplete="off"
        readOnly={saving}
        error={slugError}
        onChange={(e) => {
          setSlug(e.target.value)
          setSlugTouched(true)
        }}
      />
      <Input id="mn-page-desc" label="Description" optional value={description} readOnly={saving} autoComplete="off" onChange={(e) => setDescription(e.target.value)} />
    </Sheet>
  )
}

/** Gestion des pages de carte (créer, renommer, afficher ou masquer, réordonner, supprimer), repliée par défaut. */
export function PagesManager({ pages, data, onSelect }: { pages: MenuPage[]; data: MenuData; onSelect: (id: number) => void }) {
  const confirm = useConfirm()
  const [open, setOpen] = useState(false)
  const [sheet, setSheet] = useState<{ page?: MenuPage } | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  async function toggle(page: MenuPage) {
    setBusy(page.id)
    await data.togglePageActive(page)
    setBusy(null)
  }

  async function remove(page: MenuPage) {
    const n = countItems(page.categories).total
    const ok = await confirm({
      title: `Supprimer la page « ${page.name} » ?`,
      description: `${page.categories?.length ?? 0} catégorie${(page.categories?.length ?? 0) > 1 ? 's' : ''} et ${pluralPlats(n)} seront supprimés avec elle, de la carte et du site. Cette action est définitive.`,
      confirmLabel: 'Supprimer la page',
      cancelLabel: 'Garder la page',
    })
    if (ok) await data.deletePage(page)
  }

  return (
    <section className="mn-pages adm-card" aria-label="Gérer les pages de la carte">
      <button type="button" className="mn-pages__toggle" aria-expanded={open} aria-controls="mn-pages-body" onClick={() => setOpen((v) => !v)}>
        <ChevronDown className={`i mn-chev${open ? ' mn-chev--open' : ''}`} aria-hidden="true" focusable="false" />
        <span className="adm-h2">Gérer les pages</span>
        <span className="adm-muted adm-small">Créer, renommer, masquer ou supprimer une page de la carte</span>
      </button>
      {open ? (
        <div id="mn-pages-body" className="mn-pages__body">
          <ul className="mn-pagelist">
            {pages.map((page, i) => (
              <li key={page.id} className="mn-pagerow">
                <div className="mn-pagerow__main">
                  <p className="mn-pagerow__name">{page.name}</p>
                  <p className="adm-muted adm-small">
                    /{page.slug} · {page.categories?.length ?? 0} catégorie{(page.categories?.length ?? 0) > 1 ? 's' : ''}
                  </p>
                  {page.is_active ? (
                    <Badge tone="ok" icon={CircleCheck}>
                      Affichée sur le site
                    </Badge>
                  ) : (
                    <Badge tone="neutral" icon={EyeOff}>
                      Masquée du site
                    </Badge>
                  )}
                </div>
                <div className="mn-pagerow__acts">
                  <Switch checked={page.is_active} busy={busy === page.id} onChange={() => toggle(page)} label={`la page ${page.name}`} onText="Affichée" offText="Masquée" />
                  <div className="mn-pagerow__btns">
                    <Button variant="ghost" size="sm" iconOnly aria-label={`Monter la page ${page.name}`} disabled={i === 0} aria-disabled={data.reordering || undefined} onClick={() => data.movePage(i, -1)}>
                      <ArrowUp className="i" aria-hidden="true" focusable="false" />
                    </Button>
                    <Button variant="ghost" size="sm" iconOnly aria-label={`Descendre la page ${page.name}`} disabled={i === pages.length - 1} aria-disabled={data.reordering || undefined} onClick={() => data.movePage(i, 1)}>
                      <ArrowDown className="i" aria-hidden="true" focusable="false" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setSheet({ page })}>
                      <Pencil className="i i-sm" aria-hidden="true" focusable="false" />
                      Modifier
                    </Button>
                    <Button variant="danger-outline" size="sm" iconOnly aria-label={`Supprimer la page ${page.name}`} onClick={() => remove(page)}>
                      <Trash2 className="i" aria-hidden="true" focusable="false" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Button variant="secondary" onClick={() => setSheet({})}>
            <Plus className="i i-sm" aria-hidden="true" focusable="false" />
            Nouvelle page
          </Button>
        </div>
      ) : null}
      {sheet ? <PageSheet page={sheet.page} data={data} onClose={() => setSheet(null)} onCreated={onSelect} /> : null}
    </section>
  )
}
