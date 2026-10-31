import type { Metadata } from 'next'
import { createAccessDeps } from '@/utils/access/deps'
import { peekToken, type PeekResult } from '@/utils/access/service'
import { AuthFrame } from '../_auth/AuthFrame'
import { InvalidLink } from '../_auth/InvalidLink'
import { NewPasswordForm } from '../_auth/NewPasswordForm'

// Le jeton est dans l'adresse : aucune fuite par l'en-tête Referer, jamais de cache.
export const metadata: Metadata = { title: 'Invitation | Gecko Cabane', referrer: 'no-referrer' }
export const dynamic = 'force-dynamic'

/**
 * Acceptation d'une invitation (page PUBLIQUE, hors shell). L'ouverture du lien (y compris par un
 * antivirus ou un aperçu de messagerie) ne consomme rien : seul l'envoi du formulaire le fait.
 */
export default async function InvitationPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  let peek: PeekResult = { valid: false }
  try {
    peek = await peekToken(createAccessDeps(), 'invite', token)
  } catch {
    peek = { valid: false }
  }
  return (
    <AuthFrame>
      {peek.valid && typeof token === 'string' ? (
        <NewPasswordForm mode="accept" token={token} email={peek.email} />
      ) : (
        <InvalidLink kind="invite" />
      )}
    </AuthFrame>
  )
}
