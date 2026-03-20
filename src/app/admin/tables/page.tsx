'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import type { RestaurantTable, TableConfiguration } from '@/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DragState = {
  tableId: number
  startClientX: number
  startClientY: number
  origX: number
  origY: number
  moved: boolean
}

type TabId = 'plan' | 'configs'

const SHAPE_DEFAULTS: Record<string, { width: number; height: number }> = {
  square:    { width: 9,  height: 11 },
  round:     { width: 10, height: 10 },
  rectangle: { width: 15, height: 10 },
}

const DEFAULT_TABLE: Omit<RestaurantTable, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  seats: 2,
  position_x: 50,
  position_y: 50,
  width: 9,
  height: 11,
  shape: 'square',
  is_active: true,
  display_order: 0,
}

// ---------------------------------------------------------------------------
// Sub-component: Floor plan
// ---------------------------------------------------------------------------

interface FloorPlanProps {
  tables: RestaurantTable[]
  selectedTableId: number | null
  dragState: DragState | null
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, table: RestaurantTable) => void
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void
  onTableClick: (table: RestaurantTable) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  configurations: TableConfiguration[]
}

function FloorPlan({
  tables,
  selectedTableId,
  dragState,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onTableClick,
  containerRef,
  configurations,
}: FloorPlanProps) {
  // Map: table_id → list of config names
  const tableConfigNames = new Map<number, string[]>()
  for (const cfg of configurations) {
    for (const t of cfg.tables ?? []) {
      const existing = tableConfigNames.get(t.id) ?? []
      tableConfigNames.set(t.id, [...existing, cfg.name])
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-amber-50 border-2 border-amber-200 rounded-xl overflow-hidden select-none touch-none"
      style={{ aspectRatio: '4/3' }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(#b45309 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, #b45309 0 1px, transparent 1px 100%)',
          backgroundSize: '10% 12.5%',
        }}
      />

      {/* Tables */}
      {tables
        .filter((t) => t.is_active)
        .map((table) => {
          const isSelected = selectedTableId === table.id
          const isDragging = dragState?.tableId === table.id
          const cfgNames = tableConfigNames.get(table.id) ?? []
          const isRound = table.shape === 'round'

          return (
            <div
              key={table.id}
              title={cfgNames.length > 0 ? `Configs: ${cfgNames.join(', ')}` : 'Aucune configuration'}
              style={{
                position: 'absolute',
                left: `${table.position_x - table.width / 2}%`,
                top: `${table.position_y - table.height / 2}%`,
                width: `${table.width}%`,
                height: `${table.height}%`,
                cursor: isDragging ? 'grabbing' : 'grab',
                zIndex: isDragging ? 20 : 10,
                touchAction: 'none',
              }}
              className={[
                'flex flex-col items-center justify-center text-white font-semibold shadow-md transition-all',
                isRound ? 'rounded-full' : 'rounded-xl',
                isSelected
                  ? 'ring-4 ring-yellow-400 ring-offset-1 bg-[var(--primary-dark)]'
                  : 'bg-[var(--primary)] hover:brightness-110',
                isDragging ? 'opacity-75 scale-105' : '',
              ].join(' ')}
              onPointerDown={(e) => onPointerDown(e, table)}
              onClick={() => !dragState?.moved && onTableClick(table)}
            >
              <span className="text-xs leading-tight truncate max-w-[90%] text-center">
                {table.name}
              </span>
              <span className="text-[10px] opacity-75">{table.seats}p</span>
            </div>
          )
        })}

      {/* Empty state */}
      {tables.filter((t) => t.is_active).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-amber-400 text-sm">
          Aucune table — ajoutez-en une ci-dessous
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: Table edit form
// ---------------------------------------------------------------------------

interface TableFormProps {
  value: Partial<RestaurantTable>
  onChange: (v: Partial<RestaurantTable>) => void
  onSave: () => void
  onDelete?: () => void
  onCancel: () => void
  saving: boolean
  isNew: boolean
}

function TableForm({ value, onChange, onSave, onDelete, onCancel, saving, isNew }: TableFormProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <h3 className="font-bold text-[var(--primary-dark)]">
        {isNew ? '➕ Nouvelle table' : `✏️ Modifier — ${value.name}`}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[var(--warm-gray)]">Nom</label>
          <input
            className="w-full px-3 py-1.5 border rounded-lg text-sm mt-0.5"
            value={value.name ?? ''}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="T1, Table terrasse…"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--warm-gray)]">Places</label>
          <input
            type="number"
            min={1}
            max={30}
            className="w-full px-3 py-1.5 border rounded-lg text-sm mt-0.5"
            value={value.seats ?? 2}
            onChange={(e) => onChange({ ...value, seats: parseInt(e.target.value) || 2 })}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-[var(--warm-gray)]">Forme</label>
        <div className="flex gap-2 mt-1">
          {(['square', 'round', 'rectangle'] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                const defaults = SHAPE_DEFAULTS[s]
                onChange({ ...value, shape: s, ...defaults })
              }}
              className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                value.shape === s
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'hover:bg-gray-100 border-gray-200'
              }`}
            >
              {s === 'square' ? '⬛ Carré' : s === 'round' ? '⚫ Rond' : '▬ Rectangle'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[var(--warm-gray)]">Largeur (%)</label>
          <input
            type="number"
            min={4}
            max={40}
            step={0.5}
            className="w-full px-3 py-1.5 border rounded-lg text-sm mt-0.5"
            value={value.width ?? 9}
            onChange={(e) => onChange({ ...value, width: parseFloat(e.target.value) || 9 })}
          />
        </div>
        <div>
          <label className="text-xs text-[var(--warm-gray)]">Hauteur (%)</label>
          <input
            type="number"
            min={4}
            max={40}
            step={0.5}
            className="w-full px-3 py-1.5 border rounded-lg text-sm mt-0.5"
            value={value.height ?? 11}
            onChange={(e) => onChange({ ...value, height: parseFloat(e.target.value) || 11 })}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-dark)] disabled:opacity-50"
        >
          {saving ? '…' : isNew ? 'Créer' : 'Enregistrer'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100">
          Annuler
        </button>
        {!isNew && onDelete && (
          <button onClick={onDelete} className="px-3 py-2 text-red-500 hover:text-red-700 text-sm">
            🗑️
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: Configuration manager
// ---------------------------------------------------------------------------

interface ConfigManagerProps {
  configurations: TableConfiguration[]
  tables: RestaurantTable[]
  onRefresh: () => void
}

function ConfigManager({ configurations, tables, onRefresh }: ConfigManagerProps) {
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState({ name: '', min_capacity: 1, max_capacity: 2, table_ids: [] as number[] })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function startNew() {
    setForm({ name: '', min_capacity: 1, max_capacity: 2, table_ids: [] })
    setEditingId('new')
  }

  function startEdit(cfg: TableConfiguration) {
    setForm({
      name: cfg.name,
      min_capacity: cfg.min_capacity,
      max_capacity: cfg.max_capacity,
      table_ids: (cfg.tables ?? []).map((t) => t.id),
    })
    setEditingId(cfg.id)
  }

  function toggleTable(tableId: number) {
    setForm((prev) => ({
      ...prev,
      table_ids: prev.table_ids.includes(tableId)
        ? prev.table_ids.filter((id) => id !== tableId)
        : [...prev.table_ids, tableId],
    }))
  }

  async function save() {
    if (!form.name.trim()) { setMsg({ type: 'error', text: 'Nom requis' }); return }
    if (form.table_ids.length === 0) { setMsg({ type: 'error', text: 'Sélectionnez au moins une table' }); return }
    if (form.max_capacity < form.min_capacity) { setMsg({ type: 'error', text: 'Max ≥ Min requis' }); return }

    setSaving(true)
    try {
      const isNew = editingId === 'new'
      const url   = isNew ? '/api/tables/configurations' : `/api/tables/configurations/${editingId}`
      const res   = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ type: 'error', text: data.error }); return }
      setMsg({ type: 'success', text: isNew ? 'Configuration créée' : 'Mise à jour' })
      setEditingId(null)
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  async function deleteConfig(id: number) {
    if (!confirm('Supprimer cette configuration ? Les assignations liées seront supprimées.')) return
    const res = await fetch(`/api/tables/configurations/${id}`, { method: 'DELETE' })
    if (res.ok) { onRefresh(); setMsg({ type: 'success', text: 'Supprimée' }) }
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="float-right">✕</button>
        </div>
      )}

      <button
        onClick={startNew}
        className="w-full py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-dark)]"
      >
        ➕ Nouvelle configuration
      </button>

      {/* Inline form */}
      {editingId !== null && (
        <div className="bg-white border-2 border-[var(--accent)] rounded-xl p-4 space-y-3">
          <h3 className="font-bold text-[var(--primary-dark)]">
            {editingId === 'new' ? 'Nouvelle configuration' : 'Modifier'}
          </h3>
          <div>
            <label className="text-xs text-[var(--warm-gray)]">Nom</label>
            <input
              className="w-full px-3 py-1.5 border rounded-lg text-sm mt-0.5"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder='ex: "T1 seul", "T3+T4 joints"'
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--warm-gray)]">Min personnes</label>
              <input
                type="number"
                min={1}
                className="w-full px-3 py-1.5 border rounded-lg text-sm mt-0.5"
                value={form.min_capacity}
                onChange={(e) => setForm((f) => ({ ...f, min_capacity: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--warm-gray)]">Max personnes</label>
              <input
                type="number"
                min={1}
                className="w-full px-3 py-1.5 border rounded-lg text-sm mt-0.5"
                value={form.max_capacity}
                onChange={(e) => setForm((f) => ({ ...f, max_capacity: parseInt(e.target.value) || 2 }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--warm-gray)] block mb-1">
              Tables comprises ({form.table_ids.length} sélectionnée{form.table_ids.length > 1 ? 's' : ''})
            </label>
            <div className="flex flex-wrap gap-2">
              {tables.filter((t) => t.is_active).map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTable(t.id)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    form.table_ids.includes(t.id)
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                      : 'hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  {t.name} ({t.seats}p)
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-dark)] disabled:opacity-50"
            >
              {saving ? '…' : editingId === 'new' ? 'Créer' : 'Enregistrer'}
            </button>
            <button onClick={() => setEditingId(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Configurations list */}
      {configurations.length === 0 ? (
        <div className="text-center py-8 text-[var(--warm-gray)] text-sm">
          Aucune configuration — créez-en une pour assigner des réservations
        </div>
      ) : (
        <div className="space-y-3">
          {configurations.map((cfg) => (
            <div key={cfg.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-[var(--primary-dark)]">{cfg.name}</div>
                  <div className="text-sm text-[var(--warm-gray)] mt-0.5">
                    {cfg.min_capacity === cfg.max_capacity
                      ? `${cfg.max_capacity} personne${cfg.max_capacity > 1 ? 's' : ''}`
                      : `${cfg.min_capacity}–${cfg.max_capacity} personnes`}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(cfg.tables ?? []).map((t) => (
                      <span
                        key={t.id}
                        className="px-2 py-0.5 text-xs bg-[var(--accent-light)] text-[var(--primary-dark)] rounded-full"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => startEdit(cfg)}
                    className="px-3 py-1 text-sm text-[var(--primary)] hover:bg-[var(--accent-light)] rounded-lg"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteConfig(cfg.id)}
                    className="px-3 py-1 text-sm text-red-400 hover:text-red-600 rounded-lg"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminTablesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('plan')
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [configurations, setConfigurations] = useState<TableConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  // Floor plan state
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [tableForm, setTableForm] = useState<Partial<RestaurantTable> | null>(null)
  const [isNewTable, setIsNewTable] = useState(false)

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [tablesRes, configsRes] = await Promise.all([
        fetch('/api/tables'),
        fetch('/api/tables/configurations'),
      ])
      const [tablesData, configsData] = await Promise.all([tablesRes.json(), configsRes.json()])
      if (tablesData.data)  setTables(tablesData.data)
      if (configsData.data) setConfigurations(configsData.data)
    } catch {
      setMessage({ type: 'error', text: 'Erreur de chargement' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // -------------------------------------------------------------------------
  // Drag handlers
  // -------------------------------------------------------------------------

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>, table: RestaurantTable) {
    if (e.button !== 0) return
    e.stopPropagation()
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
    setDragState({
      tableId: table.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: table.position_x,
      origY: table.position_y,
      moved: false,
    })
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - dragState.startClientX) / rect.width) * 100
    const dy = ((e.clientY - dragState.startClientY) / rect.height) * 100
    const moved = Math.abs(dx) > 1 || Math.abs(dy) > 1

    const newX = Math.max(1, Math.min(99, dragState.origX + dx))
    const newY = Math.max(1, Math.min(99, dragState.origY + dy))

    setTables((prev) =>
      prev.map((t) =>
        t.id === dragState.tableId ? { ...t, position_x: newX, position_y: newY } : t
      )
    )
    setDragState((s) => (s ? { ...s, moved } : s))
  }

  async function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState) return
    const ds = dragState
    setDragState(null)

    if (ds.moved) {
      const table = tables.find((t) => t.id === ds.tableId)
      if (!table) return
      await fetch(`/api/tables/${ds.tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position_x: table.position_x, position_y: table.position_y }),
      })
    }
    e.stopPropagation()
  }

  function handleTableClick(table: RestaurantTable) {
    setSelectedTable(table)
    setTableForm({ ...table })
    setIsNewTable(false)
  }

  // -------------------------------------------------------------------------
  // CRUD
  // -------------------------------------------------------------------------

  async function saveTable() {
    if (!tableForm) return
    setSaving(true)
    try {
      const url    = isNewTable ? '/api/tables' : `/api/tables/${tableForm.id}`
      const method = isNewTable ? 'POST' : 'PUT'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tableForm),
      })
      const data = await res.json()
      if (!res.ok) { setMessage({ type: 'error', text: data.error }); return }
      setMessage({ type: 'success', text: isNewTable ? 'Table créée' : 'Table mise à jour' })
      setTableForm(null)
      setSelectedTable(null)
      await fetchAll()
    } finally {
      setSaving(false)
    }
  }

  async function deleteTable(id: number) {
    if (!confirm('Supprimer cette table ? Elle sera retirée de toutes les configurations.')) return
    const res = await fetch(`/api/tables/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMessage({ type: 'success', text: 'Table supprimée' })
      setTableForm(null)
      setSelectedTable(null)
      await fetchAll()
    }
  }

  function startNewTable() {
    const count = tables.length + 1
    setTableForm({
      ...DEFAULT_TABLE,
      name: `T${count}`,
      position_x: 20 + (count % 5) * 15,
      position_y: 30 + Math.floor(count / 5) * 20,
    })
    setIsNewTable(true)
    setSelectedTable(null)
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--primary)] text-white py-5 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <Link href="/admin" className="text-[var(--accent-light)] hover:text-white mb-1 inline-block text-sm">
              ← Retour au tableau de bord
            </Link>
            <h1 className="text-3xl font-bold">🗺️ Plan de salle</h1>
          </div>
          <Link
            href="/admin/settings"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
          >
            ⚙️ Paramètres
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-6">
        {/* Message */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-md mb-6 w-fit">
          {(['plan', 'configs'] as TabId[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-[var(--primary)] text-white'
                  : 'hover:bg-gray-100 text-[var(--warm-gray)]'
              }`}
            >
              {tab === 'plan' ? '🗺️ Plan de salle' : '⚙️ Configurations'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto" />
          </div>
        ) : activeTab === 'plan' ? (
          /* ----------------------------------------------------------------
           * Tab: Floor plan
           * ---------------------------------------------------------------- */
          <div className="grid lg:grid-cols-[1fr_300px] gap-6">
            {/* Left: map */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-md p-4">
                {/* Legend */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-3 text-xs text-[var(--warm-gray)]">
                    <span>🟢 Glisser pour repositionner</span>
                    <span>🖱️ Cliquer pour modifier</span>
                  </div>
                  <button
                    onClick={startNewTable}
                    className="px-4 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-dark)]"
                  >
                    ➕ Ajouter une table
                  </button>
                </div>

                <FloorPlan
                  tables={tables}
                  configurations={configurations}
                  selectedTableId={selectedTable?.id ?? null}
                  dragState={dragState}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onTableClick={handleTableClick}
                  containerRef={containerRef}
                />

                {/* Summary */}
                <div className="mt-3 flex gap-4 text-xs text-[var(--warm-gray)]">
                  <span>{tables.filter((t) => t.is_active).length} tables</span>
                  <span>
                    {tables.filter((t) => t.is_active).reduce((s, t) => s + t.seats, 0)} couverts totaux
                  </span>
                  <span>{configurations.length} configurations</span>
                </div>
              </div>

              {/* Tables grid */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="font-semibold text-[var(--primary-dark)] mb-3 text-sm">Liste des tables</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {tables.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleTableClick(t)}
                      className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                        selectedTable?.id === t.id
                          ? 'border-[var(--primary)] bg-[var(--accent-light)]'
                          : 'border-gray-200 hover:border-[var(--primary)]'
                      }`}
                    >
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-[var(--warm-gray)]">
                        {t.shape} · {t.seats}p
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: edit panel */}
            <div className="space-y-4">
              {tableForm ? (
                <TableForm
                  value={tableForm}
                  onChange={setTableForm}
                  onSave={saveTable}
                  onDelete={isNewTable ? undefined : () => deleteTable(tableForm.id!)}
                  onCancel={() => { setTableForm(null); setSelectedTable(null) }}
                  saving={saving}
                  isNew={isNewTable}
                />
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-[var(--warm-gray)] text-sm">
                  Cliquez sur une table pour la modifier
                </div>
              )}

              {/* Quick stats per table */}
              {tables.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-sm space-y-2">
                  <h4 className="font-semibold text-[var(--primary-dark)]">Configurations par table</h4>
                  {tables
                    .filter((t) => t.is_active)
                    .map((t) => {
                      const cfgs = configurations.filter((cfg) =>
                        (cfg.tables ?? []).some((ct) => ct.id === t.id)
                      )
                      return (
                        <div key={t.id} className="flex gap-2 items-start">
                          <span className="font-medium w-10 shrink-0">{t.name}</span>
                          <div className="flex flex-wrap gap-1">
                            {cfgs.length === 0 ? (
                              <span className="text-gray-400 italic text-xs">aucune config</span>
                            ) : (
                              cfgs.map((c) => (
                                <span key={c.id} className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                  {c.name}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ----------------------------------------------------------------
           * Tab: Configurations
           * ---------------------------------------------------------------- */
          <div className="max-w-2xl">
            <ConfigManager
              configurations={configurations}
              tables={tables}
              onRefresh={fetchAll}
            />
          </div>
        )}
      </main>
    </div>
  )
}
