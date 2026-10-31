'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Check, Circle, Lock, Minus, Send, ShieldCheck, Clock, Info, CircleAlert, TriangleAlert } from 'lucide-react'
import { UNAVAILABLE_LABEL, KPI_METRICS } from '@/utils/kpi-format'
import type { ApiResponse, WeeklyKpiRow } from '@/types/database'
import { adminFetch, AdminFetchError } from '../admin-fetch'
import { useAdminQuery } from '../use-admin-query'
import { useConfirm } from '../ConfirmDialog'
import { useToast } from '../Toast'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Card } from '../Card'
import { DataTable, type DataTableColumn } from '../DataTable'
import { Input, Select, Textarea } from '../Input'
import { EmptyState, ErrorState, LoadingState } from '../states'
import { Notice } from './Notice'
import {
  GUARD_PHRASE,
  KEY_METRICS,
  LIVE_PASSAGE_SENTENCE,
  TEST_REPORTS_TARGET,
  criticalAlerts,
  deltaView,
  formatKpiValue,
  formatWeek,
  krabiToday,
  liveConditions,
  reportModeOf,
  savedMessage,
  shouldConfirmAlert,
  submitManualEntry,
  unavailableSources,
  type ManualPayload,
} from './kpi-guard'

type KpiBody = ApiResponse<{ weeks: WeeklyKpiRow[]; testReportsSent: number }>

/** En-têtes courts du tableau (les libellés complets restent dans le détail de la semaine). */
const SHORT_LABELS: Record<string, string> = {
  reservations_new: 'Réservations',
  covers: 'Couverts',
  no_show_rate: 'No-show',
  gsc_clicks: 'Clics Google',
  gsc_position: 'Position Google',
  tripadvisor_rank: 'Rang TripAdvisor',
  google_reviews_total: 'Avis Google',
}

const LOAD_ERROR = 'Impossible de charger les KPI. Réessayez ou rechargez la page.'

function ModeBadge({ mode }: { mode: 'test' | 'live' }) {
  return mode === 'live' ? (
    <Badge tone="ok" icon={ShieldCheck}>
      live
    </Badge>
  ) : (
    <Badge tone="warn" icon={ShieldCheck}>
      TEST
    </Badge>
  )
}

/** Bandeau garde-fou : TOUJOURS visible, même en chargement ou en erreur. Aucun bouton d'envoi ici. */
function GuardBanner({ mode, testReportsSent }: { mode: 'test' | 'live'; testReportsSent: number | null }) {
  return (
    <section className={`adm-rep-guard${mode === 'live' ? ' adm-rep-guard--live' : ''}`} aria-labelledby="rep-guard-t">
      <p className="adm-rep-guard__row">
        <ModeBadge mode={mode} />
        <span className="adm-eyebrow">Mode actuel</span>
      </p>
      <h2 id="rep-guard-t">
        Rapports TEST envoyés : {testReportsSent ?? '—'} / {TEST_REPORTS_TARGET}
      </h2>
      <p>{LIVE_PASSAGE_SENTENCE}</p>
      <p className="adm-rep-guard__rule">{GUARD_PHRASE}</p>
    </section>
  )
}

function SendPanel({ testReportsSent, mode }: { testReportsSent: number | null; mode: 'test' | 'live' }) {
  const conditions = liveConditions(testReportsSent, krabiToday())
  return (
    <Card>
      <div className="adm-rep-head">
        <div>
          <h2 className="adm-rep-h2">Envoi du rapport</h2>
          <p className="adm-rep-lead">Rien n&apos;est envoyé en ouvrant cette page. Chaque envoi demande une action et une confirmation.</p>
        </div>
      </div>
      <div className="adm-rep-cols">
        <div className="adm-rep-lock">
          <h3 className="adm-rep-sub">Rapport de la semaine</h3>
          <p className="adm-muted">
            Le rapport est envoyé par la collecte du lundi, au propriétaire uniquement tant que le mode est TEST (sujet préfixé
            [TEST]). Cette page ne contient aucun bouton d&apos;envoi de rapport.
          </p>
          <p className="adm-muted">
            Le seul email que cette page peut déclencher est l&apos;alerte d&apos;une note minimale de 3 ou moins, après confirmation (voir la
            saisie manuelle).
          </p>
        </div>
        <div className="adm-rep-lock">
          <h3 className="adm-rep-sub adm-rep-guard__row">
            Passage en live{' '}
            {mode === 'live' ? (
              <Badge tone="ok" icon={ShieldCheck}>
                live
              </Badge>
            ) : (
              <Badge tone="neutral" icon={Lock}>
                live verrouillé
              </Badge>
            )}
          </h3>
          <ul className="adm-rep-checks">
            {conditions.map((c) => (
              <li key={c.id} className={c.done ? 'done' : undefined}>
                {c.done ? (
                  <Check className="i" aria-hidden="true" focusable="false" />
                ) : (
                  <Circle className="i" aria-hidden="true" focusable="false" />
                )}
                <span>
                  <strong>{c.label}</strong> : {c.detail}
                </span>
              </li>
            ))}
          </ul>
          <p className="adm-rep-hint">Le mode live n&apos;est jamais activable depuis cette page : il se règle côté serveur, après accord du propriétaire.</p>
        </div>
      </div>
    </Card>
  )
}

function DeltaCell({ cur, prev, kind, betterWhen }: { cur: number | null; prev: number | null; kind: Parameters<typeof deltaView>[2]; betterWhen: 'up' | 'down' }) {
  const d = deltaView(cur, prev, kind, betterWhen)
  const Icon = d.direction === 'up' ? ArrowUp : d.direction === 'down' ? ArrowDown : Minus
  return (
    <span className={`adm-rep-delta ${d.tone === 'good' ? 'good' : d.tone === 'bad' ? 'bad' : ''}`}>
      <Icon className="i i-sm" aria-hidden="true" focusable="false" />
      {d.text}
      {d.tone === 'good' ? <span className="adm-sr-only">, favorable</span> : d.tone === 'bad' ? <span className="adm-sr-only">, défavorable</span> : null}
    </span>
  )
}

function ManualEntryForm({ row, onSaved }: { row: WeeklyKpiRow; onSaved: (alerted: boolean) => void }) {
  const confirm = useConfirm()
  const [total, setTotal] = useState(row.google_reviews_total?.toString() ?? '')
  const [newReviews, setNewReviews] = useState(row.google_new_reviews?.toString() ?? '')
  const [minRating, setMinRating] = useState(row.google_min_rating?.toString() ?? '')
  const [note, setNote] = useState(row.manual_note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toInt = (v: string): number | null => (v.trim() === '' ? null : Number(v))
  const minValue = toInt(minRating)
  const willAlert = shouldConfirmAlert(row.google_min_rating, minValue)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload: ManualPayload = {
      week_start: row.week_start,
      google_reviews_total: toInt(total),
      google_new_reviews: toInt(newReviews),
      google_min_rating: minValue,
      manual_note: note,
    }
    try {
      const result = await submitManualEntry({
        payload,
        previousMinRating: row.google_min_rating,
        confirm: () =>
          confirm({
            title: "Enregistrer et envoyer l'alerte ?",
            tone: 'default',
            confirmLabel: "Enregistrer et envoyer l'alerte",
            cancelLabel: 'Annuler',
            description: (
              <>
                <span>
                  Une note minimale de {minValue} envoie immédiatement un email d&apos;alerte au propriétaire. Vous pouvez aussi enregistrer en
                  choisissant une note supérieure à 3.
                </span>
                <dl className="adm-rep-facts">
                  <div>
                    <dt>Semaine</dt>
                    <dd>{formatWeek(row)}</dd>
                  </div>
                  <div>
                    <dt>Note minimale</dt>
                    <dd>{minValue}</dd>
                  </div>
                  <div>
                    <dt>Destinataire</dt>
                    <dd>Adresse du propriétaire</dd>
                  </div>
                </dl>
              </>
            ),
          }),
        save: async (p) => {
          try {
            const body = await adminFetch<ApiResponse<{ alerted: boolean }>>('/api/kpi', { method: 'PUT', json: p })
            return { alerted: Boolean(body.data?.alerted) }
          } catch (err) {
            if (err instanceof AdminFetchError && err.status === 400) throw new Error('Saisie invalide : vérifiez les valeurs.')
            throw new Error('Enregistrement impossible. Réessayez.')
          }
        },
      })
      if (result.status === 'saved') onSaved(result.alerted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible. Réessayez.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="adm-rep-stack" aria-labelledby="rep-saisie-t">
      <div>
        <h3 className="adm-rep-sub" id="rep-saisie-t">
          Saisie manuelle de la semaine
        </h3>
        <p className="adm-rep-lead">Avis Google (hors collecte automatique). Facultatif : le rapport part sans cette saisie.</p>
      </div>
      <div className="adm-rep-grid3">
        <Input label="Total d'avis Google" type="number" inputMode="numeric" min={0} max={100000} value={total} onChange={(e) => setTotal(e.target.value)} />
        <Input label="Nouveaux avis de la semaine" type="number" inputMode="numeric" min={0} max={1000} value={newReviews} onChange={(e) => setNewReviews(e.target.value)} />
        <Select label="Note minimale reçue" value={minRating} onChange={(e) => setMinRating(e.target.value)}>
          <option value="">—</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </div>
      {willAlert ? (
        <Notice tone="warn" icon={Send} title="Une note de 3 ou moins déclenche un email d'alerte immédiat au propriétaire.">
          Vous devrez le confirmer avant l&apos;enregistrement.
        </Notice>
      ) : null}
      <Textarea label="Note libre (500 caractères maximum)" maxLength={500} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      {error ? (
        <Notice tone="err" role="alert" title="Enregistrement refusé">
          {error}
        </Notice>
      ) : null}
      <div className="adm-rep-actions">
        <Button type="submit" variant="primary" loading={saving} loadingLabel="Enregistrement…">
          Enregistrer la saisie
        </Button>
      </div>
    </form>
  )
}

export function KpiPanel() {
  const q = useAdminQuery<KpiBody>('/api/kpi?weeks=12')
  const toast = useToast()
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)

  const weeks = q.data?.data?.weeks ?? []
  const testReportsSent = q.status === 'ready' ? (q.data?.data?.testReportsSent ?? 0) : null
  const mode = reportModeOf(weeks)

  const selectedIndex = Math.max(0, weeks.findIndex((w) => w.week_start === selectedWeek))
  const selected: WeeklyKpiRow | undefined = weeks[selectedIndex]
  const previous: WeeklyKpiRow | undefined = weeks[selectedIndex + 1]
  const critical = criticalAlerts(selected)

  function handleSaved(alerted: boolean) {
    q.refetch()
    toast.success(savedMessage(alerted))
  }

  const columns: DataTableColumn<WeeklyKpiRow>[] = [
    {
      key: 'week',
      header: 'Semaine',
      role: 'name',
      cell: (w) => {
        const isSelected = w.week_start === selected?.week_start
        return (
          <span>
            <button type="button" className="adm-rep-weekbtn" aria-pressed={isSelected} onClick={() => setSelectedWeek(w.week_start)}>
              {formatWeek(w)}
            </button>
            {w.gsc_partial ? (
              <>
                {' '}
                <Badge tone="warn" icon={Clock}>
                  partiel
                </Badge>
              </>
            ) : null}
          </span>
        )
      },
    },
    ...KEY_METRICS.map<DataTableColumn<WeeklyKpiRow>>((m) => ({
      key: String(m.key),
      header: SHORT_LABELS[String(m.key)] ?? m.label,
      role: 'num',
      cell: (w) => formatKpiValue(w[m.key] as number | null, m.kind),
    })),
    {
      key: 'missing',
      header: 'Sources non disponibles',
      role: 'text',
      cell: (w) => {
        const missing = unavailableSources(w)
        return missing.length > 0 ? missing.join(', ') : '—'
      },
    },
  ]

  return (
    <div className="adm-rep-stack">
      {critical.length > 0 ? (
        <Notice tone="err" title="Alerte critique" id="rep-critical">
          {critical.map((a) => a.message).join(' · ')} <a href="#rep-detail">Voir le détail de la semaine</a>
        </Notice>
      ) : null}

      {q.status === 'error' && q.data !== null ? (
        <Notice tone="err" role="alert" title="Données non actualisées">
          {LOAD_ERROR}
        </Notice>
      ) : null}

      <GuardBanner mode={mode} testReportsSent={testReportsSent} />
      <SendPanel testReportsSent={testReportsSent} mode={mode} />

      <section aria-labelledby="rep-hist-t">
        <div className="adm-rep-head">
          <div>
            <h2 className="adm-rep-h2" id="rep-hist-t">
              KPI hebdomadaires
            </h2>
            <p className="adm-rep-lead">
              Historique semaine par semaine (12 dernières semaines). Une valeur absente s&apos;affiche « {UNAVAILABLE_LABEL} », jamais 0.
            </p>
          </div>
        </div>
        {q.status === 'loading' && q.data === null ? (
          <LoadingState variant="table" />
        ) : q.status === 'error' && q.data === null ? (
          <ErrorState title="Chargement impossible" description={LOAD_ERROR} onRetry={q.refetch} />
        ) : weeks.length === 0 ? (
          <EmptyState
            icon={Info}
            title="Aucune semaine enregistrée"
            description="Le premier relevé apparaîtra ici après la collecte du lundi."
          />
        ) : (
          <>
            <DataTable
              caption="KPI par semaine (7 indicateurs clés)"
              scrollLabel="KPI par semaine, défilement horizontal possible"
              columns={columns}
              rows={weeks}
              rowKey={(w) => w.week_start}
            />
            <p className="adm-rep-hint">Les 15 indicateurs figurent dans le détail de chaque semaine.</p>
          </>
        )}
      </section>

      {selected ? (
        <Card className="adm-rep-stack">
          <div>
            <h2 className="adm-rep-h2" id="rep-detail" tabIndex={-1}>
              Semaine du {formatWeek(selected)}
            </h2>
          </div>

          <div>
            <h3 className="adm-rep-sub">
              {previous ? `Comparaison à la semaine précédente (${previous.week_start})` : 'Comparaison'}
            </h3>
            {previous ? (
              <ul className="adm-rep-cmp">
                {KPI_METRICS.map((m) => (
                  <li key={m.key}>
                    <span>{m.label}</span>
                    <span className="num">
                      <strong>{formatKpiValue(selected[m.key] as number | null, m.kind)}</strong>
                      <DeltaCell cur={selected[m.key] as number | null} prev={previous[m.key] as number | null} kind={m.kind} betterWhen={m.betterWhen} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="adm-muted">première semaine</p>
            )}
          </div>

          <div>
            <h3 className="adm-rep-sub">Alertes</h3>
            {selected.alerts && selected.alerts.length > 0 ? (
              <ul className="adm-rep-alerts" style={{ marginTop: 8 }}>
                {selected.alerts.map((a, i) => (
                  <li key={`${a.code}-${i}`}>
                    {a.severity === 'critical' ? (
                      <Notice tone="err" icon={CircleAlert} title="Critique">
                        {a.message}
                      </Notice>
                    ) : (
                      <Notice tone="warn" icon={TriangleAlert} title="À surveiller">
                        {a.message}
                      </Notice>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="adm-muted">Aucune alerte cette semaine.</p>
            )}
          </div>

          <div>
            <h3 className="adm-rep-sub">Lecture et actions</h3>
            {selected.narrative ? (
              <div className="adm-rep-stack" style={{ marginTop: 8 }}>
                {selected.narrative.source === 'fallback' ? (
                  <p>
                    <Badge tone="neutral" icon={Info}>
                      texte de repli sans IA
                    </Badge>
                  </p>
                ) : null}
                <div className="adm-rep-cols">
                  <div>
                    <h4 className="adm-rep-sub" style={{ fontSize: 'var(--adm-text-base)' }}>
                      Lecture
                    </h4>
                    <ul className="adm-rep-list">
                      {selected.narrative.lecture.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="adm-rep-sub" style={{ fontSize: 'var(--adm-text-base)' }}>
                      Actions recommandées
                    </h4>
                    <ul className="adm-rep-list">
                      {selected.narrative.actions.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p className="adm-muted">Aucune lecture enregistrée pour cette semaine.</p>
            )}
          </div>

          <hr className="adm-rep-rule" />
          <ManualEntryForm key={selected.week_start} row={selected} onSaved={handleSaved} />
        </Card>
      ) : null}
    </div>
  )
}
