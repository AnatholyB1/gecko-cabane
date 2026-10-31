'use client'

import { useState } from 'react'
import { CalendarDays, CircleCheck, CircleX, Plus, Trash2 } from 'lucide-react'
import type { SpecialHours } from '@/types/database'
import { krabiTodayYmd } from '@/utils/krabi-time'
import { adminFetch } from '../admin-fetch'
import { useAdminQuery } from '../use-admin-query'
import { EmptyState, ErrorState, LoadingState } from '../states'
import { useToast } from '../Toast'
import { useConfirm } from '../ConfirmDialog'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Input, Textarea } from '../Input'
import {
  EMPTY_EXCEPTION,
  describeSaveError,
  exceptionHoursText,
  exceptionPayload,
  formatLongDate,
  splitExceptions,
  validateException,
  type ExceptionErrors,
  type ExceptionForm,
} from './site-logic'
import { InlineAlert, PreviewPanel, SaveFailure, SectionTitle, SiteSwitch } from './site-ui'
import { useUnsavedGuard } from './use-unsaved-guard'

/** Onglet « Exceptions » : nouvelle exception (action immédiate) + dates à venir (suppression avec dialogue). */
export function ExceptionsSection() {
  const toast = useToast()
  const confirm = useConfirm()
  const { status, data, error, refetch } = useAdminQuery<{ data?: SpecialHours[] }>('/api/special-hours')

  const [form, setForm] = useState<ExceptionForm>(EMPTY_EXCEPTION)
  const [errors, setErrors] = useState<ExceptionErrors>({})
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteFailure, setDeleteFailure] = useState<string | null>(null)

  const dirty = JSON.stringify(form) !== JSON.stringify(EMPTY_EXCEPTION)
  useUnsavedGuard(dirty, 'de la nouvelle exception')

  const list = data?.data ?? []
  const today = krabiTodayYmd()
  const { upcoming, past } = splitExceptions(list, today)

  function patch(p: Partial<ExceptionForm>) {
    setForm((f) => ({ ...f, ...p }))
    const keys = Object.keys(p) as (keyof ExceptionForm)[]
    setErrors((prev) => {
      const next = { ...prev }
      for (const k of keys) delete next[k as keyof ExceptionErrors]
      return next
    })
  }

  async function add() {
    if (saving) return
    const invalid = validateException(form)
    setErrors(invalid)
    if (Object.keys(invalid).length > 0) {
      setFailure(null)
      toast.error('Exception non ajoutée', 'Corrigez les champs signalés, puis réessayez.')
      return
    }
    const replaced = list.some((e) => e.date === form.date)
    setSaving(true)
    setFailure(null)
    try {
      await adminFetch('/api/special-hours', { method: 'POST', json: exceptionPayload(form) })
      toast.success(replaced ? 'Exception remplacée.' : 'Exception ajoutée.')
      setForm(EMPTY_EXCEPTION)
      refetch()
    } catch (e) {
      const reason = describeSaveError(e)
      setFailure(reason)
      toast.error('Exception non ajoutée', `${reason} Vos saisies sont conservées.`)
    } finally {
      setSaving(false)
    }
  }

  async function remove(item: SpecialHours) {
    const ok = await confirm({
      title: 'Supprimer cette exception ?',
      description: `Le ${formatLongDate(item.date)} reprendra les horaires habituels. Cette action est définitive.`,
      confirmLabel: 'Supprimer l’exception',
    })
    if (!ok) return
    setDeletingId(item.id)
    setDeleteFailure(null)
    try {
      await adminFetch(`/api/special-hours?id=${item.id}`, { method: 'DELETE' })
      toast.success('Exception supprimée.')
      refetch()
    } catch (e) {
      const reason = describeSaveError(e)
      setDeleteFailure(`L’exception du ${formatLongDate(item.date)} n’a pas été supprimée. ${reason}`)
      toast.error('Exception non supprimée', reason)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="adm-site-split">
      <div className="adm-site-stack">
        <section className="adm-site-card" aria-labelledby="site-exc-title">
          <SectionTitle icon={CalendarDays} id="site-exc-title">
            Horaires exceptionnels
          </SectionTitle>
          <p className="adm-site-lede">Jours fériés, événements, fermetures exceptionnelles : ces dates remplacent les horaires habituels.</p>
          {failure ? (
            <div className="adm-site-mt">
              <SaveFailure title="L’exception n’a pas été ajoutée." reason={failure} onRetry={() => void add()} retrying={saving} />
            </div>
          ) : null}
          <form
            className="adm-site-stack"
            aria-labelledby="site-exc-new"
            onSubmit={(e) => {
              e.preventDefault()
              void add()
            }}
          >
            <h3 id="site-exc-new" className="adm-site-h3">
              Nouvelle exception
            </h3>
            <div className="adm-site-row2">
              <Input
                label="Date"
                type="date"
                value={form.date}
                readOnly={saving}
                error={errors.date}
                hint="Une exception déjà enregistrée à cette date sera remplacée."
                onChange={(e) => patch({ date: e.target.value })}
              />
              <Input
                label="Titre"
                optional
                value={form.title}
                readOnly={saving}
                placeholder="Nouvel An, fermeture annuelle…"
                onChange={(e) => patch({ title: e.target.value })}
              />
            </div>
            <div>
              <SiteSwitch
                checked={form.is_open}
                onChange={(next) => patch({ is_open: next })}
                label="Ouvert ce jour"
                onText="Ouvert"
                offText="Fermé"
                readOnly={saving}
              />
            </div>
            {form.is_open ? (
              <div className="adm-site-row2 adm-site-row2--times">
                <Input label="Ouverture" type="time" value={form.open_time} readOnly={saving} error={errors.open_time} onChange={(e) => patch({ open_time: e.target.value })} />
                <Input label="Fermeture" type="time" value={form.close_time} readOnly={saving} error={errors.close_time} onChange={(e) => patch({ close_time: e.target.value })} />
              </div>
            ) : null}
            <Textarea label="Note" optional rows={2} value={form.note} readOnly={saving} placeholder="Information affichée avec l’horaire" onChange={(e) => patch({ note: e.target.value })} />
            <div>
              <Button variant="primary" onClick={() => void add()} loading={saving} loadingLabel="Ajout…">
                <Plus className="i" aria-hidden="true" focusable="false" />
                Ajouter l’exception
              </Button>
            </div>
          </form>
        </section>

        {status === 'loading' && !data ? (
          <LoadingState label="Chargement des dates…" />
        ) : status === 'error' && !data ? (
          <ErrorState error={error} title="Impossible de charger les horaires exceptionnels" description="Rien n’a été modifié." onRetry={refetch} />
        ) : list.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Aucun horaire exceptionnel" description="Les jours fériés, événements et fermetures exceptionnelles que vous ajouterez apparaîtront ici." />
        ) : (
          <section className="adm-site-card" aria-labelledby="site-exc-list">
            <h2 id="site-exc-list" className="adm-display adm-site-h2">
              Dates à venir
            </h2>
            {deleteFailure ? (
              <div className="adm-site-mt">
                <InlineAlert tone="err" role="alert" title="Suppression impossible.">
                  {deleteFailure} Réessayez.
                </InlineAlert>
              </div>
            ) : null}
            {upcoming.length === 0 ? (
              <p className="adm-muted adm-site-mt">Aucune date à venir.</p>
            ) : (
              <ul className="adm-site-list" aria-label="Horaires exceptionnels à venir">
                {upcoming.map((e) => (
                  <ExceptionRow key={e.id} item={e} busy={deletingId === e.id} onDelete={() => void remove(e)} />
                ))}
              </ul>
            )}
            {past.length > 0 ? (
              <details className="adm-site-past">
                <summary>Dates passées ({past.length})</summary>
                <ul className="adm-site-list" aria-label="Horaires exceptionnels passés">
                  {past.map((e) => (
                    <ExceptionRow key={e.id} item={e} busy={deletingId === e.id} onDelete={() => void remove(e)} />
                  ))}
                </ul>
              </details>
            ) : null}
          </section>
        )}
      </div>

      <PreviewPanel title="Aperçu : prochaines exceptions">
        {upcoming.length === 0 ? (
          <p>Aucune exception à venir : les horaires habituels s’appliquent.</p>
        ) : (
          upcoming.slice(0, 4).map((e) => (
            <div className="adm-site-pvh" key={e.id}>
              <span>
                {formatLongDate(e.date)}
                {e.title ? <span className="adm-site-pv__sub"> {e.title}</span> : null}
              </span>
              <span>{e.is_open ? `${exceptionHoursText(e).replace('Ouvert ', '')}` : 'Fermé'}</span>
            </div>
          ))
        )}
      </PreviewPanel>
    </div>
  )
}

function ExceptionRow({ item, busy, onDelete }: { item: SpecialHours; busy: boolean; onDelete: () => void }) {
  const long = formatLongDate(item.date)
  return (
    <li className="adm-site-xrow">
      <div>
        <div className="adm-site-xdate">{long}</div>
        <div className="adm-site-xmeta">
          {item.title ? <span>{item.title}</span> : null}
          {item.is_open ? (
            <Badge tone="ok" icon={CircleCheck}>
              {exceptionHoursText(item)}
            </Badge>
          ) : (
            <Badge tone="danger" icon={CircleX}>
              Fermé
            </Badge>
          )}
        </div>
      </div>
      <Button variant="danger-outline" iconOnly aria-label={`Supprimer l’exception du ${long}`} onClick={onDelete} loading={busy}>
        <Trash2 className="i" aria-hidden="true" focusable="false" />
      </Button>
      {item.note ? <p className="adm-site-xnote">{item.note}</p> : null}
    </li>
  )
}
