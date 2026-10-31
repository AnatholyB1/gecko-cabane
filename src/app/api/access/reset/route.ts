import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { createAccessDeps } from '@/utils/access/deps'
import { resetPassword } from '@/utils/access/service'
import { clientIp, errorResponse, guarded, isRateLimited, isSameOrigin, readJsonObject } from '@/utils/access/http'

/**
 * PUBLIC : change le mot de passe d'un ADMINISTRATEUR GECKO à partir d'un jeton de réinitialisation
 * (1 heure, usage unique). Ne concerne jamais un compte de l'autre application du pool partagé.
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

  const result = await resetPassword(createAccessDeps(), {
    token: body.token,
    password: body.password,
    confirm: body.confirm,
  })
  if (result.ok) return NextResponse.json({ data: { ok: true } }, { headers: { 'Cache-Control': 'no-store' } })
  switch (result.code) {
    case 'weak':
      return errorResponse(result.message ?? 'Mot de passe refusé.', 400)
    case 'invalid':
      return errorResponse("Ce lien n'est plus valable : il a expiré ou a déjà été utilisé.", 410)
    default:
      return errorResponse('Une erreur est survenue. Votre lien reste valable : réessayez dans un instant.', 500)
  }
}
