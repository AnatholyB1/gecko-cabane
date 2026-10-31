'use client'

import { useState } from 'react'
import { CircleAlert } from 'lucide-react'
import type { MenuCategory } from '@/types/database'
import { Button } from '../Button'
import { Input } from '../Input'
import { useConfirm } from '../ConfirmDialog'
import { Sheet } from './Sheet'
import type { MenuData } from './useMenuData'
import { pluralPlats } from './menu-logic'

/** Créer une catégorie, ou « Options de la catégorie » : renommer, supprimer. */
export function CategorySheet({
  pageId,
  category,
  data,
  onClose,
}: {
  pageId: number
  /** Absent = création. */
  category?: MenuCategory
  data: MenuData
  onClose: () => void
}) {
  const confirm = useConfirm()
  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [nameError, setNameError] = useState<string | null>(null)
  const [failure, setFailure] = useState<{ title: string; message: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const busy = saving || deleting

  const dirty = name !== (category?.name ?? '') || description !== (category?.description ?? '')
  const itemCount = category?.items?.length ?? 0

  async function requestClose() {
    if (!dirty) return onClose()
    const leave = await confirm({
      title: 'Fermer sans enregistrer ?',
      description: 'Les modifications de cette catégorie ne seront pas enregistrées.',
      confirmLabel: 'Fermer sans enregistrer',
      cancelLabel: 'Rester ici',
    })
    if (leave) onClose()
  }

  async function save() {
    setFailure(null)
    if (name.trim() === '') {
      setNameError('Entrez le nom de la catégorie.')
      document.getElementById('mn-cat-name')?.focus()
      return
    }
    setNameError(null)
    setSaving(true)
    const r = category ? await data.renameCategory(category, name, description) : await data.createCategory(pageId, name, description)
    setSaving(false)
    if (!r.ok) {
      setFailure({ title: `La catégorie « ${name.trim()} » n’a pas été enregistrée.`, message: r.message })
      return
    }
    onClose()
  }

  async function remove() {
    if (!category) return
    const ok = await confirm({
      title: `Supprimer la catégorie « ${category.name} » ?`,
      description:
        itemCount > 0
          ? `Ses ${pluralPlats(itemCount)} seront supprimés avec elle, de la carte et du site. Cette action est définitive.`
          : 'Cette catégorie est vide. Cette action est définitive.',
      confirmLabel: 'Supprimer la catégorie',
      cancelLabel: 'Garder la catégorie',
    })
    if (!ok) return
    setFailure(null)
    setDeleting(true)
    const r = await data.deleteCategory(category)
    setDeleting(false)
    if (!r.ok) {
      setFailure({ title: `La catégorie « ${category.name} » n’a pas été supprimée.`, message: r.message })
      return
    }
    onClose()
  }

  return (
    <Sheet
      open
      onRequestClose={requestClose}
      title={category ? 'Options de la catégorie' : 'Ajouter une catégorie'}
      footer={
        <>
          <Button variant="primary" block loading={saving} loadingLabel="Enregistrement…" disabled={deleting} onClick={save}>
            {category ? 'Enregistrer' : 'Ajouter la catégorie'}
          </Button>
          <Button variant="secondary" block disabled={busy} onClick={requestClose}>
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
        id="mn-cat-name"
        label="Nom de la catégorie"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={nameError}
        readOnly={busy}
        autoComplete="off"
        maxLength={80}
        placeholder="Entrées, Plats, Desserts"
        onKeyDown={(e) => {
          if (e.key === 'Enter') void save()
        }}
      />
      <Input id="mn-cat-desc" label="Description" optional value={description} onChange={(e) => setDescription(e.target.value)} readOnly={busy} autoComplete="off" />
      {category ? (
        <Button variant="danger-outline" block loading={deleting} loadingLabel="Suppression…" disabled={saving} onClick={remove}>
          Supprimer la catégorie
        </Button>
      ) : null}
    </Sheet>
  )
}
