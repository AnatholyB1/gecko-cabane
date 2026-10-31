/**
 * Logique pure de la section « Site public » (SITE-01, SITE-02) : aucune dépendance
 * à React ni au navigateur, entièrement testée (tests/site-public-logic.test.ts).
 *
 * Les routes API ne changent pas : horaires (`/api/hours`), horaires exceptionnels
 * (`/api/special-hours`), annonce (`/api/announcement`), réglages (`/api/settings`).
 */
import type { Announcement, OpeningHours, SpecialHours } from '@/types/database'
import { AdminFetchError } from '../admin-fetch'

// ---------------------------------------------------------------------------
// Onglets
// ---------------------------------------------------------------------------

export const SITE_TABS = [
  { id: 'horaires', label: 'Horaires' },
  { id: 'exceptions', label: 'Exceptions' },
  { id: 'annonces', label: 'Annonces' },
  { id: 'capacite', label: 'Capacité' },
] as const

export type SiteTabId = (typeof SITE_TABS)[number]['id']

export const DEFAULT_SITE_TAB: SiteTabId = 'horaires'

/** Onglet désigné par une ancre d'URL (`#annonces`), sinon `fallback`. */
export function tabFromHash(hash: string, fallback: SiteTabId = DEFAULT_SITE_TAB): SiteTabId {
  const id = hash.replace(/^#/, '')
  return SITE_TABS.find((t) => t.id === id)?.id ?? fallback
}

export function isTabHash(hash: string): boolean {
  return SITE_TABS.some((t) => `#${t.id}` === hash)
}

// ---------------------------------------------------------------------------
// Messages d'erreur lisibles (jamais de code HTTP ni de trace)
// ---------------------------------------------------------------------------

/** Phrase française pour une erreur d'enregistrement : ce qui s'est passé, sans jargon. */
export function describeSaveError(error: unknown): string {
  if (error instanceof AdminFetchError) {
    if (error.status === 0) return 'La connexion a été perdue.'
    if (error.status === 401) return 'Votre session a expiré. Reconnectez-vous.'
    if (error.status === 403) return 'Ce compte n’a pas le droit de modifier ces données.'
    if (error.status === 400) return 'Le serveur a refusé ces valeurs.'
    if (error.status === 429) return 'Trop de requêtes. Patientez un instant.'
    return 'Le serveur a rencontré un problème.'
  }
  return 'Une erreur inattendue est survenue.'
}

export const NOTHING_LOST = 'Vos modifications sont toujours affichées ci-dessous : rien n’est perdu. Réessayez.'

// ---------------------------------------------------------------------------
// Horaires
// ---------------------------------------------------------------------------

/** Affichage lundi → dimanche ; les données restent 0 = dimanche. */
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const
export const DAY_LABELS: Record<number, string> = {
  0: 'Dimanche',
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
}
export const DEFAULT_OPEN = '12:00'
export const DEFAULT_CLOSE = '22:00'

export type HourRow = {
  day_of_week: number
  is_open: boolean
  open_time: string
  close_time: string
}

/** « 12:00:00 » → « 12:00 » ; vide si absent. */
export function toClock(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : ''
}

/** Lignes d'édition, dans l'ordre lundi → dimanche. Un jour absent de la base n'est pas inventé. */
export function toHourRows(data: OpeningHours[]): HourRow[] {
  return DAY_ORDER.flatMap((dow) => {
    const row = data.find((h) => h.day_of_week === dow)
    if (!row) return []
    return [
      {
        day_of_week: dow,
        is_open: row.is_open,
        // Un jour fermé n'a pas d'heures en base : valeurs par défaut prêtes si on le rouvre.
        open_time: toClock(row.open_time) || DEFAULT_OPEN,
        close_time: toClock(row.close_time) || DEFAULT_CLOSE,
      },
    ]
  })
}

/** Deux lignes sont égales pour l'enregistrement : les heures d'un jour fermé ne comptent pas. */
export function sameHourRow(a: HourRow, b: HourRow): boolean {
  if (a.is_open !== b.is_open) return false
  return !a.is_open || (a.open_time === b.open_time && a.close_time === b.close_time)
}

export function changedDays(current: HourRow[], saved: HourRow[]): number[] {
  return current
    .filter((row) => {
      const base = saved.find((s) => s.day_of_week === row.day_of_week)
      return !base || !sameHourRow(row, base)
    })
    .map((r) => r.day_of_week)
}

/** Corps de `PUT /api/hours` : tous les jours d'un coup, comme avant. */
export function hoursPayload(rows: HourRow[]) {
  return {
    hours: rows.map((r) => ({
      day_of_week: r.day_of_week,
      is_open: r.is_open,
      open_time: r.is_open ? r.open_time : null,
      close_time: r.is_open ? r.close_time : null,
    })),
  }
}

/** Erreur de champ par jour (heure manquante) ; `{}` si tout est valide. */
export function validateHours(rows: HourRow[]): Record<number, string> {
  const out: Record<number, string> = {}
  for (const r of rows) {
    if (!r.is_open) continue
    if (!r.open_time) out[r.day_of_week] = 'Indiquez l’heure d’ouverture.'
    else if (!r.close_time) out[r.day_of_week] = 'Indiquez l’heure de fermeture.'
  }
  return out
}

export type PreviewHourRow = { dow: number; label: string; text: string; today: boolean }

/** Aperçu public : un jour par ligne, le jour courant (Krabi) marqué. */
export function previewHours(rows: HourRow[], todayDow: number): PreviewHourRow[] {
  return rows.map((r) => ({
    dow: r.day_of_week,
    label: DAY_LABELS[r.day_of_week] + (r.day_of_week === todayDow ? ' (aujourd’hui)' : ''),
    text: r.is_open ? `${r.open_time || '--:--'} – ${r.close_time || '--:--'}` : 'Fermé',
    today: r.day_of_week === todayDow,
  }))
}

/** Jour de la semaine (0 = dimanche) d'une date AAAA-MM-JJ, sans fuseau. */
export function dayOfWeekOf(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

// ---------------------------------------------------------------------------
// Horaires exceptionnels
// ---------------------------------------------------------------------------

export type ExceptionForm = {
  date: string
  title: string
  is_open: boolean
  open_time: string
  close_time: string
  note: string
}

export const EMPTY_EXCEPTION: ExceptionForm = {
  date: '',
  title: '',
  is_open: true,
  open_time: DEFAULT_OPEN,
  close_time: DEFAULT_CLOSE,
  note: '',
}

export type ExceptionErrors = Partial<Record<'date' | 'open_time' | 'close_time', string>>

export function validateException(f: ExceptionForm): ExceptionErrors {
  const errors: ExceptionErrors = {}
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) errors.date = 'Choisissez la date de l’exception.'
  if (f.is_open) {
    if (!f.open_time) errors.open_time = 'Indiquez l’heure d’ouverture.'
    else if (!f.close_time) errors.close_time = 'Indiquez l’heure de fermeture.'
  }
  return errors
}

/** Corps de `POST /api/special-hours` (identique à l'ancienne page). */
export function exceptionPayload(f: ExceptionForm) {
  return {
    date: f.date,
    title: f.title.trim(),
    is_open: f.is_open,
    open_time: f.open_time,
    close_time: f.close_time,
    note: f.note.trim(),
  }
}

/** Date longue française d'une date AAAA-MM-JJ (« jeudi 24 décembre 2026 »), sans décalage de fuseau. */
export function formatLongDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return ymd
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/** Date courte (« 24/12/2026 »). */
export function formatShortDate(ymd: string): string {
  const [y, m, d] = ymd.split('-')
  return y && m && d ? `${d}/${m}/${y}` : ymd
}

/** Exceptions à venir (aujourd'hui compris) et passées, chacune triée par date croissante. */
export function splitExceptions(list: SpecialHours[], todayYmd: string): { upcoming: SpecialHours[]; past: SpecialHours[] } {
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date))
  return {
    upcoming: sorted.filter((e) => e.date >= todayYmd),
    past: sorted.filter((e) => e.date < todayYmd).reverse(),
  }
}

/** « Ouvert 12:00 – 23:00 » ou « Fermé ». */
export function exceptionHoursText(e: Pick<SpecialHours, 'is_open' | 'open_time' | 'close_time'>): string {
  return e.is_open ? `Ouvert ${toClock(e.open_time)} – ${toClock(e.close_time)}` : 'Fermé'
}

// ---------------------------------------------------------------------------
// Annonce
// ---------------------------------------------------------------------------

export const BANNER_COLORS = [
  { value: 'amber', label: 'Orange' },
  { value: 'green', label: 'Vert' },
  { value: 'red', label: 'Rouge' },
  { value: 'blue', label: 'Bleu' },
  { value: 'purple', label: 'Violet' },
] as const

export type BannerColor = (typeof BANNER_COLORS)[number]['value']

export type AnnouncementForm = {
  title: string
  content: string
  is_active: boolean
  bg_color: BannerColor
  start_date: string
  end_date: string
}

export const EMPTY_ANNOUNCEMENT: AnnouncementForm = {
  title: '',
  content: '',
  is_active: false,
  bg_color: 'amber',
  start_date: '',
  end_date: '',
}

export function toAnnouncementForm(a: Partial<Announcement> | null | undefined): AnnouncementForm {
  if (!a) return EMPTY_ANNOUNCEMENT
  const color = BANNER_COLORS.find((c) => c.value === a.bg_color)?.value ?? 'amber'
  return {
    title: a.title ?? '',
    content: a.content ?? '',
    is_active: a.is_active ?? false,
    bg_color: color,
    start_date: a.start_date ?? '',
    end_date: a.end_date ?? '',
  }
}

export function sameAnnouncement(a: AnnouncementForm, b: AnnouncementForm): boolean {
  return (
    a.title === b.title &&
    a.content === b.content &&
    a.is_active === b.is_active &&
    a.bg_color === b.bg_color &&
    a.start_date === b.start_date &&
    a.end_date === b.end_date
  )
}

export type AnnouncementErrors = Partial<Record<'content' | 'end_date', string>>

export function validateAnnouncement(f: AnnouncementForm): AnnouncementErrors {
  const errors: AnnouncementErrors = {}
  if (f.is_active && !f.content.trim()) errors.content = 'Écrivez le message de la bannière, ou masquez-la.'
  if (f.start_date && f.end_date && f.end_date < f.start_date) errors.end_date = 'La date de fin doit être le jour du début ou après.'
  return errors
}

/** Corps de `PUT /api/announcement` (identique à l'ancienne page). */
export function announcementPayload(f: AnnouncementForm) {
  return {
    title: f.title.trim(),
    content: f.content,
    is_active: f.is_active,
    bg_color: f.bg_color,
    start_date: f.start_date,
    end_date: f.end_date,
  }
}

export type AnnouncementStatus =
  | { kind: 'none' }
  | { kind: 'hidden' }
  | { kind: 'scheduled'; start: string; end: string }
  | { kind: 'live' }
  | { kind: 'ended'; end: string }

/**
 * État de la bannière côté site, avec la même règle que `AnnouncementBanner` :
 * affichée si active, avec un message, et si aujourd'hui (Krabi) est dans la plage (bornes comprises).
 */
export function announcementStatus(f: AnnouncementForm, todayYmd: string): AnnouncementStatus {
  if (!f.content.trim()) return { kind: 'none' }
  if (!f.is_active) return { kind: 'hidden' }
  if (f.start_date && f.start_date > todayYmd) return { kind: 'scheduled', start: f.start_date, end: f.end_date }
  if (f.end_date && f.end_date < todayYmd) return { kind: 'ended', end: f.end_date }
  return { kind: 'live' }
}

export function announcementStatusText(s: AnnouncementStatus): string {
  switch (s.kind) {
    case 'none':
      return 'Aucune bannière'
    case 'hidden':
      return 'Masquée'
    case 'live':
      return 'Affichée maintenant'
    case 'ended':
      return `Terminée le ${formatShortDate(s.end)}`
    case 'scheduled':
      return s.end ? `Programmée du ${formatShortDate(s.start)} au ${formatShortDate(s.end)}` : `Programmée dès le ${formatShortDate(s.start)}`
  }
}

// ---------------------------------------------------------------------------
// Capacité
// ---------------------------------------------------------------------------

export const COVERS_KEY = 'max_covers'
export const DURATION_KEY = 'table_block_duration_minutes'
export const COVERS_RANGE = { min: 1, max: 200 } as const
export const DURATION_RANGE = { min: 30, max: 480, step: 15 } as const
export const DEFAULT_COVERS = 40
export const DEFAULT_DURATION = 120
export const DURATION_CHIPS = [60, 90, 120, 150, 180] as const

export type CapacityForm = { covers: string; duration: string }

/** Entier strict : « 40 » oui ; « 4,5 », « 40 minutes », « » non. */
export function parseWholeNumber(value: string): number | null {
  const v = value.trim()
  return /^\d{1,6}$/.test(v) ? Number(v) : null
}

export type CapacityErrors = Partial<Record<'covers' | 'duration', string>>

export function validateCapacity(f: CapacityForm): CapacityErrors {
  const errors: CapacityErrors = {}
  const c = parseWholeNumber(f.covers)
  if (c === null || c < COVERS_RANGE.min || c > COVERS_RANGE.max) {
    errors.covers = `Entrez un nombre de couverts entre ${COVERS_RANGE.min} et ${COVERS_RANGE.max}.${f.covers.trim() ? ` Vous avez saisi ${f.covers.trim()}.` : ''}`
  }
  const d = parseWholeNumber(f.duration)
  if (d === null || d < DURATION_RANGE.min || d > DURATION_RANGE.max) {
    errors.duration = `Entrez une durée entre ${DURATION_RANGE.min} et ${DURATION_RANGE.max} minutes.${f.duration.trim() ? ` Vous avez saisi ${f.duration.trim()}.` : ''}`
  }
  return errors
}

/** Corps de `PUT /api/settings` : les deux valeurs, en nombres. */
export function capacityPayload(f: CapacityForm): Record<string, number> {
  return { [COVERS_KEY]: Number(f.covers), [DURATION_KEY]: Number(f.duration) }
}

/** Valeur d'un réglage lu depuis `GET /api/settings` (repli si la ligne n'existe pas). */
export function settingValue(rows: { key: string; value: string }[], key: string, fallback: number): string {
  const row = rows.find((r) => r.key === key)
  return row && parseWholeNumber(row.value) !== null ? row.value.trim() : String(fallback)
}

/** Pas de ±15 minutes ou ±1 couvert, borné. */
export function stepValue(current: string, delta: number, min: number, max: number): string {
  const n = parseWholeNumber(current)
  const base = n === null ? min : n
  return String(Math.min(max, Math.max(min, base + delta)))
}

/** 120 → « 2 h 00 » ; 90 → « 1 h 30 » ; 45 → « 45 min ». */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h} h ${String(m).padStart(2, '0')}`
}

export const TIMELINE_START = 12 * 60
export const TIMELINE_END = 22 * 60
export const EXAMPLE_ARRIVAL = 19 * 60

function clock(minutes: number): string {
  return `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** Frise 12 h – 22 h : une réservation à 19:00 occupe la durée choisie (pourcentages de la frise). */
export function capacityTimeline(durationMinutes: number): { left: number; width: number; endClock: string; beyondClosing: boolean } {
  const span = TIMELINE_END - TIMELINE_START
  const end = EXAMPLE_ARRIVAL + durationMinutes
  const visibleEnd = Math.min(end, TIMELINE_END)
  return {
    left: ((EXAMPLE_ARRIVAL - TIMELINE_START) / span) * 100,
    width: (Math.max(0, visibleEnd - EXAMPLE_ARRIVAL) / span) * 100,
    endClock: clock(end),
    beyondClosing: end > TIMELINE_END,
  }
}
