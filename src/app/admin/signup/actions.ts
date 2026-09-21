'use server'

import { redirect } from 'next/navigation'

// Self-signup is disabled: this Supabase project is shared with another
// app, and any account signed up here would land in the same auth pool.
// Admin access is granted exclusively by inserting a row into gecko_admins
// via the service-role key — never through public signup.
export async function signupAction() {
  redirect('/admin/signup')
}
