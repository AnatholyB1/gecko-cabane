/**
 * DSN-06 : le dialogue de confirmation accessible remplace les `confirm()` natifs.
 * Les pages sont migrées par les phases 13 à 16 : ce test est un CLIQUET. Il inventorie les
 * `confirm()` natifs restants dans src/app/admin et échoue si l'un d'eux apparaît ailleurs
 * ou si leur nombre augmente. Quand une page est migrée, baisser (ou retirer) son entrée.
 *
 * Le comportement du dialogue (rôle alertdialog, focus piégé et rendu, Échap) est prouvé en
 * navigateur sur /admin/kit : un portail Base UI n'existe pas en rendu serveur.
 */
import { describe, expect, it } from 'vitest'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { ConfirmProvider, useConfirm } from '../src/components/admin/ConfirmDialog'

const root = join(__dirname, '..')
const adminDir = join(root, 'src', 'app', 'admin')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.tsx?$/.test(name) ? [full] : []
  })
}

/** `confirm('…')`, `confirm(\`…\`)`, `window.confirm(…)` : l'API native (pas `await confirm({ … })` du hook). */
const NATIVE_CONFIRM = /(?<![\w.$])confirm\(\s*['"`]|\bwindow\.confirm\(/g

/** Inventaire autorisé (relatif à la racine). À faire diminuer, jamais augmenter. */
const BASELINE: Record<string, number> = {
  'src/app/admin/(app)/hours/page.tsx': 1,
  'src/app/admin/(app)/menu/page.tsx': 1,
  'src/app/admin/(app)/menu/[pageId]/page.tsx': 2,
  'src/app/admin/(app)/reservations/page.tsx': 1,
}

function inventory(): Record<string, number> {
  const found: Record<string, number> = {}
  for (const file of walk(adminDir)) {
    const n = (readFileSync(file, 'utf8').match(NATIVE_CONFIRM) ?? []).length
    if (n > 0) found[relative(root, file).split('\\').join('/')] = n
  }
  return found
}

describe('DSN-06 confirm() natifs restants (cliquet)', () => {
  it('aucun nouveau confirm() natif, et le total ne dépasse pas l’inventaire', () => {
    const found = inventory()
    const added = Object.keys(found).filter((f) => !(f in BASELINE))
    expect(added, `nouveau confirm() natif : utiliser useConfirm()\n${added.join('\n')}`).toEqual([])
    const grown = Object.entries(found).filter(([f, n]) => n > (BASELINE[f] ?? 0))
    expect(grown).toEqual([])
  })

  it('l’inventaire n’est pas périmé : une page migrée doit sortir de la liste', () => {
    const found = inventory()
    const stale = Object.keys(BASELINE).filter((f) => !(f in found))
    expect(stale, `retirer de BASELINE (page migrée) : ${stale.join(', ')}`).toEqual([])
  })

  it('le motif natif ne confond pas useConfirm() avec window.confirm()', () => {
    const sample = "const ok = await confirm({ title: 'x' }); if (!window.confirm('y')) return; if (!confirm(`z`)) return"
    expect(sample.match(NATIVE_CONFIRM)).toHaveLength(2)
    expect("await confirm({ title: 'x' })".match(NATIVE_CONFIRM)).toBeNull()
    expect('useConfirm()'.match(NATIVE_CONFIRM)).toBeNull()
  })
})

describe('DSN-06 ConfirmProvider / useConfirm', () => {
  it('useConfirm hors fournisseur lève une erreur explicite', () => {
    function Bad() {
      useConfirm()
      return null
    }
    expect(() => renderToStaticMarkup(h(Bad))).toThrow(/ConfirmProvider/)
  })

  it('sous le fournisseur, useConfirm renvoie une fonction (Promise<boolean>)', () => {
    function Probe() {
      return h('p', null, typeof useConfirm())
    }
    expect(renderToStaticMarkup(h(ConfirmProvider, null, h(Probe)))).toBe('<p>function</p>')
  })
})
