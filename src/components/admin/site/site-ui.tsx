'use client'

import type { ReactNode } from 'react'
import { Check, CircleAlert, CircleCheck, Eye, Info, Minus, Pencil, Plus, RefreshCw, type LucideIcon } from 'lucide-react'
import { Button } from '../Button'
import './site.css'

/** Titre de section avec icône (Cormorant, comme le titre de page). */
export function SectionTitle({ icon: Icon, id, children }: { icon: LucideIcon; id: string; children: ReactNode }) {
  return (
    <div className="adm-site-sectitle">
      <Icon className="i" aria-hidden="true" focusable="false" />
      <h2 id={id} className="adm-display">
        {children}
      </h2>
    </div>
  )
}

/**
 * Interrupteur à libellé texte obligatoire (« Ouvert » / « Fermé ») : l'état n'est jamais porté
 * par la couleur seule (coche ou tiret dans le pouce + mot). Zone cliquable de 44 px.
 */
export function SiteSwitch({
  checked,
  onChange,
  label,
  onText,
  offText,
  readOnly,
  id,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  /** Nom accessible complet (« Ouvert le lundi »). */
  label: string
  onText: string
  offText: string
  /** Pendant un enregistrement : lisible, mais inactif (pas `disabled`). */
  readOnly?: boolean
  id?: string
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-readonly={readOnly ? true : undefined}
      className="adm-site-sw"
      onClick={() => {
        if (!readOnly) onChange(!checked)
      }}
    >
      <span className="adm-site-sw__track" aria-hidden="true">
        <span className="adm-site-sw__thumb">{checked ? <Check className="i" focusable="false" /> : <Minus className="i" focusable="false" />}</span>
      </span>
      <span className="adm-site-sw__text">{checked ? onText : offText}</span>
    </button>
  )
}

/** Alerte en ligne : bordure complète + fond teinté + icône (jamais de liseré latéral). */
export function InlineAlert({
  tone,
  title,
  children,
  action,
  role,
}: {
  tone: 'err' | 'ok' | 'info'
  title: string
  children?: ReactNode
  action?: ReactNode
  role?: 'alert' | 'status'
}) {
  const Icon = tone === 'err' ? CircleAlert : tone === 'ok' ? CircleCheck : Info
  return (
    <div className={`adm-site-alert adm-site-alert--${tone}`} role={role}>
      <Icon className="i" aria-hidden="true" focusable="false" />
      <div>
        <strong>{title}</strong>
        {children ? <p>{children}</p> : null}
        {action}
      </div>
    </div>
  )
}

/** Échec d'enregistrement : ce qui a échoué, ce qui est conservé, Réessayer. */
export function SaveFailure({ title, reason, onRetry, retrying }: { title: string; reason: string; onRetry: () => void; retrying: boolean }) {
  return (
    <InlineAlert
      tone="err"
      role="alert"
      title={title}
      action={
        <Button variant="secondary" size="sm" onClick={onRetry} loading={retrying} loadingLabel="Enregistrement…">
          <RefreshCw className="i i-sm" aria-hidden="true" focusable="false" />
          Réessayer
        </Button>
      }
    >
      {reason} Vos modifications sont toujours affichées ci-dessous : rien n’est perdu. Réessayez.
    </InlineAlert>
  )
}

/** Barre d'enregistrement collante : état propre / modifié, Annuler, Enregistrer. */
export function SaveBar({
  dirty,
  saving,
  label,
  onCancel,
  onSave,
}: {
  dirty: boolean
  saving: boolean
  label: string
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div className="adm-site-savebar">
      <div className={`adm-site-savebar__msg ${dirty ? 'is-dirty' : 'is-clean'}`}>
        {dirty ? (
          <>
            <Pencil className="i" aria-hidden="true" focusable="false" />
            Modifications non enregistrées
          </>
        ) : (
          <>
            <Check className="i" aria-hidden="true" focusable="false" />
            Tout est enregistré
          </>
        )}
      </div>
      <div className="adm-site-savebar__btns">
        {dirty ? (
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Annuler
          </Button>
        ) : null}
        <Button variant="primary" onClick={onSave} disabled={!dirty && !saving} loading={saving} loadingLabel="Enregistrement…">
          {label}
        </Button>
      </div>
    </div>
  )
}

/** Panneau « Aperçu » : à droite et collant dès 1180 px, dessous sinon, jamais replié. */
export function PreviewPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="adm-site-pv" aria-label="Aperçu public">
      <div className="adm-site-pv__h">
        <Eye className="i" aria-hidden="true" focusable="false" />
        {title}
      </div>
      <div className="adm-site-pv__frame">{children}</div>
      <p className="adm-site-pv__note">Mise en forme indicative. Le site garde son propre style.</p>
    </aside>
  )
}

/** Compteur à pas (− valeur +), boutons de 56 px. */
export function Stepper({
  id,
  label,
  value,
  onChange,
  onStep,
  unit,
  decreaseLabel,
  increaseLabel,
  hint,
  error,
  readOnly,
  children,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onStep: (delta: 1 | -1) => void
  unit: string
  decreaseLabel: string
  increaseLabel: string
  hint: string
  error?: string
  readOnly?: boolean
  children?: ReactNode
}) {
  const describedBy = [error ? `${id}-error` : null, `${id}-hint`].filter(Boolean).join(' ')
  return (
    <div className="adm-field">
      <label className="adm-label" htmlFor={id}>
        {label}
      </label>
      <div className="adm-site-stepper">
        <button type="button" className="adm-btn adm-site-stepper__btn" aria-label={decreaseLabel} onClick={() => !readOnly && onStep(-1)}>
          <Minus className="i" aria-hidden="true" focusable="false" />
        </button>
        <input
          id={id}
          className="adm-input adm-site-stepper__input"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="adm-btn adm-site-stepper__btn" aria-label={increaseLabel} onClick={() => !readOnly && onStep(1)}>
          <Plus className="i" aria-hidden="true" focusable="false" />
        </button>
        <span className="adm-site-stepper__unit">{unit}</span>
      </div>
      <p className="adm-help" id={`${id}-hint`}>
        {hint}
      </p>
      {error ? (
        <p className="adm-error" id={`${id}-error`} role="alert">
          <CircleAlert className="i i-sm" aria-hidden="true" focusable="false" />
          <span>{error}</span>
        </p>
      ) : null}
      {children}
    </div>
  )
}
