/**
 * L'exemption i18n de src/components/admin/ ne couvre que ce dossier (phase 11, D-14),
 * et le code public n'importe jamais les composants d'admin.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { ADMIN_COMPONENTS_DIR, isAdminComponentPath } from './helpers/admin-exemption'

const root = join(__dirname, '..')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.tsx?$/.test(name) ? [full] : []
  })
}

describe('exemption i18n de src/components/admin/', () => {
  it('couvre les fichiers de src/components/admin/ (y compris en sous-dossier)', () => {
    expect(isAdminComponentPath('src/components/admin/Button.tsx')).toBe(true)
    expect(isAdminComponentPath('src/components/admin/deep/Thing.tsx')).toBe(true)
    expect(isAdminComponentPath(join('src', 'components', 'admin', 'Button.tsx'))).toBe(true)
  })

  it('ne couvre rien d’autre : voisins au nom proche, site public, pages localisées', () => {
    for (const p of [
      'src/components/admin-extra/Button.tsx',
      'src/components/adminButton.tsx',
      'src/components/administration/X.tsx',
      'src/components/seo/Json.tsx',
      'src/components/ui/GcDivider.tsx',
      'src/components/SiteHeader.tsx',
      'src/app/[locale]/page.tsx',
      'src/app/admin/page.tsx',
      'src/components/x/admin/Button.tsx',
      'tests/admin/Button.tsx',
    ]) {
      expect(isAdminComponentPath(p), p).toBe(false)
    }
  })

  it('le dossier exempté est exactement src/components/admin', () => {
    expect(ADMIN_COMPONENTS_DIR).toBe('src/components/admin')
  })

  it('parmi les fichiers du site public et des pages localisées, aucun n’est exempté', () => {
    const scanned = [...walk(join(root, 'src', 'components')), ...walk(join(root, 'src', 'app', '[locale]'))]
    const exempt = scanned.filter((f) => isAdminComponentPath(relative(root, f)))
    expect(exempt.every((f) => relative(root, f).split('\\').join('/').startsWith('src/components/admin/'))).toBe(true)
    expect(scanned.filter((f) => relative(root, f).includes('[locale]') && isAdminComponentPath(relative(root, f)))).toEqual([])
  })

  it('aucun fichier hors src/app/admin et src/components/admin n’importe @/components/admin', () => {
    const offenders: string[] = []
    for (const file of walk(join(root, 'src'))) {
      const rel = relative(root, file).split('\\').join('/')
      if (rel.startsWith('src/app/admin/') || rel.startsWith('src/components/admin/')) continue
      if (/from\s+'@\/components\/admin(\/|')/.test(readFileSync(file, 'utf8'))) offenders.push(rel)
    }
    expect(offenders).toEqual([])
  })
})
