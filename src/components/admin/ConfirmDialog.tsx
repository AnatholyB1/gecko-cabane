'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { TriangleAlert } from 'lucide-react'
import { buttonClass } from './Button'

export type ConfirmOptions = {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** `danger` (défaut) : bouton rouge. Le focus initial est TOUJOURS sur l'action non destructrice. */
  tone?: 'danger' | 'default'
}

type ConfirmDialogProps = ConfirmOptions & {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  /** Classe du portail : `adm-portal` + variable de police (fournie par AdminRoot). */
  portalClass?: string
}

/**
 * Dialogue de confirmation accessible (remplace `confirm()`), DSN-06.
 * `role="alertdialog"`, focus piégé, focus initial sur « Garder », focus rendu
 * au déclencheur, Échap et clic sur le fond ferment.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'danger',
  portalClass = 'adm-portal',
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal className={portalClass}>
        <AlertDialog.Backdrop className="adm-scrim" onClick={() => onOpenChange(false)} />
        <AlertDialog.Popup className="adm-dialog" initialFocus={cancelRef}>
          <AlertDialog.Title className={tone === 'danger' ? 'adm-dialog__title' : 'adm-dialog__title adm-dialog__title--default'}>
            <TriangleAlert className="i" aria-hidden="true" focusable="false" />
            {title}
          </AlertDialog.Title>
          {description ? <AlertDialog.Description>{description}</AlertDialog.Description> : null}
          <div className="adm-dialog__actions">
            <AlertDialog.Close ref={cancelRef} className={buttonClass({ variant: 'secondary' })}>
              {cancelLabel}
            </AlertDialog.Close>
            <button type="button" className={buttonClass({ variant: tone === 'danger' ? 'danger' : 'primary' })} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/**
 * Fournisseur de `useConfirm()`. Migration d'un `confirm()` natif :
 *   if (!confirm('Supprimer ?')) return
 * devient
 *   if (!(await confirm({ title: 'Supprimer ce plat ?', confirmLabel: 'Supprimer' }))) return
 */
export function ConfirmProvider({ children, portalClass }: { children: ReactNode; portalClass?: string }) {
  const resolver = useRef<((value: boolean) => void) | null>(null)
  const [state, setState] = useState<{ open: boolean; options: ConfirmOptions }>({ open: false, options: { title: '' } })

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setState((s) => ({ ...s, open: false }))
  }, [])

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolver.current?.(false) // une demande en cours est abandonnée
      resolver.current = resolve
      setState({ open: true, options })
    })
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        {...state.options}
        portalClass={portalClass}
        open={state.open}
        onOpenChange={(open) => {
          if (!open) settle(false)
        }}
        onConfirm={() => settle(true)}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm doit être utilisé sous <AdminRoot> (ConfirmProvider).')
  return confirm
}
