'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    redirect('/admin/signup?error=Les+mots+de+passe+ne+correspondent+pas')
  }

  if (password.length < 6) {
    redirect('/admin/signup?error=Le+mot+de+passe+doit+contenir+au+moins+6+caract%C3%A8res')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect(`/admin/signup?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/admin/login?message=Compte+créé+avec+succès.+Vérifiez+votre+email.')
}
