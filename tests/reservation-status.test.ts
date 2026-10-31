/**
 * Reservation status matrix (Phase 15, RSV-01). The UI transitions must stay a
 * subset of what the frozen PUT /api/reservations accepts (any enum value).
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { ReservationStatus } from '../src/types/database'
import {
  RESERVATION_STATUS_ORDER,
  STATUS_FILTER_LABELS,
  STATUS_LABELS,
  UI_TRANSITIONS,
  actionAriaLabel,
  canTransition,
  isActiveForCovers,
  isReservationStatus,
  nextActions,
  statusLabel,
} from '../src/utils/reservation-status'

const ALL: ReservationStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']

describe('status labels', () => {
  it('covers every status with a French label', () => {
    expect(RESERVATION_STATUS_ORDER).toEqual(ALL)
    expect(statusLabel('pending')).toBe('En attente')
    expect(statusLabel('confirmed')).toBe('Confirmée')
    expect(statusLabel('completed')).toBe('Terminée')
    expect(statusLabel('cancelled')).toBe('Annulée')
    expect(statusLabel('no_show')).toBe('Non présenté')
    expect(STATUS_FILTER_LABELS.pending).toBe('À confirmer')
  })
  it('never relies on colour alone: every status has a distinct label', () => {
    const labels = ALL.map((s) => STATUS_LABELS[s].label)
    expect(new Set(labels).size).toBe(ALL.length)
  })
  it('unknown status falls back to the raw value', () => {
    expect(statusLabel('weird' as ReservationStatus)).toBe('weird')
  })
})

describe('transition matrix (exhaustive 5 x 5)', () => {
  const allowed: Record<ReservationStatus, ReservationStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'no_show', 'cancelled'],
    completed: [],
    cancelled: [],
    no_show: [],
  }
  for (const from of ALL) {
    for (const to of ALL) {
      it(`${from} -> ${to}: ${allowed[from].includes(to) ? 'allowed' : 'refused'}`, () => {
        expect(canTransition(from, to)).toBe(allowed[from].includes(to))
      })
    }
  }
  it('no self transition, "Rétablir" (no_show -> confirmed) is not coded', () => {
    expect(canTransition('no_show', 'confirmed')).toBe(false)
    for (const s of ALL) expect(canTransition(s, s)).toBe(false)
  })
  it('UI_TRANSITIONS is a subset of the statuses PUT accepts (route enum)', () => {
    const src = readFileSync('src/app/api/reservations/route.ts', 'utf8')
    const block = /RESERVATION_STATUSES[^=]*=\s*\[([^\]]*)\]/.exec(src)?.[1] ?? ''
    const putEnum = [...block.matchAll(/'([a-z_]+)'/g)].map((m) => m[1])
    expect(putEnum.sort()).toEqual([...ALL].sort())
    for (const from of ALL) for (const to of UI_TRANSITIONS[from]) expect(putEnum).toContain(to)
  })
})

describe('nextActions', () => {
  it('pending: Confirmer (primary), Annuler (confirm dialog)', () => {
    expect(nextActions('pending').map((a) => [a.label, a.to, a.needsConfirm, a.emphasis])).toEqual([
      ['Confirmer', 'confirmed', false, 'primary'],
      ['Annuler', 'cancelled', true, 'danger-outline'],
    ])
  })
  it('confirmed: Terminer (primary), Absent, Annuler', () => {
    expect(nextActions('confirmed').map((a) => [a.label, a.to, a.needsConfirm, a.emphasis])).toEqual([
      ['Terminer', 'completed', false, 'primary'],
      ['Absent', 'no_show', true, 'secondary'],
      ['Annuler', 'cancelled', true, 'danger-outline'],
    ])
  })
  it.each(['completed', 'cancelled', 'no_show'] as const)('%s: no action', (s) => {
    expect(nextActions(s)).toEqual([])
  })
  it.each(ALL)('%s: actions agree with canTransition, one primary max, only cancel and Absent ask confirmation', (s) => {
    const actions = nextActions(s)
    expect(actions.map((a) => a.to)).toEqual(UI_TRANSITIONS[s])
    for (const a of actions) expect(canTransition(s, a.to)).toBe(true)
    expect(actions.filter((a) => a.emphasis === 'primary').length).toBeLessThanOrEqual(1)
    for (const a of actions) expect(a.needsConfirm).toBe(a.to === 'cancelled' || a.to === 'no_show')
    for (const a of actions) expect(a.busyLabel.length).toBeGreaterThan(0)
  })
  it('returns copies (mutating the result does not alter the table)', () => {
    const a = nextActions('pending')
    a[0].label = 'x'
    a.pop()
    expect(nextActions('pending')).toHaveLength(2)
    expect(nextActions('pending')[0].label).toBe('Confirmer')
  })
})

describe('helpers', () => {
  it('isReservationStatus', () => {
    expect(isReservationStatus('no_show')).toBe(true)
    expect(isReservationStatus('NO_SHOW')).toBe(false)
    expect(isReservationStatus(undefined)).toBe(false)
    expect(isReservationStatus(3)).toBe(false)
  })
  it('isActiveForCovers excludes cancelled and no_show only', () => {
    expect(ALL.filter(isActiveForCovers)).toEqual(['pending', 'confirmed', 'completed'])
  })
  it('actionAriaLabel', () => {
    const [confirm] = nextActions('pending')
    expect(actionAriaLabel(confirm, 'Anna Schmidt', '19:30')).toBe('Confirmer la réservation de Anna Schmidt, 19:30')
    const noShow = nextActions('confirmed')[1]
    expect(actionAriaLabel(noShow, 'Luc', '12:00')).toBe('Marquer absente la réservation de Luc, 12:00')
  })
})
