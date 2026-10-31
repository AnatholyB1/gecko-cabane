/**
 * SITE-01 / SITE-02 : logique pure de la section « Site public »
 * (src/components/admin/site/site-logic.ts) : payloads identiques aux anciennes pages,
 * validations, états de l'aperçu, messages d'erreur lisibles.
 */
import { describe, it, expect } from 'vitest'
import type { OpeningHours, SpecialHours } from '../src/types/database'
import { AdminFetchError } from '../src/components/admin/admin-fetch'
import {
  DAY_LABELS,
  DAY_ORDER,
  EMPTY_ANNOUNCEMENT,
  EMPTY_EXCEPTION,
  SITE_TABS,
  announcementPayload,
  announcementStatus,
  announcementStatusText,
  capacityPayload,
  capacityTimeline,
  changedDays,
  dayOfWeekOf,
  describeSaveError,
  exceptionHoursText,
  exceptionPayload,
  formatDuration,
  formatLongDate,
  hoursPayload,
  isTabHash,
  parseWholeNumber,
  previewHours,
  settingValue,
  splitExceptions,
  stepValue,
  tabFromHash,
  toAnnouncementForm,
  toHourRows,
  validateAnnouncement,
  validateCapacity,
  validateException,
  validateHours,
  type HourRow,
} from '../src/components/admin/site/site-logic'

const api = (dow: number, open: boolean, o: string | null, c: string | null): OpeningHours => ({
  id: dow,
  day_of_week: dow,
  day_name: '',
  is_open: open,
  open_time: o,
  close_time: c,
  created_at: '',
  updated_at: '',
})
const WEEK = [0, 1, 2, 3, 4, 5, 6].map((d) => api(d, d !== 2, d !== 2 ? '12:00:00' : null, d !== 2 ? '22:00:00' : null))

describe('SITE-01 onglets', () => {
  it('quatre onglets dans l’ordre du contrat', () => {
    expect(SITE_TABS.map((t) => t.label)).toEqual(['Horaires', 'Exceptions', 'Annonces', 'Capacité'])
  })
  it('l’ancre désigne l’onglet, sinon le repli', () => {
    expect(tabFromHash('#annonces')).toBe('annonces')
    expect(tabFromHash('#capacite', 'horaires')).toBe('capacite')
    expect(tabFromHash('')).toBe('horaires')
    expect(tabFromHash('#adm-main', 'annonces')).toBe('annonces')
    expect(isTabHash('#exceptions')).toBe(true)
    expect(isTabHash('#adm-main')).toBe(false)
  })
})

describe('SITE-01 horaires', () => {
  it('lundi → dimanche à l’affichage, données inchangées (0 = dimanche)', () => {
    expect(DAY_ORDER).toEqual([1, 2, 3, 4, 5, 6, 0])
    const rows = toHourRows(WEEK)
    expect(rows.map((r) => DAY_LABELS[r.day_of_week])).toEqual(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'])
  })

  it('heures ramenées à HH:MM ; un jour fermé garde des heures par défaut prêtes à rouvrir', () => {
    const rows = toHourRows(WEEK)
    expect(rows[0]).toEqual({ day_of_week: 1, is_open: true, open_time: '12:00', close_time: '22:00' })
    expect(rows[1]).toEqual({ day_of_week: 2, is_open: false, open_time: '12:00', close_time: '22:00' })
  })

  it('un jour absent de la base n’est pas inventé', () => {
    expect(toHourRows([api(1, true, '12:00', '22:00')])).toHaveLength(1)
  })

  it('jours modifiés : les heures d’un jour fermé ne comptent pas', () => {
    const saved = toHourRows(WEEK)
    const cur: HourRow[] = saved.map((r) => ({ ...r }))
    expect(changedDays(cur, saved)).toEqual([])
    cur[1] = { ...cur[1], open_time: '09:00' } // mardi fermé : changement d'heure sans effet
    expect(changedDays(cur, saved)).toEqual([])
    cur[0] = { ...cur[0], close_time: '21:00' }
    cur[2] = { ...cur[2], is_open: false }
    expect(changedDays(cur, saved)).toEqual([1, 3])
  })

  it('PUT /api/hours : tous les jours, heures nulles quand fermé (comme avant)', () => {
    const body = hoursPayload(toHourRows(WEEK))
    expect(Object.keys(body)).toEqual(['hours'])
    expect(body.hours).toHaveLength(7)
    expect(body.hours[0]).toEqual({ day_of_week: 1, is_open: true, open_time: '12:00', close_time: '22:00' })
    expect(body.hours[1]).toEqual({ day_of_week: 2, is_open: false, open_time: null, close_time: null })
  })

  it('une heure manquante est signalée sur le jour concerné', () => {
    const rows = toHourRows(WEEK).map((r) => (r.day_of_week === 4 ? { ...r, open_time: '' } : r))
    expect(validateHours(rows)).toEqual({ 4: 'Indiquez l’heure d’ouverture.' })
    expect(validateHours(toHourRows(WEEK))).toEqual({})
  })

  it('aperçu : jour courant en gras « (aujourd’hui) », jour fermé = Fermé', () => {
    const p = previewHours(toHourRows(WEEK), 6)
    expect(p.find((x) => x.dow === 6)).toMatchObject({ label: 'Samedi (aujourd’hui)', today: true, text: '12:00 – 22:00' })
    expect(p.find((x) => x.dow === 2)?.text).toBe('Fermé')
    expect(p.filter((x) => x.today)).toHaveLength(1)
  })

  it('jour de la semaine d’une date, sans fuseau', () => {
    expect(dayOfWeekOf('2026-10-31')).toBe(6)
    expect(dayOfWeekOf('2026-11-01')).toBe(0)
  })
})

describe('SITE-01 exceptions', () => {
  it('validation : date obligatoire, heures si ouvert', () => {
    expect(validateException(EMPTY_EXCEPTION)).toEqual({ date: 'Choisissez la date de l’exception.' })
    expect(validateException({ ...EMPTY_EXCEPTION, date: '2026-12-24' })).toEqual({})
    expect(validateException({ ...EMPTY_EXCEPTION, date: '2026-12-24', open_time: '' }).open_time).toBeDefined()
    expect(validateException({ ...EMPTY_EXCEPTION, date: '2026-12-24', is_open: false, open_time: '' })).toEqual({})
  })

  it('POST /api/special-hours : mêmes champs qu’avant', () => {
    expect(exceptionPayload({ date: '2026-12-24', title: ' Réveillon ', is_open: true, open_time: '12:00', close_time: '23:00', note: ' ' })).toEqual({
      date: '2026-12-24',
      title: 'Réveillon',
      is_open: true,
      open_time: '12:00',
      close_time: '23:00',
      note: '',
    })
  })

  it('date longue française sans décalage de fuseau', () => {
    expect(formatLongDate('2026-12-24')).toBe('jeudi 24 décembre 2026')
    expect(formatLongDate('2027-01-01')).toBe('vendredi 1 janvier 2027')
  })

  it('à venir (aujourd’hui compris) / passées, triées', () => {
    const mk = (id: number, date: string): SpecialHours => ({ id, date, title: null, is_open: false, open_time: null, close_time: null, note: null, created_at: '', updated_at: '' })
    const { upcoming, past } = splitExceptions([mk(1, '2027-01-01'), mk(2, '2026-10-31'), mk(3, '2026-09-01'), mk(4, '2026-08-01')], '2026-10-31')
    expect(upcoming.map((e) => e.id)).toEqual([2, 1])
    expect(past.map((e) => e.id)).toEqual([3, 4])
  })

  it('texte d’horaire : Ouvert HH:MM – HH:MM ou Fermé', () => {
    expect(exceptionHoursText({ is_open: true, open_time: '12:00:00', close_time: '23:00:00' })).toBe('Ouvert 12:00 – 23:00')
    expect(exceptionHoursText({ is_open: false, open_time: null, close_time: null })).toBe('Fermé')
  })
})

describe('SITE-01 annonce', () => {
  const live = { ...EMPTY_ANNOUNCEMENT, content: 'Fermé le 13 avril', is_active: true }

  it('PUT /api/announcement : mêmes champs qu’avant', () => {
    expect(announcementPayload({ ...live, title: ' Songkran ', bg_color: 'blue', start_date: '2027-03-30', end_date: '2027-04-13' })).toEqual({
      title: 'Songkran',
      content: 'Fermé le 13 avril',
      is_active: true,
      bg_color: 'blue',
      start_date: '2027-03-30',
      end_date: '2027-04-13',
    })
  })

  it('formulaire depuis l’API : null → vide, couleur inconnue → orange', () => {
    expect(toAnnouncementForm(null)).toEqual(EMPTY_ANNOUNCEMENT)
    expect(toAnnouncementForm({ title: null, content: 'x', is_active: true, bg_color: 'zzz' as never, start_date: null, end_date: null })).toMatchObject({ title: '', bg_color: 'amber' })
  })

  it('validation : message exigé quand la bannière est affichée, fin après début', () => {
    expect(validateAnnouncement({ ...EMPTY_ANNOUNCEMENT, is_active: true }).content).toBeDefined()
    expect(validateAnnouncement(EMPTY_ANNOUNCEMENT)).toEqual({})
    expect(validateAnnouncement({ ...live, start_date: '2027-04-13', end_date: '2027-03-30' }).end_date).toBeDefined()
    expect(validateAnnouncement({ ...live, start_date: '2027-03-30', end_date: '2027-03-30' })).toEqual({})
  })

  it('états de la bannière : mêmes règles que le site (bornes comprises)', () => {
    const today = '2026-10-31'
    expect(announcementStatus(EMPTY_ANNOUNCEMENT, today).kind).toBe('none')
    expect(announcementStatus({ ...live, is_active: false }, today).kind).toBe('hidden')
    expect(announcementStatus(live, today).kind).toBe('live')
    expect(announcementStatus({ ...live, start_date: today }, today).kind).toBe('live')
    expect(announcementStatus({ ...live, end_date: today }, today).kind).toBe('live')
    expect(announcementStatus({ ...live, start_date: '2026-11-01' }, today).kind).toBe('scheduled')
    expect(announcementStatus({ ...live, end_date: '2026-10-30' }, today).kind).toBe('ended')
  })

  it('libellés des états', () => {
    const today = '2026-10-31'
    expect(announcementStatusText(announcementStatus(EMPTY_ANNOUNCEMENT, today))).toBe('Aucune bannière')
    expect(announcementStatusText(announcementStatus(live, today))).toBe('Affichée maintenant')
    expect(announcementStatusText(announcementStatus({ ...live, start_date: '2026-12-20', end_date: '2026-12-26' }, today))).toBe('Programmée du 20/12/2026 au 26/12/2026')
    expect(announcementStatusText(announcementStatus({ ...live, end_date: '2026-10-01' }, today))).toBe('Terminée le 01/10/2026')
  })
})

describe('SITE-01 capacité', () => {
  it('PUT /api/settings : les deux clés inchangées, valeurs numériques', () => {
    expect(capacityPayload({ covers: '40', duration: '120' })).toEqual({ max_covers: 40, table_block_duration_minutes: 120 })
  })

  it('valeurs lues des réglages (repli 40 / 120 si la ligne manque)', () => {
    const rows = [{ key: 'max_covers', value: '36' }]
    expect(settingValue(rows, 'max_covers', 40)).toBe('36')
    expect(settingValue(rows, 'table_block_duration_minutes', 120)).toBe('120')
    expect(settingValue([{ key: 'max_covers', value: 'abc' }], 'max_covers', 40)).toBe('40')
  })

  it('validation : message du contrat « Entrez une durée entre 30 et 480 minutes. Vous avez saisi 20. »', () => {
    expect(validateCapacity({ covers: '40', duration: '20' }).duration).toBe('Entrez une durée entre 30 et 480 minutes. Vous avez saisi 20.')
    expect(validateCapacity({ covers: '0', duration: '120' }).covers).toContain('entre 1 et 200')
    expect(validateCapacity({ covers: '201', duration: '120' }).covers).toBeDefined()
    expect(validateCapacity({ covers: '', duration: '120' }).covers).not.toContain('Vous avez saisi')
    expect(validateCapacity({ covers: '4,5', duration: '120' }).covers).toBeDefined()
    expect(validateCapacity({ covers: '1', duration: '30' })).toEqual({})
    expect(validateCapacity({ covers: '200', duration: '480' })).toEqual({})
    expect(validateCapacity({ covers: '40', duration: '481' }).duration).toBeDefined()
  })

  it('entier strict', () => {
    expect(parseWholeNumber(' 40 ')).toBe(40)
    expect(parseWholeNumber('40 min')).toBeNull()
    expect(parseWholeNumber('-5')).toBeNull()
  })

  it('pas de ±15 minutes, borné', () => {
    expect(stepValue('120', 15, 30, 480)).toBe('135')
    expect(stepValue('30', -15, 30, 480)).toBe('30')
    expect(stepValue('480', 15, 30, 480)).toBe('480')
    expect(stepValue('abc', 15, 30, 480)).toBe('45')
  })

  it('durées lisibles', () => {
    expect(formatDuration(120)).toBe('2 h 00')
    expect(formatDuration(90)).toBe('1 h 30')
    expect(formatDuration(45)).toBe('45 min')
  })

  it('frise 12 h – 22 h : 19:00 + 2 h 00 jusqu’à 21:00 ; au-delà de 22 h la frise est rognée', () => {
    const t = capacityTimeline(120)
    expect(t.endClock).toBe('21:00')
    expect(t.beyondClosing).toBe(false)
    expect(t.left).toBeCloseTo(70)
    expect(t.width).toBeCloseTo(20)
    const long = capacityTimeline(240)
    expect(long.endClock).toBe('23:00')
    expect(long.beyondClosing).toBe(true)
    expect(long.width).toBeCloseTo(30)
  })
})

describe('SITE-02 messages d’erreur lisibles', () => {
  it('jamais de code HTTP, de trace ni d’anglais brut de l’API', () => {
    const msgs = [0, 400, 401, 403, 429, 500, 503].map((s) => describeSaveError(new AdminFetchError('Internal server error', s)))
    for (const m of msgs) {
      expect(m).not.toMatch(/Internal|server error|\b[45]\d\d\b|stack/i)
      expect(m).toMatch(/[.]$/)
    }
    expect(describeSaveError(new AdminFetchError('x', 0))).toBe('La connexion a été perdue.')
    expect(describeSaveError(new Error('boom'))).toBe('Une erreur inattendue est survenue.')
  })
})
