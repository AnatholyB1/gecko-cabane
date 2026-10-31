import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { safeAdminRedirect } from '@/utils/safe-redirect'
import { Notice } from '@/components/admin/reputation/Notice'
import { AuthFrame } from '../_auth/AuthFrame'
import { LoginForm } from './LoginForm'
import { isLoginErrorCode, isLoginNoticeCode, LOGIN_NOTICES } from './messages'

export const metadata: Metadata = { title: 'Connexion | Gecko Cabane' }

/**
 * Connexion (hors shell). L'URL ne porte que des CODES (`e`, `m`) et la cible `redirect`, validée
 * par safe-redirect : un texte libre dans l'adresse n'est jamais affiché.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; m?: string; redirect?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If already logged in, redirect to admin
  if (user) {
    redirect('/admin')
  }

  const target = params.redirect ? safeAdminRedirect(params.redirect) : null
  const initialError = isLoginErrorCode(params.e) ? params.e : null
  const notice = !initialError && isLoginNoticeCode(params.m) ? LOGIN_NOTICES[params.m] : null

  return (
    <AuthFrame>
      <p className="auth-eyebrow">Connexion</p>
      <h1 className="auth-title">Bienvenue</h1>
      <p className="auth-lede">Connectez-vous pour accéder à l&apos;administration.</p>
      {notice ? (
        <div className="auth-notice">
          <Notice tone="ok" role="status" title={notice.title}>
            {notice.body}
          </Notice>
        </div>
      ) : null}
      <LoginForm redirectTo={target} initialError={initialError} />
    </AuthFrame>
  )
}
