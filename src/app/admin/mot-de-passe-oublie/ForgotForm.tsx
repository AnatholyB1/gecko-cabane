'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Notice } from '@/components/admin/reputation/Notice'
import { Button } from '@/components/admin/Button'
import { Field } from '@/components/admin/Field'
import { adminFetch, AdminFetchError } from '@/components/admin/admin-fetch'
import { isValidEmail, normalizeEmail } from '@/utils/access/validation'

/**
 * La réponse est la même que l'adresse existe ou non : l'écran de confirmation ne dit jamais
 * « on a trouvé votre compte ».
 */
export function ForgotForm() {
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    const value = normalizeEmail(email)
    if (!isValidEmail(value)) {
      setError("Adresse email invalide : vérifiez qu'elle contient un « @ » et un domaine.")
      return
    }
    setError(null)
    setPending(true)
    try {
      await adminFetch('/api/access/forgot', { method: 'POST', json: { email: value } })
      setSent(true)
    } catch (err) {
      setError(err instanceof AdminFetchError ? err.message : 'Une erreur est survenue. Réessayez.')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      {sent ? (
        <div className="auth-notice">
          <Notice tone="ok" role="status" title="Demande enregistrée.">
            Si cette adresse correspond à un administrateur, un email avec un lien vient de partir. Pensez à vérifier les courriers indésirables.
          </Notice>
        </div>
      ) : null}
      {error ? (
        <div className="auth-notice">
          <Notice tone="err" role="alert" title="La demande n'a pas pu être envoyée." id="fg-err">
            {error}
          </Notice>
        </div>
      ) : null}
      <form className="auth-form" onSubmit={submit} noValidate>
        <Field id="fg-email" label="Adresse email">
          <input
            id="fg-email"
            className="adm-input"
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            aria-invalid={error && !sent ? true : undefined}
            aria-describedby={error ? 'fg-err' : undefined}
          />
        </Field>
        <Button type="submit" variant="primary" loading={pending} loadingLabel="Envoi…">
          {sent ? 'Renvoyer le lien' : 'Envoyer le lien'}
        </Button>
      </form>
      <div className="auth-links">
        <Link href="/admin/login" prefetch={false}>
          <ArrowLeft className="i i-sm" aria-hidden="true" focusable="false" />
          Retour à la connexion
        </Link>
        <Link href="/" prefetch={false}>
          Retour au site
        </Link>
      </div>
    </>
  )
}
