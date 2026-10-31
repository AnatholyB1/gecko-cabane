import type { ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'

export type FieldMessages = {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  /** Ajoute « (facultatif) » au libellé. */
  optional?: boolean
}

export const hintId = (id: string) => `${id}-hint`
export const errorId = (id: string) => `${id}-error`

/** Attributs ARIA d'un contrôle : description (aide + erreur) et état invalide. */
export function fieldAria(id: string, { hint, error }: Pick<FieldMessages, 'hint' | 'error'>) {
  const ids = [error ? errorId(id) : null, hint ? hintId(id) : null].filter(Boolean).join(' ')
  return {
    id,
    'aria-describedby': ids || undefined,
    'aria-invalid': error ? (true as const) : undefined,
  }
}

/** Enveloppe libellé + aide + erreur autour d'un contrôle d'identifiant `id`. */
export function Field({ id, label, hint, error, optional, children }: FieldMessages & { id: string; children: ReactNode }) {
  return (
    <div className="adm-field">
      <label className="adm-label" htmlFor={id}>
        {label}
        {optional ? <span className="opt"> (facultatif)</span> : null}
      </label>
      {children}
      {hint ? (
        <p className="adm-help" id={hintId(id)}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="adm-error" id={errorId(id)} role="alert">
          <CircleAlert className="i i-sm" aria-hidden="true" focusable="false" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
}
