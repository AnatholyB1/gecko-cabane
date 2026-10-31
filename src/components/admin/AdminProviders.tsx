'use client'

import type { ReactNode } from 'react'
import { ToastProvider } from './Toast'
import { ConfirmProvider } from './ConfirmDialog'
import { NewReservationProvider } from './reservations/NewReservation'

export function AdminProviders({ children, portalClass }: { children: ReactNode; portalClass?: string }) {
  return (
    <ToastProvider portalClass={portalClass}>
      <ConfirmProvider portalClass={portalClass}>
        <NewReservationProvider portalClass={portalClass}>{children}</NewReservationProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}
