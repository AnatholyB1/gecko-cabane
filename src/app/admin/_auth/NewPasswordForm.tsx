'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Circle, CircleCheck } from 'lucide-react'
import { Notice } from '@/components/admin/reputation/Notice'
import { Button, buttonClass } from '@/components/admin/Button'
import { Field } from '@/components/admin/Field'
import { adminFetch, AdminFetchError } from '@/components/admin/admin-fetch'
import { passwordRules, validatePassword } from '@/utils/access/validation'
import { PasswordInput } from './PasswordInput'

type Mode = 'accept' | 'reset'

const COPY: Record<Mode, { endpoint: string; submit: string; busy: string; doneTitle: string; doneNotice: string; doneBody: string; loginCode: string; eyebrow: string }> = {
  accept: {
    endpoint: '/api/access/accept',
    submit: 'Créer mon accès',
    busy: 'Création…',
    doneTitle: 'Votre accès est prêt',
    doneNotice: 'Mot de passe enregistré.',
    doneBody: "Vous pouvez entrer dans l'administration.",
    loginCode: 'acces',
    eyebrow: 'Invitation',
  },
  reset: {
    endpoint: '/api/access/reset',
    submit: 'Enregistrer le mot de passe',
    busy: 'Enregistrement…',
    doneTitle: 'Mot de passe modifié',
    doneNotice: 'Votre nouveau mot de passe est enregistré.',
    doneBody: "Utilisez-le pour vous connecter à l'administration.",
    loginCode: 'mdp',
    eyebrow: 'Mot de passe',
  },
}

/**
 * Choix du mot de passe (acceptation d'une invitation, réinitialisation). Le jeton part dans le
 * CORPS d'une requête POST, jamais dans une URL de lecture ; l'email affiché vient du serveur et
 * n'est pas modifiable (lecture seule). Critères visibles, chacun « rempli » ou « à remplir » en texte.
 */
export function NewPasswordForm({ mode, token, email }: { mode: Mode; token: string; email?: string }) {
  const copy = COPY[mode]
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rules = passwordRules(password, confirm)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    const local = validatePassword(password, confirm)
    if (local) {
      setError(local)
      return
    }
    setError(null)
    setPending(true)
    try {
      await adminFetch(copy.endpoint, { method: 'POST', json: { token, password, confirm } })
      setDone(true)
    } catch (err) {
      setError(err instanceof AdminFetchError ? err.message : 'Une erreur est survenue. Réessayez.')
    } finally {
      setPending(false)
    }
  }

  if (done) {
    return (
      <>
        <p className="auth-eyebrow">{copy.eyebrow}</p>
        <h1 className="auth-title">{copy.doneTitle}</h1>
        <div className="auth-notice">
          <Notice tone="ok" role="status" title={copy.doneNotice}>
            {copy.doneBody}
          </Notice>
        </div>
        <div className="auth-notice">
          <Link className={buttonClass({ variant: 'primary', block: true })} href={`/admin/login?m=${copy.loginCode}`} prefetch={false}>
            Aller à la connexion
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <p className="auth-eyebrow">{copy.eyebrow}</p>
      <h1 className="auth-title">{mode === 'accept' ? 'Choisissez votre mot de passe' : 'Nouveau mot de passe'}</h1>
      <p className="auth-lede">
        {mode === 'accept'
          ? "Vous avez été invité à rejoindre l'administration du Gecko Cabane."
          : 'Choisissez un nouveau mot de passe pour votre accès à l\'administration.'}
      </p>
      {error ? (
        <div className="auth-notice">
          <Notice tone="err" role="alert" title="Le mot de passe n'a pas été enregistré." id="np-err">
            {error}
          </Notice>
        </div>
      ) : null}
      <form className="auth-form" onSubmit={submit}>
        {email ? (
          <Field id="np-email" label="Adresse email">
            <input id="np-email" className="adm-input auth-readonly" type="email" value={email} readOnly aria-readonly="true" autoComplete="username" />
          </Field>
        ) : null}
        <PasswordInput
          label="Mot de passe"
          name="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby="np-rules"
        />
        <PasswordInput
          label="Confirmez le mot de passe"
          name="confirm"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <ul className="auth-rules" id="np-rules" aria-label="Critères du mot de passe">
          {rules.map((r) => (
            <li key={r.id} data-ok={r.ok}>
              {r.ok ? (
                <CircleCheck className="i i-sm" aria-hidden="true" focusable="false" />
              ) : (
                <Circle className="i i-sm" aria-hidden="true" focusable="false" />
              )}
              <span>
                {r.label} : {r.ok ? 'rempli' : 'à remplir'}
              </span>
            </li>
          ))}
        </ul>
        <Button type="submit" variant="primary" loading={pending} loadingLabel={copy.busy}>
          {copy.submit}
        </Button>
      </form>
    </>
  )
}
