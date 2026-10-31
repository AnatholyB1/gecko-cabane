'use client'

import { useRef, useState } from 'react'
import { Toaster, toast } from 'sonner'

const btn =
  'inline-flex h-10 items-center rounded-(--adm-radius) border border-(--adm-line) bg-(--adm-surface) px-4 text-sm text-(--adm-ink)'
const btnDanger =
  'inline-flex h-10 items-center rounded-(--adm-radius) bg-(--adm-danger) px-4 text-sm text-white'

export default function FallbackClient() {
  const ref = useRef<HTMLDialogElement>(null)
  const [status, setStatus] = useState('pending')

  return (
    <div className="flex flex-col gap-8">
      <button type="button" className={btnDanger} data-testid="open-dialog" onClick={() => ref.current?.showModal()}>
        Annuler la réservation
      </button>
      <dialog
        ref={ref}
        data-testid="dialog"
        aria-labelledby="fb-title"
        className="m-auto w-[min(28rem,90vw)] rounded-(--adm-radius) bg-(--adm-surface) p-6 text-(--adm-ink) shadow-(--adm-shadow) backdrop:bg-black/40"
      >
        <h2 id="fb-title" className="text-lg font-semibold">Annuler cette réservation ?</h2>
        <p className="mt-2 text-sm text-(--adm-ink-soft)">Le client sera prévenu par email.</p>
        <form method="dialog" className="mt-6 flex justify-end gap-3">
          <button className={btn} data-testid="dialog-keep" value="keep">Garder</button>
          <button
            className={btnDanger}
            data-testid="dialog-confirm"
            value="ok"
            onClick={() => toast.success('Réservation annulée')}
          >
            Confirmer
          </button>
        </form>
      </dialog>

      <section className="flex gap-3">
        <button type="button" className={btn} data-testid="toast-ok" onClick={() => toast.success('Enregistré', { description: 'Horaires mis à jour.' })}>
          Toast succès
        </button>
        <button type="button" className={btn} data-testid="toast-err" onClick={() => toast.error('Erreur', { description: 'Échec de la sauvegarde.' })}>
          Toast erreur
        </button>
      </section>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Statut
        <select
          data-testid="select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 w-56 rounded-(--adm-radius) border border-(--adm-line) bg-(--adm-surface) px-3"
        >
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmée</option>
          <option value="completed">Terminée</option>
          <option value="cancelled">Annulée</option>
          <option value="no_show">Absent</option>
        </select>
      </label>
      <p className="text-sm" data-testid="select-value">{status}</p>
      <Toaster position="bottom-right" />
    </div>
  )
}
