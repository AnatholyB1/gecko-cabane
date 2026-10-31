'use client'

import type { ReactNode } from 'react'
import { Toast } from '@base-ui/react/toast'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { buttonClass } from './Button'

const SUCCESS_TIMEOUT_MS = 5000

function ToastList() {
  const { toasts } = Toast.useToastManager()
  return toasts.map((toast) => {
    const isError = toast.type === 'error'
    const Icon = isError ? CircleAlert : CircleCheck
    return (
      <Toast.Root key={toast.id} toast={toast} className={`adm-toast ${isError ? 'adm-toast--error' : 'adm-toast--success'}`}>
        <Toast.Content className="adm-toast__content">
          <Icon className="i adm-toast__icon" aria-hidden="true" focusable="false" />
          <div>
            <Toast.Title className="adm-toast__title" />
            <Toast.Description className="adm-toast__msg" />
          </div>
          <Toast.Close className={`${buttonClass({ variant: 'ghost', size: 'sm', iconOnly: true })} adm-toast__close`} aria-label="Fermer la notification">
            <X className="i i-sm" aria-hidden="true" focusable="false" />
          </Toast.Close>
        </Toast.Content>
      </Toast.Root>
    )
  })
}

/** Région `aria-live` des notifications (Base UI) + styles empilés. À monter une fois (AdminRoot). */
export function ToastProvider({ children, portalClass = 'adm-portal' }: { children: ReactNode; portalClass?: string }) {
  return (
    <Toast.Provider limit={4}>
      {children}
      <Toast.Portal className={portalClass}>
        <Toast.Viewport className="adm-toast-viewport">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}

/**
 * `success` : annonce polie, disparaît après 5 s (pause au survol et au focus).
 * `error` : annonce assertive (`role="alert"`), reste jusqu'à fermeture.
 */
export function useToast() {
  const manager = Toast.useToastManager()
  return {
    success: (title: string, message?: string) =>
      manager.add({ title, description: message, type: 'success', priority: 'low', timeout: SUCCESS_TIMEOUT_MS }),
    error: (title: string, message?: string) =>
      manager.add({ title, description: message, type: 'error', priority: 'high', timeout: 0 }),
  }
}
