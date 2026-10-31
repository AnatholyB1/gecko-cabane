/**
 * Exemption i18n de src/components/admin/ (phase 11, D-14).
 *
 * L'admin est en français fixe (règle du projet) : ses primitives contiennent du
 * français accentué (« Réessayer », « Chargement… »). tests/i18n-hardcoded.test.ts
 * exempte donc CE dossier, et uniquement lui. Le test
 * tests/admin-component-exemption.test.ts garantit que l'exemption ne déborde pas.
 */
import { sep } from 'node:path'

/** Dossier exempté, relatif à la racine du dépôt, séparateurs POSIX. */
export const ADMIN_COMPONENTS_DIR = 'src/components/admin'

/** Vrai uniquement pour un fichier situé sous src/components/admin/ (chemin relatif à la racine). */
export function isAdminComponentPath(relativePath: string): boolean {
  const p = relativePath.split(sep).join('/')
  return p.startsWith(`${ADMIN_COMPONENTS_DIR}/`)
}
