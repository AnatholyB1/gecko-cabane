import { NextResponse } from 'next/server'
import { requireAdmin } from '@/utils/auth'
import { createAccessDeps } from '@/utils/access/deps'
import { revokeAdmin } from '@/utils/access/service'
import { errorResponse, guarded, isSameOrigin, REVOKE_ERRORS } from '@/utils/access/http'

/**
 * Retire l'accès d'un administrateur : supprime sa ligne `gecko_admins` (le compte du pool
 * d'authentification partagé n'est PAS supprimé). Refuse de se retirer soi-même et de retirer
 * le dernier administrateur. L'effet est immédiat : `gecko_is_admin()` est évalué à chaque requête.
 */
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return guarded(() => handle(request, ctx))
}

async function handle(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!isSameOrigin(request)) return errorResponse('Requête refusée.', 403)

  const { id } = await params
  const result = await revokeAdmin(createAccessDeps(), { actorId: auth.user.id, targetId: id })
  if (!result.ok) {
    const e = REVOKE_ERRORS[result.code]
    return errorResponse(e.message, e.status)
  }
  return NextResponse.json({ data: { ok: true } }, { headers: { 'Cache-Control': 'no-store' } })
}
