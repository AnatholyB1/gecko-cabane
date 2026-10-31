/**
 * Phase 15 (RSV-01..05) : l'API de réservation est figée, l'interface envoie EXACTEMENT les mêmes
 * requêtes que l'ancienne page. Les « anciennes » expressions ci-dessous sont la transcription
 * littérale du code de src/app/admin/(app)/reservations/page.tsx et ManualReservationForm.tsx
 * avant la phase 15 (commit 9264722) ; le test compare octet pour octet les corps JSON.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { adminFetch } from '../src/components/admin/admin-fetch'
import {
  deleteUrl,
  dayUrl,
  manualReservationBody,
  notesUpdateBody,
  sourceUpdateBody,
  statusUpdateBody,
  MANUAL_RESERVATION_URL,
  RESERVATIONS_URL,
} from '../src/components/admin/reservations/requests'
import { validateManualReservation } from '../src/utils/manual-reservation'
import { RESERVATION_STATUS_ORDER } from '../src/utils/reservation-status'
import type { ReservationSource, ReservationStatus } from '../src/types/database'

// --- Transcription littérale de l'ancien code (ne pas « améliorer ») -------------------------
const OLD_STATUS_BODY = (id: number, newStatus: ReservationStatus) => JSON.stringify({ id, status: newStatus })
const OLD_SOURCE_BODY = (id: number, source: ReservationSource) => JSON.stringify({ id, source })
const OLD_NOTES_BODY = (selected: { id: number }, adminNotes: string) =>
  JSON.stringify({ id: selected.id, admin_notes: adminNotes })
const OLD_DELETE_URL = (id: number) => `/api/reservations?id=${id}`
const OLD_DAY_URL = (filterDate: string) => {
  let url = '/api/reservations?'
  url += `date=${filterDate}`
  return url
}
function OLD_MANUAL_BODY(form: HTMLFormElementLike) {
  const fd = form.fd
  const payload = {
    customer_name: String(fd.get('customer_name') ?? ''),
    customer_phone: String(fd.get('customer_phone') ?? ''),
    customer_email: String(fd.get('customer_email') ?? ''),
    reservation_date: String(fd.get('reservation_date') ?? ''),
    reservation_time: String(fd.get('reservation_time') ?? ''),
    party_size: Number(fd.get('party_size')),
    source: String(fd.get('source') ?? ''),
    admin_notes: String(fd.get('admin_notes') ?? ''),
  }
  return JSON.stringify(payload)
}
type HTMLFormElementLike = { fd: FormData }

const formData = (entries: Record<string, string>) => {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) fd.set(k, v)
  return fd
}

afterEach(() => vi.unstubAllGlobals())

describe('PUT /api/reservations : corps identiques à l’ancienne page', () => {
  it.each(RESERVATION_STATUS_ORDER)('statut %s', (status) => {
    expect(JSON.stringify(statusUpdateBody(42, status))).toBe(OLD_STATUS_BODY(42, status))
  })
  it.each(['site', 'whatsapp', 'telephone', 'sans_reservation'] as const)('source %s', (s) => {
    expect(JSON.stringify(sourceUpdateBody(7, s))).toBe(OLD_SOURCE_BODY(7, s))
  })
  it('notes admin', () => {
    expect(JSON.stringify(notesUpdateBody(7, 'Table calme'))).toBe(OLD_NOTES_BODY({ id: 7 }, 'Table calme'))
    expect(JSON.stringify(notesUpdateBody(7, ''))).toBe(OLD_NOTES_BODY({ id: 7 }, ''))
  })
  it('DELETE et GET du jour : mêmes URL', () => {
    expect(deleteUrl(9)).toBe(OLD_DELETE_URL(9))
    expect(dayUrl('2026-11-01')).toBe(OLD_DAY_URL('2026-11-01'))
    expect(RESERVATIONS_URL).toBe('/api/reservations')
  })
})

describe('requête réellement émise par adminFetch (corps, méthode, en-tête de contenu)', () => {
  it('PUT statut = {"id":42,"status":"confirmed"}', async () => {
    const fetchMock = vi.fn(async () => new Response('{"data":{}}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await adminFetch(RESERVATIONS_URL, { method: 'PUT', json: statusUpdateBody(42, 'confirmed') })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/reservations')
    expect(init.method).toBe('PUT')
    expect(init.body).toBe(OLD_STATUS_BODY(42, 'confirmed'))
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json')
  })
  it('POST manuel : même corps que l’ancien formulaire', async () => {
    const fetchMock = vi.fn(async () => new Response('{"data":{"id":1}}', { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    const fd = formData({
      customer_name: 'Somchai',
      customer_phone: '+66 81 234 5678',
      customer_email: '',
      reservation_date: '2026-11-03',
      reservation_time: '19:30',
      party_size: '4',
      source: 'whatsapp',
      admin_notes: '',
    })
    await adminFetch(MANUAL_RESERVATION_URL, { method: 'POST', json: manualReservationBody(fd) })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/reservations/manual')
    expect(init.method).toBe('POST')
    expect(init.body).toBe(OLD_MANUAL_BODY({ fd }))
  })
})

describe('POST /api/reservations/manual : corps du formulaire', () => {
  const base = {
    customer_name: 'Anna Schmidt',
    customer_phone: '',
    customer_email: 'a@b.co',
    reservation_date: '2026-11-03',
    reservation_time: '20:00',
    party_size: '12',
    source: 'sans_reservation',
    admin_notes: 'Fenêtre',
  }
  it('sans allergie : identique à l’ancien corps, octet pour octet', () => {
    const fd = formData(base)
    expect(JSON.stringify(manualReservationBody(fd))).toBe(OLD_MANUAL_BODY({ fd }))
  })
  it('allergie vide ou blanche : le champ est omis (corps historique)', () => {
    for (const a of ['', '   ']) {
      const fd = formData({ ...base, allergies: a })
      expect(JSON.stringify(manualReservationBody(fd))).toBe(OLD_MANUAL_BODY({ fd }))
    }
  })
  it('champs absents : mêmes valeurs par défaut que l’ancien code (chaînes vides, party_size NaN -> null en JSON)', () => {
    const fd = new FormData()
    expect(JSON.stringify(manualReservationBody(fd))).toBe(OLD_MANUAL_BODY({ fd }))
  })
  it('allergie renseignée : une seule clé ajoutée, en dernier, le reste est inchangé', () => {
    const fd = formData({ ...base, allergies: 'Arachides' })
    const next = manualReservationBody(fd)
    expect(Object.keys(next).slice(0, 8)).toEqual(Object.keys(JSON.parse(OLD_MANUAL_BODY({ fd }))))
    expect(Object.keys(next).at(-1)).toBe('allergies')
    const { allergies, ...rest } = next
    expect(allergies).toBe('Arachides')
    expect(JSON.stringify(rest)).toBe(OLD_MANUAL_BODY({ fd }))
  })
})

describe('validateManualReservation : changement additif (allergies)', () => {
  const valid = {
    customer_name: 'Somchai',
    customer_phone: '+66 81 234 5678',
    reservation_date: '2026-11-03',
    reservation_time: '19:30',
    party_size: 4,
    source: 'whatsapp',
  }
  it('un corps existant donne exactement la même valeur qu’avant (aucune clé allergies)', () => {
    const r = validateManualReservation(valid)
    expect(r.ok && Object.keys(r.value)).toEqual([
      'customer_name', 'customer_phone', 'customer_email', 'reservation_date', 'reservation_time',
      'party_size', 'admin_notes', 'locale', 'source',
    ])
  })
  it('allergies vide, blanche ou null : ignorée, jamais refusée', () => {
    for (const a of ['', '   ', null, undefined]) {
      const r = validateManualReservation({ ...valid, allergies: a })
      expect(r.ok && 'allergies' in r.value).toBe(false)
    }
  })
  it('allergies renseignée : normalisée (trim) et transmise', () => {
    const r = validateManualReservation({ ...valid, allergies: ' Arachides, gluten ' })
    expect(r.ok && r.value.allergies).toBe('Arachides, gluten')
  })
  it('allergies invalide : refusée avec un message clair', () => {
    expect(validateManualReservation({ ...valid, allergies: 5 })).toEqual({ ok: false, error: 'Allergies invalides' })
    expect(validateManualReservation({ ...valid, allergies: 'x'.repeat(501) })).toEqual({ ok: false, error: 'Allergies invalides' })
  })
  it('la route et le formulaire public ne sont pas modifiés par la phase 15', () => {
    const route = readFileSync(join(__dirname, '..', 'src/app/api/reservations/route.ts'), 'utf8')
    expect(route).not.toMatch(/allergies/)
    const manualRoute = readFileSync(join(__dirname, '..', 'src/app/api/reservations/manual/route.ts'), 'utf8')
    expect(manualRoute).not.toMatch(/allergies/)
  })
})

describe('aucun composant ne fabrique un corps à la main', () => {
  const dir = join(__dirname, '..', 'src/components/admin/reservations')
  const files = readdirSync(dir).filter((f) => /\.tsx?$/.test(f) && f !== 'requests.ts')
  it.each(files)('%s : ni JSON.stringify ni fetch direct', (f) => {
    const src = readFileSync(join(dir, f), 'utf8')
    expect(src).not.toMatch(/JSON\.stringify|\bfetch\(/)
  })
  it('les écritures passent par adminFetch avec les constructeurs de requests.ts', () => {
    const hook = readFileSync(join(dir, 'use-reservation-actions.ts'), 'utf8')
    expect(hook).toContain('statusUpdateBody(r.id, action.to)')
    const details = readFileSync(join(dir, 'ReservationDetails.tsx'), 'utf8')
    expect(details).toContain('sourceUpdateBody(r.id, source)')
    expect(details).toContain('notesUpdateBody(r.id, notes)')
    expect(details).toContain('deleteUrl(r.id)')
    const form = readFileSync(join(dir, 'ManualReservationForm.tsx'), 'utf8')
    expect(form).toContain('manualReservationBody(fd)')
  })
})
