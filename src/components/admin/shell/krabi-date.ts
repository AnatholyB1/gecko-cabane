/** « Samedi 31 octobre », en heure de Krabi (UTC+7), quel que soit le fuseau du serveur. */
export function krabiDateLabel(now: Date): string {
  const s = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Bangkok',
  }).format(now)
  return s.charAt(0).toUpperCase() + s.slice(1)
}
