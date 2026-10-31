import type { ReactNode } from 'react'
import { admSans } from '@/components/admin/font'
import './auth.css'

/**
 * Cadre des écrans publics de l'admin (connexion, invitation, mot de passe oublié) : deux volets
 * à partir de 900 px (marque à gauche), bandeau vert compact en dessous. HORS du shell : aucune
 * navigation, aucune donnée. Un seul `main`, un seul `h1` par page (fourni par l'enfant).
 */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className={`adm-root ${admSans.variable}`}>
      <a className="adm-skip" href="#contenu">
        Aller au contenu
      </a>
      <div className="auth">
        <header className="auth-brand">
          <div className="auth-brand__crest" aria-hidden="true">
            GC
          </div>
          <div>
            <p className="auth-brand__eyebrow">Espace de gestion</p>
            <p className="auth-brand__word">Gecko Cabane</p>
            <hr className="auth-brand__rule" />
            <p className="auth-brand__tag">Cuisine franco-thaïe, Krabi. Réservations, carte et avis, au même endroit.</p>
          </div>
          <p className="auth-brand__foot">Accès réservé à l&apos;équipe du restaurant.</p>
        </header>
        <main className="auth-main" id="contenu" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  )
}
