'use client'

import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { buttonClass } from '@/components/admin/Button'
import '../_auth/auth.css'

/**
 * Erreur d'une page de l'admin (D4 §3.5) : dans le shell, une sortie claire, une référence courte,
 * jamais de trace. `digest` est l'identifiant opaque généré par Next.js pour retrouver l'erreur
 * dans les journaux : il ne contient aucune donnée.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="err-page" role="alert">
      <h1 className="adm-display" style={{ fontSize: 'var(--adm-text-3xl)' }}>
        Une erreur est survenue
      </h1>
      <p className="adm-muted" style={{ maxWidth: '58ch' }}>
        Votre travail n&apos;a pas été perdu : ce qui était déjà enregistré l&apos;est toujours. Réessayez ; si le problème continue, transmettez
        la référence ci-dessous à l&apos;équipe technique.
      </p>
      <div className="err-actions">
        <button type="button" className={buttonClass({ variant: 'primary' })} onClick={() => reset()}>
          <RefreshCw className="i i-sm" aria-hidden="true" focusable="false" />
          Réessayer
        </button>
        <Link className={buttonClass({ variant: 'secondary' })} href="/admin" prefetch={false}>
          Retour à Aujourd&apos;hui
        </Link>
      </div>
      {error.digest ? <p className="err-ref">Référence : {error.digest}</p> : null}
    </div>
  )
}
