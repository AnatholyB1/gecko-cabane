'use client'

import { useState, useSyncExternalStore } from 'react'
import { Inbox, MessageCircle, Phone, Plus, Search, Trash2 } from 'lucide-react'
import { Badge, StatusBadge } from '@/components/admin/Badge'
import { Button, buttonClass } from '@/components/admin/Button'
import { Card, CardHeader } from '@/components/admin/Card'
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable'
import { Input, Select, Textarea } from '@/components/admin/Input'
import { PageHeader } from '@/components/admin/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/admin/states'
import { useConfirm } from '@/components/admin/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'
import { AdminFetchError } from '@/components/admin/admin-fetch'
import { RESERVATION_STATUS_BADGES } from '@/components/admin/status'
import type { ReservationStatus } from '@/types/database'

type Row = { id: number; time: string; name: string; party: number; status: ReservationStatus; action: string }

// Exemples : aucune donnée réelle.
const ROWS: Row[] = [
  { id: 1, time: '12:00', name: 'Martin L.', party: 4, status: 'pending', action: 'Confirmer' },
  { id: 2, time: '19:15', name: 'Schmidt K.', party: 5, status: 'confirmed', action: 'Terminer' },
  { id: 3, time: '20:00', name: 'Andersson E.', party: 2, status: 'no_show', action: 'Rétablir' },
]

const COLUMNS: DataTableColumn<Row>[] = [
  { key: 'time', header: 'Heure', role: 'time', cell: (r) => r.time },
  { key: 'name', header: 'Client', role: 'name', cell: (r) => r.name },
  { key: 'party', header: 'Couverts', role: 'num', cell: (r) => r.party },
  { key: 'status', header: 'Statut', role: 'status', cell: (r) => <StatusBadge status={r.status} /> },
  {
    key: 'actions',
    header: 'Actions',
    role: 'actions',
    cell: (r) => (
      <>
        <Button size="sm" variant={r.status === 'pending' ? 'primary' : r.status === 'no_show' ? 'ghost' : 'secondary'}>
          {r.action}
        </Button>
        <a className={buttonClass({ size: 'sm', iconOnly: true })} href="#table" aria-label={`Appeler ${r.name}`}>
          <Phone className="i i-sm" aria-hidden="true" focusable="false" />
        </a>
        <a className={buttonClass({ size: 'sm', iconOnly: true })} href="#table" aria-label={`WhatsApp ${r.name}`}>
          <MessageCircle className="i i-sm" aria-hidden="true" focusable="false" />
        </a>
      </>
    ),
  },
]

const SWATCHES: { name: string; token: string; hex: string }[] = [
  { name: 'bg', token: '--adm-bg', hex: '#F7F4EC' },
  { name: 'surface', token: '--adm-surface', hex: '#FFFFFF' },
  { name: 'surface-2', token: '--adm-surface-2', hex: '#F1ECE0' },
  { name: 'line', token: '--adm-line', hex: '#E2DCCB' },
  { name: 'ink', token: '--adm-ink', hex: '#1B2A22' },
  { name: 'muted', token: '--adm-muted', hex: '#5E6B62' },
  { name: 'brand', token: '--adm-brand', hex: '#1F3D2F' },
  { name: 'accent (décor)', token: '--adm-accent', hex: '#B08D3C' },
  { name: 'accent-text', token: '--adm-accent-text', hex: '#7A5C16' },
  { name: 'ok', token: '--adm-ok', hex: '#2F6B45' },
  { name: 'warn', token: '--adm-warn', hex: '#8A5A00' },
  { name: 'danger', token: '--adm-danger', hex: '#A33A2B' },
  { name: 'info', token: '--adm-info', hex: '#2F5F7A' },
]

function subscribeResize(cb: () => void) {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}
const getWidth = () => String(window.innerWidth)
const getServerWidth = () => '—'

export function KitClient() {
  const viewport = useSyncExternalStore(subscribeResize, getWidth, getServerWidth)
  const confirm = useConfirm()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [lastChoice, setLastChoice] = useState<string>('aucune')

  function fakeSave() {
    setSaving(true)
    setTimeout(() => setSaving(false), 1600)
  }

  async function tryDelete() {
    const ok = await confirm({
      title: 'Supprimer ce plat ?',
      description: '« Magret de canard, sauce tamarin » sera retiré de la carte publique. Cette action est définitive.',
      confirmLabel: 'Supprimer',
      cancelLabel: 'Garder le plat',
    })
    setLastChoice(ok ? 'Supprimer' : 'Garder le plat')
  }

  async function tryCancelReservation() {
    const ok = await confirm({
      title: 'Annuler cette réservation ?',
      description: (
        <>
          Martin L., 4 couverts à <span className="adm-num">12:00</span>. Le client recevra un e-mail d’annulation.
        </>
      ),
      confirmLabel: 'Annuler la réservation',
      cancelLabel: 'Garder',
    })
    setLastChoice(ok ? 'Annuler la réservation' : 'Garder')
  }

  return (
    <div className="adm-kit" id="kit">
      <header className="k-top">
        <p className="adm-eyebrow">Kit interne · phase 11</p>
        <h1 className="adm-display">Système de design de l’admin</h1>
        <p className="adm-muted" style={{ maxWidth: '60ch' }}>
          Primitives, états et jetons <code>--adm-*</code>. Les données de ce kit sont des exemples. Redimensionner pour relire à 360, 768, 1024 et 1440 px.
        </p>
        <p className="k-vp">
          Largeur actuelle : <b className="adm-num" data-testid="viewport-width">{viewport}</b> px
        </p>
      </header>

      <section className="k-sec" id="tokens" aria-labelledby="t-tokens">
        <h2 id="t-tokens">Couleurs et typographie</h2>
        <p className="adm-muted">Ivoire chaud, vert jungle, laiton en touche rare (filets, jamais du texte). Les statuts portent toujours une icône et un libellé.</p>
        <div className="k-sw">
          {SWATCHES.map((s) => (
            <div className="k-chip" key={s.token}>
              <i style={{ background: `var(${s.token})` }} />
              <div>
                <b>{s.name}</b>
                <br />
                <code>{s.hex}</code>
              </div>
            </div>
          ))}
        </div>
        <hr className="adm-rule adm-rule--brass" style={{ margin: '32px 0 24px' }} />
        <div className="k-grid two k-type">
          <div>
            <p className="k-cap">Titre de page : Cormorant Garamond 600 (titres de page uniquement)</p>
            <p className="adm-display" style={{ fontSize: 'var(--adm-text-3xl)' }}>Réservations du jour</p>
            <p className="k-cap" style={{ marginTop: 16 }}>Section : Inter 600 / 18</p>
            <p className="adm-h2">Arrivées par heure</p>
          </div>
          <div>
            <p className="k-cap">Corps Inter 400 / 16, aide et tableau 14, chiffres tabulaires</p>
            <p>Table de 4 couverts, terrasse, anniversaire.</p>
            <p className="adm-small adm-muted">Créée le 31/10 à 11:42 · Heure de Krabi (UTC+7)</p>
            <p className="adm-num" style={{ fontSize: 'var(--adm-text-xl)', fontWeight: 600, lineHeight: 1.5 }}>12:00 · 12:30 · 19:15 · 1 111 · 40 / 40</p>
          </div>
        </div>
      </section>

      <section className="k-sec" id="buttons" aria-labelledby="t-btn">
        <h2 id="t-btn">Button</h2>
        <p className="adm-muted">Hauteur 44 px par défaut. La taille <code>sm</code> (36 px) n’existe qu’à partir de 1024 px avec pointeur précis ; sinon elle reste à 44 px.</p>
        <div className="k-grid two">
          <div>
            <p className="k-cap">Variantes</p>
            <div className="k-row">
              <Button variant="primary"><Plus className="i i-sm" aria-hidden="true" focusable="false" /> Réservation</Button>
              <Button>Annuler</Button>
              <Button variant="danger"><Trash2 className="i i-sm" aria-hidden="true" focusable="false" /> Supprimer</Button>
              <Button variant="ghost">Voir le détail</Button>
              <Button iconOnly aria-label="Rechercher"><Search className="i" aria-hidden="true" focusable="false" /></Button>
            </div>
          </div>
          <div>
            <p className="k-cap">Taille sm (dense, ordinateur)</p>
            <div className="k-row">
              <Button variant="primary" size="sm">Confirmer</Button>
              <Button size="sm">Terminer</Button>
              <Button size="sm" variant="ghost">Non présenté</Button>
            </div>
          </div>
          <div>
            <p className="k-cap">Chargement (aria-busy, non cliquable)</p>
            <div className="k-row">
              <Button variant="primary" loading loadingLabel="Enregistrement…">Enregistrer</Button>
              <Button loading loadingLabel="Mise à jour…">Mettre à jour</Button>
              <Button variant="primary" loading={saving} loadingLabel="Enregistrement…" onClick={fakeSave}>Essayer</Button>
            </div>
          </div>
          <div>
            <p className="k-cap">Désactivé</p>
            <div className="k-row">
              <Button variant="primary" disabled>Enregistrer</Button>
              <Button disabled>Annuler</Button>
              <Button variant="danger" disabled>Supprimer</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="k-sec" id="fields" aria-labelledby="t-field">
        <h2 id="t-field">Field, Input, Select, Textarea</h2>
        <p className="adm-muted">Libellé toujours visible au-dessus, texte de champ à 16 px (pas de zoom iOS), erreur avec icône et texte, reliée par <code>aria-describedby</code>.</p>
        <div className="k-grid two">
          <Input label="Nom du client" defaultValue="Martin L." hint="Tel qu’il apparaîtra sur la liste." />
          <Input label="Téléphone" defaultValue="+66 81 000" error="Numéro incomplet. Exemple : +66 81 958 5945." />
          <Select label="Couverts" defaultValue="4">
            <option>4</option>
            <option>5</option>
          </Select>
          <Input label="Heure" type="time" defaultValue="19:15" hint="Heure de Krabi." />
          <Input label="Capacité maximale" defaultValue="40" disabled hint="Verrouillé pendant l’enregistrement." />
          <Textarea label="Note interne" optional defaultValue="Allergie arachides." />
        </div>
      </section>

      <section className="k-sec" id="cards" aria-labelledby="t-card">
        <h2 id="t-card">Card et Badge de statut</h2>
        <p className="adm-muted">Une carte ne contient jamais une autre carte : à l’intérieur, filets et espacement. Les cinq statuts de réservation, avec leur icône.</p>
        <div className="k-grid two">
          <Card>
            <CardHeader title="Horaires de la semaine" actions={<a className={buttonClass({ variant: 'ghost', size: 'sm' })} href="#cards">Modifier</a>} />
            <p className="adm-muted">
              Ouvert tous les jours, de <span className="adm-num">12:00</span> à <span className="adm-num">22:00</span>. Capacité <span className="adm-num">40</span> couverts.
            </p>
          </Card>
          <Card>
            <p className="k-cap">Statuts (machine à statuts inchangée)</p>
            <div className="k-row">
              {(Object.keys(RESERVATION_STATUS_BADGES) as ReservationStatus[]).map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
              <Badge tone="info" icon={Inbox}>Badge générique</Badge>
            </div>
          </Card>
        </div>
      </section>

      <section className="k-sec" id="table" aria-labelledby="t-table">
        <h2 id="t-table">DataTable</h2>
        <p className="adm-muted">Tableau dense à partir de 768 px, liste de cartes empilées en dessous (même balisage). Données d’exemple.</p>
        <DataTable
          columns={COLUMNS}
          rows={ROWS}
          rowKey={(r) => r.id}
          caption={
            <>
              Vendredi 31 octobre · 3 réservations · <span className="adm-num">11</span> couverts sur <span className="adm-num">40</span> (exemple)
            </>
          }
        />
      </section>

      <section className="k-sec" id="pageheader" aria-labelledby="t-ph">
        <h2 id="t-ph">PageHeader</h2>
        <p className="adm-muted">Titre en Cormorant, description, actions à droite (empilées sous 768 px), filet laiton de 40 px. Un seul h1 par page : ici le titre du kit est le h1, l’exemple ci-dessous est rendu en h2 (prop <code>as</code>).</p>
        <Card className="k-flush-top">
          <PageHeader
            as="h2"
            title="Horaires"
            description="Ce que voient les visiteurs sur le site. Les changements sont visibles tout de suite."
            actions={
              <>
                <Button>Annuler</Button>
                <Button variant="primary">Enregistrer</Button>
              </>
            }
          />
        </Card>
      </section>

      <section className="k-sec" id="dialog" aria-labelledby="t-dlg">
        <h2 id="t-dlg">Dialogue de confirmation</h2>
        <p className="adm-muted">
          Remplace chaque <code>confirm()</code>. Feuille ancrée en bas sous 768 px, centrée au-dessus. Échap ferme, le focus est piégé puis rendu au bouton déclencheur. Le bouton destructeur n’a jamais le focus initial.
        </p>
        <div className="k-row">
          <Button onClick={tryDelete}><Trash2 className="i i-sm" aria-hidden="true" focusable="false" /> Essayer « Supprimer ce plat »</Button>
          <Button onClick={tryCancelReservation}>Essayer « Annuler la réservation »</Button>
        </div>
        <p className="adm-small adm-muted" style={{ marginTop: 12 }} role="status">
          Dernier choix : <b data-testid="confirm-result">{lastChoice}</b>
        </p>
      </section>

      <section className="k-sec" id="toast" aria-labelledby="t-toast">
        <h2 id="t-toast">Toast</h2>
        <p className="adm-muted">
          Région <code>aria-live</code> : succès poli, disparaît après 5 s (pause au survol et au focus) ; erreur assertive, reste jusqu’à fermeture, la saisie n’est jamais perdue.
        </p>
        <div className="k-row">
          <Button onClick={() => toast.success('Horaires enregistrés', 'Visibles sur le site public.')}>Toast de succès</Button>
          <Button onClick={() => toast.error('Enregistrement impossible', 'Connexion perdue. Votre saisie est conservée, réessayez.')}>Toast d’erreur</Button>
        </div>
      </section>

      <section className="k-sec" id="states" aria-labelledby="t-states">
        <h2 id="t-states">Chargement, vide, erreur</h2>
        <p className="adm-muted">
          Trois composants communs à toutes les pages. Le squelette garde la forme du contenu final (pas de saut de mise en page) et se fige sous <code>prefers-reduced-motion</code>.
        </p>
        <div className="k-grid three">
          <div>
            <p className="k-cap">Chargement</p>
            <LoadingState label="Chargement de la liste…" />
          </div>
          <div>
            <p className="k-cap">Vide</p>
            <EmptyState
              title="Aucune réservation ce jour"
              description="Les nouvelles réservations du site apparaîtront ici."
              action={<Button variant="primary"><Plus className="i i-sm" aria-hidden="true" focusable="false" /> Réservation</Button>}
            />
          </div>
          <div>
            <p className="k-cap">Erreur</p>
            <ErrorState error={new AdminFetchError('Connexion perdue.', 0)} onRetry={() => toast.success('Nouvelle tentative lancée')} />
          </div>
        </div>
        <div className="k-grid" style={{ marginTop: 24 }}>
          <div>
            <p className="k-cap">Emplacement d’image (placeholder honnête)</p>
            <div className="k-ph">Aucune photo : emplacement réservé (non fournie)</div>
          </div>
        </div>
      </section>
    </div>
  )
}
