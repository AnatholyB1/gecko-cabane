'use server'

import { createClient, isGeckoAdmin } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirect') as string | null

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`)
  }

  // This Supabase project is shared with another app — a valid account
  // does not by itself grant gecko-cabane admin access.
  if (!(await isGeckoAdmin(supabase))) {
    await supabase.auth.signOut()
    redirect(`/admin/login?error=${encodeURIComponent("Ce compte n'a pas accès à l'administration Gecko Cabane.")}`)
  }

  redirect(redirectTo || '/admin')
}
