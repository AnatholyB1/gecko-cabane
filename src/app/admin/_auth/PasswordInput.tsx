'use client'

import { useId, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Field, fieldAria } from '@/components/admin/Field'

/**
 * Champ mot de passe avec bascule « Afficher / Masquer » (`aria-pressed`, cible 44 px).
 * Libellé toujours visible, erreur et aide reliées par `aria-describedby`.
 */
export function PasswordInput({
  label,
  hint,
  error,
  id,
  ...rest
}: { label: ReactNode; hint?: ReactNode; error?: ReactNode } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'aria-invalid'>) {
  const auto = useId()
  const fieldId = id ?? auto
  const [shown, setShown] = useState(false)
  return (
    <Field id={fieldId} label={label} hint={hint} error={error}>
      <div className="auth-pw">
        <input {...rest} {...fieldAria(fieldId, { hint, error })} className="adm-input" type={shown ? 'text' : 'password'} />
        <button
          type="button"
          className="auth-pw__toggle"
          aria-pressed={shown}
          aria-controls={fieldId}
          onClick={() => setShown((v) => !v)}
        >
          {shown ? 'Masquer' : 'Afficher'}
        </button>
      </div>
    </Field>
  )
}
