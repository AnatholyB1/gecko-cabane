'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  buildMonthTable,
  lastMonths,
  totalsEvolution,
  type ClickRow,
  type TotalRow,
} from '@/utils/review-report'
import { REVIEW_WA_TEMPLATES, reviewWhatsAppShareUrl } from '@/utils/review-whatsapp'

type Message = { type: 'success' | 'error'; text: string } | null

function formatDelta(delta: number | null): string {
  if (delta === null) return '—'
  if (delta === 0) return '0'
  return delta > 0 ? `+${delta}` : `${delta}`
}

function WhatsAppCard({ lang, label, needsReview, text }: (typeof REVIEW_WA_TEMPLATES)[number]) {
  const [copied, setCopied] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const areaId = `wa-text-${lang}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      areaRef.current?.focus()
      areaRef.current?.select()
    }
  }

  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <label htmlFor={areaId} className="font-bold text-(--primary-dark)">
          {label}
        </label>
        {needsReview && (
          <span className="bg-amber-100 text-amber-900 px-2 rounded text-sm">à relire</span>
        )}
      </div>
      <textarea
        id={areaId}
        ref={areaRef}
        readOnly
        rows={5}
        value={text}
        className="w-full px-3 py-2 border rounded-lg text-sm"
      />
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <button
          type="button"
          onClick={copy}
          className="px-4 py-2 rounded-lg bg-(--primary) text-white cursor-pointer"
        >
          {copied ? 'Copié' : 'Copier'}
        </button>
        <a
          href={reviewWhatsAppShareUrl(text)}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg border border-(--tropical) text-(--tropical)"
        >
          Ouvrir WhatsApp
        </a>
        <span aria-live="polite" className="sr-only">
          {copied ? 'Copié' : ''}
        </span>
      </div>
    </div>
  )
}

export default function AdminAvisPage() {
  const months = lastMonths(12)
  const [month, setMonth] = useState(months[0])
  const [clicks, setClicks] = useState<ClickRow[]>([])
  const [totals, setTotals] = useState<TotalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [message, setMessage] = useState<Message>(null)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<{ month: string; google: string; tripadvisor: string } | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/review/stats?months=12')
      const json = await res.json()
      if (!res.ok || !json.data) throw new Error('load failed')
      setClicks(json.data.clicks)
      setTotals(json.data.totals)
      setLoadError(false)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const table = buildMonthTable(clicks, month)
  const evolution = totalsEvolution(totals)

  const stored = (platform: 'google' | 'tripadvisor') => {
    const row = totals.find((t) => t.month.startsWith(`${month}-`) && t.platform === platform)
    return row ? String(row.total_reviews) : ''
  }
  const googleValue = draft?.month === month ? draft.google : stored('google')
  const tripValue = draft?.month === month ? draft.tripadvisor : stored('tripadvisor')

  function edit(field: 'google' | 'tripadvisor', value: string) {
    setDraft({ month, google: googleValue, tripadvisor: tripValue, [field]: value })
  }

  async function saveTotals(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const payload: Record<string, unknown> = { month }
    if (googleValue !== '') payload.google = Number(googleValue)
    if (tripValue !== '') payload.tripadvisor = Number(tripValue)
    try {
      const res = await fetch('/api/review/stats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: json.error ?? 'Valeur invalide : entrez un nombre entier.' })
      } else {
        setMessage({ type: 'success', text: 'Totaux enregistrés.' })
        setDraft(null)
        await load()
      }
    } catch {
      setMessage({ type: 'error', text: 'Valeur invalide : entrez un nombre entier.' })
    } finally {
      setSaving(false)
    }
  }

  const num = 'px-3 py-2 text-right tabular-nums'

  return (
    <div className="min-h-screen bg-(--background)">
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div>
          <Link href="/admin" prefetch={false} className="text-sm text-(--tropical)">
            ← Tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-(--primary-dark) mt-2">Avis</h1>
          <p className="text-(--warm-gray)">
            D&apos;où viennent les visiteurs de la page d&apos;avis, et comment évoluent vos avis Google et
            TripAdvisor.
          </p>
        </div>

        {loading ? (
          <div aria-busy="true" className="text-(--warm-gray)">
            Chargement…
          </div>
        ) : loadError ? (
          <div className="p-4 rounded-lg bg-red-100 text-red-800" role="alert">
            Impossible de charger les statistiques. Réessayez ou rechargez la page.
          </div>
        ) : null}

        <section className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-(--primary-dark)">Suivi mensuel</h2>
            <div className="flex items-center gap-2">
              <label htmlFor="avis-month" className="text-sm">
                Mois
              </label>
              <select
                id="avis-month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {table.isEmpty ? (
            <div>
              <h3 className="font-bold">Aucune donnée pour ce mois</h3>
              <p className="text-(--warm-gray)">
                Les visites de la page /review apparaîtront ici dès qu&apos;un client ouvrira le lien d&apos;avis.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Visites et clics du mois {month} par source</caption>
                <thead>
                  <tr className="border-b">
                    <th scope="col" className="px-3 py-2 text-left">Source</th>
                    <th scope="col" className={num}>Visites /review</th>
                    <th scope="col" className={num}>Clics Google</th>
                    <th scope="col" className={num}>Clics TripAdvisor</th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((r) => (
                    <tr key={r.source} className="border-b">
                      <th scope="row" className="px-3 py-2 text-left font-normal">{r.label}</th>
                      <td className={num}>{r.visit}</td>
                      <td className={num}>{r.google}</td>
                      <td className={num}>{r.tripadvisor}</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <th scope="row" className="px-3 py-2 text-left">Total</th>
                    <td className={num}>{table.total.visit}</td>
                    <td className={num}>{table.total.google}</td>
                    <td className={num}>{table.total.tripadvisor}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-(--primary-dark) mb-4">Totaux du mois (saisie manuelle)</h2>
          {message && (
            <div
              role={message.type === 'error' ? 'alert' : 'status'}
              className={`mb-4 p-3 rounded-lg ${
                message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}
          <form onSubmit={saveTotals} className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="total-google" className="block text-sm mb-1">Google</label>
              <input
                id="total-google"
                type="number"
                min={0}
                max={100000}
                step={1}
                value={googleValue}
                onChange={(e) => edit('google', e.target.value)}
                className="px-3 py-2 border rounded-lg w-32"
              />
            </div>
            <div>
              <label htmlFor="total-tripadvisor" className="block text-sm mb-1">TripAdvisor</label>
              <input
                id="total-tripadvisor"
                type="number"
                min={0}
                max={100000}
                step={1}
                value={tripValue}
                onChange={(e) => edit('tripadvisor', e.target.value)}
                className="px-3 py-2 border rounded-lg w-32"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-(--primary) text-white cursor-pointer disabled:opacity-50"
            >
              Enregistrer les totaux
            </button>
          </form>
          {evolution.length > 0 && (
            <ul className="mt-6 space-y-1 text-sm">
              {evolution.map((e) => (
                <li key={e.month} className="tabular-nums">
                  <strong>{e.month}</strong> — Google : {e.google ?? '—'} ({formatDelta(e.googleDelta)}) ·
                  TripAdvisor : {e.tripadvisor ?? '—'} ({formatDelta(e.tripadvisorDelta)})
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-(--primary-dark)">Message WhatsApp (invitation d&apos;avis)</h2>
          {REVIEW_WA_TEMPLATES.map((t) => (
            <WhatsAppCard key={t.lang} {...t} />
          ))}
        </section>
      </main>
    </div>
  )
}
