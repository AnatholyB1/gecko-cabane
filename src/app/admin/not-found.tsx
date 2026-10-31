import Link from 'next/link'
import { buttonClass } from '@/components/admin/Button'
import { AuthFrame } from './_auth/AuthFrame'

/** 404 de l'admin (D4 §3.5). Aussi rendue quand un compte connecté n'est pas administrateur. */
export default function AdminNotFound() {
  return (
    <AuthFrame>
      <div className="err-page">
        <p className="err-code" aria-hidden="true">
          404
        </p>
        <h1 className="auth-title" style={{ marginTop: 0 }}>
          Cette page n&apos;existe pas
        </h1>
        <p className="auth-lede">L&apos;adresse est peut-être incorrecte, ou la page a été déplacée. Rien n&apos;a été modifié.</p>
        <div className="err-actions">
          <Link className={buttonClass({ variant: 'primary' })} href="/admin" prefetch={false}>
            Retour à Aujourd&apos;hui
          </Link>
          <Link className={buttonClass({ variant: 'secondary' })} href="/admin/login" prefetch={false}>
            Aller à la connexion
          </Link>
        </div>
      </div>
    </AuthFrame>
  )
}
