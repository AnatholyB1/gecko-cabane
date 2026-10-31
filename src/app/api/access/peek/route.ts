import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { createAccessDeps } from '@/utils/access/deps'
import { peekToken } from '@/utils/access/service'
import { clientIp, errorResponse, guarded, INVALID_LINK_MESSAGE, isRateLimited, isSameOrigin, readJsonObject } from '@/utils/access/http'

/**
 * PUBLIC : aperçu d'un jeton d'invitation ou de réinitialisation, appelé par la page après lecture
 * du fragment d'adresse (`#token=`). Ne consomme JAMAIS le jeton. Une seule réponse (410) pour tout
 * lien invalide (inconnu, expiré, utilisé, révoqué, mauvais type) : pas d'oracle.
 */
export async function POST(request: Request) {
  return guarded(() => handle(request))
}

async function handle(request: Request) {
  if (!isSameOrigin(request)) return errorResponse('Requête refusée.', 403)
  const body = await readJsonObject(request)
  if (!body) return errorResponse('Requête invalide.', 400)
  const kind = body.kind
  if (kind !== 'invite' && kind !== 'reset') return errorResponse('Requête invalide.', 400)

  if (await isRateLimited(createAdminClient(), [{ kind: 'acc-ip', value: clientIp(request), limit: 20, windowSeconds: 3600 }])) {
    return errorResponse('Trop de tentatives. Réessayez plus tard.', 429)
  }

  const peek = await peekToken(createAccessDeps(), kind, body.token)
  if (!peek.valid) return errorResponse(INVALID_LINK_MESSAGE, 410)
  // L'email n'est rendu que pour une invitation (affiché en lecture seule, comme avant).
  return NextResponse.json(
    { data: kind === 'invite' ? { valid: true, email: peek.email } : { valid: true } },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
