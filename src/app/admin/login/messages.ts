/**
 * Messages de la connexion (D4 §3.3 et §10). Les messages bruts de Supabase (anglais, détaillés)
 * ne sont JAMAIS affichés : le serveur ne renvoie qu'un code, la page choisit la phrase.
 * Une URL ne porte jamais de texte libre (pas de contenu réfléchi, pas d'hameçonnage par `?error=`).
 */

export type LoginErrorCode = 'invalid' | 'noaccess' | 'unavailable' | 'throttled'
export type LoginNoticeCode = 'deconnecte' | 'mdp' | 'acces'

export const LOGIN_ERRORS: Record<LoginErrorCode, { title: string; body: string }> = {
  invalid: { title: 'Email ou mot de passe incorrect.', body: 'Vérifiez votre saisie, puis réessayez.' },
  noaccess: {
    title: "Ce compte n'a pas accès à l'administration Gecko Cabane.",
    body: "Si vous devriez y avoir accès, demandez une invitation à un administrateur.",
  },
  unavailable: { title: 'Connexion impossible pour le moment.', body: 'Le service ne répond pas. Réessayez dans un instant.' },
  throttled: { title: 'Trop de tentatives.', body: 'Patientez quelques minutes avant de réessayer.' },
}

export const LOGIN_NOTICES: Record<LoginNoticeCode, { title: string; body?: string }> = {
  deconnecte: { title: 'Vous êtes déconnecté.' },
  mdp: { title: 'Mot de passe modifié.', body: 'Connectez-vous avec votre nouveau mot de passe.' },
  acces: { title: 'Votre accès est prêt.', body: 'Connectez-vous pour entrer dans l\'administration.' },
}

export function isLoginErrorCode(v: unknown): v is LoginErrorCode {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(LOGIN_ERRORS, v)
}
export function isLoginNoticeCode(v: unknown): v is LoginNoticeCode {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(LOGIN_NOTICES, v)
}

/** Classe une erreur Supabase Auth sans en exposer le texte. */
export function classifyAuthError(error: { status?: number; code?: string } | null | undefined): LoginErrorCode {
  const status = error?.status
  if (status === 429 || error?.code === 'over_request_rate_limit') return 'throttled'
  if (status === undefined || status === 0 || status >= 500) return 'unavailable'
  return 'invalid'
}
