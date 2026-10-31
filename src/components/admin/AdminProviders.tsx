'use client'

import type { ReactNode } from 'react'
import { ToastProvider } from './Toast'
import { ConfirmProvider } from './ConfirmDialog'

export function AdminProviders({ children, portalClass }: { children: ReactNode; portalClass?: string }) {
  return (
    <ToastProvider portalClass={portalClass}>
      <ConfirmProvider portalClass={portalClass}>{children}</ConfirmProvider>
    </ToastProvider>
  )
}
