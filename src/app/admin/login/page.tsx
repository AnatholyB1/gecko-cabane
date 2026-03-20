import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { loginAction } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; redirect?: string }>
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
          <h1 className="text-3xl font-bold text-[var(--primary-dark)]">Connexion Admin</h1>
          <p className="text-[var(--warm-gray)] mt-2">Gecko Cabane Restaurant</p>
        </div>

        {/* Error Message */}
        {params.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">❌ {params.error}</p>
          </div>
        )}

        {/* Success Message */}
        {params.message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-700 text-sm">✅ {params.message}</p>
          </div>
        )}

        <form action={loginAction} className="space-y-6">
          {params.redirect && (
            <input type="hidden" name="redirect" value={params.redirect} />
          )}
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
              className="w-full px-4 py-3 border border-[var(--accent-light)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[var(--primary)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--primary-dark)] transition-colors focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
          >
            Se connecter
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[var(--warm-gray)]">
            Pas encore de compte ?{' '}
            <Link href="/admin/signup" className="text-[var(--primary)] font-semibold hover:underline">
              S&apos;inscrire
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
