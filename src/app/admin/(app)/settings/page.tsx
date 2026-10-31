'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import type { RestaurantSetting } from '@/types/database'

const SETTING_META: Record<string, { label: string; description: string; unit: string; min: number; max: number }> = {
  table_block_duration_minutes: {
    label: 'Durée d\'occupation d\'un créneau',
    description: 'Temps pendant lequel une réservation occupe de la capacité après son heure de début (repas + marge).',
    unit: 'minutes',
    min: 30,
    max: 480,
  },
  max_covers: {
    label: 'Couverts maximum par service',
    description: 'Nombre maximum de clients pouvant être accueillis simultanément (vérification à la réservation en ligne).',
    unit: 'couverts',
    min: 1,
    max: 200,
  },
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<RestaurantSetting[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      if (data.data) {
        setSettings(data.data)
        const vals: Record<string, string> = {}
        for (const s of data.data as RestaurantSetting[]) vals[s.key] = s.value
        setValues(vals)
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur de chargement' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  async function save() {
    setSaving(true)
    try {
      const body: Record<string, number> = {}
      for (const [key, val] of Object.entries(values)) {
        body[key] = parseInt(val, 10)
      }
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setMessage({ type: 'error', text: data.error }); return }
      setMessage({ type: 'success', text: 'Paramètres enregistrés' })
      await fetchSettings()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Capacité" description="Couverts maximum et durée d'occupation d'un créneau." />

      <div className="max-w-4xl mx-auto py-8">
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right">✕</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--primary) mx-auto" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Reservation capacity settings */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="bg-(--accent-light) px-6 py-4 border-b border-amber-100">
                <h2 className="text-lg font-bold text-(--primary-dark)">Capacité et créneaux</h2>
              </div>
              <div className="p-6 space-y-6">
                {settings
                  .filter((s) => SETTING_META[s.key])
                  .map((s) => {
                    const meta = SETTING_META[s.key]
                    const val  = values[s.key] ?? s.value

                    return (
                      <div key={s.key} className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <label className="font-semibold text-(--primary-dark) text-sm">
                            {meta.label}
                          </label>
                          <p className="text-xs text-(--warm-gray) mt-0.5">{meta.description}</p>
                          {s.description && (
                            <p className="text-xs text-gray-400 italic mt-0.5">{s.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <input
                            type="range"
                            min={meta.min}
                            max={meta.max}
                            step={meta.unit === 'minutes' ? 15 : 1}
                            value={val}
                            onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
                            className="w-32 accent-(--primary)"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={meta.min}
                              max={meta.max}
                              value={val}
                              onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
                              className="w-20 px-2 py-1 border rounded-lg text-sm text-center font-mono"
                            />
                            <span className="text-xs text-(--warm-gray) w-16">{meta.unit}</span>
                          </div>
                        </div>
                      </div>
                    )

                  })}
              </div>
            </div>

            {/* Info block */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong>ℹ️ Note :</strong> La durée d&apos;occupation est calculée depuis l&apos;heure de début de la
              réservation. Par exemple, une réservation à 19h00 avec 120 min d&apos;occupation compte dans la
              capacité jusqu&apos;à 21h00. Les couverts des réservations qui se chevauchent sur ce créneau
              sont additionnés et ne peuvent pas dépasser le nombre de couverts maximum.
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="px-8 py-3 bg-(--primary) text-white rounded-xl font-medium hover:bg-(--primary-dark) disabled:opacity-50 transition-colors"
            >
              {saving ? 'Enregistrement…' : '💾 Enregistrer les paramètres'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
