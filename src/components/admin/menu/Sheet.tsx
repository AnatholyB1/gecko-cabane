'use client'

import type { ReactNode } from 'react'
import { useRef } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { buttonClass } from '../Button'
import { trapTab } from '../focus-loop'
import { admSans } from '../font'

/**
 * Feuille (D3 §1) : bas d'écran sous 768 px, panneau droit de 460 px au-delà.
 * `role="dialog"`, focus piégé, focus initial sur le premier champ, Échap = demande de fermeture
 * (l'appelant décide : fermer, ou confirmer s'il y a une saisie non enregistrée), focus rendu au
 * déclencheur. Les clics sur le fond ne ferment pas (la saisie ne se perd pas par un tap raté).
 */
export function Sheet({
  open,
  onRequestClose,
  title,
  children,
  footer,
}: {
  open: boolean
  /** Appelé pour Échap, la croix et « Annuler » : à l'appelant de fermer (ou de confirmer). */
  onRequestClose: () => void
  title: string
  children: ReactNode
  footer: ReactNode
}) {
  const popup = useRef<HTMLDivElement>(null)
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onRequestClose()
      }}
      disablePointerDismissal
    >
      <Dialog.Portal className={`adm-portal ${admSans.variable}`}>
        <Dialog.Backdrop className="adm-scrim mn-scrim" />
        <Dialog.Popup
          ref={popup}
          className="mn-sheet"
          onKeyDown={(e) => trapTab(e, e.currentTarget)}
          initialFocus={() => popup.current?.querySelector<HTMLElement>('input:not([type=hidden]):not([type=file]), select, textarea') ?? true}
        >
          <div className="mn-sheet__h">
            <Dialog.Title className="mn-sheet__title">{title}</Dialog.Title>
            <Dialog.Close className={buttonClass({ variant: 'ghost', iconOnly: true })} aria-label="Fermer">
              <X className="i" aria-hidden="true" focusable="false" />
            </Dialog.Close>
          </div>
          <div className="mn-sheet__b">{children}</div>
          <div className="mn-sheet__f">{footer}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
