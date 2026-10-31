'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { LogOut } from 'lucide-react'
import { ACCOUNT_LINKS } from '@/app/admin/(app)/nav'

/**
 * Menu du compte : e-mail, liens de `nav.ts` (Voir le site public, Accès) et
 * déconnexion. `logoutAction` est la Server Action de l'admin, passée par le
 * layout (un composant de `src/components` n'importe pas `src/app`).
 * Simple disclosure (bouton `aria-expanded` + liste de liens et d'un bouton), pas de
 * rôle ARIA menu : ce motif promet des flèches que ce composant n'implémente pas.
 * Échap ferme (et rend le focus à l'avatar seulement s'il était dans le menu) ; un clic hors
 * du menu ou la sortie du focus le ferme.
 */
export function AccountMenu({
  email,
  logoutAction,
}: {
  email: string
  logoutAction: () => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const initials = (email.split('@')[0] || '?').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase() || '?'

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const root = rootRef.current
      const focusInside = !!root && root.contains(document.activeElement)
      setOpen(false)
      if (focusInside) buttonRef.current?.focus() // ne vole pas le focus s'il est ailleurs
    }
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [open])

  return (
    <div
      className="adm-account"
      ref={rootRef}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null
        if (next && rootRef.current && !rootRef.current.contains(next)) setOpen(false)
      }}
    >
      <button
        ref={buttonRef}
        className="adm-account__btn"
        type="button"
        aria-expanded={open}
        aria-controls="adm-account-menu"
        aria-label={`Compte : ${email}`}
        onClick={() => setOpen((v) => !v)}
      >
        {initials}
      </button>
      <div className="adm-menu" id="adm-account-menu" hidden={!open}>
        <div className="adm-menu__who">
          <p className="adm-small adm-muted">Connecté</p>
          <p className="adm-small adm-menu__email">{email}</p>
        </div>
        {ACCOUNT_LINKS.map((l) => {
          const Icon = l.icon
          if (l.planned) {
            return (
              <span key={l.id} className="adm-menu__item adm-menu__item--planned" aria-disabled="true">
                <Icon className="i i-sm" aria-hidden="true" focusable="false" strokeWidth={1.75} />
                {l.label}
                <span className="adm-menu__soon">Bientôt</span>
              </span>
            )
          }
          return (
            <Link key={l.id} className="adm-menu__item" href={l.href} prefetch={false} onClick={() => setOpen(false)}>
              <Icon className="i i-sm" aria-hidden="true" focusable="false" strokeWidth={1.75} />
              {l.label}
            </Link>
          )
        })}
        <form action={logoutAction}>
          <button className="adm-menu__item" type="submit">
            <LogOut className="i" aria-hidden="true" focusable="false" strokeWidth={1.75} />
            Déconnexion
          </button>
        </form>
      </div>
    </div>
  )
}
