import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { createAccessDeps } from '@/utils/access/deps'
import { acceptInvitation } from '@/utils/access/service'
import { clientIp, errorResponse, guarded, INVALID_LINK_MESSAGE, isRateLimited, isSameOrigin, readJsonObject } from '@/utils/access/http'

/**
 * PUBLIC (le visiteur n'a pas encore de compte) : consomme un jeton d'invitation, crée le compte,
 * ajoute la ligne `gecko_admins`. La sécurité repose sur le jeton (256 bits, usage unique, 7 jours),
 * jamais sur un identifiant fourni par le client : l'email vient de la base, pas du corps.
 */
export async function POST(request: Request) {
  return guarded(() => handle(request))
}

async function handle(request: Request) {
  if (!isSameOrigin(request)) return errorResponse('Requête refusée.', 403)
  const body = await readJsonObject(request)
  if (!body) return errorResponse('Requête invalide.', 400)

  if (await isRateLimited(createAdminClient(), [{ kind: 'acc-ip', value: clientIp(request), limit: 20, windowSeconds: 3600 }])) {
    return errorResponse('Trop de tentatives. Réessayez plus tard.', 429)
  }

  const result = await acceptInvitation(createAccessDeps(), {
    token: body.token,
    password: body.password,
    confirm: body.confirm,
  })
  if (result.ok) return NextResponse.json({ data: { ok: true } }, { headers: { 'Cache-Control': 'no-store' } })
  switch (result.code) {
    case 'weak':
      return errorResponse(result.message ?? 'Mot de passe refusé.', 400)
    case 'invalid':
      return errorResponse(INVALID_LINK_MESSAGE, 410)
    case 'account_exists':
      return errorResponse(
        "Un compte existe déjà avec cette adresse. Demandez à l'équipe technique de l'associer à l'administration.",
        409,
      )
    default:
      return errorResponse("Une erreur est survenue. Votre lien reste valable : réessayez dans un instant.", 500)
  }
}
