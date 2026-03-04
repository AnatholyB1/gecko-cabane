'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { OpeningHours, SpecialHours } from '@/types/database'

const DAYS = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
]

export default function HoursAdminPage() {
  const router = useRouter()
  const [hours, setHours] = useState<OpeningHours[]>([])
  const [specialHours, setSpecialHours] = useState<SpecialHours[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Special hours form
  const [showSpecialForm, setShowSpecialForm] = useState(false)
  const [specialForm, setSpecialForm] = useState({
    date: '',
    title: '',
    is_open: true,
    open_time: '11:00',
    close_time: '23:00',
    note: ''
  })

  useEffect(() => {
    fetchHours()
  }, [])

  async function fetchHours() {
    try {
      const [hoursRes, specialRes] = await Promise.all([
        fetch('/api/hours'),
        fetch('/api/special-hours')
      ])
      
      const hoursData = await hoursRes.json()
      const specialData = await specialRes.json()
      
      if (hoursData.data) {
        setHours(hoursData.data)
      }
      if (specialData.data) {
        setSpecialHours(specialData.data)
      }
    } catch (error) {
      console.error('Error fetching hours:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des horaires' })
    } finally {
      setLoading(false)
    }
  }

  function updateHour(dayOfWeek: number, field: string, value: string | boolean) {
    setHours(prev => prev.map(h => 
      h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
    ))
  }

  async function saveHours() {
    setSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Horaires mis à jour avec succès!' })
      } else {
        if (data.error === 'Unauthorized') {
          router.push('/admin/login')
          return
        }
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la sauvegarde' })
      }
    } catch (error) {
      console.error('Error saving hours:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  async function addSpecialHours() {
    if (!specialForm.date) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une date' })
      return
    }
    
    setSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/special-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specialForm)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Horaires spéciaux ajoutés!' })
        setShowSpecialForm(false)
        setSpecialForm({
          date: '',
          title: '',
          is_open: true,
          open_time: '11:00',
          close_time: '23:00',
          note: ''
        })
        fetchHours() // Refresh the list
      } else {
        if (data.error === 'Unauthorized') {
          router.push('/admin/login')
          return
        }
        setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'ajout' })
      }
    } catch (error) {
      console.error('Error adding special hours:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'ajout' })
    } finally {
      setSaving(false)
    }
  }

  async function deleteSpecialHours(id: number) {
    if (!confirm('Supprimer ces horaires spéciaux?')) return
    
    try {
      const response = await fetch(`/api/special-hours?id=${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Horaires spéciaux supprimés' })
        fetchHours()
      } else {
        const data = await response.json()
        if (data.error === 'Unauthorized') {
          router.push('/admin/login')
          return
        }
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la suppression' })
      }
    } catch (error) {
      console.error('Error deleting special hours:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce">🦎</div>
          <p className="mt-4 text-[var(--warm-gray)]">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Admin Header */}
      <header className="bg-gradient-to-r from-[var(--jungle-dark)] to-[var(--primary-dark)] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🦎</span>
            <div>
              <h1 className="text-xl font-bold">Gecko Cabane Admin</h1>
              <p className="text-sm opacity-80">Gestion des horaires</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              ← Retour
            </Link>
            <Link
              href="/api/auth/logout"
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              Déconnexion
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Regular Hours */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-[var(--primary-dark)] mb-6 flex items-center gap-3">
            <span>🕐</span> Horaires d&apos;ouverture
          </h2>
          
          <div className="space-y-4">
            {DAYS.map(day => {
              const hourData = hours.find(h => h.day_of_week === day.value)
              if (!hourData) return null
              
              return (
                <div 
                  key={day.value}
                  className="flex flex-wrap items-center gap-4 p-4 bg-[var(--background)] rounded-xl"
                >
                  <div className="w-28 font-medium text-[var(--primary-dark)]">
                    {day.label}
                  </div>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hourData.is_open}
                      onChange={(e) => updateHour(day.value, 'is_open', e.target.checked)}
                      className="w-5 h-5 rounded accent-[var(--tropical)]"
                    />
                    <span className={hourData.is_open ? 'text-green-600' : 'text-red-500'}>
                      {hourData.is_open ? 'Ouvert' : 'Fermé'}
                    </span>
                  </label>
                  
                  {hourData.is_open && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="time"
                        value={hourData.open_time || '11:00'}
                        onChange={(e) => updateHour(day.value, 'open_time', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--tropical)] focus:outline-none"
                      />
                      <span className="text-[var(--warm-gray)]">à</span>
                      <input
                        type="time"
                        value={hourData.close_time || '23:00'}
                        onChange={(e) => updateHour(day.value, 'close_time', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--tropical)] focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          <button
            onClick={saveHours}
            disabled={saving}
            className="mt-6 w-full bg-gradient-to-r from-[var(--tropical)] to-[var(--primary)] text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : '💾 Enregistrer les horaires'}
          </button>
        </div>

        {/* Special Hours */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[var(--primary-dark)] flex items-center gap-3">
              <span>📅</span> Horaires spéciaux
            </h2>
            <button
              onClick={() => setShowSpecialForm(!showSpecialForm)}
              className="bg-[var(--tropical)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary)] transition-colors"
            >
              {showSpecialForm ? '✕ Annuler' : '+ Ajouter'}
            </button>
          </div>
          
          <p className="text-[var(--warm-gray)] mb-6">
            Ajoutez des horaires spéciaux pour les jours fériés, événements ou fermetures exceptionnelles.
          </p>

          {/* Add Special Hours Form */}
          {showSpecialForm && (
            <div className="bg-[var(--accent-light)] p-6 rounded-xl mb-6">
              <h3 className="font-semibold text-[var(--primary-dark)] mb-4">Nouvel horaire spécial</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[var(--primary-dark)] mb-1">Date</label>
                  <input
                    type="date"
                    value={specialForm.date}
                    onChange={(e) => setSpecialForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--tropical)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--primary-dark)] mb-1">Titre (optionnel)</label>
                  <input
                    type="text"
                    placeholder="ex: Nouvel An, Fermeture annuelle..."
                    value={specialForm.title}
                    onChange={(e) => setSpecialForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--tropical)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={specialForm.is_open}
                      onChange={(e) => setSpecialForm(prev => ({ ...prev, is_open: e.target.checked }))}
                      className="w-5 h-5 rounded accent-[var(--tropical)]"
                    />
                    <span className={specialForm.is_open ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                      {specialForm.is_open ? 'Ouvert' : 'Fermé'}
                    </span>
                  </label>
                </div>
                {specialForm.is_open && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={specialForm.open_time}
                      onChange={(e) => setSpecialForm(prev => ({ ...prev, open_time: e.target.value }))}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--tropical)] focus:outline-none"
                    />
                    <span className="text-[var(--warm-gray)]">à</span>
                    <input
                      type="time"
                      value={specialForm.close_time}
                      onChange={(e) => setSpecialForm(prev => ({ ...prev, close_time: e.target.value }))}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--tropical)] focus:outline-none"
                    />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--primary-dark)] mb-1">Note (optionnel)</label>
                  <textarea
                    placeholder="Informations supplémentaires..."
                    value={specialForm.note}
                    onChange={(e) => setSpecialForm(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--tropical)] focus:outline-none resize-none"
                    rows={2}
                  />
                </div>
              </div>
              <button
                onClick={addSpecialHours}
                disabled={saving}
                className="mt-4 bg-[var(--tropical)] text-white px-6 py-2 rounded-lg hover:bg-[var(--primary)] transition-colors disabled:opacity-50"
              >
                {saving ? 'Ajout...' : '✓ Ajouter'}
              </button>
            </div>
          )}

          {/* List of Special Hours */}
          {specialHours.length === 0 ? (
            <p className="text-center text-[var(--warm-gray)] py-8">
              Aucun horaire spécial programmé
            </p>
          ) : (
            <div className="space-y-3">
              {specialHours.map(sh => (
                <div 
                  key={sh.id}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    sh.is_open ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--primary-dark)]">
                        {new Date(sh.date).toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                      {sh.title && (
                        <span className="bg-white px-2 py-0.5 rounded text-sm">
                          {sh.title}
                        </span>
                      )}
                    </div>
                    <div className="text-sm mt-1">
                      {sh.is_open ? (
                        <span className="text-green-600">
                          Ouvert: {sh.open_time?.slice(0, 5)} - {sh.close_time?.slice(0, 5)}
                        </span>
                      ) : (
                        <span className="text-red-500">Fermé</span>
                      )}
                      {sh.note && <span className="ml-2 text-[var(--warm-gray)]">• {sh.note}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSpecialHours(sh.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
