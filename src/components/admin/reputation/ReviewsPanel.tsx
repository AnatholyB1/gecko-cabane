'use client'

import { useRef, useState } from 'react'
import { ChevronDown, Copy, ExternalLink, Info, Clock } from 'lucide-react'
import {
  buildMonthTable,
  lastMonths,
  totalsEvolution,
  type ClickRow,
  type TotalRow,
} from '@/utils/review-report'
import { REVIEW_WA_TEMPLATES, reviewWhatsAppShareUrl } from '@/utils/review-whatsapp'
import { buildTotalsPayload, latestCollectedGoogle } from '@/utils/review-totals'
import type { ApiResponse, WeeklyKpiRow } from '@/types/database'
import { adminFetch } from '../admin-fetch'
import { useAdminQuery } from '../use-admin-query'
import { useToast } from '../Toast'
import { Badge } from '../Badge'
import { Button, buttonClass } from '../Button'
import { Card } from '../Card'
import { DataTable, type DataTableColumn } from '../DataTable'
import { Input, Select } from '../Input'
import { EmptyState, ErrorState, LoadingState } from '../states'

type StatsBody = ApiResponse<{ clicks: ClickRow[]; totals: TotalRow[] }>
type KpiWeeksBody = ApiResponse<{ weeks: WeeklyKpiRow[] }>

const LOAD_ERROR = 'Impossible de charger les statistiques. Réessayez ou rechargez la page.'
const INVALID_NUMBER = 'Valeur invalide : entrez un nombre entier.'

export function formatTotalDelta(delta: number | null): string {
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
    <div className="adm-rep-tpl">
      <div className="adm-rep-actions">
        <label htmlFor={areaId} className="adm-label">
          {label}
        </label>
        {needsReview ? (
          <Badge tone="warn" icon={Clock}>
            à relire
          </Badge>
        ) : null}
      </div>
      <textarea id={areaId} ref={areaRef} readOnly rows={5} value={text} className="adm-textarea" />
      <div className="adm-rep-actions">
        <Button variant="primary" onClick={copy}>
          <Copy className="i" aria-hidden="true" focusable="false" />
          {copied ? 'Copié' : 'Copier'}
        </Button>
        <a href={reviewWhatsAppShareUrl(text)} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'secondary' })}>
          <ExternalLink className="i" aria-hidden="true" focusable="false" />
          Ouvrir WhatsApp
        </a>
        <span aria-live="polite" className="adm-sr-only">
          {copied ? 'Copié' : ''}
        </span>
      </div>
    </div>
  )
}

type EvolutionRow = ReturnType<typeof totalsEvolution>[number]

export function ReviewsPanel() {
  const months = lastMonths(12)
  const [month, setMonth] = useState(months[0])
  const q = useAdminQuery<StatsBody>('/api/review/stats?months=12')
  // Lecture seule : le total Google vient de la collecte KPI hebdomadaire (REP-03).
  const kpi = useAdminQuery<KpiWeeksBody>('/api/kpi?weeks=12')
  const collectedGoogle = latestCollectedGoogle(kpi.data?.data?.weeks ?? [])
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  // Erreur rattachée au champ en cause (null = erreur du serveur, affichée sous le formulaire).
  const [fieldError, setFieldError] = useState<{ field: 'tripadvisor' | null; message: string } | null>(null)
  // Un brouillon par mois : changer de mois ne détruit pas une saisie non enregistrée.
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const clicks = q.data?.data?.clicks ?? []
  const totals = q.data?.data?.totals ?? []
  const table = buildMonthTable(clicks, month)
  const evolution = totalsEvolution(totals)
  const monthEvolution = evolution.find((e) => e.month === month)

  const stored = (platform: 'google' | 'tripadvisor') => {
    const row = totals.find((t) => t.month.startsWith(`${month}-`) && t.platform === platform)
    return row ? String(row.total_reviews) : ''
  }
  const tripValue = drafts[month] ?? stored('tripadvisor')

  function edit(value: string) {
    setFieldError(null)
    setDrafts((d) => ({ ...d, [month]: value }))
  }

  function changeMonth(next: string) {
    setFieldError(null)
    setMonth(next)
  }

  async function saveTotals(e: React.FormEvent) {
    e.preventDefault()
    setFieldError(null)
    const built = buildTotalsPayload(month, tripValue)
    if (!built.ok) {
      setFieldError({ field: 'tripadvisor', message: built.reason === 'empty' ? 'Entrez le total TripAdvisor du mois.' : INVALID_NUMBER })
      return
    }
    const payload = built.payload
    setSaving(true)
    try {
      await adminFetch('/api/review/stats', { method: 'PUT', json: payload })
      toast.success('Total enregistré.')
      setDrafts((d) => {
        const rest = { ...d }
        delete rest[month]
        return rest
      })
      q.refetch()
    } catch (err) {
      setFieldError({ field: null, message: err instanceof Error && err.message ? err.message : INVALID_NUMBER })
    } finally {
      setSaving(false)
    }
  }

  const loading = q.status === 'loading' && q.data === null
  const failed = q.status === 'error' && q.data === null
  const noData = !loading && !failed && clicks.length === 0 && totals.length === 0

  const evolutionColumns: DataTableColumn<EvolutionRow>[] = [
    { key: 'month', header: 'Mois', role: 'name', cell: (e) => e.month },
    { key: 'google', header: 'Google', role: 'num', cell: (e) => e.google ?? '—' },
    { key: 'gd', header: 'Écart Google', role: 'num', cell: (e) => formatTotalDelta(e.googleDelta) },
    { key: 'ta', header: 'TripAdvisor', role: 'num', cell: (e) => e.tripadvisor ?? '—' },
    { key: 'td', header: 'Écart TripAdvisor', role: 'num', cell: (e) => formatTotalDelta(e.tripadvisorDelta) },
  ]

  type SourceRow = (typeof table.rows)[number]
  const sourceColumns: DataTableColumn<SourceRow>[] = [
    { key: 'source', header: 'Source', role: 'name', cell: (r) => r.label },
    { key: 'visit', header: 'Visites /review', role: 'num', cell: (r) => r.visit },
    { key: 'google', header: 'Clics Google', role: 'num', cell: (r) => r.google },
    { key: 'tripadvisor', header: 'Clics TripAdvisor', role: 'num', cell: (r) => r.tripadvisor },
  ]

  return (
    <div className="adm-rep-stack">
      {loading ? <LoadingState variant="table" /> : null}
      {failed ? <ErrorState title="Chargement impossible" description={LOAD_ERROR} onRetry={q.refetch} /> : null}

      {noData ? (
        <EmptyState
          icon={Info}
          title="Pas encore d'avis enregistrés"
          description="Saisissez le total TripAdvisor du mois ; le total Google est collecté automatiquement chaque semaine."
          action={
            <a href="#totaux" className={buttonClass({ variant: 'primary' })}>
              Saisir le total du mois
            </a>
          }
        />
      ) : null}

      {!loading && !failed && totals.length > 0 ? (
        <section aria-labelledby="rep-synthese-t">
          <div className="adm-rep-head">
            <div>
              <h2 className="adm-rep-h2" id="rep-synthese-t">
                Totaux d&apos;avis
              </h2>
              <p className="adm-rep-lead">Totaux d&apos;avis du mois sélectionné : Google enregistré (collecte automatique, saisies passées comprises), TripAdvisor saisi à la main.</p>
            </div>
          </div>
          <dl className="adm-rep-band" style={{ '--cols': 4 } as React.CSSProperties}>
            <div>
              <dt>Avis Google</dt>
              <dd className="adm-num">{stored('google') || '—'}</dd>
            </div>
            <div>
              <dt>Avis TripAdvisor</dt>
              <dd className="adm-num">{stored('tripadvisor') || '—'}</dd>
            </div>
            <div>
              <dt>Écart Google du mois</dt>
              <dd className="adm-num">{formatTotalDelta(monthEvolution?.googleDelta ?? null)}</dd>
            </div>
            <div>
              <dt>Écart TripAdvisor du mois</dt>
              <dd className="adm-num">{formatTotalDelta(monthEvolution?.tripadvisorDelta ?? null)}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <Card>
        <div className="adm-rep-head">
          <div>
            <h2 className="adm-rep-h2">Suivi mensuel</h2>
            <p className="adm-rep-lead">D&apos;où viennent les visiteurs de la page d&apos;avis.</p>
          </div>
          <Select label="Mois" id="avis-month" value={month} onChange={(e) => changeMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>
        {table.isEmpty ? (
          <div>
            <h3 className="adm-rep-sub">Aucune donnée pour ce mois</h3>
            <p className="adm-muted">Les visites de la page /review apparaîtront ici dès qu&apos;un client ouvrira le lien d&apos;avis.</p>
          </div>
        ) : (
          <>
            <DataTable
              caption={`Visites et clics du mois ${month} par source`}
              scrollLabel="Visites et clics par source, défilement horizontal possible"
              columns={sourceColumns}
              rows={table.rows}
              rowKey={(r) => r.source}
            />
            <p className="adm-rep-hint">
              Total du mois : {table.total.visit} visites, {table.total.google} clics Google, {table.total.tripadvisor} clics TripAdvisor.
            </p>
          </>
        )}
      </Card>

      <Card className="adm-rep-stack">
        <div id="totaux">
          <h2 className="adm-rep-h2" id="totaux-t">Total TripAdvisor du mois (saisie manuelle)</h2>
          <p className="adm-rep-lead">
            Le nombre d&apos;avis affiché sur TripAdvisor, relevé à la main, mois par mois. Le total Google n&apos;est plus saisi ici : il est
            collecté automatiquement par le rapport KPI hebdomadaire.
          </p>
        </div>
        <div>
          <p className="adm-label">Avis Google (collecte automatique, lecture seule)</p>
          <p className="adm-num adm-rep-h2" data-testid="google-collected">
            {collectedGoogle ? collectedGoogle.total : '—'}
          </p>
          <p className="adm-rep-hint">
            {collectedGoogle
              ? `Collecté le ${collectedGoogle.collectedOn} (semaine du ${collectedGoogle.weekStart}), par le rapport KPI du lundi.`
              : 'Pas encore de total collecté : il arrive avec le prochain rapport KPI du lundi.'}
          </p>
        </div>
        <form onSubmit={saveTotals} noValidate aria-labelledby="totaux-t" className="adm-rep-grid3" style={{ alignItems: 'start' }}>
          <Input
            id="total-tripadvisor"
            label="TripAdvisor"
            type="number"
            inputMode="numeric"
            min={0}
            max={100000}
            step={1}
            value={tripValue}
            onChange={(e) => edit(e.target.value)}
            error={fieldError?.field === 'tripadvisor' ? fieldError.message : undefined}
          />
          <div style={{ alignSelf: 'end' }}>
            <Button type="submit" variant="primary" loading={saving} loadingLabel="Enregistrement…">
              Enregistrer le total
            </Button>
          </div>
        </form>
        {fieldError?.field === null ? (
          <p className="adm-rep-hint" role="alert">
            {fieldError.message}
          </p>
        ) : null}
        {evolution.length > 0 ? (
          <DataTable caption="Évolution des totaux d'avis par mois" scrollLabel="Évolution des totaux, défilement horizontal possible" columns={evolutionColumns} rows={evolution} rowKey={(e) => e.month} />
        ) : null}
      </Card>

      <details className="adm-card adm-rep-fold">
        <summary>
          <span className="adm-rep-sub">Message WhatsApp (invitation d&apos;avis)</span>
          <ChevronDown className="i" aria-hidden="true" focusable="false" />
        </summary>
        <div className="adm-rep-cols" style={{ marginTop: 16 }}>
          {REVIEW_WA_TEMPLATES.map((t) => (
            <WhatsAppCard key={t.lang} {...t} />
          ))}
        </div>
      </details>
    </div>
  )
}
