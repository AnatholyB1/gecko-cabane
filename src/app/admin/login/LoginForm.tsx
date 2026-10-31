'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Notice } from '@/components/admin/reputation/Notice'
import { Button } from '@/components/admin/Button'
import { Field } from '@/components/admin/Field'
import { PasswordInput } from '../_auth/PasswordInput'
import { loginAction, type LoginState } from './actions'
import { LOGIN_ERRORS, type LoginErrorCode } from './messages'

/**
 * Formulaire de connexion. L'erreur est un `role="alert"` ; l'email est `aria-invalid` quand les
 * identifiants sont refusés. `initialError` vient d'un code d'URL (ex. compte sans accès après
 * déconnexion forcée par le middleware), jamais d'un texte libre.
 */
export function LoginForm({ redirectTo, initialError }: { redirectTo: string | null; initialError: LoginErrorCode | null }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, { error: initialError, email: '' })
  const error = state.error ? LOGIN_ERRORS[state.error] : null
  return (
    <>
      {error ? (
        <div className="auth-notice">
          <Notice tone="err" role="alert" title={error.title} id="login-err">
            {error.body}
          </Notice>
        </div>
      ) : null}
      <form action={formAction} className="auth-form">
        {redirectTo ? <input type="hidden" name="redirect" value={redirectTo} /> : null}
        <Field id="login-email" label="Adresse email">
          <input
            id="login-email"
            className="adm-input"
            name="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            required
            defaultValue={state.email}
            placeholder="vous@exemple.com"
            aria-invalid={state.error === 'invalid' ? true : undefined}
            aria-describedby={error ? 'login-err' : undefined}
          />
        </Field>
        <PasswordInput label="Mot de passe" name="password" autoComplete="current-password" required />
        <Button type="submit" variant="primary" loading={pending} loadingLabel="Connexion…">
          Se connecter
        </Button>
      </form>
      <div className="auth-links">
        <Link href="/admin/mot-de-passe-oublie" prefetch={false}>
          Mot de passe oublié ?
        </Link>
        <Link href="/" prefetch={false}>
          <ArrowLeft className="i i-sm" aria-hidden="true" focusable="false" />
          Retour au site
        </Link>
      </div>
    </>
  )
}
