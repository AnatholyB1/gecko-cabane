'use client'

import { useId } from 'react'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Field, fieldAria, type FieldMessages } from './Field'

type InputProps = FieldMessages & Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-invalid'>

/** Champ de saisie 44 px, 16 px (pas de zoom iOS). Date et heure : types natifs. */
export function Input({ label, hint, error, optional, id, className, ...rest }: InputProps) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} optional={optional}>
      <input {...rest} {...fieldAria(fieldId, { hint, error })} className={['adm-input', className].filter(Boolean).join(' ')} />
    </Field>
  )
}

type SelectProps = FieldMessages & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'aria-invalid'>

/** Liste déroulante native stylée (clavier et lecteurs d'écran natifs). */
export function Select({ label, hint, error, optional, id, className, children, ...rest }: SelectProps) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} optional={optional}>
      <select {...rest} {...fieldAria(fieldId, { hint, error })} className={['adm-select', className].filter(Boolean).join(' ')}>
        {children}
      </select>
    </Field>
  )
}

type TextareaProps = FieldMessages & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'aria-invalid'>

export function Textarea({ label, hint, error, optional, id, className, ...rest }: TextareaProps) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <Field id={fieldId} label={label} hint={hint} error={error} optional={optional}>
      <textarea {...rest} {...fieldAria(fieldId, { hint, error })} className={['adm-textarea', className].filter(Boolean).join(' ')} />
    </Field>
  )
}
