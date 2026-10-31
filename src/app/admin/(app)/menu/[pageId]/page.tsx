import { MenuScreen } from '@/components/admin/menu/MenuScreen'

/**
 * /admin/menu/[pageId] : l'ancienne adresse d'édition d'une page de carte continue de répondre.
 * Elle rend le même écran unique, positionné sur cette page de carte (une page inconnue retombe
 * sur la première).
 */
export default async function MenuPageEditor({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params
  const id = Number.parseInt(pageId, 10)
  return <MenuScreen initialPageId={Number.isFinite(id) ? id : undefined} />
}
