'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { KPI_METRICS, UNAVAILABLE_LABEL, formatDelta, formatKpiValue } from '@/utils/kpi-format'
import type { KpiSourceKey, WeeklyKpiRow } from '@/types/database'

type Message = { type: 'success' | 'error'; text: string } | null

const SOURCE_LABELS: Record<KpiSourceKey, string> = {
  reservations: 'Réservations',
  newsletter: 'Newsletter',
  review_clicks: 'Clics /review',
  search_console: 'Search Console',
  tripadvisor: 'TripAdvisor',
  manual_reviews: 'Avis saisis',
}

const TEST_REPORTS_TARGET = 2

function unavailableSources(row: WeeklyKpiRow): string[] {
  return Object.entries(row.sources_status ?? {})
    .filter(([, state]) => state === 'unavailable')
    .map(([key]) => SOURCE_LABELS[key as KpiSourceKey] ?? key)
}

function formatWeek(row: WeeklyKpiRow): string {
  return `${row.week_start} → ${row.week_end}`
}

export default function AdminKpiPage() {
  const [weeks, setWeeks] = useState<WeeklyKpiRow[]>([])
  const [testReportsSent, setTestReportsSent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<Message>(null)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/kpi?weeks=12')
        const json = await res.json()
        if (!res.ok || !json.data) throw new Error('load failed')
        if (cancelled) return
        setWeeks(json.data.weeks)
        setTestReportsSent(json.data.testReportsSent)
        setMessage(null)
      } catch {
        if (!cancelled) {
          setMessage({
            type: 'error',
            text: 'Impossible de charger les KPI. Réessayez ou rechargez la page.',
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedIndex = Math.max(
    0,
    weeks.findIndex((w) => w.week_start === selectedWeek)
  )
  const selected: WeeklyKpiRow | undefined = weeks[selectedIndex]
  const previous: WeeklyKpiRow | undefined = weeks[selectedIndex + 1]

  const cell = 'px-3 py-2 text-right tabular-nums whitespace-nowrap'

  return (
    <div className="min-h-screen bg-(--background)">
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div>
          <Link href="/admin" prefetch={false} className="text-sm text-(--tropical)">
            ← Tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-(--primary-dark) mt-2">KPI hebdomadaires</h1>
          <p className="text-(--warm-gray)">
            Historique semaine par semaine (12 dernières semaines). Une valeur absente s&apos;affiche «{' '}
            {UNAVAILABLE_LABEL} », jamais 0.
          </p>
        </div>

        {loading && (
          <div aria-busy="true" className="text-(--warm-gray)">
            Chargement…
          </div>
        )}

        {message && (
          <div
            role={message.type === 'error' ? 'alert' : 'status'}
            className={`p-4 rounded-lg ${
              message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <section className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-(--warm-gold)">
          <h2 className="text-lg font-bold text-(--primary-dark)">
            Rapports TEST envoyés : {testReportsSent} / {TEST_REPORTS_TARGET}
          </h2>
          <p className="text-(--warm-gray) text-sm mt-1">
            Passage en live : décision du propriétaire après {TEST_REPORTS_TARGET} rapports TEST vérifiés
            (au plus tôt mi-novembre 2026).
          </p>
        </section>

        {!loading && !message && weeks.length === 0 && (
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="font-bold text-(--primary-dark)">Aucune semaine enregistrée</h2>
            <p className="text-(--warm-gray)">
              Le premier relevé apparaîtra ici après la collecte du lundi.
            </p>
          </section>
        )}

        {weeks.length > 0 && (
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-(--primary-dark) mb-4">Historique</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">KPI par semaine</caption>
                <thead>
                  <tr className="border-b text-left">
                    <th scope="col" className="px-3 py-2">
                      Semaine
                    </th>
                    {KPI_METRICS.map((m) => (
                      <th key={m.key} scope="col" className="px-3 py-2 text-right">
                        {m.label}
                      </th>
                    ))}
                    <th scope="col" className="px-3 py-2">
                      Sources non disponibles
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((w) => {
                    const missing = unavailableSources(w)
                    const isSelected = w.week_start === selected?.week_start
                    return (
                      <tr
                        key={w.week_start}
                        className={`border-b ${isSelected ? 'bg-(--accent-light)' : ''}`}
                      >
                        <th scope="row" className="px-3 py-2 text-left whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedWeek(w.week_start)}
                            aria-pressed={isSelected}
                            className="text-(--tropical) underline cursor-pointer"
                          >
                            {formatWeek(w)}
                          </button>
                          {w.gsc_partial && (
                            <span className="ml-2 bg-amber-100 text-amber-900 px-2 rounded text-xs">
                              partiel
                            </span>
                          )}
                        </th>
                        {KPI_METRICS.map((m) => (
                          <td key={m.key} className={cell}>
                            {formatKpiValue(w[m.key] as number | null, m.kind)}
                          </td>
                        ))}
                        <td className="px-3 py-2">{missing.length > 0 ? missing.join(', ') : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {selected && (
          <section className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-(--primary-dark)">
              Semaine du {formatWeek(selected)}
            </h2>

            <div>
              <h3 className="font-bold mb-2">
                {previous ? `Comparaison à la semaine précédente (${previous.week_start})` : 'Comparaison'}
              </h3>
              {previous ? (
                <ul className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  {KPI_METRICS.map((m) => (
                    <li key={m.key} className="flex justify-between border-b py-1">
                      <span>{m.label}</span>
                      <span className="tabular-nums">
                        {formatKpiValue(selected[m.key] as number | null, m.kind)}{' '}
                        <span className="text-(--warm-gray)">
                          (
                          {formatDelta(
                            selected[m.key] as number | null,
                            previous[m.key] as number | null,
                            m.kind
                          )}
                          )
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-(--warm-gray)">première semaine</p>
              )}
            </div>

            <div>
              <h3 className="font-bold mb-2">Alertes</h3>
              {selected.alerts && selected.alerts.length > 0 ? (
                <ul className="space-y-2">
                  {selected.alerts.map((a, i) => (
                    <li
                      key={`${a.code}-${i}`}
                      className={`p-3 rounded-lg ${
                        a.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {a.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-(--warm-gray)">Aucune alerte cette semaine.</p>
              )}
            </div>

            <div>
              <h3 className="font-bold mb-2">Lecture et actions</h3>
              {selected.narrative ? (
                <div className="space-y-3">
                  {selected.narrative.source === 'fallback' && (
                    <p className="text-sm text-(--warm-gray)">texte de repli sans IA</p>
                  )}
                  <div>
                    <h4 className="text-sm font-bold">Lecture</h4>
                    <ul className="list-disc pl-5">
                      {selected.narrative.lecture.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Actions recommandées</h4>
                    <ul className="list-disc pl-5">
                      {selected.narrative.actions.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-(--warm-gray)">Aucune lecture enregistrée pour cette semaine.</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
