/**
 * Contrôleur des changements de statut (RSV-01, RSV-05) : logique pure, sans React, testable seule.
 *
 * Garanties (audit P15, HAUTE) :
 * - UNE seule requête PUT par ligne à la fois, de la confirmation du dialogue jusqu'à la fin du
 *   rechargement de la liste. Tout tap pendant ce temps est ignoré (pas de second PUT, donc pas
 *   de second email client : le PUT de l'API figée n'est pas idempotent).
 * - Après un PUT réussi, le nouveau statut est appliqué localement (`applied`) : la ligne ne
 *   montre jamais l'ancien statut avec ses boutons actifs, même si le rechargement échoue.
 * - La ligne n'est jamais « occupée » indéfiniment : le rechargement est plafonné (`refreshTimeoutMs`).
 */

import type { Reservation, ReservationStatus } from '@/types/database'
import type { ReservationAction } from '@/utils/reservation-status'

export type RowFailure = { action: ReservationAction; message: string }

export type ActionState = {
  /** Statut en cours d'envoi, par id de réservation (ligne occupée). */
  busy: Readonly<Record<number, ReservationStatus>>
  failures: Readonly<Record<number, RowFailure>>
  /** Statut confirmé par le serveur mais pas encore relu dans la liste. */
  applied: Readonly<Record<number, ReservationStatus>>
}

export type ActionDeps = {
  /** PUT { id, status }. Lève en cas d'échec ; l'erreur porte le message à afficher. */
  send: (r: Reservation, action: ReservationAction) => Promise<void>
  /** Recharge la liste. Résout `true` si les données sont fraîches, `false` si le rechargement a échoué. Ne lève pas. */
  refresh: () => Promise<boolean>
  /** Dialogue de confirmation (Annuler / Absent) ou `null` si l'action n'en demande pas. */
  confirmFor: (r: Reservation, action: ReservationAction) => Promise<boolean> | null
  messageOf: (e: unknown) => string
  onSuccess: (r: Reservation, action: ReservationAction) => void
  onFailure: (r: Reservation, action: ReservationAction, message: string) => void
  onStale: (r: Reservation, action: ReservationAction) => void
}

export const REFRESH_TIMEOUT_MS = 20_000

export type ActionController = {
  getState: () => ActionState
  subscribe: (listener: () => void) => () => void
  run: (r: Reservation, action: ReservationAction) => Promise<void>
  /** Des données fraîches sont arrivées : les statuts locaux des lignes non occupées ne servent plus. */
  reconcile: () => void
  /** Remplace les dépendances (fonctions courantes du composant) ; prises en compte à la prochaine action. */
  setDeps: (deps: ActionDeps) => void
}

function omit<V>(map: Readonly<Record<number, V>>, id: number): Record<number, V> {
  if (!(id in map)) return map as Record<number, V>
  const rest = { ...map }
  delete rest[id]
  return rest
}

export function createActionController(initialDeps?: ActionDeps, refreshTimeoutMs = REFRESH_TIMEOUT_MS): ActionController {
  let currentDeps: ActionDeps | undefined = initialDeps
  const getDeps = (): ActionDeps => {
    if (!currentDeps) throw new Error('createActionController: dépendances non fournies')
    return currentDeps
  }
  let state: ActionState = { busy: {}, failures: {}, applied: {} }
  const listeners = new Set<() => void>()
  /** Ids verrouillés de façon SYNCHRONE (avant tout `await`) : deux taps dans le même tick ne passent pas. */
  const locked = new Set<number>()

  function set(patch: Partial<ActionState>) {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  }

  function refreshWithCeiling(refresh: () => Promise<boolean>): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), refreshTimeoutMs)
      refresh().then(
        (ok) => {
          clearTimeout(timer)
          resolve(ok)
        },
        () => {
          clearTimeout(timer)
          resolve(false)
        },
      )
    })
  }

  async function run(r: Reservation, action: ReservationAction): Promise<void> {
    if (locked.has(r.id)) return
    // Déjà appliqué (statut local ou affiché) : rien à envoyer, un second PUT renverrait un second email.
    if ((state.applied[r.id] ?? r.status) === action.to) return
    locked.add(r.id)
    const deps = getDeps()
    try {
      const asking = deps.confirmFor(r, action)
      if (asking && !(await asking)) return

      set({ busy: { ...state.busy, [r.id]: action.to }, failures: omit(state.failures, r.id) })
      try {
        await deps.send(r, action)
      } catch (e) {
        const message = deps.messageOf(e)
        set({ failures: { ...state.failures, [r.id]: { action, message } } })
        deps.onFailure(r, action, message)
        return
      }
      set({ applied: { ...state.applied, [r.id]: action.to } })
      deps.onSuccess(r, action)
      const fresh = await refreshWithCeiling(getDeps().refresh)
      if (fresh) set({ applied: omit(state.applied, r.id) })
      else getDeps().onStale(r, action)
    } finally {
      if (r.id in state.busy) set({ busy: omit(state.busy, r.id) })
      locked.delete(r.id)
    }
  }

  return {
    getState: () => state,
    subscribe: (l) => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    run,
    setDeps: (deps) => {
      currentDeps = deps
    },
    reconcile: () => {
      const keep: Record<number, ReservationStatus> = {}
      for (const [id, to] of Object.entries(state.applied)) if (locked.has(Number(id))) keep[Number(id)] = to
      if (Object.keys(keep).length !== Object.keys(state.applied).length) set({ applied: keep })
    },
  }
}

/** Réservation avec le statut local appliqué (en attendant que la liste rechargée le confirme). */
export function withAppliedStatus<T extends Pick<Reservation, 'id' | 'status'>>(r: T, applied: ActionState['applied']): T {
  const to = applied[r.id]
  return to && to !== r.status ? { ...r, status: to } : r
}
