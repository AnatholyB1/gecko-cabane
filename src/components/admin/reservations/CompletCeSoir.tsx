'use client'

import { useRef, useState } from 'react'
import { Ban, RotateCcw } from 'lucide-react'
import { Button } from '../Button'
import { adminFetch, AdminFetchError } from '../admin-fetch'
import { useConfirm } from '../ConfirmDialog'
import { useToast } from '../Toast'
import { useAdminQuery } from '../use-admin-query'
import { serviceClosureUrl } from './requests'

type ClosureState = { data?: { closed?: boolean } }

/**
 * « Complet ce soir » (ACC-03) : ferme le dîner de `date` en un tap (avec confirmation), le rouvre en un tap.
 * État lu depuis le serveur (jamais deviné) ; une seule requête à la fois ; boutons inertes pendant la requête.
 * Les réservations existantes ne sont jamais touchées. Modèle et réversibilité : src/utils/service-closure.ts.
 */
export function CompletCeSoir({ date }: { date: string }) {
  const confirm = useConfirm()
  const toast = useToast()
  const query = useAdminQuery<ClosureState>(serviceClosureUrl(date))
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)

  const closed = query.data?.data?.closed === true

  async function run(next: 'close' | 'reopen') {
    if (inFlight.current) return
    if (next === 'close') {
      const ok = await confirm({
        title: 'Fermer les réservations ce soir ?',
        description:
          "Le site n'acceptera plus de nouvelle réservation pour ce soir. Les réservations existantes sont conservées. Vous pourrez rouvrir à tout moment.",
        confirmLabel: 'Oui, complet ce soir',
        cancelLabel: 'Non, garder ouvert',
        tone: 'default',
      })
      if (!ok) return
    }
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    try {
      if (next === 'close') {
        await adminFetch(serviceClosureUrl(), { method: 'POST', json: { date } })
        toast.success('Complet ce soir', 'Les réservations en ligne sont fermées pour le dîner.')
      } else {
        await adminFetch(serviceClosureUrl(date), { method: 'DELETE' })
        toast.success('Dîner rouvert', 'Les réservations en ligne sont de nouveau possibles ce soir.')
      }
      await query.refetch()
    } catch (e) {
      const message = e instanceof AdminFetchError ? e.message : 'Erreur inattendue.'
      toast.error(
        next === 'close' ? 'Fermeture du dîner impossible' : 'Réouverture impossible',
        `${message} Rien n'a été modifié.`,
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  if (query.status === 'loading' && !query.data) {
    return (
      <div className="rv-close" aria-busy="true">
        <Button variant="secondary" loading loadingLabel="Chargement…">
          Complet ce soir
        </Button>
      </div>
    )
  }

  if (query.status === 'error' && !query.data) {
    return (
      <div className="rv-close">
        <p className="rv-total" role="alert">
          État du dîner indisponible : {query.error?.message ?? 'erreur inconnue'}
        </p>
        <Button variant="secondary" onClick={() => void query.refetch()}>
          Réessayer
        </Button>
      </div>
    )
  }

  if (closed) {
    return (
      <div className="rv-close">
        <div className="rv-close__banner" role="status">
          <Ban className="i" aria-hidden="true" focusable="false" />
          <div className="rv-close__body">
            <b>Service complet</b>
            <span>Les réservations en ligne sont fermées pour le dîner. Les réservations existantes sont conservées.</span>
          </div>
        </div>
        <Button variant="secondary" loading={busy} loadingLabel="Réouverture…" onClick={() => void run('reopen')}>
          <RotateCcw className="i i-sm" aria-hidden="true" focusable="false" />
          Service complet — rouvrir
        </Button>
      </div>
    )
  }

  return (
    <div className="rv-close">
      <Button variant="secondary" loading={busy} loadingLabel="Fermeture…" onClick={() => void run('close')}>
        <Ban className="i i-sm" aria-hidden="true" focusable="false" />
        Complet ce soir
      </Button>
    </div>
  )
}
