'use server'

import { createClient, isGeckoAdmin } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { safeAdminRedirect } from '@/utils/safe-redirect'
import { classifyAuthError, type LoginErrorCode } from './messages'

export type LoginState = { error: LoginErrorCode | null; email: string }

const MAX_EMAIL = 254
const MAX_PASSWORD = 256

/**
 * Connexion. Renvoie un code d'erreur (jamais le message de Supabase) et l'email saisi pour
 * le réafficher. Identifiants incorrects, compte inconnu et compte non confirmé donnent la même
 * réponse : aucun moyen de savoir si une adresse existe.
 */
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const rawEmail = formData.get('email')
  const rawPassword = formData.get('password')
  const redirectTo = formData.get('redirect') as string | null

  const email = typeof rawEmail === 'string' ? rawEmail.trim().slice(0, MAX_EMAIL) : ''
  if (typeof rawPassword !== 'string' || email === '' || rawPassword === '' || rawPassword.length > MAX_PASSWORD) {
    return { error: 'invalid', email }
  }
  const password = rawPassword

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: classifyAuthError(error), email }
  }

  // This Supabase project is shared with another app — a valid account
  // does not by itself grant gecko-cabane admin access.
  if (!(await isGeckoAdmin(supabase))) {
    await supabase.auth.signOut()
    return { error: 'noaccess', email }
  }

  redirect(safeAdminRedirect(redirectTo))
}
