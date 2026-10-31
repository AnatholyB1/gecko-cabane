'use client'

import { useState } from 'react'
import { Clock, PencilLine } from 'lucide-react'
import type { OpeningHours } from '@/types/database'
import { krabiTodayYmd } from '@/utils/krabi-time'
import { adminFetch } from '../admin-fetch'
import { useAdminQuery } from '../use-admin-query'
import { ErrorState, LoadingState } from '../states'
import { useToast } from '../Toast'
import { Badge } from '../Badge'
import {
  DAY_LABELS,
  changedDays,
  dayOfWeekOf,
  describeSaveError,
  hoursPayload,
  previewHours,
  toHourRows,
  validateHours,
  type HourRow,
} from './site-logic'
import { PreviewPanel, SaveBar, SaveFailure, SectionTitle, SiteSwitch } from './site-ui'
import { useUnsavedGuard } from './use-unsaved-guard'

/** Onglet « Horaires » : chargement, états, puis le formulaire. */
export function HoursSection() {
  const { status, data, error, refetch } = useAdminQuery<{ data?: OpeningHours[] }>('/api/hours')
  if (status === 'loading' && !data) return <LoadingState label="Chargement des horaires…" variant="table" />
  if (status === 'error' && !data) {
    return <ErrorState error={error} title="Impossible de charger les horaires" description="Rien n’a été modifié." onRetry={refetch} />
  }
  return <HoursForm initial={toHourRows(data?.data ?? [])} />
}

export function HoursForm({ initial }: { initial: HourRow[] }) {
  const toast = useToast()
  const [rows, setRows] = useState<HourRow[]>(initial)
  const [saved, setSaved] = useState<HourRow[]>(initial)
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<number, string>>({})

  const changed = changedDays(rows, saved)
  const dirty = changed.length > 0
  useUnsavedGuard(dirty, 'des horaires')

  function update(dow: number, patch: Partial<HourRow>) {
    setRows((prev) => prev.map((r) => (r.day_of_week === dow ? { ...r, ...patch } : r)))
    setErrors((prev) => {
      if (!(dow in prev)) return prev
      const rest = { ...prev }
      delete rest[dow]
      return rest
    })
  }

  async function save() {
    if (saving) return
    const invalid = validateHours(rows)
    setErrors(invalid)
    if (Object.keys(invalid).length > 0) {
      setFailure(null)
      toast.error('Horaires non enregistrés', 'Corrigez les jours signalés, puis réessayez.')
      return
    }
    setSaving(true)
    setFailure(null)
    try {
      await adminFetch('/api/hours', { method: 'PUT', json: hoursPayload(rows) })
      setSaved(rows)
      toast.success('Horaires enregistrés.')
    } catch (e) {
      const reason = describeSaveError(e)
      setFailure(reason)
      toast.error('Horaires non enregistrés', `${reason} Vos modifications sont conservées.`)
    } finally {
      setSaving(false)
    }
  }

  const todayDow = dayOfWeekOf(krabiTodayYmd())
  const preview = previewHours(rows, todayDow)

  return (
    <div className="adm-site-split">
      <section className="adm-site-card" aria-labelledby="site-hours-title">
        <SectionTitle icon={Clock} id="site-hours-title">
          Horaires de la semaine
        </SectionTitle>
        {failure ? (
          <div className="adm-site-mt">
            <SaveFailure title="Les horaires n’ont pas été enregistrés." reason={failure} onRetry={save} retrying={saving} />
          </div>
        ) : null}
        <form
          className="adm-site-stack"
          aria-labelledby="site-hours-title"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <div>
            {rows.map((r) => {
              const day = DAY_LABELS[r.day_of_week]
              const isChanged = changed.includes(r.day_of_week)
              const err = errors[r.day_of_week]
              return (
                <div className="adm-site-hrow" key={r.day_of_week}>
                  <div className="adm-site-hday">
                    <span>{day}</span>
                    {isChanged ? (
                      <Badge tone="warn" icon={PencilLine}>
                        Modifié
                      </Badge>
                    ) : null}
                  </div>
                  <div>
                    <SiteSwitch
                      checked={r.is_open}
                      onChange={(next) => update(r.day_of_week, { is_open: next })}
                      label={`Ouvert le ${day.toLowerCase()}`}
                      onText="Ouvert"
                      offText="Fermé"
                      readOnly={saving}
                    />
                  </div>
                  {r.is_open ? (
                    <div className="adm-site-htimes">
                      <label className="adm-sr-only" htmlFor={`h${r.day_of_week}-o`}>
                        Ouverture le {day.toLowerCase()}
                      </label>
                      <input
                        className="adm-input adm-site-time"
                        id={`h${r.day_of_week}-o`}
                        type="time"
                        value={r.open_time}
                        readOnly={saving}
                        aria-invalid={err ? true : undefined}
                        aria-describedby={err ? `h${r.day_of_week}-e` : undefined}
                        onChange={(e) => update(r.day_of_week, { open_time: e.target.value })}
                      />
                      <span className="adm-site-sep" aria-hidden="true">
                        à
                      </span>
                      <label className="adm-sr-only" htmlFor={`h${r.day_of_week}-c`}>
                        Fermeture le {day.toLowerCase()}
                      </label>
                      <input
                        className="adm-input adm-site-time"
                        id={`h${r.day_of_week}-c`}
                        type="time"
                        value={r.close_time}
                        readOnly={saving}
                        aria-invalid={err ? true : undefined}
                        aria-describedby={err ? `h${r.day_of_week}-e` : undefined}
                        onChange={(e) => update(r.day_of_week, { close_time: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className="adm-site-hclosed">Fermé toute la journée</div>
                  )}
                  {err ? (
                    <p className="adm-error adm-site-hrow__err" id={`h${r.day_of_week}-e`} role="alert">
                      {err}
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
          <SaveBar dirty={dirty} saving={saving} label="Enregistrer les horaires" onCancel={() => { setRows(saved); setErrors({}); setFailure(null) }} onSave={() => void save()} />
        </form>
      </section>

      <PreviewPanel title="Aperçu : horaires affichés sur le site">
        {preview.map((p) => (
          <div className={`adm-site-pvh${p.today ? ' is-today' : ''}`} key={p.dow}>
            <span>{p.label}</span>
            <span>{p.text}</span>
          </div>
        ))}
      </PreviewPanel>
    </div>
  )
}
