import type { ReactNode } from 'react'
import { Inbox, RefreshCw, WifiOff, type LucideIcon } from 'lucide-react'
import { describeError } from './admin-fetch'

/** Squelette de la forme finale (pas de saut de mise en page) ; annoncé « Chargement… » aux lecteurs d'écran. */
export function LoadingState({ label = 'Chargement…', variant = 'card' }: { label?: string; variant?: 'card' | 'table' }) {
  return (
    <div className="adm-card" role="status" aria-busy="true">
      <div className="adm-skel" style={{ height: 22, width: '45%' }} />
      <div className="adm-skel" style={{ height: 16, width: '90%', marginTop: 14 }} />
      <div className="adm-skel" style={{ height: 16, width: '80%', marginTop: 10 }} />
      {variant === 'table' ? (
        <>
          <div className="adm-skel" style={{ height: 44, width: '100%', marginTop: 18 }} />
          <div className="adm-skel" style={{ height: 44, width: '100%', marginTop: 10 }} />
        </>
      ) : (
        <div className="adm-skel" style={{ height: 44, width: '100%', marginTop: 18 }} />
      )}
      <span className="adm-sr-only">{label}</span>
    </div>
  )
}

/** Vide : icône, titre, une phrase utile, une action. */
export function EmptyState({ icon: Icon = Inbox, title, description, action }: { icon?: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="adm-card adm-state">
      <div className="adm-state__icon">
        <Icon className="i i-lg" aria-hidden="true" focusable="false" />
      </div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  )
}

/** Erreur : ce qui s'est passé, « Réessayer », rien n'a été perdu. `error` (d'adminFetch) fournit titre et phrase par défaut. */
export function ErrorState({
  error,
  title,
  description,
  onRetry,
  retryLabel = 'Réessayer',
}: {
  error?: unknown
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
}) {
  const fallback = describeError(error)
  return (
    <div className="adm-card adm-state adm-state--error" role="alert">
      <div className="adm-state__icon">
        <WifiOff className="i i-lg" aria-hidden="true" focusable="false" />
      </div>
      <h3>{title ?? fallback.title}</h3>
      <p>{description ?? fallback.description}</p>
      {onRetry ? (
        <button type="button" className="adm-btn" onClick={onRetry}>
          <RefreshCw className="i i-sm" aria-hidden="true" focusable="false" />
          {retryLabel}
        </button>
      ) : null}
    </div>
  )
}
