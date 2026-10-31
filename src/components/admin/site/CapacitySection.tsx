'use client'

import { useState } from 'react'
import { Check, Users } from 'lucide-react'
import type { RestaurantSetting } from '@/types/database'
import { adminFetch } from '../admin-fetch'
import { useAdminQuery } from '../use-admin-query'
import { ErrorState, LoadingState } from '../states'
import { useToast } from '../Toast'
import {
  COVERS_KEY,
  COVERS_RANGE,
  DEFAULT_COVERS,
  DEFAULT_DURATION,
  DURATION_CHIPS,
  DURATION_KEY,
  DURATION_RANGE,
  capacityPayload,
  capacityTimeline,
  describeSaveError,
  formatDuration,
  parseWholeNumber,
  settingValue,
  stepValue,
  validateCapacity,
  EXAMPLE_ARRIVAL,
  TIMELINE_END,
  TIMELINE_START,
  type CapacityErrors,
  type CapacityForm,
} from './site-logic'
import { PreviewPanel, SaveBar, SaveFailure, SectionTitle, Stepper } from './site-ui'
import { useUnsavedGuard } from './use-unsaved-guard'

/** Onglet « Capacité » : chargement, états, puis le formulaire. */
export function CapacitySection() {
  const { status, data, error, refetch } = useAdminQuery<{ data?: RestaurantSetting[] }>('/api/settings')
  if (status === 'loading' && !data) return <LoadingState label="Chargement de la capacité…" />
  if (status === 'error' && !data) {
    return <ErrorState error={error} title="Impossible de charger la capacité" description="Rien n’a été modifié." onRetry={refetch} />
  }
  const rows = data?.data ?? []
  return (
    <CapacityFormView
      initial={{
        covers: settingValue(rows, COVERS_KEY, DEFAULT_COVERS),
        duration: settingValue(rows, DURATION_KEY, DEFAULT_DURATION),
      }}
    />
  )
}

export function CapacityFormView({ initial }: { initial: CapacityForm }) {
  const toast = useToast()
  const [form, setForm] = useState<CapacityForm>(initial)
  const [saved, setSaved] = useState<CapacityForm>(initial)
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [errors, setErrors] = useState<CapacityErrors>({})

  const dirty = form.covers.trim() !== saved.covers || form.duration.trim() !== saved.duration
  useUnsavedGuard(dirty, 'de la capacité')

  function patch(p: Partial<CapacityForm>) {
    setForm((f) => ({ ...f, ...p }))
    setErrors((prev) => {
      const next = { ...prev }
      if ('covers' in p) delete next.covers
      if ('duration' in p) delete next.duration
      return next
    })
  }

  async function save() {
    if (saving) return
    const invalid = validateCapacity(form)
    setErrors(invalid)
    if (Object.keys(invalid).length > 0) {
      setFailure(null)
      toast.error('Capacité non enregistrée', 'Corrigez les valeurs signalées, puis réessayez.')
      return
    }
    setSaving(true)
    setFailure(null)
    try {
      await adminFetch('/api/settings', { method: 'PUT', json: capacityPayload(form) })
      const next = { covers: String(Number(form.covers)), duration: String(Number(form.duration)) }
      setForm(next)
      setSaved(next)
      toast.success('Capacité enregistrée.')
    } catch (e) {
      const reason = describeSaveError(e)
      setFailure(reason)
      toast.error('Capacité non enregistrée', `${reason} Vos modifications sont conservées.`)
    } finally {
      setSaving(false)
    }
  }

  const coversN = parseWholeNumber(form.covers)
  const durationN = parseWholeNumber(form.duration)
  const durationOk = durationN !== null && durationN >= DURATION_RANGE.min && durationN <= DURATION_RANGE.max
  const timeline = durationOk ? capacityTimeline(durationN) : null

  return (
    <div className="adm-site-split">
      <section className="adm-site-card" aria-labelledby="site-cap-title">
        <SectionTitle icon={Users} id="site-cap-title">
          Capacité et durée d’occupation
        </SectionTitle>
        {failure ? (
          <div className="adm-site-mt">
            <SaveFailure title="La capacité n’a pas été enregistrée." reason={failure} onRetry={() => void save()} retrying={saving} />
          </div>
        ) : null}
        <form
          className="adm-site-stack"
          aria-labelledby="site-cap-title"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <Stepper
            id="site-covers"
            label="Couverts maximum par service"
            value={form.covers}
            onChange={(v) => patch({ covers: v })}
            onStep={(d) => patch({ covers: stepValue(form.covers, d, COVERS_RANGE.min, COVERS_RANGE.max) })}
            unit="couverts"
            decreaseLabel="Diminuer le nombre de couverts"
            increaseLabel="Augmenter le nombre de couverts"
            hint={`Nombre maximum de clients accueillis en même temps. Vérifié à chaque réservation en ligne. Entre ${COVERS_RANGE.min} et ${COVERS_RANGE.max}.`}
            error={errors.covers}
            readOnly={saving}
          />
          <Stepper
            id="site-duration"
            label="Durée d’occupation d’un créneau"
            value={form.duration}
            onChange={(v) => patch({ duration: v })}
            onStep={(d) => patch({ duration: stepValue(form.duration, d * DURATION_RANGE.step, DURATION_RANGE.min, DURATION_RANGE.max) })}
            unit={durationOk ? `minutes (${formatDuration(durationN)})` : 'minutes'}
            decreaseLabel="Diminuer la durée de 15 minutes"
            increaseLabel="Augmenter la durée de 15 minutes"
            hint={`Temps pendant lequel une réservation compte dans les couverts après son heure d’arrivée : repas et marge de service. Entre ${DURATION_RANGE.min} et ${DURATION_RANGE.max} minutes, par pas de ${DURATION_RANGE.step}.`}
            error={errors.duration}
            readOnly={saving}
          >
            <div className="adm-site-chips" role="radiogroup" aria-label="Durées courantes">
              {DURATION_CHIPS.map((m) => {
                const on = durationN === m
                return (
                  <button key={m} type="button" role="radio" aria-checked={on} className="adm-site-chip" onClick={() => !saving && patch({ duration: String(m) })}>
                    {on ? <Check className="i i-sm" aria-hidden="true" focusable="false" /> : null}
                    {formatDuration(m)}
                  </button>
                )
              })}
            </div>
          </Stepper>
          <SaveBar
            dirty={dirty}
            saving={saving}
            label="Enregistrer la capacité"
            onCancel={() => {
              setForm(saved)
              setErrors({})
              setFailure(null)
            }}
            onSave={() => void save()}
          />
        </form>
      </section>

      <PreviewPanel title="Aperçu : réservation en ligne">
        <p>
          <b>{coversN !== null ? `${coversN} couverts` : 'Couverts'}</b> maximum en même temps.{' '}
          {timeline ? (
            <>
              Une réservation à 19:00 occupe {formatDuration(durationN!)}, jusqu’à {timeline.endClock}.
              {timeline.beyondClosing ? ' Cela dépasse l’heure de fermeture.' : ''}
            </>
          ) : (
            'Entrez une durée valide pour voir la frise.'
          )}
        </p>
        {timeline ? (
          <div className="adm-site-tl">
            <div
              className="adm-site-tl__bar"
              role="img"
              aria-label={`Frise de 12 heures à 22 heures : la réservation de 19 heures occupe ${formatDuration(durationN!)}, jusqu’à ${timeline.endClock}.`}
            >
              <div className="adm-site-tl__fill" style={{ left: `${timeline.left}%`, width: `${timeline.width}%` }} />
            </div>
            <div className="adm-site-tl__ticks" aria-hidden="true">
              <span>{TIMELINE_START / 60} h</span>
              <span>{EXAMPLE_ARRIVAL / 60} h</span>
              <span>{TIMELINE_END / 60} h</span>
            </div>
          </div>
        ) : null}
      </PreviewPanel>
    </div>
  )
}
