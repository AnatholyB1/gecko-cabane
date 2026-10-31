/**
 * Lecture du jeton dans le FRAGMENT de l'adresse (`/admin/invitation#token=…`). Un fragment n'est
 * jamais envoyé au serveur, ni dans l'en-tête Referer, ni enregistré par Sentry ou les journaux de
 * l'hébergeur : le jeton ne quitte le navigateur que dans le corps d'une requête POST.
 * Aucune lecture par query string (`?token=`) : les anciens liens n'existent pas en production.
 */
export function parseTokenFragment(hash: string): string | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (raw === '') return null
  const value = new URLSearchParams(raw).get('token')
  return value && value.length > 0 && value.length <= 200 ? value : null
}
