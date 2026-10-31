import { notFound } from 'next/navigation'

/**
 * Toute adresse inconnue sous /admin rend la 404 de l'admin (`admin/not-found.tsx`, D4 §3.5)
 * et non la 404 générale du site public. Le middleware garde déjà /admin : sans session,
 * l'adresse inconnue renvoie à la connexion avant d'arriver ici.
 */
export default function AdminUnknownPage() {
  notFound()
}
