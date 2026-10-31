'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Reservation, ReservationSource } from '@/types/database'
import { adminFetch, AdminFetchError } from '../admin-fetch'
import { Button } from '../Button'
import { useConfirm } from '../ConfirmDialog'
import { Select, Textarea } from '../Input'
import { useToast } from '../Toast'
import { krabiToday } from '@/utils/review-invitations'
import { getReviewBadges, showNoShowDeadline } from '@/utils/review-badges'
import { formatOrigin, RESERVATION_SOURCES, SOURCE_LABELS } from '@/utils/reservation-source'
import { deleteUrl, notesUpdateBody, RESERVATIONS_URL, sourceUpdateBody } from './requests'

/** Date et heure d'un horodatage, en heure de Krabi (UTC+7), quel que soit le fuseau du navigateur. */
function krabiStamp(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' })
}

function reason(e: unknown): string {
  return e instanceof AdminFetchError ? e.message : 'Erreur inattendue.'
}

/**
 * Ce qui était dans l'ancien modal et les lignes : email, source (PUT { id, source }), origine,
 * suivi des avis, notes admin (PUT { id, admin_notes }), suppression (DELETE avec useConfirm).
 * Un échec ne vide jamais la saisie.
 */
export function ReservationDetails({
  reservation: r,
  disabled,
  onChanged,
}: {
  reservation: Reservation
  disabled: boolean
  onChanged: () => void
}) {
  const toast = useToast()
  const confirm = useConfirm()
  const [notes, setNotes] = useState(r.admin_notes ?? '')
  const [saving, setSaving] = useState<'notes' | 'source' | 'delete' | null>(null)
  const todayKrabi = krabiToday(new Date())
  const badges = getReviewBadges(r, todayKrabi)
  const origin = formatOrigin(r)

  async function saveSource(source: ReservationSource) {
    setSaving('source')
    try {
      await adminFetch(RESERVATIONS_URL, { method: 'PUT', json: sourceUpdateBody(r.id, source) })
      toast.success('Source enregistrée.')
      onChanged()
    } catch (e) {
      toast.error('Impossible de modifier la source.', `${reason(e)} Réessayez.`)
    } finally {
      setSaving(null)
    }
  }

  async function saveNotes() {
    setSaving('notes')
    try {
      await adminFetch(RESERVATIONS_URL, { method: 'PUT', json: notesUpdateBody(r.id, notes) })
      toast.success('Notes enregistrées.')
      onChanged()
    } catch (e) {
      toast.error("Impossible d'enregistrer les notes.", `${reason(e)} Votre saisie est conservée.`)
    } finally {
      setSaving(null)
    }
  }

  async function remove() {
    const ok = await confirm({
      title: 'Supprimer cette réservation ?',
      description: `${r.customer_name} sera supprimée définitivement, sans email. Pour prévenir le client, annulez la réservation à la place.`,
      confirmLabel: 'Supprimer définitivement',
      cancelLabel: 'Garder la réservation',
    })
    if (!ok) return
    setSaving('delete')
    try {
      await adminFetch(deleteUrl(r.id), { method: 'DELETE' })
      toast.success('Réservation supprimée.')
      onChanged()
    } catch (e) {
      toast.error('Impossible de supprimer la réservation.', reason(e))
    } finally {
      setSaving(null)
    }
  }

  const locked = disabled || saving !== null

  return (
    <div className="rv-detail">
      <dl>
        <div>
          <dt>Téléphone</dt>
          <dd>{r.customer_phone || 'Non renseigné'}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{r.customer_email ? <a href={`mailto:${r.customer_email}`}>{r.customer_email}</a> : 'Non renseigné'}</dd>
        </div>
        {origin ? (
          <div>
            <dt>Origine</dt>
            <dd>{origin}</dd>
          </div>
        ) : null}
        <div>
          <dt>Créée</dt>
          <dd>{krabiStamp(r.created_at)} (Krabi)</dd>
        </div>
        {r.confirmed_at ? (
          <div>
            <dt>Confirmée</dt>
            <dd>{krabiStamp(r.confirmed_at)} (Krabi)</dd>
          </div>
        ) : null}
      </dl>
      {badges.length > 0 ? (
        <ul className="rv-row__notes" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {badges.map((b) => (
            <li key={b.label} className="rv-tag" title={b.title}>{b.label}</li>
          ))}
        </ul>
      ) : null}
      {showNoShowDeadline(r, todayKrabi) ? (
        <p className="adm-small" style={{ color: 'var(--adm-warn)' }}>
          Non présenté ? À marquer avant 11h (Krabi) le lendemain du service : l&apos;envoi de l&apos;invitation à laisser un avis peut avoir lieu entre 11h et 12h.
        </p>
      ) : null}
      <div className="rv-detail__row">
        <Select
          label="Source"
          value={r.source ?? 'site'}
          disabled={locked}
          onChange={(e) => saveSource(e.target.value as ReservationSource)}
        >
          {RESERVATION_SOURCES.map((s) => (
            <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
          ))}
        </Select>
      </div>
      <Textarea label="Notes internes" value={notes} maxLength={2000} rows={3} disabled={disabled} onChange={(e) => setNotes(e.target.value)} />
      <div className="rv-detail__row">
        <Button variant="primary" disabled={locked || notes === (r.admin_notes ?? '')} loading={saving === 'notes'} loadingLabel="Enregistrement…" onClick={saveNotes}>
          Enregistrer les notes
        </Button>
        <Button variant="danger-outline" disabled={locked} loading={saving === 'delete'} loadingLabel="Suppression…" onClick={remove}>
          <Trash2 className="i i-sm" aria-hidden="true" focusable="false" />
          Supprimer
        </Button>
      </div>
    </div>
  )
}
