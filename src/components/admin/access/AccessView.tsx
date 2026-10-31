'use client'

import { useRef, useState } from 'react'
import { CircleCheck, Clock, Mail, Users, X } from 'lucide-react'
import { PageHeader } from '../PageHeader'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Input } from '../Input'
import { useConfirm } from '../ConfirmDialog'
import { adminFetch, AdminFetchError } from '../admin-fetch'
import { useAdminQuery } from '../use-admin-query'
import { ErrorState, LoadingState } from '../states'
import { Notice } from '../reputation/Notice'
import { isValidEmail, normalizeEmail } from '@/utils/access/validation'
import type { AccessList } from '@/utils/access/service'
import { formatDay, INVITE_VALIDITY_LABEL } from './access-logic'
import './access.css'

type Feedback = { tone: 'ok' | 'err'; title: string; body: string } | null

/**
 * Accès (ACC-02). Liste des administrateurs et des invitations, invitation par email avec dialogue
 * de confirmation, retrait d'un accès avec dialogue. Les garde-fous (pas d'auto-retrait, pas de
 * retrait du dernier administrateur) sont aussi appliqués par le serveur : ici ils masquent
 * seulement les boutons inutiles.
 */
export function AccessView() {
  const query = useAdminQuery<{ data: AccessList }>('/api/access')
  const confirm = useConfirm()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [busy, setBusy] = useState(false)
  const listHeading = useRef<HTMLHeadingElement>(null)

  const list = query.data?.data ?? null

  async function sendInvitation(target: string) {
    const ok = await confirm({
      title: "Envoyer l'invitation ?",
      tone: 'default',
      confirmLabel: "Envoyer l'invitation",
      description: (
        <div>
          <p>Un email avec un lien à usage unique va être envoyé. Aucun compte n&apos;est créé avant que la personne accepte.</p>
          <dl className="adm-access__recap">
            <div>
              <dt>Destinataire</dt>
              <dd>{target}</dd>
            </div>
            <div>
              <dt>Validité du lien</dt>
              <dd>{INVITE_VALIDITY_LABEL}</dd>
            </div>
            <div>
              <dt>Droits</dt>
              <dd>Tous les droits d&apos;administration</dd>
            </div>
          </dl>
        </div>
      ),
    })
    if (!ok) return
    setBusy(true)
    setFeedback(null)
    try {
      const res = await adminFetch<{ data: { email: string; expiresAt: string } }>('/api/access/invitations', {
        method: 'POST',
        json: { email: target },
      })
      setFeedback({
        tone: 'ok',
        title: `Invitation envoyée à ${res.data.email}.`,
        body: `Le lien est valable jusqu'au ${formatDay(res.data.expiresAt)}. Rien d'autre n'a été créé.`,
      })
      setEmail('')
      void query.refetch()
    } catch (e) {
      setFeedback({
        tone: 'err',
        title: "L'invitation n'a pas pu être envoyée.",
        body: e instanceof AdminFetchError ? e.message : 'Réessayez dans un instant.',
      })
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    const value = normalizeEmail(email)
    if (!isValidEmail(value)) {
      setFieldError("Adresse email invalide : vérifiez qu'elle contient un « @ » et un domaine.")
      return
    }
    setFieldError(null)
    void sendInvitation(value)
  }

  async function revoke(kind: 'admin' | 'invitation', id: string, label: string) {
    const ok = await confirm(
      kind === 'admin'
        ? {
            title: `Retirer l'accès de ${label} ?`,
            description: "Cette personne ne pourra plus entrer dans l'administration, immédiatement. Son compte n'est pas supprimé et vous pourrez l'inviter de nouveau.",
            confirmLabel: "Retirer l'accès",
          }
        : {
            title: "Révoquer l'invitation ?",
            description: `Le lien envoyé à ${label} cessera de fonctionner.`,
            confirmLabel: "Révoquer l'invitation",
          },
    )
    if (!ok) return
    setBusy(true)
    setFeedback(null)
    try {
      await adminFetch(kind === 'admin' ? `/api/access/admins/${id}` : `/api/access/invitations/${id}`, { method: 'DELETE' })
      setFeedback({
        tone: 'ok',
        title: kind === 'admin' ? `Accès retiré : ${label}.` : `Invitation révoquée : ${label}.`,
        body: kind === 'admin' ? "Elle ne peut plus entrer dans l'administration." : 'Le lien ne fonctionne plus.',
      })
      await query.refetch()
      listHeading.current?.focus() // la ligne disparaît : le focus ne reste pas dans le vide
    } catch (e) {
      setFeedback({
        tone: 'err',
        title: kind === 'admin' ? "L'accès n'a pas été retiré." : "L'invitation n'a pas été révoquée.",
        body: e instanceof AdminFetchError ? e.message : 'Réessayez dans un instant.',
      })
    } finally {
      setBusy(false)
    }
  }

  const onlyOne = list !== null && list.admins.length <= 1

  return (
    <div className="adm-access">
      <PageHeader
        title="Accès"
        description="Les administrateurs du restaurant et les invitations en cours. L'inscription publique n'existe plus : on entre par invitation."
      />

      <section className="adm-card adm-access__panel" aria-labelledby="acc-inv">
        <h2 className="adm-h2" id="acc-inv">
          Inviter un administrateur
        </h2>
        <p className="adm-muted adm-access__lede">
          La personne reçoit un email avec un lien valable 7 jours. Elle choisit elle-même son mot de passe. Aucun compte n&apos;est créé avant
          qu&apos;elle accepte. Elle aura les mêmes droits que vous.
        </p>
        <form className="adm-access__form" onSubmit={onSubmit} noValidate>
          <Input
            label="Adresse email de la personne"
            type="email"
            name="email"
            inputMode="email"
            autoComplete="off"
            placeholder="prenom@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldError}
          />
          <div>
            <Button type="submit" variant="primary" loading={busy} loadingLabel="Envoi…">
              <Mail className="i i-sm" aria-hidden="true" focusable="false" />
              Envoyer l&apos;invitation
            </Button>
          </div>
        </form>
        {feedback ? (
          <div className="adm-access__feedback">
            <Notice tone={feedback.tone} role={feedback.tone === 'err' ? 'alert' : 'status'} title={feedback.title}>
              {feedback.body}
            </Notice>
          </div>
        ) : null}
      </section>

      <section className="adm-card adm-access__panel" aria-labelledby="acc-list">
        <h2 className="adm-h2" id="acc-list" ref={listHeading} tabIndex={-1}>
          Administrateurs et invitations
        </h2>
        {query.status === 'loading' && !list ? <LoadingState /> : null}
        {query.status === 'error' && !list ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : null}
        {list ? (
          <>
            {onlyOne ? (
              <Notice tone="info" title="Vous êtes le seul administrateur.">
                Invitez un proche collaborateur pour qu&apos;il puisse gérer les réservations en votre absence. Le dernier administrateur ne peut pas
                être retiré.
              </Notice>
            ) : null}
            <ul className="adm-access__people" aria-label="Administrateurs et invitations">
              {list.admins.map((a) => (
                <li key={a.id} className="adm-access__person">
                  <div>
                    <p className="adm-access__who">
                      {a.email}
                      {a.isSelf ? ' (vous)' : ''}
                    </p>
                    <p className="adm-access__meta">Depuis le <span className="adm-nowrap">{formatDay(a.since)}</span></p>
                  </div>
                  <Badge tone="ok" icon={CircleCheck}>
                    Actif
                  </Badge>
                  <div className="adm-access__acts">
                    {!a.isSelf && !onlyOne ? (
                      <Button variant="secondary" disabled={busy} onClick={() => void revoke('admin', a.id, a.email)}>
                        Retirer<span className="adm-sr-only"> l&apos;accès de {a.email}</span>
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
              {list.invitations.map((i) => (
                <li key={i.id} className="adm-access__person">
                  <div>
                    <p className="adm-access__who">{i.email}</p>
                    <p className="adm-access__meta">
                      Envoyée le <span className="adm-nowrap">{formatDay(i.sentAt)}</span>, {i.status === 'pending' ? 'expire' : 'expirée'} le <span className="adm-nowrap">{formatDay(i.expiresAt)}</span>
                    </p>
                  </div>
                  {i.status === 'pending' ? (
                    <Badge tone="info" icon={Clock}>
                      Invitation en attente
                    </Badge>
                  ) : (
                    <Badge tone="neutral" icon={X}>
                      Invitation expirée
                    </Badge>
                  )}
                  <div className="adm-access__acts">
                    <Button variant="secondary" disabled={busy} onClick={() => void sendInvitation(i.email)}>
                      Renvoyer<span className="adm-sr-only"> l&apos;invitation à {i.email}</span>
                    </Button>
                    <Button variant="secondary" disabled={busy} onClick={() => void revoke('invitation', i.id, i.email)}>
                      Révoquer<span className="adm-sr-only"> l&apos;invitation de {i.email}</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section className="adm-card adm-access__panel" aria-labelledby="acc-steps">
        <h2 className="adm-h2" id="acc-steps">
          Comment ça se passe
        </h2>
        <ol className="adm-access__steps">
          <li>
            <strong>Vous invitez</strong>
            <span className="adm-muted">Saisissez l&apos;email, confirmez l&apos;envoi.</span>
          </li>
          <li>
            <strong>La personne reçoit un lien</strong>
            <span className="adm-muted">Valable 7 jours, à usage unique.</span>
          </li>
          <li>
            <strong>Elle choisit son mot de passe</strong>
            <span className="adm-muted">Son accès est créé à ce moment, puis elle arrive dans l&apos;administration.</span>
          </li>
        </ol>
        <p className="adm-small adm-muted adm-access__foot">
          <Users className="i i-sm" aria-hidden="true" focusable="false" /> Tous les administrateurs ont les mêmes droits.
        </p>
      </section>
    </div>
  )
}
