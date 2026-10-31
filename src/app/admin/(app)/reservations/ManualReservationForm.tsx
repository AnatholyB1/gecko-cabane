'use client'

import { useState } from 'react'
import { MANUAL_SOURCES } from '@/utils/manual-reservation'
import { SOURCE_LABELS } from '@/utils/reservation-source'

type Props = {
  onCreated: () => void
  onMessage: (m: { type: 'success' | 'error'; text: string }) => void
}

const FALLBACK_ERROR = "Impossible d'ajouter la réservation"
const INPUT = 'w-full px-3 py-2 border rounded-lg'

export default function ManualReservationForm({ onCreated, onMessage }: Props) {
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const payload = {
      customer_name: String(fd.get('customer_name') ?? ''),
      customer_phone: String(fd.get('customer_phone') ?? ''),
      customer_email: String(fd.get('customer_email') ?? ''),
      reservation_date: String(fd.get('reservation_date') ?? ''),
      reservation_time: String(fd.get('reservation_time') ?? ''),
      party_size: Number(fd.get('party_size')),
      source: String(fd.get('source') ?? ''),
      admin_notes: String(fd.get('admin_notes') ?? ''),
    }
    setPending(true)
    try {
      const res = await fetch('/api/reservations/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 201) {
        form.reset()
        onMessage({ type: 'success', text: 'Réservation ajoutée' })
        onCreated()
      } else {
        onMessage({ type: 'error', text: data.error ?? FALLBACK_ERROR })
      }
    } catch {
      onMessage({ type: 'error', text: FALLBACK_ERROR })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-md mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="mr-name" className="block text-sm font-medium mb-1">Nom</label>
        <input id="mr-name" name="customer_name" required maxLength={100} className={INPUT} />
      </div>
      <div>
        <label htmlFor="mr-phone" className="block text-sm font-medium mb-1">Téléphone</label>
        <input id="mr-phone" name="customer_phone" type="tel" className={INPUT} />
        <p className="text-xs text-gray-500 mt-1">Facultatif pour un client sans réservation</p>
      </div>
      <div>
        <label htmlFor="mr-email" className="block text-sm font-medium mb-1">Email (facultatif)</label>
        <input id="mr-email" name="customer_email" type="email" className={INPUT} />
      </div>
      <div>
        <label htmlFor="mr-source" className="block text-sm font-medium mb-1">Source</label>
        <select id="mr-source" name="source" required defaultValue="" className={INPUT}>
          <option value="" disabled>Choisir…</option>
          {MANUAL_SOURCES.map((s) => (
            <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="mr-date" className="block text-sm font-medium mb-1">Date</label>
        <input id="mr-date" name="reservation_date" type="date" required className={INPUT} />
      </div>
      <div>
        <label htmlFor="mr-time" className="block text-sm font-medium mb-1">Heure</label>
        <input id="mr-time" name="reservation_time" type="time" required className={INPUT} />
      </div>
      <div>
        <label htmlFor="mr-size" className="block text-sm font-medium mb-1">Couverts</label>
        <input id="mr-size" name="party_size" type="number" min={1} max={50} step={1} required className={INPUT} />
      </div>
      <div>
        <label htmlFor="mr-notes" className="block text-sm font-medium mb-1">Notes</label>
        <textarea id="mr-notes" name="admin_notes" rows={2} maxLength={2000} className={INPUT} />
      </div>
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-lg bg-(--primary) text-white font-semibold disabled:opacity-60"
        >
          {pending ? 'Ajout…' : 'Ajouter la réservation'}
        </button>
      </div>
    </form>
  )
}
