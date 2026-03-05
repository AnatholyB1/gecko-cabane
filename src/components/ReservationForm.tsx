'use client'

import { useState, useEffect } from 'react'

const OCCASIONS = [
  { value: '', label: 'Sélectionnez (optionnel)' },
  { value: 'Anniversaire', label: '🎂 Anniversaire' },
  { value: 'Dîner romantique', label: '💕 Dîner romantique' },
  { value: 'Repas d\'affaires', label: '💼 Repas d\'affaires' },
  { value: 'Célébration', label: '🎉 Célébration' },
  { value: 'Autre', label: '✨ Autre' }
]

const TIME_SLOTS = [
  '11:30', '12:00', '12:30', '13:00', '13:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
]

export default function ReservationForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    reservation_date: '',
    reservation_time: '',
    party_size: 2,
    occasion: ''
  })

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(true)
        setForm({
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          reservation_date: '',
          reservation_time: '',
          party_size: 2,
          occasion: ''
        })
      } else {
        setError(data.error || 'Une erreur est survenue')
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-[var(--primary-dark)] mb-4">
          Demande envoyée !
        </h3>
        <p className="text-[var(--warm-gray)] mb-6">
          Merci pour votre demande de réservation. Nous vous contacterons rapidement pour confirmer.
        </p>
        <p className="text-sm text-[var(--primary)]">
          📞 Pour les groupes de plus de 10 personnes, veuillez nous appeler directement.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 bg-[var(--primary)] text-white px-6 py-2 rounded-full hover:bg-[var(--primary-dark)] transition-colors"
        >
          Nouvelle réservation
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
      <h3 className="text-2xl font-bold text-[var(--primary-dark)] mb-6 text-center">
        🦎 Réserver une table
      </h3>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[var(--primary-dark)] mb-1">
            Nom complet *
          </label>
          <input
            type="text"
            required
            value={form.customer_name}
            onChange={(e) => setForm(f => ({ ...f, customer_name: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            placeholder="Jean Dupont"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-[var(--primary-dark)] mb-1">
            Téléphone *
          </label>
          <input
            type="tel"
            required
            value={form.customer_phone}
            onChange={(e) => setForm(f => ({ ...f, customer_phone: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            placeholder="+66 XX XXX XXXX"
          />
        </div>

        {/* Email */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[var(--primary-dark)] mb-1">
            Email (optionnel)
          </label>
          <input
            type="email"
            value={form.customer_email}
            onChange={(e) => setForm(f => ({ ...f, customer_email: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            placeholder="jean@example.com"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-[var(--primary-dark)] mb-1">
            Date *
          </label>
          <input
            type="date"
            required
            min={today}
            value={form.reservation_date}
            onChange={(e) => setForm(f => ({ ...f, reservation_date: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          />
        </div>

        {/* Time */}
        <div>
          <label className="block text-sm font-medium text-[var(--primary-dark)] mb-1">
            Heure *
          </label>
          <select
            required
            value={form.reservation_time}
            onChange={(e) => setForm(f => ({ ...f, reservation_time: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          >
            <option value="">Choisir une heure</option>
            <optgroup label="Déjeuner">
              {TIME_SLOTS.filter(t => t < '15:00').map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </optgroup>
            <optgroup label="Dîner">
              {TIME_SLOTS.filter(t => t >= '15:00').map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Party Size */}
        <div>
          <label className="block text-sm font-medium text-[var(--primary-dark)] mb-1">
            Nombre de personnes *
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, party_size: Math.max(1, f.party_size - 1) }))}
              className="w-10 h-10 rounded-full bg-[var(--accent-light)] text-[var(--primary-dark)] font-bold hover:bg-[var(--moss)]/30"
            >
              -
            </button>
            <span className="text-2xl font-bold text-[var(--primary-dark)] w-12 text-center">
              {form.party_size}
            </span>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, party_size: Math.min(20, f.party_size + 1) }))}
              className="w-10 h-10 rounded-full bg-[var(--accent-light)] text-[var(--primary-dark)] font-bold hover:bg-[var(--moss)]/30"
            >
              +
            </button>
          </div>
          {form.party_size > 10 && (
            <p className="text-amber-600 text-sm mt-2">
              ⚠️ Pour les grands groupes, nous vous contacterons pour confirmer la disponibilité.
            </p>
          )}
        </div>

        {/* Occasion */}
        <div>
          <label className="block text-sm font-medium text-[var(--primary-dark)] mb-1">
            Occasion
          </label>
          <select
            value={form.occasion}
            onChange={(e) => setForm(f => ({ ...f, occasion: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          >
            {OCCASIONS.map(occ => (
              <option key={occ.value} value={occ.value}>{occ.label}</option>
            ))}
          </select>
        </div>

      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 bg-[var(--primary)] text-white py-4 rounded-xl font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
            Envoi en cours...
          </span>
        ) : (
          '📅 Envoyer ma demande de réservation'
        )}
      </button>

      <p className="text-center text-sm text-[var(--warm-gray)] mt-4">
        * Champs obligatoires. La réservation sera confirmée par téléphone.
      </p>
    </form>
  )
}
