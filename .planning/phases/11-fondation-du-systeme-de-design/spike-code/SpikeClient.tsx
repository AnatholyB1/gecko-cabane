'use client'

import { useState } from 'react'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Toast } from '@base-ui/react/toast'
import { Select } from '@base-ui/react/select'

const btn =
  'inline-flex h-10 items-center rounded-(--adm-radius) border border-(--adm-line) bg-(--adm-surface) px-4 text-sm text-(--adm-ink) hover:bg-(--adm-bg)'
const btnPrimary =
  'inline-flex h-10 items-center rounded-(--adm-radius) bg-(--adm-accent) px-4 text-sm text-(--adm-accent-ink)'
const btnDanger =
  'inline-flex h-10 items-center rounded-(--adm-radius) bg-(--adm-danger) px-4 text-sm text-white'

const STATUSES = [
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'completed', label: 'Terminée' },
  { value: 'cancelled', label: 'Annulée' },
  { value: 'no_show', label: 'Absent' },
]

function Demo() {
  const toasts = Toast.useToastManager()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<string | null>('pending')

  return (
    <div className="flex flex-col gap-8">
      <section>
        <AlertDialog.Root open={open} onOpenChange={setOpen}>
          <AlertDialog.Trigger className={btnDanger} data-testid="open-dialog">
            Annuler la réservation
          </AlertDialog.Trigger>
          <AlertDialog.Portal className="adm-portal">
            <AlertDialog.Backdrop className="fixed inset-0 bg-black/40 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
            <AlertDialog.Popup
              data-testid="dialog"
              className="fixed top-1/2 left-1/2 w-[min(28rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-(--adm-radius) bg-(--adm-surface) p-6 text-(--adm-ink) shadow-(--adm-shadow)"
            >
              <AlertDialog.Title className="text-lg font-semibold">
                Annuler cette réservation ?
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-(--adm-ink-soft)">
                Le client sera prévenu par email.
              </AlertDialog.Description>
              <div className="mt-6 flex justify-end gap-3">
                <AlertDialog.Close className={btn} data-testid="dialog-keep">
                  Garder
                </AlertDialog.Close>
                <AlertDialog.Close
                  className={btnDanger}
                  data-testid="dialog-confirm"
                  onClick={() =>
                    toasts.add({ title: 'Réservation annulée', type: 'success', priority: 'low' })
                  }
                >
                  Confirmer
                </AlertDialog.Close>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </section>

      <section className="flex gap-3">
        <button
          type="button"
          className={btnPrimary}
          data-testid="toast-ok"
          onClick={() =>
            toasts.add({ title: 'Enregistré', description: 'Horaires mis à jour.', type: 'success', priority: 'low' })
          }
        >
          Toast succès
        </button>
        <button
          type="button"
          className={btn}
          data-testid="toast-err"
          onClick={() =>
            toasts.add({ title: 'Erreur', description: 'Échec de la sauvegarde.', type: 'error', priority: 'high' })
          }
        >
          Toast erreur
        </button>
      </section>

      <section>
        <Select.Root items={STATUSES} value={status} onValueChange={setStatus}>
          <Select.Label className="mb-1 block text-sm font-medium">Statut</Select.Label>
          <Select.Trigger
            data-testid="select"
            className="flex h-10 w-56 items-center justify-between rounded-(--adm-radius) border border-(--adm-line) bg-(--adm-surface) px-3 text-sm"
          >
            <Select.Value />
            <Select.Icon aria-hidden>▾</Select.Icon>
          </Select.Trigger>
          <Select.Portal className="adm-portal">
            <Select.Positioner sideOffset={4} className="z-50">
              <Select.Popup className="min-w-(--anchor-width) rounded-(--adm-radius) border border-(--adm-line) bg-(--adm-surface) py-1 text-(--adm-ink) shadow-(--adm-shadow)">
                <Select.List>
                  {STATUSES.map((s) => (
                    <Select.Item
                      key={s.value}
                      value={s.value}
                      className="flex cursor-default items-center gap-2 px-3 py-2 text-sm outline-none data-highlighted:bg-(--adm-accent) data-highlighted:text-(--adm-accent-ink)"
                    >
                      <Select.ItemIndicator>✓</Select.ItemIndicator>
                      <Select.ItemText>{s.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <p className="mt-2 text-sm" data-testid="select-value">{status}</p>
      </section>
    </div>
  )
}

function ToastList() {
  const { toasts } = Toast.useToastManager()
  return toasts.map((t) => (
    <Toast.Root
      key={t.id}
      toast={t}
      className="absolute right-0 bottom-0 w-full rounded-(--adm-radius) border border-(--adm-line) bg-(--adm-surface) p-4 text-(--adm-ink) shadow-(--adm-shadow) transition-all data-ending-style:opacity-0 data-starting-style:translate-y-4"
    >
      <Toast.Content>
        <Toast.Title className="text-sm font-semibold" />
        <Toast.Description className="text-sm text-(--adm-ink-soft)" />
        <Toast.Close className="mt-2 text-xs underline" aria-label="Fermer">
          Fermer
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ))
}

export default function SpikeClient() {
  return (
    <Toast.Provider>
      <Demo />
      <Toast.Portal className="adm-portal">
        <Toast.Viewport className="fixed right-4 bottom-4 z-50 w-80">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}
