/**
 * « Complet ce soir » (ACC-03, phase 17) : logique pure, sans framework ni base.
 *
 * Modèle retenu : un horaire exceptionnel (`gecko_special_hours`) de la date qui se termine à 16:00
 * (fin du déjeuner). La disponibilité publique et la validation serveur de la création lisent DÉJÀ
 * `gecko_special_hours` via `resolveHours` / `checkSlot` (src/utils/reservation-rules.ts) : aucun
 * élément figé (API de réservation, fonction SQL, emails, cron, KPI) n'est modifié.
 *
 * Réversibilité : l'état précédent de la date (ligne exceptionnelle existante, ou absence de ligne)
 * est mémorisé dans `gecko_restaurant_settings` sous la clé `service_closure_prev:YYYY-MM-DD`
 * (JSON), jamais dans `note`/`title` de l'horaire (affichés publiquement par HoursDisplay).
 */

import { bangkokNow, dayOfWeek, toMinutes, type HoursRow } from './reservation-rules'
import { SERVICE_SPLIT_MINUTES, isYmd, addDaysYmd } from './krabi-time'

/**
 * Titre de la ligne exceptionnelle posée par « Complet ce soir » (affiché publiquement). Ce titre ne
 * suffit PAS à reconnaître une fermeture (une exception créée à la main peut le porter) : le marqueur
 * est la clé mémoire `service_closure_prev:<date>`, non affichée (voir `isClosureRow`).
 */
export const CLOSURE_TITLE = 'Dîner complet'
/** Fin de service posée : le déjeuner (dernier créneau 13:30) reste réservable, pas le dîner (dès 18:00). */
export const CLOSURE_CLOSE_TIME = '16:00:00'
export const CLOSURE_MEMORY_PREFIX = 'service_closure_prev:'
/** Même borne que checkSlot (180 jours). */
export const CLOSURE_MAX_DAYS_AHEAD = 180

export function memoryKey(date: string): string {
  return `${CLOSURE_MEMORY_PREFIX}${date}`
}

/** Ligne `gecko_special_hours` telle que lue/écrite (hors id et horodatages). */
export type SpecialRow = {
  date: string
  title: string | null
  is_open: boolean | null
  open_time: string | null
  close_time: string | null
  note: string | null
}

/** Valeurs d'une ligne exceptionnelle à restaurer à l'identique. */
export type SpecialSnapshot = Pick<SpecialRow, 'title' | 'is_open' | 'open_time' | 'close_time' | 'note'>

export type WeeklyRow = HoursRow & { day_of_week: number }

/** Vrai si la ligne porte le titre de fermeture (indice seulement, jamais une preuve). */
export function hasClosureTitle(row: Pick<SpecialRow, 'title'> | null | undefined): boolean {
  return !!row && row.title === CLOSURE_TITLE
}

/**
 * Une date est « fermée par Complet ce soir » si sa ligne exceptionnelle porte le titre de fermeture
 * ET que la clé mémoire `service_closure_prev:<date>` existe (marqueur explicite, non affiché).
 * `memoryRaw` : valeur lue de cette clé, ou null / undefined si la clé est absente.
 */
export function isClosureRow(row: Pick<SpecialRow, 'title'> | null | undefined, memoryRaw: string | null | undefined): boolean {
  return hasClosureTitle(row) && typeof memoryRaw === 'string'
}

export type DateCheck = { ok: true } | { ok: false; code: 'invalid_date' | 'date_past' | 'date_too_far' }

/** Date acceptable : calendrier réel, pas dans le passé (heure de Krabi), pas au-delà de 180 jours. */
export function checkClosureDate(date: unknown, now: Date = new Date()): DateCheck {
  if (typeof date !== 'string' || !isYmd(date)) return { ok: false, code: 'invalid_date' }
  const today = bangkokNow(now).date
  if (date < today) return { ok: false, code: 'date_past' }
  if (date > addDaysYmd(today, CLOSURE_MAX_DAYS_AHEAD)) return { ok: false, code: 'date_too_far' }
  return { ok: true }
}

export type ClosePlan =
  | { ok: true; alreadyClosed: true }
  | { ok: true; alreadyClosed: false; prev: SpecialSnapshot | null; next: SpecialSnapshot }
  | { ok: false; code: 'invalid_date' | 'date_past' | 'date_too_far' | 'already_closed_day' }

/**
 * Calcule la fermeture du dîner d'une date.
 *  - ligne déjà posée par cette fonctionnalité : idempotent, rien à écrire ;
 *  - jour sans service du soir (fermé, ou fin de service <= 16:00) : refus `already_closed_day` ;
 *  - ouverture exceptionnelle uniquement le soir (ouvre >= 16:00) : la journée entière est fermée ;
 *  - sinon : même ouverture, fin de service ramenée à 16:00.
 */
export function planClose(input: {
  date: unknown
  regular: readonly WeeklyRow[]
  special: SpecialRow | null
  /** Valeur de la clé mémoire de la date (absente : null). Sans elle, un titre identique n'est pas une fermeture. */
  memoryRaw?: string | null
  now?: Date
}): ClosePlan {
  const dateCheck = checkClosureDate(input.date, input.now)
  if (!dateCheck.ok) return dateCheck
  const date = input.date as string

  if (isClosureRow(input.special, input.memoryRaw)) return { ok: true, alreadyClosed: true }

  const effective: HoursRow | null = input.special ?? input.regular.find((r) => r.day_of_week === dayOfWeek(date)) ?? null
  if (!effective || !effective.is_open || !effective.open_time || !effective.close_time) {
    return { ok: false, code: 'already_closed_day' }
  }
  if (toMinutes(effective.close_time) <= SERVICE_SPLIT_MINUTES) return { ok: false, code: 'already_closed_day' }

  const prev: SpecialSnapshot | null = input.special
    ? {
        title: input.special.title,
        is_open: input.special.is_open,
        open_time: input.special.open_time,
        close_time: input.special.close_time,
        note: input.special.note,
      }
    : null

  if (toMinutes(effective.open_time) >= SERVICE_SPLIT_MINUTES) {
    return { ok: true, alreadyClosed: false, prev, next: { title: CLOSURE_TITLE, is_open: false, open_time: null, close_time: null, note: null } }
  }
  return {
    ok: true,
    alreadyClosed: false,
    prev,
    next: { title: CLOSURE_TITLE, is_open: true, open_time: effective.open_time, close_time: CLOSURE_CLOSE_TIME, note: null },
  }
}

export type ReopenPlan =
  | { action: 'noop' }
  | { action: 'delete' }
  | { action: 'restore'; snapshot: SpecialSnapshot }

/** Mémoire stockée : `{ "prev": null | snapshot }`. */
export function serializeMemory(prev: SpecialSnapshot | null): string {
  return JSON.stringify({ prev })
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/

function isNullableString(v: unknown): v is string | null {
  return v === null || typeof v === 'string'
}

/** Lecture stricte : toute forme inattendue renvoie `undefined` (jamais d'exception, jamais de valeur devinée). */
export function parseMemory(raw: string | null | undefined): { prev: SpecialSnapshot | null } | undefined {
  if (typeof raw !== 'string') return undefined
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return undefined
  }
  if (typeof json !== 'object' || json === null || !('prev' in json)) return undefined
  const prev = (json as { prev: unknown }).prev
  if (prev === null) return { prev: null }
  if (typeof prev !== 'object') return undefined
  const p = prev as Record<string, unknown>
  const isOpen = p.is_open
  const times = [p.open_time, p.close_time]
  if (!(isOpen === null || typeof isOpen === 'boolean')) return undefined
  if (!isNullableString(p.title) || !isNullableString(p.note)) return undefined
  if (!times.every((t) => t === null || (typeof t === 'string' && TIME_RE.test(t)))) return undefined
  return {
    prev: {
      title: p.title as string | null,
      is_open: isOpen as boolean | null,
      open_time: p.open_time as string | null,
      close_time: p.close_time as string | null,
      note: p.note as string | null,
    },
  }
}

/**
 * Réouverture. Pas de fermeture reconnue (ligne absente, ou clé mémoire absente : exception
 * créée à la main) : rien à faire, l'exception est conservée (idempotent). Mémoire présente mais illisible :
 * on supprime la ligne de fermeture (retour aux horaires hebdomadaires), c'est le seul état sûr.
 */
export function planReopen(special: SpecialRow | null, memoryRaw: string | null | undefined): ReopenPlan {
  if (!isClosureRow(special, memoryRaw)) return { action: 'noop' }
  const memory = parseMemory(memoryRaw)
  if (!memory || memory.prev === null) return { action: 'delete' }
  return { action: 'restore', snapshot: memory.prev }
}
