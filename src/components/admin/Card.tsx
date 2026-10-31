import type { ReactNode } from 'react'

/** Une carte ne contient jamais une autre carte : à l'intérieur, filets et espacement. */
export function Card({ flush, className, children }: { flush?: boolean; className?: string; children: ReactNode }) {
  return <section className={['adm-card', flush && 'adm-card--flush', className].filter(Boolean).join(' ')}>{children}</section>
}

export function CardHeader({ title, actions }: { title: ReactNode; actions?: ReactNode }) {
  return (
    <div className="adm-card__head">
      <h2 className="adm-h2">{title}</h2>
      {actions}
    </div>
  )
}
