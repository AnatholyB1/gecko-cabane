import type { ReactNode } from 'react'
import { notFound, redirect } from 'next/navigation'
import { AdminRoot } from '@/components/admin/AdminRoot'
import { AdminShell } from '@/components/admin/shell/AdminShell'
import { createClient, isGeckoAdmin } from '@/utils/supabase/server'
import { logoutAction } from '../actions'

/**
 * Layout partagé de toutes les pages d'admin sauf la connexion (NAV-01, NAV-05).
 * Le middleware est la première garde ; celle-ci est la défense en profondeur
 * côté serveur : sans session de membre `gecko_admins`, aucune page du shell
 * n'est rendue. `/admin/login` et `/admin/signup` sont hors de ce groupe : ils
 * n'ont ni shell ni garde.
 */
export default async function AdminAppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  // Compte valide mais pas membre de gecko_admins (projet Supabase partagé) : jamais de redirection vers
  // la connexion (elle renvoie un compte connecté vers /admin : boucle). Le middleware déconnecte ce cas ;
  // ici, repli sûr sans rien afficher.
  if (!(await isGeckoAdmin(supabase))) notFound()

  return (
    <AdminRoot>
      <AdminShell email={user.email ?? ''} logoutAction={logoutAction}>
        {children}
      </AdminShell>
    </AdminRoot>
  )
}
