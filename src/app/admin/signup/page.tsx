import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SignupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already logged in, redirect to admin
  if (user) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-(--jungle-dark) via-(--primary) to-(--accent) flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="text-5xl mb-4">🦎</div>
        <h1 className="text-3xl font-bold text-(--primary-dark)">Inscription Admin</h1>
        <p className="text-(--warm-gray) mt-4">
          La création de comptes administrateur n&apos;est plus ouverte au public.
          Contactez l&apos;équipe technique pour obtenir un accès.
        </p>

        <div className="mt-8">
          <Link
            href="/admin/login"
            className="inline-block bg-(--primary) text-white px-6 py-3 rounded-xl font-semibold hover:bg-(--primary-dark) transition-colors"
          >
            Se connecter
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-(--accent-light)">
          <Link href="/" className="text-(--warm-gray) hover:text-(--primary) transition-colors">
            ← Retour au site
          </Link>
        </div>
      </div>
    </div>
  )
}
