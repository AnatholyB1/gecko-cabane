'use client'

import { useState } from 'react'
import { Check, CircleCheck, CircleSlash, Clock, Info, Megaphone } from 'lucide-react'
import type { Announcement } from '@/types/database'
import { krabiTodayYmd } from '@/utils/krabi-time'
import { adminFetch } from '../admin-fetch'
import { useAdminQuery } from '../use-admin-query'
import { ErrorState, LoadingState } from '../states'
import { useToast } from '../Toast'
import { Badge } from '../Badge'
import { Input, Textarea } from '../Input'
import {
  BANNER_COLORS,
  announcementPayload,
  announcementStatus,
  announcementStatusText,
  describeSaveError,
  sameAnnouncement,
  toAnnouncementForm,
  validateAnnouncement,
  type AnnouncementErrors,
  type AnnouncementForm,
  type AnnouncementStatus,
} from './site-logic'
import { PreviewPanel, SaveBar, SaveFailure, SectionTitle, SiteSwitch } from './site-ui'
import { useUnsavedGuard } from './use-unsaved-guard'

/** Onglet « Annonces » : chargement, états, puis le formulaire. */
export function AnnouncementSection() {
  const { status, data, error, refetch } = useAdminQuery<{ data?: Announcement | null }>('/api/announcement')
  if (status === 'loading' && !data) return <LoadingState label="Chargement de l’annonce…" />
  if (status === 'error' && !data) {
    return <ErrorState error={error} title="Impossible de charger l’annonce" description="Rien n’a été modifié." onRetry={refetch} />
  }
  return <AnnouncementFormView initial={toAnnouncementForm(data?.data)} />
}

const STATUS_BADGE: Record<AnnouncementStatus['kind'], { tone: 'ok' | 'warn' | 'info' | 'neutral'; icon: typeof Info }> = {
  none: { tone: 'neutral', icon: CircleSlash },
  hidden: { tone: 'neutral', icon: CircleSlash },
  live: { tone: 'ok', icon: CircleCheck },
  ended: { tone: 'neutral', icon: CircleSlash },
  scheduled: { tone: 'info', icon: Clock },
}

export function AnnouncementFormView({ initial }: { initial: AnnouncementForm }) {
  const toast = useToast()
  const [form, setForm] = useState<AnnouncementForm>(initial)
  const [saved, setSaved] = useState<AnnouncementForm>(initial)
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [errors, setErrors] = useState<AnnouncementErrors>({})

  const dirty = !sameAnnouncement(form, saved)
  useUnsavedGuard(dirty, 'de l’annonce')

  function patch(p: Partial<AnnouncementForm>) {
    setForm((f) => ({ ...f, ...p }))
    setErrors((prev) => {
      const next = { ...prev }
      if ('content' in p || 'is_active' in p) delete next.content
      if ('start_date' in p || 'end_date' in p) delete next.end_date
      return next
    })
  }

  async function save() {
    if (saving) return
    const invalid = validateAnnouncement(form)
    setErrors(invalid)
    if (Object.keys(invalid).length > 0) {
      setFailure(null)
      toast.error('Annonce non enregistrée', 'Corrigez les champs signalés, puis réessayez.')
      return
    }
    setSaving(true)
    setFailure(null)
    try {
      await adminFetch('/api/announcement', { method: 'PUT', json: announcementPayload(form) })
      setSaved(form)
      toast.success('Annonce enregistrée.')
    } catch (e) {
      const reason = describeSaveError(e)
      setFailure(reason)
      toast.error('Annonce non enregistrée', `${reason} Vos modifications sont conservées.`)
    } finally {
      setSaving(false)
    }
  }

  const st = announcementStatus(form, krabiTodayYmd())
  const badge = STATUS_BADGE[st.kind]

  return (
    <div className="adm-site-split">
      <section className="adm-site-card" aria-labelledby="site-ann-title">
        <SectionTitle icon={Megaphone} id="site-ann-title">
          Annonce du site
        </SectionTitle>
        {failure ? (
          <div className="adm-site-mt">
            <SaveFailure title="L’annonce n’a pas été enregistrée." reason={failure} onRetry={() => void save()} retrying={saving} />
          </div>
        ) : null}
        <form
          className="adm-site-stack"
          aria-labelledby="site-ann-title"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <div>
            <SiteSwitch
              checked={form.is_active}
              onChange={(next) => patch({ is_active: next })}
              label="Afficher la bannière sur le site"
              onText="Bannière affichée"
              offText="Bannière masquée"
              readOnly={saving}
            />
          </div>
          <Input
            label="Titre"
            optional
            value={form.title}
            readOnly={saving}
            placeholder="Fermeture exceptionnelle, menu spécial, événement…"
            onChange={(e) => patch({ title: e.target.value })}
          />
          <Textarea
            label="Message"
            rows={4}
            value={form.content}
            readOnly={saving}
            error={errors.content}
            placeholder="Écrivez votre annonce ici…"
            onChange={(e) => patch({ content: e.target.value })}
          />
          <div className="adm-field" role="radiogroup" aria-labelledby="site-ann-color">
            <span className="adm-label" id="site-ann-color">
              Couleur de la bannière
            </span>
            <div className="adm-site-swatches">
              {BANNER_COLORS.map((c) => {
                const on = form.bg_color === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className="adm-site-swatch"
                    onClick={() => !saving && patch({ bg_color: c.value })}
                  >
                    <i className={`adm-site-dot adm-site-dot--${c.value}`} aria-hidden="true" />
                    {c.label}
                    {on ? <Check className="i i-sm" aria-hidden="true" focusable="false" /> : null}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="adm-site-row2">
            <Input label="Début" optional type="date" value={form.start_date} readOnly={saving} onChange={(e) => patch({ start_date: e.target.value })} />
            <Input label="Fin" optional type="date" value={form.end_date} readOnly={saving} error={errors.end_date} onChange={(e) => patch({ end_date: e.target.value })} />
          </div>
          <SaveBar
            dirty={dirty}
            saving={saving}
            label="Enregistrer l’annonce"
            onCancel={() => {
              setForm(saved)
              setErrors({})
              setFailure(null)
            }}
            onSave={() => void save()}
          />
        </form>
      </section>

      <PreviewPanel title="Aperçu : bannière en haut du site">
        {st.kind === 'none' ? (
          <p>Aucune bannière n’est affichée sur le site.</p>
        ) : (
          <div className={`adm-site-bn adm-site-bn--${form.bg_color}`}>
            <Megaphone className="i" aria-hidden="true" focusable="false" />
            <div>
              {form.title.trim() ? <strong>{form.title.trim()}</strong> : null}
              <span className="adm-site-bn__msg">{form.content}</span>
            </div>
          </div>
        )}
        <div className="adm-site-pv__status">
          <Badge tone={badge.tone} icon={badge.icon}>
            {announcementStatusText(st)}
          </Badge>
        </div>
      </PreviewPanel>
    </div>
  )
}
