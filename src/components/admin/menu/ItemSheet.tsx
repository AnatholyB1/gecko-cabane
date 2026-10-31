'use client'

import { useRef, useState } from 'react'
import { CircleAlert, ImageIcon, Upload } from 'lucide-react'
import type { MenuCategory, MenuItem } from '@/types/database'
import { Button, buttonClass } from '../Button'
import { Input, Select, Textarea } from '../Input'
import { useConfirm } from '../ConfirmDialog'
import { Sheet } from './Sheet'
import { Switch } from './Switch'
import type { MenuData } from './useMenuData'
import { createSubmitLock, itemToForm, parsePriceInput, sameForm, type ItemForm } from './menu-logic'

/** Alerte en ligne d'échec : ce qui a échoué, ce qui est conservé, quoi faire (D3 §3). */
function FailureAlert({ title, message }: { title: string; message: string }) {
  return (
    <div className="mn-alert mn-alert--err" role="alert">
      <CircleAlert className="i" aria-hidden="true" focusable="false" />
      <div>
        <strong>{title}</strong>
        <p>{message} Votre saisie est conservée ci-dessous : rien n’est perdu.</p>
      </div>
    </div>
  )
}

/** Ferme tout de suite, ou demande confirmation s'il y a une saisie non enregistrée. */
function useGuardedClose(dirty: boolean, onClose: () => void, title: string, description: string) {
  const confirm = useConfirm()
  const asking = useRef(false)
  return async () => {
    if (!dirty) {
      onClose()
      return
    }
    if (asking.current) return
    asking.current = true
    const leave = await confirm({ title, description, confirmLabel: 'Fermer sans enregistrer', cancelLabel: 'Rester ici' })
    asking.current = false
    if (leave) onClose()
  }
}

// ---------------------------------------------------------------------------
// Ajout rapide
// ---------------------------------------------------------------------------

export function AddItemSheet({
  categories,
  initialCategoryId,
  data,
  onClose,
  onAdded,
}: {
  categories: MenuCategory[]
  initialCategoryId: number
  data: MenuData
  onClose: () => void
  /** Mémorise la catégorie utilisée (pré-sélection au prochain ajout). */
  onAdded: (categoryId: number) => void
}) {
  const [categoryId, setCategoryId] = useState(initialCategoryId)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [available, setAvailable] = useState(true)
  const [nameError, setNameError] = useState<string | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [failure, setFailure] = useState<{ title: string; message: string } | null>(null)
  const [saving, setSaving] = useState<'one' | 'more' | null>(null)
  // Verrou synchrone : la touche Entrée (et sa répétition) ne peut pas envoyer deux fois le même plat.
  const [lock] = useState(createSubmitLock)

  const dirty = name.trim() !== '' || price.trim() !== ''
  const requestClose = useGuardedClose(dirty, onClose, 'Fermer sans ajouter ?', 'Le plat que vous avez commencé à saisir ne sera pas ajouté à la carte.')

  async function submit(another: boolean) {
    await lock.run(() => submitOnce(another))
  }

  async function submitOnce(another: boolean) {
    setFailure(null)
    const trimmed = name.trim()
    const parsed = parsePriceInput(price)
    const nErr = trimmed === '' ? 'Entrez le nom du plat.' : null
    const pErr = parsed.ok ? null : parsed.error
    setNameError(nErr)
    setPriceError(pErr)
    if (nErr || !parsed.ok) {
      document.getElementById(nErr ? 'mn-add-name' : 'mn-add-price')?.focus()
      return
    }
    setSaving(another ? 'more' : 'one')
    const r = await data.createItem(categoryId, { name: trimmed, is_available: available }, parsed.value)
    setSaving(null)
    if (!r.ok) {
      setFailure({ title: `« ${trimmed} » n’a pas été ajouté.`, message: r.message })
      return
    }
    onAdded(categoryId)
    if (another) {
      setName('')
      setPrice('')
      document.getElementById('mn-add-name')?.focus()
    } else {
      onClose()
    }
  }

  const busy = saving !== null
  return (
    <Sheet
      open
      onRequestClose={requestClose}
      title="Ajouter un plat"
      footer={
        <>
          <Button variant="primary" block loading={saving === 'one'} loadingLabel="Enregistrement…" disabled={busy && saving !== 'one'} onClick={() => submit(false)}>
            Ajouter le plat
          </Button>
          <Button variant="secondary" block loading={saving === 'more'} loadingLabel="Enregistrement…" disabled={busy && saving !== 'more'} onClick={() => submit(true)}>
            Ajouter et en saisir un autre
          </Button>
        </>
      }
    >
      {failure ? <FailureAlert title={failure.title} message={failure.message} /> : null}
      <Select id="mn-add-category" label="Catégorie" value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} disabled={busy}>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Input
        id="mn-add-name"
        label="Nom du plat"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={nameError}
        autoComplete="off"
        readOnly={busy}
        maxLength={120}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void submit(false)
        }}
      />
      <Input
        id="mn-add-price"
        label="Prix (฿)"
        optional
        inputMode="decimal"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        error={priceError}
        hint="En bahts, par exemple 350."
        autoComplete="off"
        readOnly={busy}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void submit(false)
        }}
      />
      <div className="mn-field-switch">
        <span className="adm-label">Visible sur le site</span>
        <Switch checked={available} onChange={setAvailable} label="le nouveau plat" onText="Disponible" offText="Indisponible" />
      </div>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Détails (modifier le plat)
// ---------------------------------------------------------------------------

function CheckRow({ checked, onChange, children, disabled }: { checked: boolean; onChange: (v: boolean) => void; children: string; disabled?: boolean }) {
  return (
    <label className="mn-check">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  )
}

export function EditItemSheet({ item, data, onClose }: { item: MenuItem; data: MenuData; onClose: () => void }) {
  const confirm = useConfirm()
  const original = itemToForm(item)
  const [itemForm, setItemForm] = useState<ItemForm>(original)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [failure, setFailure] = useState<{ title: string; message: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [lock] = useState(createSubmitLock)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const set = <K extends keyof ItemForm>(key: K, value: ItemForm[K]) => setItemForm((f) => ({ ...f, [key]: value }))
  const dirty = !sameForm(itemForm, original)
  const requestClose = useGuardedClose(dirty, onClose, 'Fermer sans enregistrer ?', 'Les modifications de ce plat ne seront pas enregistrées.')
  const busy = saving || deleting

  async function save() {
    await lock.run(saveOnce)
  }

  async function saveOnce() {
    setFailure(null)
    const parsed = parsePriceInput(itemForm.price)
    const nErr = itemForm.name.trim() === '' ? 'Entrez le nom du plat.' : null
    setNameError(nErr)
    setPriceError(parsed.ok ? null : parsed.error)
    if (nErr || !parsed.ok) {
      document.getElementById(nErr ? 'mn-edit-name' : 'mn-edit-price')?.focus()
      return
    }
    setSaving(true)
    const r = await data.updateItem(item.id, itemForm, parsed.value)
    setSaving(false)
    if (!r.ok) {
      setFailure({ title: `« ${itemForm.name.trim()} » n’a pas été enregistré.`, message: r.message })
      return
    }
    onClose()
  }

  async function remove() {
    const ok = await confirm({
      title: 'Supprimer ce plat ?',
      description: `« ${item.name} » disparaît de la carte et du site. Pour le retirer seulement quelques jours, rendez-le plutôt indisponible. Cette action est définitive.`,
      confirmLabel: 'Supprimer le plat',
      cancelLabel: 'Garder le plat',
    })
    if (!ok) return
    setFailure(null)
    setDeleting(true)
    const r = await data.deleteItem(item)
    setDeleting(false)
    if (!r.ok) {
      setFailure({ title: `« ${item.name} » n’a pas été supprimé.`, message: r.message })
      return
    }
    onClose()
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    setUploadError(null)
    setUploading(true)
    const r = await data.uploadImage(file)
    setUploading(false)
    if (r.ok) set('image_url', r.url)
    else setUploadError(`La photo n’a pas été téléversée. ${r.message}`)
  }

  return (
    <Sheet
      open
      onRequestClose={requestClose}
      title="Modifier le plat"
      footer={
        <>
          <Button variant="primary" block loading={saving} loadingLabel="Enregistrement…" disabled={deleting} onClick={save}>
            Enregistrer
          </Button>
          <Button variant="secondary" block disabled={busy} onClick={requestClose}>
            Annuler
          </Button>
        </>
      }
    >
      {failure ? <FailureAlert title={failure.title} message={failure.message} /> : null}
      <Input id="mn-edit-name" label="Nom" value={itemForm.name} onChange={(e) => set('name', e.target.value)} error={nameError} readOnly={busy} autoComplete="off" maxLength={120} />
      <Textarea id="mn-edit-desc" label="Description" optional rows={3} value={itemForm.description} onChange={(e) => set('description', e.target.value)} readOnly={busy} />
      <div className="mn-two">
        <Input id="mn-edit-price" label="Prix (฿)" optional inputMode="decimal" value={itemForm.price} onChange={(e) => set('price', e.target.value)} error={priceError} readOnly={busy} autoComplete="off" />
        <Input
          id="mn-edit-label"
          label="Libellé de prix"
          optional
          value={itemForm.price_label}
          onChange={(e) => set('price_label', e.target.value)}
          readOnly={busy}
          hint="Remplace le prix sur le site, par exemple 350 / 520."
          autoComplete="off"
        />
      </div>

      <div className="adm-field">
        <span className="adm-label">Photo</span>
        {itemForm.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="mn-photo" src={itemForm.image_url} alt={`Photo de ${item.name}`} />
        ) : (
          <div className="mn-photo-ph">
            <ImageIcon className="i" aria-hidden="true" focusable="false" />
            <span>Emplacement photo : aucune photo enregistrée</span>
          </div>
        )}
        <div className="mn-photo-actions">
          <label className={`${buttonClass({ variant: 'secondary', size: 'sm' })} mn-upload`}>
            <Upload className="i i-sm" aria-hidden="true" focusable="false" />
            {uploading ? 'Téléversement…' : 'Téléverser une image'}
            <input
              type="file"
              className="adm-sr-only"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploading || busy}
              onChange={(e) => {
                void onFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
          {itemForm.image_url ? (
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => set('image_url', '')}>
              Retirer la photo
            </Button>
          ) : null}
        </div>
        {uploadError ? (
          <p className="adm-error" role="alert">
            <CircleAlert className="i i-sm" aria-hidden="true" focusable="false" />
            <span>{uploadError}</span>
          </p>
        ) : null}
      </div>
      <Input id="mn-edit-image" label="Adresse de la photo" optional value={itemForm.image_url} onChange={(e) => set('image_url', e.target.value)} readOnly={busy} inputMode="url" autoComplete="off" />

      <Input id="mn-edit-allergens" label="Allergènes" optional value={itemForm.allergens} onChange={(e) => set('allergens', e.target.value)} readOnly={busy} hint="Séparés par des virgules, par exemple gluten, lait." autoComplete="off" />

      <fieldset className="mn-checks" disabled={busy}>
        <legend className="adm-label">Sur la carte</legend>
        <CheckRow checked={itemForm.is_available} onChange={(v) => set('is_available', v)}>
          Disponible
        </CheckRow>
        <CheckRow checked={itemForm.is_vegetarian} onChange={(v) => set('is_vegetarian', v)}>
          Végétarien
        </CheckRow>
        <CheckRow checked={itemForm.is_spicy} onChange={(v) => set('is_spicy', v)}>
          Épicé
        </CheckRow>
        <CheckRow checked={itemForm.is_gluten_free} onChange={(v) => set('is_gluten_free', v)}>
          Sans gluten (confirmé par la cheffe)
        </CheckRow>
      </fieldset>

      <Button variant="danger-outline" block loading={deleting} loadingLabel="Suppression…" disabled={saving} onClick={remove}>
        Supprimer ce plat
      </Button>
    </Sheet>
  )
}

