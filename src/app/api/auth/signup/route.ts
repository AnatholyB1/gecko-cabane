import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // Validate passwords match
  if (password !== confirmPassword) {
    return NextResponse.redirect(
      new URL('/admin/signup?error=Les+mots+de+passe+ne+correspondent+pas', request.url)
    )
  }

  // Validate password length
  if (password.length < 6) {
    return NextResponse.redirect(
      new URL('/admin/signup?error=Le+mot+de+passe+doit+contenir+au+moins+6+caractères', request.url)
    )
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${new URL(request.url).origin}/admin`,
    },
  })

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/signup?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }

  return NextResponse.redirect(
    new URL('/admin/login?message=Vérifiez+votre+email+pour+confirmer+votre+inscription', request.url)
  )
}
