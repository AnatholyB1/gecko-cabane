import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirect') as string | null

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/login?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }

  // Redirect to the original destination or admin dashboard
  const destination = redirectTo || '/admin'
  return NextResponse.redirect(new URL(destination, request.url))
}
