import { after, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { createAccessDeps } from '@/utils/access/deps'
import { requestPasswordReset } from '@/utils/access/service'
import { isValidEmail, normalizeEmail } from '@/utils/access/validation'
import { clientIp, errorResponse, guarded, isRateLimited, isSameOrigin, readJsonObject } from '@/utils/access/http'

/**
 * PUBLIC : « Mot de passe oublié ». La réponse est IDENTIQUE que l'adresse existe ou non :
 * le travail (recherche + envoi) se fait après la réponse (`after`), donc la durée ne trahit rien.
 * Seuls les comptes de `gecko_admins` reçoivent un lien. Le seuil par adresse, lui aussi, répond
 * pareil quand il est dépassé (aucun signal).
 */
const NEUTRAL = { data: { ok: true } }

export async function POST(request: Request) {
  return guarded(() => handle(request))
}

async function handle(request: Request) {
  if (!isSameOrigin(request)) return errorResponse('Requête refusée.', 403)
  const body = await readJsonObject(request)
  if (!body) return errorResponse('Requête invalide.', 400)

  const email = normalizeEmail(body.email)
  if (!isValidEmail(email)) return errorResponse("Adresse email invalide : vérifiez qu'elle contient un « @ » et un domaine.", 400)

  const admin = createAdminClient()
  if (await isRateLimited(admin, [{ kind: 'acc-ip', value: clientIp(request), limit: 5, windowSeconds: 3600 }])) {
    return errorResponse('Trop de demandes. Réessayez plus tard.', 429)
  }
  const emailLimited = await isRateLimited(admin, [{ kind: 'acc-email', value: email, limit: 3, windowSeconds: 3600 }])

  if (!emailLimited) {
    const deps = createAccessDeps()
    after(async () => {
      await requestPasswordReset(deps, { email })
    })
  }
  return NextResponse.json(NEUTRAL, { headers: { 'Cache-Control': 'no-store' } })
}
