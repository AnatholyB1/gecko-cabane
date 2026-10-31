/**
 * DSN-02 : les jetons --adm-* vivent sur `.adm-root, .adm-portal` (les portails Base UI
 * sortent de .adm-root), neutralisent les styles du site public et ne réutilisent aucune
 * variable publique.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const css = readFileSync(join(__dirname, '..', 'src', 'app', 'admin', 'admin.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

/** Corps du premier bloc dont le sélecteur contient à la fois .adm-root et .adm-portal. */
function tokenBlock(): string {
  const re = /([^{}]+)\{([^{}]*)\}/g
  for (const m of css.matchAll(re)) {
    if (m[1].includes('.adm-root') && m[1].includes('.adm-portal') && m[2].includes('--adm-bg')) return m[2]
  }
  return ''
}

const block = tokenBlock()

// Les 14 jetons imposés par le contrat D1 (§2.1) + rayons, espacements, typographie.
const REQUIRED = [
  '--adm-bg', '--adm-surface', '--adm-surface-2', '--adm-ink', '--adm-muted', '--adm-line',
  '--adm-brand', '--adm-accent', '--adm-ok', '--adm-warn', '--adm-danger', '--adm-info',
  '--adm-radius', '--adm-radius-lg', '--adm-space-4', '--adm-font-sans', '--adm-font-display',
  '--adm-focus', '--adm-target',
]

describe('DSN-02 jetons --adm-*', () => {
  it('définit chaque jeton requis sur .adm-root et .adm-portal', () => {
    expect(block, 'bloc de jetons introuvable').not.toBe('')
    const missing = REQUIRED.filter((t) => !new RegExp(`${t}\\s*:`).test(block))
    expect(missing).toEqual([])
  })

  it('la police de l’interface est Inter (variable next/font), le serif est réservé aux titres', () => {
    expect(block).toMatch(/--adm-font-sans:\s*var\(--font-adm-sans\)/)
    expect(block).toMatch(/--adm-font-display:\s*var\(--font-cormorant\)/)
  })

  it('pose les chiffres tabulaires et le thème clair', () => {
    expect(block).toMatch(/font-variant-numeric:\s*tabular-nums/)
    expect(block).toMatch(/color-scheme:\s*light/)
  })

  it('ne dépend d’aucune variable du site public ni des anciennes variables admin', () => {
    expect(css).not.toMatch(/var\(--(gc-|primary|warm-|jungle|accent-light|moss|leaf|tropical|bamboo|background|foreground)/)
  })

  it('redéfinit le focus visible pour l’admin et ses portails', () => {
    expect(css).toMatch(/\.adm-portal button:focus-visible/)
    expect(css).toMatch(/\.adm-root button:focus-visible/)
  })

  it('respecte prefers-reduced-motion', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
  })
})
