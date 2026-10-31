import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import { Notice } from '@/components/admin/reputation/Notice'

/**
 * Lien inconnu, falsifié, expiré, révoqué ou déjà utilisé : UNE seule présentation (pas d'oracle
 * qui distinguerait « expiré » de « déjà utilisé » de « inconnu »).
 */
export function InvalidLink({ kind }: { kind: 'invite' | 'reset' }) {
  return (
    <>
      <p className="auth-eyebrow">{kind === 'invite' ? 'Invitation' : 'Mot de passe'}</p>
      <h1 className="auth-title">Ce lien n&apos;est plus valable</h1>
      <div className="auth-notice">
        <Notice
          tone="warn"
          role="alert"
          icon={Clock}
          title={kind === 'invite' ? "L'invitation a expiré ou a déjà été utilisée." : 'Le lien a expiré ou a déjà été utilisé.'}
        >
          {kind === 'invite'
            ? "Demandez à un administrateur de vous en envoyer une nouvelle."
            : 'Demandez un nouveau lien depuis « Mot de passe oublié ».'}
        </Notice>
      </div>
      <div className="auth-links">
        <Link href={kind === 'invite' ? '/admin/login' : '/admin/mot-de-passe-oublie'} prefetch={false}>
          {kind === 'invite' ? 'Aller à la connexion' : 'Demander un nouveau lien'}
        </Link>
        <Link href="/" prefetch={false}>
          <ArrowLeft className="i i-sm" aria-hidden="true" focusable="false" />
          Retour au site
        </Link>
      </div>
    </>
  )
}
