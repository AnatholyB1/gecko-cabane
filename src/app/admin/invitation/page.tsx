import type { Metadata } from 'next'
import { AuthFrame } from '../_auth/AuthFrame'
import { TokenGate } from '../_auth/TokenGate'

// Le jeton est dans le FRAGMENT de l'adresse (`#token=`) : jamais envoyé au serveur, ni en Referer,
// ni à Sentry. Pas de cache.
export const metadata: Metadata = { title: 'Invitation | Gecko Cabane', referrer: 'no-referrer' }
export const dynamic = 'force-dynamic'

/**
 * Acceptation d'une invitation (page PUBLIQUE, hors shell). L'ouverture du lien (y compris par un
 * antivirus ou un aperçu de messagerie) ne consomme rien : seul l'envoi du formulaire le fait.
 * La lecture du jeton et son aperçu (POST /api/access/peek) se font dans le navigateur.
 */
export default function InvitationPage() {
  return (
    <AuthFrame>
      <TokenGate kind="invite" />
    </AuthFrame>
  )
}
