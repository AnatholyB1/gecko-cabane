import type { Metadata } from 'next'
import { AuthFrame } from '../_auth/AuthFrame'
import { TokenGate } from '../_auth/TokenGate'

export const metadata: Metadata = { title: 'Nouveau mot de passe | Gecko Cabane', referrer: 'no-referrer' }
export const dynamic = 'force-dynamic'

/**
 * Réinitialisation du mot de passe (page PUBLIQUE, hors shell). Le jeton est dans le FRAGMENT de
 * l'adresse (`#token=`). Ouvrir le lien ne consomme rien.
 */
export default function ResetPage() {
  return (
    <AuthFrame>
      <TokenGate kind="reset" />
    </AuthFrame>
  )
}
