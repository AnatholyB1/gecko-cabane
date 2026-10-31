'use client'

import { useEffect, useState } from 'react'
import { adminFetch } from '@/components/admin/admin-fetch'
import { parseTokenFragment } from '@/utils/access/fragment'
import { InvalidLink } from './InvalidLink'
import { NewPasswordForm } from './NewPasswordForm'

type Kind = 'invite' | 'reset'
type State = { status: 'loading' } | { status: 'invalid' } | { status: 'ready'; token: string; email?: string }

// Lu une seule fois par chargement de page (les effets peuvent s'exécuter deux fois en développement).
let captured: string | null | undefined

function takeToken(): string | null {
  if (captured === undefined) {
    captured = parseTokenFragment(window.location.hash)
    // Le jeton quitte l'adresse (historique, partage d'écran) dès qu'il est lu.
    window.history.replaceState(null, '', window.location.pathname)
  }
  return captured
}

/**
 * Pages à jeton : le jeton est lu dans le FRAGMENT de l'adresse (`#token=…`), jamais envoyé au
 * serveur dans une URL. Il est ensuite retiré de la barre d'adresse (historique) et vérifié par un
 * POST qui ne le consomme pas ; seul l'envoi du formulaire le consomme. Aucune lecture de la query string.
 */
export function TokenGate({ kind }: { kind: Kind }) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    async function run() {
      const token = takeToken()
      let next: State = { status: 'invalid' }
      if (token) {
        try {
          const res = await adminFetch<{ data?: { valid?: boolean; email?: string } }>('/api/access/peek', {
            method: 'POST',
            json: { token, kind },
          })
          if (res.data?.valid) next = { status: 'ready', token, email: res.data.email }
        } catch {
          next = { status: 'invalid' }
        }
      } else {
        await Promise.resolve()
      }
      if (!cancelled) setState(next)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [kind])

  if (state.status === 'loading') {
    return (
      <p className="auth-lede" role="status">
        Vérification du lien…
      </p>
    )
  }
  if (state.status === 'invalid') return <InvalidLink kind={kind} />
  return <NewPasswordForm mode={kind === 'invite' ? 'accept' : 'reset'} token={state.token} email={state.email} />
}
