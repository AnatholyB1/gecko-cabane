import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logoutAction } from './actions'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // AuthGuard - redirect to login if not authenticated
  if (!user) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Admin Header */}
      <header className="bg-gradient-to-r from-[var(--jungle-dark)] to-[var(--primary-dark)] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🦎</span>
            <div>
              <h1 className="text-xl font-bold">Gecko Cabane Admin</h1>
              <p className="text-sm opacity-80">Tableau de bord</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm opacity-80">{user.email}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-[var(--primary-dark)] mb-4">
            🌿 Bienvenue sur le tableau de bord
          </h2>
          <p className="text-[var(--warm-gray)]">
            Gérez votre restaurant Gecko Cabane depuis cette interface d&apos;administration.
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link prefetch={false} href="/admin/reservations" className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-[var(--tropical)] hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-bold text-[var(--primary-dark)] mb-2">Réservations</h3>
            <p className="text-[var(--warm-gray)] text-sm mb-4">Gérer les réservations du restaurant</p>
            <span className="text-sm text-[var(--tropical)] font-medium">Gérer →</span>
          </Link>

          <Link prefetch={false} href="/admin/menu" className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-[var(--warm-gold)] hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🍽️</div>
            <h3 className="text-lg font-bold text-[var(--primary-dark)] mb-2">Menu</h3>
            <p className="text-[var(--warm-gray)] text-sm mb-4">Gérer la carte du restaurant</p>
            <span className="text-sm text-[var(--warm-gold)] font-medium">Gérer →</span>
          </Link>

          <Link prefetch={false} href="/admin/hours" className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-[var(--primary)] hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🕐</div>
            <h3 className="text-lg font-bold text-[var(--primary-dark)] mb-2">Horaires</h3>
            <p className="text-[var(--warm-gray)] text-sm mb-4">Modifier les horaires d&apos;ouverture</p>
            <span className="text-sm text-[var(--tropical)] font-medium">Gérer →</span>
          </Link>

          <Link prefetch={false} href="/admin/announcement" className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-amber-400 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📢</div>
            <h3 className="text-lg font-bold text-[var(--primary-dark)] mb-2">Annonce</h3>
            <p className="text-[var(--warm-gray)] text-sm mb-4">Publier une annonce sur le site</p>
            <span className="text-sm text-amber-600 font-medium">Gérer →</span>
          </Link>

          <Link prefetch={false} href="/admin/tables" className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-[var(--moss)] hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-lg font-bold text-[var(--primary-dark)] mb-2">Plan de salle</h3>
            <p className="text-[var(--warm-gray)] text-sm mb-4">Gérer les tables et assigner les réservations</p>
            <span className="text-sm text-[var(--moss)] font-medium">Gérer →</span>
          </Link>

          <Link prefetch={false} href="/admin/settings" className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-gray-400 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-lg font-bold text-[var(--primary-dark)] mb-2">Paramètres</h3>
            <p className="text-[var(--warm-gray)] text-sm mb-4">Durée de blocage, couverts max…</p>
            <span className="text-sm text-gray-500 font-medium">Configurer →</span>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-[var(--primary-dark)] mb-6">⚡ Actions rapides</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              prefetch={false}
              href="/admin/reservations"
              className="flex items-center gap-3 p-4 bg-[var(--accent-light)] rounded-xl hover:bg-[var(--accent-light)]/70 transition-colors text-left"
            >
              <span className="text-2xl">📅</span>
              <span className="text-[var(--primary-dark)] font-medium">Voir réservations</span>
            </Link>
            <Link 
              prefetch={false}
              href="/admin/menu"
              className="flex items-center gap-3 p-4 bg-[var(--accent-light)] rounded-xl hover:bg-[var(--accent-light)]/70 transition-colors text-left"
            >
              <span className="text-2xl">📝</span>
              <span className="text-[var(--primary-dark)] font-medium">Modifier le menu</span>
            </Link>
            <Link 
              prefetch={false}
              href="/admin/hours"
              className="flex items-center gap-3 p-4 bg-[var(--accent-light)] rounded-xl hover:bg-[var(--accent-light)]/70 transition-colors text-left"
            >
              <span className="text-2xl">⏰</span>
              <span className="text-[var(--primary-dark)] font-medium">Gérer les horaires</span>
            </Link>
            <Link 
              prefetch={false}
              href="/admin/announcement"
              className="flex items-center gap-3 p-4 bg-[var(--accent-light)] rounded-xl hover:bg-[var(--accent-light)]/70 transition-colors text-left"
            >
              <span className="text-2xl">📢</span>
              <span className="text-[var(--primary-dark)] font-medium">Annonce</span>
            </Link>
            <Link 
              prefetch={false}
              href="/admin/tables"
              className="flex items-center gap-3 p-4 bg-[var(--accent-light)] rounded-xl hover:bg-[var(--accent-light)]/70 transition-colors text-left"
            >
              <span className="text-2xl">🗺️</span>
              <span className="text-[var(--primary-dark)] font-medium">Plan de salle</span>
            </Link>
            <Link 
              prefetch={false}
              href="/admin/settings"
              className="flex items-center gap-3 p-4 bg-[var(--accent-light)] rounded-xl hover:bg-[var(--accent-light)]/70 transition-colors text-left"
            >
              <span className="text-2xl">⚙️</span>
              <span className="text-[var(--primary-dark)] font-medium">Paramètres</span>
            </Link>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="mt-8 bg-gradient-to-br from-[var(--tropical)] to-[var(--jungle-dark)] rounded-2xl shadow-lg p-8 text-white">
          <h3 className="text-xl font-bold mb-6">🦎 Informations du restaurant</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="opacity-80 text-sm mb-1">Adresse</p>
              <p className="font-medium">1/36-37 Soi Ruamjit, Maharat Road</p>
              <p className="font-medium">Krabi Town 81000, Thaïlande</p>
            </div>
            <div>
              <p className="opacity-80 text-sm mb-1">Téléphone</p>
              <p className="font-medium">+66 81 958 5945</p>
            </div>
            <div>
              <p className="opacity-80 text-sm mb-1">Capacité</p>
              <p className="font-medium">40 places maximum</p>
            </div>
            <div>
              <p className="opacity-80 text-sm mb-1">Horaires</p>
              <p className="font-medium">11h - 23h (Fermé le mardi)</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-8 text-center text-[var(--warm-gray)] text-sm">
        <Link href="/" className="hover:text-[var(--primary)] transition-colors">
          ← Retour au site public
        </Link>
      </footer>
    </div>
  )
}
