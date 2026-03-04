'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Announcement } from '@/types/database'

const BG_COLORS = [
  { value: 'amber', label: 'Orange', preview: 'bg-amber-100 border-amber-300' },
  { value: 'green', label: 'Vert', preview: 'bg-green-100 border-green-300' },
  { value: 'red', label: 'Rouge', preview: 'bg-red-100 border-red-300' },
  { value: 'blue', label: 'Bleu', preview: 'bg-blue-100 border-blue-300' },
  { value: 'purple', label: 'Violet', preview: 'bg-purple-100 border-purple-300' },
]

export default function AnnouncementAdminPage() {
  const router = useRouter()
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [form, setForm] = useState({
    title: '',
    content: '',
    is_active: false,
    bg_color: 'amber' as 'amber' | 'green' | 'red' | 'blue' | 'purple',
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    fetchAnnouncement()
  }, [])

  async function fetchAnnouncement() {
    try {
      const response = await fetch('/api/announcement')
      const data = await response.json()
      
      if (data.data) {
        setAnnouncement(data.data)
        setForm({
          title: data.data.title || '',
          content: data.data.content || '',
          is_active: data.data.is_active || false,
          bg_color: data.data.bg_color || 'amber',
          start_date: data.data.start_date || '',
          end_date: data.data.end_date || ''
        })
      }
    } catch (error) {
      console.error('Error fetching announcement:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  async function saveAnnouncement() {
    setSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/announcement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Annonce mise à jour!' })
        setAnnouncement(data.data)
      } else {
        if (data.error === 'Unauthorized') {
          router.push('/admin/login')
          return
        }
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la sauvegarde' })
      }
    } catch (error) {
      console.error('Error saving announcement:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  function getPreviewClasses() {
    const color = BG_COLORS.find(c => c.value === form.bg_color)
    return color?.preview || 'bg-amber-100 border-amber-300'
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
              <p className="text-sm opacity-80">Gestion de l&apos;annonce</p>
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

        {/* Announcement Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-[var(--primary-dark)] mb-6 flex items-center gap-3">
            <span>📢</span> Annonce du restaurant
          </h2>
          
          <div className="space-y-6">
            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 bg-[var(--background)] rounded-xl">
              <div>
                <p className="font-medium text-[var(--primary-dark)]">Afficher l&apos;annonce</p>
                <p className="text-sm text-[var(--warm-gray)]">L&apos;annonce sera visible sur la page d&apos;accueil</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[var(--primary-dark)] mb-2">
                Titre (optionnel)
              </label>
              <input
                type="text"
                placeholder="ex: Fermeture exceptionnelle, Menu spécial, Événement..."
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--tropical)] focus:outline-none"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-[var(--primary-dark)] mb-2">
                Contenu de l&apos;annonce *
              </label>
              <textarea
                placeholder="Écrivez votre annonce ici..."
                value={form.content}
                onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--tropical)] focus:outline-none resize-none"
              />
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--primary-dark)] mb-2">
                Couleur de fond
              </label>
              <div className="flex flex-wrap gap-3">
                {BG_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, bg_color: color.value as typeof form.bg_color }))}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      form.bg_color === color.value 
                        ? `${color.preview} ring-2 ring-offset-2 ring-[var(--tropical)]` 
                        : `${color.preview} opacity-60 hover:opacity-100`
                    }`}
                  >
                    {color.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--primary-dark)] mb-2">
                  Date de début (optionnel)
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--tropical)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--primary-dark)] mb-2">
                  Date de fin (optionnel)
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--tropical)] focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={saveAnnouncement}
              disabled={saving || !form.content.trim()}
              className="w-full bg-gradient-to-r from-[var(--tropical)] to-[var(--primary)] text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement...' : '💾 Enregistrer l\'annonce'}
            </button>
          </div>
        </div>

        {/* Preview */}
        {form.content && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-[var(--primary-dark)] mb-4 flex items-center gap-2">
              <span>👁️</span> Aperçu
            </h3>
            <div className={`p-6 rounded-2xl border-2 ${getPreviewClasses()}`}>
              {form.title && (
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                  📢 {form.title}
                </h4>
              )}
              <p className="whitespace-pre-wrap">{form.content}</p>
              {(form.start_date || form.end_date) && (
                <p className="text-sm mt-3 opacity-70">
                  {form.start_date && `Du ${new Date(form.start_date).toLocaleDateString('fr-FR')}`}
                  {form.start_date && form.end_date && ' '}
                  {form.end_date && `au ${new Date(form.end_date).toLocaleDateString('fr-FR')}`}
                </p>
              )}
            </div>
            {!form.is_active && (
              <p className="text-center text-amber-600 mt-4 text-sm">
                ⚠️ L&apos;annonce n&apos;est pas activée et ne sera pas visible sur le site
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
