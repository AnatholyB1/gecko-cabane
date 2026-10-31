import { NextResponse } from 'next/server'
import { requireAdmin } from '@/utils/auth'
import { createAccessDeps } from '@/utils/access/deps'
import { listAccess } from '@/utils/access/service'
import { errorResponse } from '@/utils/access/http'

/** Administrateurs et invitations en cours (réservé aux administrateurs). */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  try {
    const data = await listAccess(createAccessDeps(), auth.user.id)
    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return errorResponse('Impossible de charger les accès.', 500)
  }
}
