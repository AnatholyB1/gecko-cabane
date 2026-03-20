import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signupAction } from './actions'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already logged in, redirect to admin
  if (user) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--jungle-dark)] via-[var(--primary)] to-[var(--accent)] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🦎</div>
          <h1 className="text-3xl font-bold text-[var(--primary-dark)]">Inscription Admin</h1>
          <p className="text-[var(--warm-gray)] mt-2">Créer un compte administrateur</p>
        </div>

        {/* Error Message */}
        {params.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">❌ {params.error}</p>
          </div>
        )}

        <form action={signupAction} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--primary-dark)] mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 border border-[var(--accent-light)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
              placeholder="admin@gecko-cabane.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--primary-dark)] mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 border border-[var(--accent-light)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
              placeholder="Minimum 6 caractères"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--primary-dark)] mb-2">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 border border-[var(--accent-light)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
              placeholder="Répétez le mot de passe"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[var(--primary)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--primary-dark)] transition-colors focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
          >
            Créer le compte
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[var(--warm-gray)]">
            Déjà un compte ?{' '}
            <Link href="/admin/login" className="text-[var(--primary)] font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--accent-light)] text-center">
          <Link href="/" className="text-[var(--warm-gray)] hover:text-[var(--primary)] transition-colors">
            ← Retour au site
          </Link>
        </div>
      </div>
    </div>
  )
}
