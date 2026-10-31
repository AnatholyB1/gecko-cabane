'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
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
/**
 * Rend l'application (`.adm-app`, le conteneur du shell, pas le portail) inerte tant que
 * `active` est vrai. Base UI ne pose que `aria-hidden` sur le reste de la page : en frappes
 * rapides (Tab en rafale) le focus s'échappait derrière le voile (audit F-01). `inert`
 * retire aussi ces arrêts de la tabulation. Restauré à la fermeture, au démontage et à la
 * navigation (le nettoyage de l'effet s'exécute dans tous les cas). N'enlève `inert` que si
 * c'est ce dialogue qui l'a posé.
 */
export function inertApp(scope: Pick<ParentNode, 'querySelector'>): (() => void) | undefined {
  const el = scope.querySelector('.adm-app')
  if (!el || el.hasAttribute('inert')) return undefined
  el.setAttribute('inert', '')
  return () => el.removeAttribute('inert')
}

export function useInertApp(active: boolean) {
  useEffect(() => {
    if (!active) return
    return inertApp(document)
  }, [active])
}

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
  useInertApp(open)
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal className={portalClass}>
        <AlertDialog.Backdrop className="adm-scrim" onClick={() => onOpenChange(false)} />
        <AlertDialog.Popup className="adm-dialog" initialFocus={cancelRef}>
          <AlertDialog.Title className={tone === 'danger' ? 'adm-dialog__title' : 'adm-dialog__title adm-dialog__title--default'}>
            <TriangleAlert className="i" aria-hidden="true" focusable="false" />
            {title}
          </AlertDialog.Title>
          {description ? (
            // Chaîne : <p> natif. Contenu riche (<p>, <dl>) : <div>, un <p> ne peut pas contenir de bloc (audit F-08).
            <AlertDialog.Description render={typeof description === 'string' ? undefined : <div />}>{description}</AlertDialog.Description>
          ) : null}
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
 *   if (!window-confirm-natif) return
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
