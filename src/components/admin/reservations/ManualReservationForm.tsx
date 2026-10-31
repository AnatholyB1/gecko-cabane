'use client'

import { useState } from 'react'
import type { FormEvent, Ref } from 'react'
import { CircleAlert, Minus, Plus } from 'lucide-react'
import { adminFetch, AdminFetchError } from '../admin-fetch'
import { Button } from '../Button'
import { fieldAria, Field } from '../Field'
import { Input, Textarea } from '../Input'
import { MANUAL_SOURCES } from '@/utils/manual-reservation'
import { SOURCE_LABELS } from '@/utils/reservation-source'
import { MANUAL_RESERVATION_URL, manualReservationBody } from './requests'

const FALLBACK_ERROR = "Impossible d'ajouter la réservation."

type FieldName = 'source' | 'customer_name' | 'customer_phone' | 'customer_email' | 'reservation_date' | 'reservation_time' | 'party_size' | 'admin_notes' | 'allergies'

/** Messages renvoyés par la validation serveur, rattachés au champ concerné (sinon bandeau seul). */
const SERVER_FIELD: Record<string, FieldName> = {
  'Nom invalide': 'customer_name',
  'Source invalide': 'source',
  'Téléphone invalide': 'customer_phone',
  'Email invalide': 'customer_email',
  'Date invalide': 'reservation_date',
  'Heure invalide': 'reservation_time',
  'Nombre de personnes invalide': 'party_size',
  'Notes invalides': 'admin_notes',
  'Allergies invalides': 'allergies',
}

type Errors = Partial<Record<FieldName, string>>

/** Validation côté client (miroir léger des règles serveur ; le serveur reste l'autorité). */
export function validateManualForm(fd: FormData): Errors {
  const e: Errors = {}
  const text = (k: string) => String(fd.get(k) ?? '').trim()
  const source = text('source')
  if (!(MANUAL_SOURCES as readonly string[]).includes(source)) e.source = 'Choisissez une source.'
  if (text('customer_name').length < 2) e.customer_name = 'Saisissez le nom du client (2 caractères minimum).'
  if (text('customer_phone') === '' && source !== 'sans_reservation') e.customer_phone = 'Saisissez un téléphone (facultatif seulement pour « Sans réservation »).'
  if (text('reservation_date') === '') e.reservation_date = 'Choisissez une date.'
  if (text('reservation_time') === '') e.reservation_time = 'Choisissez une heure.'
  const size = Number(fd.get('party_size'))
  if (!Number.isInteger(size) || size < 1 || size > 50) e.party_size = 'Indiquez entre 1 et 50 couverts.'
  return e
}

/**
 * Feuille de saisie manuelle (RSV-04). POST /api/reservations/manual inchangé (corps : requests.ts).
 * Succès (201) : `onCreated`. Échec : la saisie est conservée, un bandeau l'explique.
 */
export default function ManualReservationForm({
  defaultDate,
  onCreated,
  onCancel,
  firstFieldRef,
}: {
  defaultDate: string
  onCreated: () => void
  onCancel: () => void
  firstFieldRef?: Ref<HTMLInputElement>
}) {
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [party, setParty] = useState('2')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    const fd = new FormData(e.currentTarget)
    const found = validateManualForm(fd)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setBanner('Corrigez les champs signalés.')
      return
    }
    setBanner(null)
    setPending(true)
    try {
      await adminFetch(MANUAL_RESERVATION_URL, { method: 'POST', json: manualReservationBody(fd) })
      onCreated()
    } catch (err) {
      const message = err instanceof AdminFetchError ? err.message : FALLBACK_ERROR
      const field = SERVER_FIELD[message]
      if (field) setErrors({ [field]: message })
      const detail = field || message === FALLBACK_ERROR ? '' : ` (${message})`
      setBanner(`${FALLBACK_ERROR}${detail} Vos informations sont conservées.`)
    } finally {
      setPending(false)
    }
  }

  function step(delta: number) {
    const n = Number(party)
    const next = Math.min(50, Math.max(1, (Number.isFinite(n) ? n : 1) + delta))
    setParty(String(next))
  }

  const sizeAria = fieldAria('mr-size', { error: errors.party_size })
  const sourceErrorId = 'mr-source-error'

  return (
    <form onSubmit={handleSubmit} noValidate className="rv-form" aria-busy={pending || undefined}>
      {banner ? (
        <div className="rv-banner" role="alert">
          <CircleAlert className="i" aria-hidden="true" focusable="false" />
          <span>{banner}</span>
        </div>
      ) : null}

      <fieldset className="rv-fieldset" aria-describedby={errors.source ? sourceErrorId : undefined} disabled={pending}>
        <legend>Source de la réservation</legend>
        <div className="rv-radios" role="radiogroup" aria-required="true" aria-invalid={errors.source ? true : undefined}>
          {MANUAL_SOURCES.map((s, i) => (
            <label key={s} className="rv-radio">
              <input type="radio" name="source" value={s} required ref={i === 0 ? firstFieldRef : undefined} />
              {SOURCE_LABELS[s]}
            </label>
          ))}
        </div>
        {errors.source ? (
          <p className="adm-error" id={sourceErrorId} role="alert">
            <CircleAlert className="i i-sm" aria-hidden="true" focusable="false" />
            <span>{errors.source}</span>
          </p>
        ) : null}
      </fieldset>

      <div className="rv-form__grid rv-form__grid--2">
        <Input id="mr-name" name="customer_name" label="Nom" required maxLength={100} autoComplete="off" readOnly={pending} error={errors.customer_name} />
        <Input
          id="mr-phone"
          name="customer_phone"
          type="tel"
          inputMode="tel"
          label="Téléphone"
          autoComplete="off"
          readOnly={pending}
          hint="Facultatif pour un client sans réservation."
          error={errors.customer_phone}
        />
      </div>

      <div className="rv-form__grid rv-form__grid--2">
        <Input id="mr-date" name="reservation_date" type="date" label="Date" required defaultValue={defaultDate} readOnly={pending} error={errors.reservation_date} />
        <Input id="mr-time" name="reservation_time" type="time" label="Heure (Krabi)" required readOnly={pending} error={errors.reservation_time} />
      </div>

      <Field id="mr-size" label="Couverts" error={errors.party_size}>
        <div className="rv-stepper">
          <Button variant="secondary" iconOnly aria-label="Un couvert de moins" disabled={pending} onClick={() => step(-1)}>
            <Minus className="i" aria-hidden="true" focusable="false" />
          </Button>
          <input
            {...sizeAria}
            className="adm-input"
            name="party_size"
            type="number"
            inputMode="numeric"
            min={1}
            max={50}
            step={1}
            required
            value={party}
            readOnly={pending}
            onChange={(e) => setParty(e.target.value)}
          />
          <Button variant="secondary" iconOnly aria-label="Un couvert de plus" disabled={pending} onClick={() => step(1)}>
            <Plus className="i" aria-hidden="true" focusable="false" />
          </Button>
        </div>
      </Field>

      <Input id="mr-email" name="customer_email" type="email" inputMode="email" label="Email" optional autoComplete="off" readOnly={pending} error={errors.customer_email} />
      <Textarea
        id="mr-allergies"
        name="allergies"
        label="Allergies"
        optional
        rows={2}
        maxLength={500}
        readOnly={pending}
        hint="Visibles sur la ligne de la réservation."
        error={errors.allergies}
      />
      <Textarea id="mr-notes" name="admin_notes" label="Notes" optional rows={2} maxLength={2000} readOnly={pending} error={errors.admin_notes} />

      <div className="rv-form__actions">
        <Button variant="secondary" disabled={pending} onClick={onCancel}>
          Fermer
        </Button>
        <Button type="submit" variant="primary" disabled={pending} loading={pending} loadingLabel="Ajout…">
          Ajouter la réservation
        </Button>
      </div>
    </form>
  )
}
