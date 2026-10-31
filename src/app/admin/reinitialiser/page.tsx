import type { Metadata } from 'next'
import { createAccessDeps } from '@/utils/access/deps'
import { peekToken, type PeekResult } from '@/utils/access/service'
import { AuthFrame } from '../_auth/AuthFrame'
import { InvalidLink } from '../_auth/InvalidLink'
import { NewPasswordForm } from '../_auth/NewPasswordForm'

export const metadata: Metadata = { title: 'Nouveau mot de passe | Gecko Cabane', referrer: 'no-referrer' }
export const dynamic = 'force-dynamic'

/** Réinitialisation du mot de passe (page PUBLIQUE, hors shell). Ouvrir le lien ne consomme rien. */
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  let peek: PeekResult = { valid: false }
  try {
    peek = await peekToken(createAccessDeps(), 'reset', token)
  } catch {
    peek = { valid: false }
  }
  return (
    <AuthFrame>
      {peek.valid && typeof token === 'string' ? <NewPasswordForm mode="reset" token={token} /> : <InvalidLink kind="reset" />}
    </AuthFrame>
  )
}
