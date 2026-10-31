'use client'

import { useId, useState } from 'react'
import { ArrowDown, ArrowUp, Check, CircleAlert, Flame, Leaf, LoaderCircle, Pencil } from 'lucide-react'
import type { MenuItem } from '@/types/database'
import { Button } from '../Button'
import { Switch } from './Switch'
import type { MenuData } from './useMenuData'
import { formatBaht, isPriceDirty, parsePriceInput, priceToInput } from './menu-logic'

type RowStatus = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string; attempted: string }

/**
 * Ligne de plat (la même à toutes les tailles). Prix éditable en ligne (enregistré à la validation
 * du clavier ou au bouton « Valider »), interrupteur Disponible / Indisponible immédiat, drapeaux
 * en lecture seule, « Détails » pour tout le reste.
 */
export function ItemRow({
  item,
  data,
  reorder,
  onDetails,
  onMove,
}: {
  item: MenuItem
  data: MenuData
  /** Mode « Réorganiser » : flèches haut / bas. */
  reorder?: { canUp: boolean; canDown: boolean }
  onDetails: (item: MenuItem) => void
  onMove: (item: MenuItem, dir: -1 | 1) => void
}) {
  const priceId = useId()
  const errorId = `${priceId}-error`
  const [draft, setDraft] = useState<string | null>(null)
  const [status, setStatus] = useState<RowStatus>({ kind: 'idle' })
  const [switchBusy, setSwitchBusy] = useState(false)
  const [formatError, setFormatError] = useState<string | null>(null)

  const saved = priceToInput(item.price)
  const shown = draft ?? saved
  const dirty = isPriceDirty(draft, item.price)
  const saving = status.kind === 'saving'
  const failed = status.kind === 'error'

  async function commit() {
    if (draft === null || saving) return
    const parsed = parsePriceInput(draft)
    if (!parsed.ok) {
      setFormatError(parsed.error)
      return
    }
    setFormatError(null)
    if (!dirty) {
      setDraft(null)
      return
    }
    setStatus({ kind: 'saving' })
    const r = await data.savePrice(item, parsed.value)
    if (r.ok) {
      setDraft(null)
      setStatus({ kind: 'saved' })
      window.setTimeout(() => setStatus((s) => (s.kind === 'saved' ? { kind: 'idle' } : s)), 3000)
    } else {
      setStatus({ kind: 'error', message: r.message, attempted: formatBaht(parsed.value) ?? 'ce prix' })
    }
  }

  function cancel() {
    setDraft(null)
    setFormatError(null)
    setStatus({ kind: 'idle' })
  }

  async function toggle(next: boolean) {
    setSwitchBusy(true)
    await data.setAvailability(item, next)
    setSwitchBusy(false)
  }

  const fieldError = formatError ?? (failed ? `Le prix n’a pas été enregistré. ${status.attempted} saisi, rien n’est perdu.` : null)
  const allergens = item.allergens?.trim()

  return (
    <li className={`mn-item${item.is_available ? '' : ' mn-item--off'}`}>
      <div className="mn-i-main">
        <p className="mn-i-name">{item.name}</p>
        {item.description ? <p className="mn-i-desc">{item.description}</p> : null}
        {item.is_vegetarian || item.is_spicy || item.is_gluten_free ? (
          <ul className="mn-flags" aria-label="Caractéristiques">
            {item.is_vegetarian ? (
              <li className="mn-flag">
                <Leaf className="i i-sm" aria-hidden="true" focusable="false" />
                Végétarien
              </li>
            ) : null}
            {item.is_spicy ? (
              <li className="mn-flag">
                <Flame className="i i-sm" aria-hidden="true" focusable="false" />
                Épicé
              </li>
            ) : null}
            {item.is_gluten_free ? (
              <li className="mn-flag">
                <Check className="i i-sm" aria-hidden="true" focusable="false" />
                Sans gluten
              </li>
            ) : null}
          </ul>
        ) : null}
        {allergens ? <p className="mn-i-all">Allergènes : {allergens}</p> : null}
        {item.price_label ? <p className="mn-i-all">Libellé de prix affiché sur le site : {item.price_label}</p> : null}
      </div>

      <div className="mn-i-avail">
        <Switch checked={item.is_available} busy={switchBusy} onChange={toggle} label={`Disponibilité de ${item.name}`} onText="Disponible" offText="Indisponible" />
      </div>

      <div className="mn-i-price">
        <div className={`mn-price${dirty && !failed && !fieldError ? ' mn-price--dirty' : ''}${fieldError ? ' mn-price--invalid' : ''}`}>
          <label className="adm-sr-only" htmlFor={priceId}>
            Prix de {item.name} en bahts
          </label>
          <input
            id={priceId}
            inputMode="decimal"
            autoComplete="off"
            value={shown}
            readOnly={saving}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? errorId : undefined}
            onChange={(e) => {
              setDraft(e.target.value)
              setFormatError(null)
              if (status.kind !== 'saving') setStatus({ kind: 'idle' })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void commit()
              } else if (e.key === 'Escape') {
                cancel()
              }
            }}
          />
          <span aria-hidden="true">฿</span>
        </div>
        {fieldError ? (
          <p className="mn-rowstatus mn-rowstatus--err" id={errorId}>
            <CircleAlert className="i i-sm" aria-hidden="true" focusable="false" />
            <span>{fieldError}</span>
          </p>
        ) : null}
        {dirty || failed ? (
          <div className="mn-price-actions">
            <Button variant="primary" size="sm" loading={saving} loadingLabel="Enregistrement…" onClick={commit}>
              {failed ? 'Réessayer' : 'Valider'}
            </Button>
            <Button variant="secondary" size="sm" disabled={saving} onClick={cancel}>
              Annuler
            </Button>
          </div>
        ) : null}
        {status.kind === 'saved' ? (
          <p className="mn-rowstatus mn-rowstatus--ok">
            <Check className="i i-sm" aria-hidden="true" focusable="false" />
            Enregistré
          </p>
        ) : null}
        {saving && !dirty ? (
          <p className="mn-rowstatus">
            <LoaderCircle className="i i-sm adm-spin" aria-hidden="true" focusable="false" />
            Enregistrement…
          </p>
        ) : null}
      </div>

      <div className="mn-i-act">
        <Button variant="secondary" size="sm" aria-label={`Détails de ${item.name}`} onClick={() => onDetails(item)}>
          <Pencil className="i i-sm" aria-hidden="true" focusable="false" />
          Détails
        </Button>
      </div>

      {reorder ? (
        <div className="mn-i-move">
          <Button variant="secondary" size="sm" iconOnly aria-label={`Monter ${item.name}`} disabled={!reorder.canUp} onClick={() => onMove(item, -1)}>
            <ArrowUp className="i" aria-hidden="true" focusable="false" />
          </Button>
          <Button variant="secondary" size="sm" iconOnly aria-label={`Descendre ${item.name}`} disabled={!reorder.canDown} onClick={() => onMove(item, 1)}>
            <ArrowDown className="i" aria-hidden="true" focusable="false" />
          </Button>
        </div>
      ) : null}
    </li>
  )
}
