/**
 * DSN-01 : Base UI adopté (verdict du spike 11-SPIKE.md).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))
const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) } as Record<string, string>

describe('DSN-01 dépendances du système de design', () => {
  it('déclare @base-ui/react en version 1.x', () => {
    expect(deps['@base-ui/react']).toMatch(/^\^?1\./)
  })

  it('n’utilise pas l’ancien nom du paquet ni de bibliothèque de repli', () => {
    expect(deps['@base-ui-components/react']).toBeUndefined()
    expect(deps['sonner']).toBeUndefined()
  })

  it('déclare lucide-react (icônes)', () => {
    expect(deps['lucide-react']).toBeDefined()
  })

  it('Playwright n’est pas une dépendance du projet', () => {
    for (const name of Object.keys(deps)) expect(name).not.toMatch(/playwright/i)
  })
})
