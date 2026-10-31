/** Aides pures de l'écran « Accès » (testées). */

export const INVITE_VALIDITY_LABEL = '7 jours, à usage unique'

const DAY = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' })

/** Date calendaire à Krabi, au format AAAA-MM-JJ (ex. 2026-11-07). Entrée invalide : tiret. */
export function formatDay(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '-' : DAY.format(d)
}
