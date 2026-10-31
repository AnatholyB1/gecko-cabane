import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Clock, Info, Send, type LucideIcon } from 'lucide-react'

export type NoticeTone = 'err' | 'ok' | 'warn' | 'info'

const DEFAULT_ICON: Record<NoticeTone, LucideIcon> = { err: CircleAlert, ok: CircleCheck, warn: Clock, info: Info }

/**
 * Avis (D4) : icône + titre court en gras + phrase. Jamais la couleur seule.
 * `role="alert"` pour une erreur qui apparaît, `status` pour un succès, `note` pour un contenu statique.
 */
export function Notice({
  tone,
  title,
  children,
  role = 'note',
  icon,
  id,
}: {
  tone: NoticeTone
  title: ReactNode
  children?: ReactNode
  role?: 'alert' | 'status' | 'note'
  icon?: LucideIcon
  id?: string
}) {
  const Icon = icon ?? DEFAULT_ICON[tone]
  return (
    <div id={id} className={`adm-rep-notice adm-rep-notice--${tone}`} role={role}>
      <Icon className="i" aria-hidden="true" focusable="false" />
      <div>
        <strong>{title}</strong>
        {children ? <span className="body">{children}</span> : null}
      </div>
    </div>
  )
}

export { Send as SendIcon }
