import { NextResponse } from 'next/server'
import { requireAdmin } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/server'
import { createAccessDeps } from '@/utils/access/deps'
import { inviteAdmin } from '@/utils/access/service'
import { isValidEmail, normalizeEmail } from '@/utils/access/validation'
import { clientIp, errorResponse, guarded, INVITE_ERRORS, isRateLimited, isSameOrigin, readJsonObject } from '@/utils/access/http'

/**
 * Inviter un administrateur par email (lien à usage unique, 7 jours).
 * Réservé aux administrateurs. N'envoie qu'un email, ne crée aucun compte.
 * Le client service-role ne sert qu'au limiteur de débit (RLS sans politique).
 */
export async function POST(request: Request) {
  return guarded(() => handle(request))
}

async function handle(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!isSameOrigin(request)) return errorResponse('Requête refusée.', 403)

  const body = await readJsonObject(request)
  if (!body) return errorResponse('Requête invalide.', 400)
  const email = normalizeEmail(body.email)
  if (!isValidEmail(email)) return errorResponse(INVITE_ERRORS.invalid_email.message, INVITE_ERRORS.invalid_email.status)

  const limited = await isRateLimited(createAdminClient(), [
    { kind: 'acc-user', value: auth.user.id, limit: 10, windowSeconds: 3600 },
    { kind: 'acc-ip', value: clientIp(request), limit: 20, windowSeconds: 3600 },
    { kind: 'acc-email', value: email, limit: 3, windowSeconds: 86400 },
  ])
  if (limited) return errorResponse('Trop d\'invitations envoyées. Réessayez plus tard.', 429)

  const result = await inviteAdmin(createAccessDeps(), {
    actor: { id: auth.user.id, email: auth.user.email ?? '' },
    email,
  })
  if (!result.ok) {
    const e = INVITE_ERRORS[result.code === 'invalid_email' ? 'invalid_email' : result.code]
    return errorResponse(e.message, e.status)
  }
  return NextResponse.json({ data: { email: result.email, expiresAt: result.expiresAt } }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}
