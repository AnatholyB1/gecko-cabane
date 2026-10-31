import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { AuthFrame } from '../_auth/AuthFrame'
import { ForgotForm } from './ForgotForm'

export const metadata: Metadata = { title: 'Mot de passe oublié | Gecko Cabane' }

export default async function ForgotPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/admin')

  return (
    <AuthFrame>
      <p className="auth-eyebrow">Connexion</p>
      <h1 className="auth-title">Mot de passe oublié</h1>
      <p className="auth-lede">
        Saisissez l&apos;adresse de votre accès à l&apos;administration. Si elle correspond à un administrateur, vous recevez un lien valable
        1 heure.
      </p>
      <ForgotForm />
    </AuthFrame>
  )
}
