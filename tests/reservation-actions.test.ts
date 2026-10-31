/**
 * Audit P15 (HAUTE) : un second tap pendant le rechargement ne doit JAMAIS émettre un second PUT
 * (chaque PUT confirmed/cancelled envoie un email client). Le hook `useReservationActions` délègue
 * toute sa logique à `createActionController` (pur, sans React) : testé ici directement.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createActionController,
  withAppliedStatus,
  REFRESH_TIMEOUT_MS,
  type ActionDeps,
} from '../src/components/admin/reservations/action-controller'
import { attemptOfKey } from '../src/components/admin/use-admin-query'
import { nextActions } from '../src/utils/reservation-status'
import type { Reservation } from '../src/types/database'

const pending = { id: 7, status: 'pending', customer_name: 'Anna', reservation_time: '19:00:00' } as Reservation
const other = { id: 8, status: 'pending', customer_name: 'Bob', reservation_time: '20:00:00' } as Reservation
const CONFIRM = nextActions('pending').find((a) => a.to === 'confirmed')!
const CANCEL = nextActions('pending').find((a) => a.to === 'cancelled')!

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function setup(over: Partial<ActionDeps> = {}) {
  const deps: ActionDeps = {
    send: vi.fn(async () => {}),
    refresh: vi.fn(async () => true),
    confirmFor: () => null,
    messageOf: (e) => (e instanceof Error ? e.message : 'Erreur'),
    onSuccess: vi.fn(),
    onFailure: vi.fn(),
    onStale: vi.fn(),
    ...over,
  }
  const c = createActionController(deps)
  return { c, deps }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('double clic', () => {
  it('deux taps dans le même tick : un seul PUT', async () => {
    const { c, deps } = setup()
    await Promise.all([c.run(pending, CONFIRM), c.run(pending, CONFIRM)])
    expect(deps.send).toHaveBeenCalledTimes(1)
  })

  it('second tap PENDANT le rechargement (PUT déjà répondu) : toujours un seul PUT', async () => {
    const refresh = deferred<boolean>()
    const { c, deps } = setup({ refresh: vi.fn(() => refresh.promise) })
    const first = c.run(pending, CONFIRM)
    await vi.waitFor(() => expect(deps.refresh).toHaveBeenCalledTimes(1)) // PUT terminé, rechargement en cours
    expect(c.getState().busy[7]).toBe('confirmed')

    await c.run(pending, CONFIRM) // l'ancien statut est encore affiché : le tap est ignoré
    await c.run(pending, CANCEL) // même une autre action est ignorée tant que la ligne est occupée
    expect(deps.send).toHaveBeenCalledTimes(1)

    refresh.resolve(true)
    await first
    expect(c.getState().busy).toEqual({})
    expect(deps.send).toHaveBeenCalledTimes(1)
  })

  it('statut déjà appliqué (rechargement échoué) : un tap sur la même action est ignoré', async () => {
    const { c, deps } = setup({ refresh: vi.fn(async () => false) })
    await c.run(pending, CONFIRM)
    await c.run(pending, CONFIRM)
    expect(deps.send).toHaveBeenCalledTimes(1)
  })
})

describe('ligne occupée', () => {
  it('la ligne reste occupée jusqu’à la fin du rechargement, pas du PUT', async () => {
    const send = deferred<void>()
    const refresh = deferred<boolean>()
    const { c, deps } = setup({ send: vi.fn(() => send.promise), refresh: vi.fn(() => refresh.promise) })
    const p = c.run(pending, CONFIRM)
    expect(c.getState().busy).toEqual({ 7: 'confirmed' })
    send.resolve()
    await vi.waitFor(() => expect(deps.refresh).toHaveBeenCalled())
    expect(c.getState().busy).toEqual({ 7: 'confirmed' })
    expect(c.getState().applied).toEqual({ 7: 'confirmed' })
    refresh.resolve(true)
    await p
    expect(c.getState().busy).toEqual({})
    expect(c.getState().applied).toEqual({})
  })

  it('une autre ligne n’est pas bloquée', async () => {
    const send = deferred<void>()
    const { c, deps } = setup({ send: vi.fn(() => send.promise) })
    const first = c.run(pending, CONFIRM)
    const second = c.run(other, CONFIRM)
    await vi.waitFor(() => expect(deps.send).toHaveBeenCalledTimes(2))
    expect(Object.keys(c.getState().busy).sort()).toEqual(['7', '8'])
    send.resolve()
    await Promise.all([first, second])
    expect(c.getState().busy).toEqual({})
  })

  it('annulation du dialogue de confirmation : aucun PUT, ligne libre ; un double tap n’ouvre qu’un dialogue', async () => {
    const answer = deferred<boolean>()
    const confirmFor = vi.fn((_r: Reservation, a: { needsConfirm: boolean }) => (a.needsConfirm ? answer.promise : null))
    const { c, deps } = setup({ confirmFor })
    const a = c.run(pending, CANCEL)
    const b = c.run(pending, CANCEL)
    answer.resolve(false)
    await Promise.all([a, b])
    expect(confirmFor).toHaveBeenCalledTimes(1)
    expect(deps.send).not.toHaveBeenCalled()
    expect(c.getState().busy).toEqual({})
    // la ligne reste utilisable
    await c.run(pending, CONFIRM)
    expect(deps.send).toHaveBeenCalledTimes(1)
  })
})

describe('échec puis Réessayer', () => {
  it('échec du PUT : ligne libérée, échec mémorisé, aucun statut appliqué, pas de rechargement', async () => {
    const send = vi.fn().mockRejectedValueOnce(new Error('Le serveur a rencontré un problème.'))
    const { c, deps } = setup({ send })
    await c.run(pending, CONFIRM)
    expect(c.getState().busy).toEqual({})
    expect(c.getState().applied).toEqual({})
    expect(c.getState().failures[7]).toEqual({ action: CONFIRM, message: 'Le serveur a rencontré un problème.' })
    expect(deps.onFailure).toHaveBeenCalledWith(pending, CONFIRM, 'Le serveur a rencontré un problème.')
    expect(deps.refresh).not.toHaveBeenCalled()
  })

  it('Réessayer : nouveau PUT, l’échec disparaît, le succès rafraîchit', async () => {
    const send = vi.fn().mockRejectedValueOnce(new Error('Réseau')).mockResolvedValueOnce(undefined)
    const { c, deps } = setup({ send })
    await c.run(pending, CONFIRM)
    expect(c.getState().failures[7]).toBeDefined()
    await c.run(pending, c.getState().failures[7].action)
    expect(send).toHaveBeenCalledTimes(2)
    expect(c.getState().failures).toEqual({})
    expect(deps.onSuccess).toHaveBeenCalledTimes(1)
    expect(deps.refresh).toHaveBeenCalledTimes(1)
  })
})

describe('rechargement en échec', () => {
  it('refresh = false : ligne libérée, statut local conservé, avertissement (jamais « occupé » indéfiniment)', async () => {
    const { c, deps } = setup({ refresh: vi.fn(async () => false) })
    await c.run(pending, CONFIRM)
    expect(c.getState().busy).toEqual({})
    expect(c.getState().applied).toEqual({ 7: 'confirmed' })
    expect(deps.onStale).toHaveBeenCalledTimes(1)
    expect(withAppliedStatus(pending, c.getState().applied).status).toBe('confirmed')
  })

  it('refresh qui rejette : même traitement', async () => {
    const { c, deps } = setup({ refresh: vi.fn(async () => Promise.reject(new Error('boom'))) })
    await c.run(pending, CONFIRM)
    expect(c.getState().busy).toEqual({})
    expect(deps.onStale).toHaveBeenCalledTimes(1)
  })

  it('refresh qui ne répond jamais : libéré par le plafond de temps', async () => {
    vi.useFakeTimers()
    const { c, deps } = setup({ refresh: vi.fn(() => new Promise<boolean>(() => {})) })
    const p = c.run(pending, CONFIRM)
    await vi.advanceTimersByTimeAsync(REFRESH_TIMEOUT_MS - 1)
    expect(c.getState().busy).toEqual({ 7: 'confirmed' })
    await vi.advanceTimersByTimeAsync(2)
    await p
    expect(c.getState().busy).toEqual({})
    expect(deps.onStale).toHaveBeenCalledTimes(1)
  })

  it('des données fraîches (reconcile) effacent le statut local, sauf pour une ligne en cours', async () => {
    const { c } = setup({ refresh: vi.fn(async () => false) })
    await c.run(pending, CONFIRM)
    expect(c.getState().applied[7]).toBe('confirmed')
    c.reconcile()
    expect(c.getState().applied).toEqual({})
  })
})

describe('refetch attendable', () => {
  it('numéro de tentative d’une clé de requête', () => {
    expect(attemptOfKey('/api/reservations?date=2026-10-31#0')).toBe(0)
    expect(attemptOfKey('/api/reservations?date=2026-10-31#12')).toBe(12)
    expect(attemptOfKey('')).toBeNaN()
  })
})

describe('câblage des vues', () => {
  it('le hook garde la ligne occupée via le contrôleur et rend le statut local', async () => {
    const { readFileSync } = await import('node:fs')
    const hook = readFileSync('src/components/admin/reservations/use-reservation-actions.ts', 'utf8')
    expect(hook).toContain('createActionController')
    expect(hook).toContain('withStatus')
    for (const f of ['TodayView.tsx', 'ReservationsView.tsx']) {
      const src = readFileSync(`src/components/admin/reservations/${f}`, 'utf8')
      expect(src).toContain('useReservationActions(refetch, res.data)')
      expect(src).toContain('map(withStatus)')
    }
  })
})
