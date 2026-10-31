import { NextResponse } from 'next/server'
import { requireAdmin } from '@/utils/auth'
import { createAccessDeps } from '@/utils/access/deps'
import { revokeInvitation } from '@/utils/access/service'
import { errorResponse, guarded, isSameOrigin, REVOKE_ERRORS } from '@/utils/access/http'

/** Révoque une invitation en attente ou expirée (le lien cesse de fonctionner). */
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return guarded(() => handle(request, ctx))
}

async function handle(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  if (!isSameOrigin(request)) return errorResponse('Requête refusée.', 403)

  const { id } = await params
  const result = await revokeInvitation(createAccessDeps(), { id })
  if (!result.ok) {
    const e = REVOKE_ERRORS[result.code]
    return errorResponse(e.message, e.status)
  }
  return NextResponse.json({ data: { ok: true } }, { headers: { 'Cache-Control': 'no-store' } })
}
