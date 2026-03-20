'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { Reservation, ReservationStatus, RestaurantTable, ConfigAvailability } from '@/types/database'

const STATUS_LABELS: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: 'text-amber-700', bg: 'bg-amber-100' },
  confirmed: { label: 'Confirmée', color: 'text-green-700', bg: 'bg-green-100' },
  cancelled: { label: 'Annulée', color: 'text-red-700', bg: 'bg-red-100' },
  completed: { label: 'Terminée', color: 'text-blue-700', bg: 'bg-blue-100' },
  no_show: { label: 'Non présenté', color: 'text-gray-700', bg: 'bg-gray-200' }
}

const OCCASIONS = [
  'Anniversaire',
  'Dîner romantique',
  'Repas d\'affaires',
  'Célébration',
  'Autre'
]

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Filters
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'all'>('day')
  
  // Modal for editing
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  // Table assignment modal
  const [assignModal, setAssignModal]           = useState<Reservation | null>(null)
  const [assignments, setAssignments]           = useState<Record<number, { config_id: number; config_name: string; table_names: string; blocked_until: string }>>({})
  const [allTables, setAllTables]               = useState<RestaurantTable[]>([])
  const [availableConfigs, setAvailableConfigs] = useState<ConfigAvailability[]>([])
  const [loadingAssignModal, setLoadingAssignModal] = useState(false)
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null)
  const [clickedTableId, setClickedTableId]     = useState<number | null>(null)

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    try {
      let url = '/api/reservations?'
      
      if (viewMode === 'day') {
        url += `date=${filterDate}`
      } else if (viewMode === 'week') {
        const start = new Date(filterDate)
        const end = new Date(filterDate)
        end.setDate(end.getDate() + 7)
        url += `startDate=${start.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}`
      }
      
      if (filterStatus !== 'all') {
        url += `&status=${filterStatus}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.data) {
        setReservations(data.data)
      }
    } catch (error) {
      console.error('Error fetching reservations:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }, [filterDate, filterStatus, viewMode])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  // Load tables once (for the floor plan)
  useEffect(() => {
    fetch('/api/tables').then(r => r.json()).then(d => { if (d.data) setAllTables(d.data) })
  }, [])

  // Refresh assignments whenever reservations are reloaded
  useEffect(() => {
    if (reservations.length === 0) return
    fetchAssignmentsForVisible()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservations])

  // Fetch assignments for the visible reservation dates
  async function fetchAssignmentsForVisible() {
    const dates = [...new Set(reservations.map(r => r.reservation_date))]
    const results: typeof assignments = {}
    await Promise.all(
      dates.map(async (date) => {
        const res  = await fetch(`/api/tables/assignments?date=${date}`)
        const data = await res.json()
        for (const a of data.data ?? []) {
          if (!a.reservation_id) continue
          const cfg    = a.table_configurations ?? a.configuration ?? {}
          const tables = (cfg.table_configuration_tables ?? []).map((tp: { tables: { name: string } }) => tp.tables?.name).filter(Boolean)
          results[a.reservation_id] = {
            config_id:    a.table_configuration_id,
            config_name:  cfg.name ?? '?',
            table_names:  tables.join(', '),
            blocked_until: a.blocked_until,
          }
        }
      })
    )
    setAssignments(results)
  }

  async function openAssignModal(reservation: Reservation) {
    setAssignModal(reservation)
    setSelectedConfigId(null)
    setClickedTableId(null)
    setLoadingAssignModal(true)
    try {
      const datetime = `${reservation.reservation_date}T${reservation.reservation_time}`
      const res = await fetch(
        `/api/tables/assignments?datetime=${encodeURIComponent(datetime)}&party_size=${reservation.party_size}&exclude_reservation_id=${reservation.id}`
      )
      const data = await res.json()
      setAvailableConfigs(data.data ?? [])
    } finally {
      setLoadingAssignModal(false)
    }
  }

  async function assignTable(reservationId: number, configId: number) {
    const res  = await fetch('/api/tables/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservation_id: reservationId, table_configuration_id: configId }),
    })
    const data = await res.json()
    if (!res.ok) { setMessage({ type: 'error', text: data.error }); return }
    setMessage({ type: 'success', text: 'Table assignée' })
    setAssignModal(null)
    fetchReservations()
  }

  async function unassignTable(reservationId: number) {
    if (!confirm('Retirer l\'assignation de cette table ?')) return
    await fetch(`/api/tables/assignments?reservation_id=${reservationId}`, { method: 'DELETE' })
    setMessage({ type: 'success', text: 'Assignation retirée' })
    setAssignModal(null)
    fetchReservations()
  }

  function getTableStatus(tableId: number): 'available' | 'blocked' | 'current' | 'no-config' {
    const tableCfgs = availableConfigs.filter(ca =>
      (ca.configuration.tables ?? []).some(t => t.id === tableId)
    )
    if (tableCfgs.length === 0) return 'no-config'
    if (tableCfgs.some(ca => ca.assigned_to_current)) return 'current'
    if (tableCfgs.some(ca => ca.available)) return 'available'
    return 'blocked'
  }

  async function updateStatus(id: number, newStatus: ReservationStatus) {
    try {
      const response = await fetch('/api/reservations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Statut mis à jour: ${STATUS_LABELS[newStatus].label}` })
        fetchReservations()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' })
    }
  }

  async function saveNotes() {
    if (!selectedReservation) return
    
    try {
      const response = await fetch('/api/reservations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedReservation.id, admin_notes: adminNotes })
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Notes enregistrées' })
        setShowModal(false)
        fetchReservations()
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur' })
    }
  }

  async function deleteReservation(id: number) {
    if (!confirm('Supprimer définitivement cette réservation?')) return
    
    try {
      const response = await fetch(`/api/reservations?id=${id}`, { method: 'DELETE' })
      if (response.ok) {
        setMessage({ type: 'success', text: 'Réservation supprimée' })
        fetchReservations()
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur' })
    }
  }

  function openModal(reservation: Reservation) {
    setSelectedReservation(reservation)
    setAdminNotes(reservation.admin_notes || '')
    setShowModal(true)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  function formatTime(timeStr: string) {
    return timeStr.substring(0, 5)
  }

  // Stats
  const todayCount = reservations.filter(r => r.status !== 'cancelled').length
  const pendingCount = reservations.filter(r => r.status === 'pending').length
  const totalGuests = reservations.filter(r => r.status !== 'cancelled').reduce((sum, r) => sum + r.party_size, 0)

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--primary)] text-white py-6 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <Link href="/admin" className="text-[var(--accent-light)] hover:text-white mb-2 inline-block">
              ← Retour au tableau de bord
            </Link>
            <h1 className="text-3xl font-bold">📅 Réservations</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-6">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right">✕</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-md text-center">
            <div className="text-3xl font-bold text-[var(--primary)]">{todayCount}</div>
            <div className="text-sm text-[var(--warm-gray)]">Réservations</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md text-center">
            <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-sm text-[var(--warm-gray)]">En attente</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md text-center">
            <div className="text-3xl font-bold text-[var(--tropical)]">{totalGuests}</div>
            <div className="text-sm text-[var(--warm-gray)]">Couverts</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-md mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* View Mode */}
            <div className="flex rounded-lg overflow-hidden border">
              {(['day', 'week', 'all'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 text-sm ${viewMode === mode ? 'bg-[var(--primary)] text-white' : 'bg-white hover:bg-gray-100'}`}
                >
                  {mode === 'day' ? 'Jour' : mode === 'week' ? 'Semaine' : 'Tout'}
                </button>
              ))}
            </div>
            
            {/* Date Picker */}
            {viewMode !== 'all' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const d = new Date(filterDate)
                    d.setDate(d.getDate() - 1)
                    setFilterDate(d.toISOString().split('T')[0])
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  ←
                </button>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
                <button
                  onClick={() => {
                    const d = new Date(filterDate)
                    d.setDate(d.getDate() + 1)
                    setFilterDate(d.toISOString().split('T')[0])
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  →
                </button>
                <button
                  onClick={() => setFilterDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-1 text-sm bg-[var(--accent-light)] rounded-lg hover:bg-[var(--moss)]/30"
                >
                  Aujourd'hui
                </button>
              </div>
            )}
            
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmées</option>
              <option value="cancelled">Annulées</option>
              <option value="completed">Terminées</option>
              <option value="no_show">Non présentés</option>
            </select>
          </div>
        </div>

        {/* Reservations List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto"></div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-[var(--warm-gray)]">Aucune réservation pour cette période</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className={`bg-white rounded-xl p-5 shadow-md border-l-4 ${
                  reservation.status === 'pending' ? 'border-amber-400' :
                  reservation.status === 'confirmed' ? 'border-green-500' :
                  reservation.status === 'cancelled' ? 'border-red-400' :
                  reservation.status === 'completed' ? 'border-blue-400' :
                  'border-gray-400'
                }`}
              >
                <div className="flex flex-wrap gap-4 justify-between items-start">
                  {/* Main Info */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl font-bold text-[var(--primary-dark)]">
                        {formatTime(reservation.reservation_time)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_LABELS[reservation.status].bg} ${STATUS_LABELS[reservation.status].color}`}>
                        {STATUS_LABELS[reservation.status].label}
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-[var(--primary-dark)]">
                      {reservation.customer_name}
                    </div>
                    <div className="text-sm text-[var(--warm-gray)] mt-1">
                      📞 {reservation.customer_phone}
                      {reservation.customer_email && ` • ✉️ ${reservation.customer_email}`}
                    </div>
                  </div>

                  {/* Party & Date */}
                  <div className="text-center px-4">
                    <div className="text-2xl font-bold text-[var(--tropical)]">
                      {reservation.party_size}
                    </div>
                    <div className="text-xs text-[var(--warm-gray)]">personnes</div>
                    {viewMode !== 'day' && (
                      <div className="text-sm text-[var(--primary)] mt-1">
                        {formatDate(reservation.reservation_date)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {reservation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(reservation.id, 'confirmed')}
                          className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                        >
                          ✓ Confirmer
                        </button>
                        <button
                          onClick={() => updateStatus(reservation.id, 'cancelled')}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                        >
                          ✕ Annuler
                        </button>
                      </>
                    )}
                    {reservation.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => updateStatus(reservation.id, 'completed')}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                        >
                          ✓ Terminée
                        </button>
                        <button
                          onClick={() => updateStatus(reservation.id, 'no_show')}
                          className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
                        >
                          Absent
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => openModal(reservation)}
                      className="px-3 py-1 bg-[var(--accent-light)] text-[var(--primary-dark)] rounded-lg text-sm hover:bg-[var(--moss)]/30"
                    >
                      👁️ Détails
                    </button>
                    <button
                      onClick={() => openAssignModal(reservation)}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        assignments[reservation.id]
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      🗺️ {assignments[reservation.id] ? assignments[reservation.id].config_name : 'Placer'}
                    </button>
                    <button
                      onClick={() => deleteReservation(reservation.id)}
                      className="px-3 py-1 text-red-500 hover:text-red-700 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Extra Info */}
                {(reservation.occasion || reservation.admin_notes || assignments[reservation.id]) && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-sm flex flex-wrap gap-2 items-center">
                    {reservation.occasion && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                        🎉 {reservation.occasion}
                      </span>
                    )}
                    {reservation.admin_notes && (
                      <span className="text-amber-700 italic">
                        📋 {reservation.admin_notes}
                      </span>
                    )}
                    {assignments[reservation.id] && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded flex items-center gap-1">
                        🪑 {assignments[reservation.id].config_name}
                        {assignments[reservation.id].table_names && (
                          <span className="opacity-75">· {assignments[reservation.id].table_names}</span>
                        )}
                        <span className="opacity-60 text-xs">
                          → {new Date(assignments[reservation.id].blocked_until).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ----------------------------------------------------------------
       * Table assignment modal
       * ---------------------------------------------------------------- */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-[var(--primary-dark)]">🗺️ Placer sur le plan</h2>
                  <p className="text-sm text-[var(--warm-gray)] mt-0.5">
                    {assignModal.customer_name} · {assignModal.party_size} pers. ·{' '}
                    {formatDate(assignModal.reservation_date)} à {formatTime(assignModal.reservation_time)}
                  </p>
                </div>
                <button onClick={() => setAssignModal(null)} className="text-2xl text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>

            <div className="p-5">
              {loadingAssignModal ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
                </div>
              ) : (
                <div className="grid md:grid-cols-[1fr_280px] gap-5">

                  {/* Floor plan */}
                  <div>
                    <p className="text-xs text-[var(--warm-gray)] mb-2">
                      🟢 Disponible &nbsp; 🔴 Bloquée &nbsp; ⬛ Aucune config
                    </p>
                    <div
                      className="relative w-full bg-amber-50 border-2 border-amber-200 rounded-xl overflow-hidden select-none"
                      style={{ aspectRatio: '4/3' }}
                    >
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(#b45309 0 1px,transparent 1px 100%),repeating-linear-gradient(90deg,#b45309 0 1px,transparent 1px 100%)',
                          backgroundSize: '10% 12.5%',
                        }}
                      />
                      {allTables.filter(t => t.is_active).map(table => {
                        const status = getTableStatus(table.id)
                        const isRound = table.shape === 'round'
                        const tableCfgs = availableConfigs.filter(ca =>
                          (ca.configuration.tables ?? []).some(t => t.id === table.id)
                        )
                        const colorClass =
                          status === 'available' ? 'bg-green-500 hover:bg-green-600 cursor-pointer' :
                          status === 'blocked'   ? 'bg-red-400 cursor-not-allowed' :
                          status === 'current'   ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer' :
                                                   'bg-gray-300 cursor-default'
                        return (
                          <div
                            key={table.id}
                            title={tableCfgs.map(ca => `${ca.configuration.name} (${ca.available ? 'libre' : 'bloquée'})`).join(' | ')}
                            style={{
                              position: 'absolute',
                              left: `${table.position_x - table.width / 2}%`,
                              top:  `${table.position_y - table.height / 2}%`,
                              width:  `${table.width}%`,
                              height: `${table.height}%`,
                            }}
                            className={`flex flex-col items-center justify-center text-white font-semibold shadow-md transition-all text-[10px] ${
                              isRound ? 'rounded-full' : 'rounded-xl'
                            } ${colorClass} ${
                              clickedTableId === table.id ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
                            }`}
                            onClick={() => {
                              if (status === 'no-config' || status === 'blocked') return
                              setClickedTableId(prev => prev === table.id ? null : table.id)
                            }}
                          >
                            <span className="truncate max-w-[90%] text-center leading-tight">{table.name}</span>
                            <span className="opacity-70" style={{ fontSize: '9px' }}>{table.seats}p</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Clicked table configs */}
                    {clickedTableId && (() => {
                      const tableCfgs = availableConfigs.filter(ca =>
                        (ca.configuration.tables ?? []).some(t => t.id === clickedTableId)
                      )
                      if (tableCfgs.length === 0) return null
                      return (
                        <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                          <p className="text-xs font-semibold text-[var(--primary-dark)] mb-2">Configurations pour cette table :</p>
                          <div className="flex flex-wrap gap-2">
                            {tableCfgs.map(ca => (
                              <button
                                key={ca.configuration.id}
                                disabled={!ca.available && !ca.assigned_to_current}
                                onClick={() => setSelectedConfigId(ca.configuration.id)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                  selectedConfigId === ca.configuration.id
                                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                    : ca.available
                                    ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                                    : ca.assigned_to_current
                                    ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                }`}
                              >
                                {ca.configuration.name}
                                <span className="text-xs ml-1 opacity-70">
                                  ({ca.configuration.min_capacity}–{ca.configuration.max_capacity}p)
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Config list */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[var(--warm-gray)] uppercase tracking-wide mb-3">Toutes les configurations</p>

                    {/* Current assignment */}
                    {assignments[assignModal.id] && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl mb-3">
                        <div className="text-xs text-blue-700 font-semibold mb-1">Table actuelle</div>
                        <div className="text-sm font-bold text-blue-800">{assignments[assignModal.id].config_name}</div>
                        <div className="text-xs text-blue-600">{assignments[assignModal.id].table_names}</div>
                        <button
                          onClick={() => unassignTable(assignModal.id)}
                          className="mt-2 text-xs text-red-500 hover:text-red-700"
                        >
                          ✕ Retirer l&apos;assignation
                        </button>
                      </div>
                    )}

                    {availableConfigs.length === 0 ? (
                      <div className="text-center py-6 text-[var(--warm-gray)] text-sm">
                        Aucune configuration active.<br />
                        <Link href="/admin/tables" className="text-[var(--primary)] underline mt-1 inline-block">Créer des configurations →</Link>
                      </div>
                    ) : (
                      availableConfigs.map(ca => (
                        <button
                          key={ca.configuration.id}
                          disabled={!ca.available && !ca.assigned_to_current}
                          onClick={() => ca.available || ca.assigned_to_current ? setSelectedConfigId(ca.configuration.id) : null}
                          className={`w-full p-3 rounded-xl border text-left transition-colors ${
                            selectedConfigId === ca.configuration.id
                              ? 'border-[var(--primary)] bg-[var(--accent-light)]'
                              : ca.assigned_to_current
                              ? 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                              : ca.available
                              ? 'border-green-200 bg-green-50 hover:bg-green-100'
                              : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-sm">{ca.configuration.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              ca.assigned_to_current ? 'bg-blue-200 text-blue-700' :
                              ca.available           ? 'bg-green-200 text-green-700' :
                                                       'bg-red-100 text-red-500'
                            }`}>
                              {ca.assigned_to_current ? 'Actuel' : ca.available ? 'Libre' : 'Bloquée'}
                            </span>
                          </div>
                          <div className="text-xs text-[var(--warm-gray)] mt-0.5">
                            {ca.configuration.min_capacity === ca.configuration.max_capacity
                              ? `${ca.configuration.max_capacity} pers.`
                              : `${ca.configuration.min_capacity}–${ca.configuration.max_capacity} pers.`}
                            {' · '}{(ca.configuration.tables ?? []).map(t => t.name).join(', ')}
                          </div>
                        </button>
                      ))
                    )}

                    {selectedConfigId && (
                      <button
                        onClick={() => assignTable(assignModal.id, selectedConfigId)}
                        className="w-full py-3 mt-2 bg-[var(--primary)] text-white rounded-xl font-medium hover:bg-[var(--primary-dark)] transition-colors"
                      >
                        ✓ Confirmer l&apos;assignation
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Details modal */}
      {showModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-[var(--primary-dark)]">
                  Détails de la réservation
                </h2>
                <button onClick={() => setShowModal(false)} className="text-2xl">✕</button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-[var(--warm-gray)]">Client</div>
                    <div className="font-semibold">{selectedReservation.customer_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--warm-gray)]">Téléphone</div>
                    <div className="font-semibold">{selectedReservation.customer_phone}</div>
                  </div>
                  {selectedReservation.customer_email && (
                    <div className="col-span-2">
                      <div className="text-sm text-[var(--warm-gray)]">Email</div>
                      <div className="font-semibold">{selectedReservation.customer_email}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-[var(--warm-gray)]">Date</div>
                    <div className="font-semibold">{formatDate(selectedReservation.reservation_date)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--warm-gray)]">Heure</div>
                    <div className="font-semibold">{formatTime(selectedReservation.reservation_time)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--warm-gray)]">Personnes</div>
                    <div className="font-semibold">{selectedReservation.party_size}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--warm-gray)]">Statut</div>
                    <div className={`font-semibold ${STATUS_LABELS[selectedReservation.status].color}`}>
                      {STATUS_LABELS[selectedReservation.status].label}
                    </div>
                  </div>
                </div>

                {selectedReservation.occasion && (
                  <div>
                    <div className="text-sm text-[var(--warm-gray)]">Occasion</div>
                    <div className="font-semibold">{selectedReservation.occasion}</div>
                  </div>
                )}

                <div>
                  <label className="text-sm text-[var(--warm-gray)]">Notes admin</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg mt-1"
                    rows={3}
                    placeholder="Notes internes..."
                  />
                </div>

                <div className="text-xs text-[var(--warm-gray)]">
                  Créée le {new Date(selectedReservation.created_at).toLocaleString('fr-FR')}
                  {selectedReservation.confirmed_at && (
                    <span> • Confirmée le {new Date(selectedReservation.confirmed_at).toLocaleString('fr-FR')}</span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={saveNotes}
                  className="flex-1 bg-[var(--primary)] text-white py-2 rounded-lg"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border rounded-lg"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
