/**
 * DSN-06 : le dialogue de confirmation accessible remplace les `confirm()` natifs.
 * Les pages sont migrées par les phases 13 à 16 : ce test est un CLIQUET. Il inventorie les
 * `confirm()` natifs restants dans src/app/admin et échoue si l'un d'eux apparaît ailleurs
 * ou si leur nombre augmente. Quand une page est migrée, baisser (ou retirer) son entrée. Phase 14 : la carte (menu/page.tsx, menu/[pageId]/page.tsx) est migrée vers useConfirm, entrées retirées.
 *
 * Le comportement du dialogue (rôle alertdialog, focus piégé et rendu, Échap) est prouvé en
 * navigateur sur /admin/kit : un portail Base UI n'existe pas en rendu serveur.
 */
import { describe, expect, it } from 'vitest'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { ConfirmProvider, useConfirm, inertApp } from '../src/components/admin/ConfirmDialog'

const root = join(__dirname, '..')
const adminDirs = [join(root, 'src', 'app', 'admin'), join(root, 'src', 'components', 'admin')]

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.tsx?$/.test(name) ? [full] : []
  })
}

/** `confirm('…')`, `confirm(\`…\`)`, `window.confirm(…)` : l'API native (pas `await confirm({ … })` du hook). */
const NATIVE_CONFIRM = /(?<![\w.$])confirm\(\s*['"`]|\b(?:window|globalThis)\.confirm\(/g

/** Inventaire autorisé (relatif à la racine). À faire diminuer, jamais augmenter. */
const BASELINE: Record<string, number> = {
}

function inventory(): Record<string, number> {
  const found: Record<string, number> = {}
  for (const file of adminDirs.flatMap(walk)) {
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
    expect("if (!globalThis.confirm('w')) return".match(NATIVE_CONFIRM)).toHaveLength(1)
    expect("await confirm({ title: 'x' })".match(NATIVE_CONFIRM)).toBeNull()
    expect('useConfirm()'.match(NATIVE_CONFIRM)).toBeNull()
  })
})

describe('DSN-06 le détecteur détecte vraiment (faux exemple)', () => {
  it('un fichier factice avec confirm(...) natif est compté, un fichier avec useConfirm ne l’est pas', () => {
    const bad = "export default function P() { function del() { if (!confirm('Supprimer ?')) return } return null }"
    const good = "export default function P() { const confirm = useConfirm(); async function del() { if (!(await confirm({ title: 'x' }))) return } return null }"
    expect((bad.match(NATIVE_CONFIRM) ?? []).length).toBe(1)
    expect((good.match(NATIVE_CONFIRM) ?? []).length).toBe(0)
  })

  it('l’inventaire couvre src/app/admin ET src/components/admin et le cliquet est à zéro', () => {
    expect(adminDirs.map((d) => relative(root, d).split('\\').join('/'))).toEqual(['src/app/admin', 'src/components/admin'])
    expect(Object.keys(BASELINE)).toEqual([])
    expect(inventory()).toEqual({})
  })
})

describe('F-01 le reste de la page est inerte pendant un dialogue', () => {
  function fakeScope(initialInert = false) {
    const attrs = new Set<string>(initialInert ? ['inert'] : [])
    const el = {
      hasAttribute: (n: string) => attrs.has(n),
      setAttribute: (n: string) => void attrs.add(n),
      removeAttribute: (n: string) => void attrs.delete(n),
    }
    const queried: string[] = []
    return { attrs, queried, scope: { querySelector: (sel: string) => (queried.push(sel), el) } as never }
  }

  it('pose inert sur .adm-app (pas le portail) et le retire au nettoyage', () => {
    const { attrs, queried, scope } = fakeScope()
    const restore = inertApp(scope)!
    expect(queried).toEqual(['.adm-app'])
    expect(attrs.has('inert')).toBe(true)
    restore()
    expect(attrs.has('inert')).toBe(false)
  })

  it('ne retire pas un inert posé par quelqu’un d’autre', () => {
    const { attrs, scope } = fakeScope(true)
    expect(inertApp(scope)).toBeUndefined()
    expect(attrs.has('inert')).toBe(true)
  })

  it('sans conteneur .adm-app (page sans shell) : sans effet', () => {
    expect(inertApp({ querySelector: () => null })).toBeUndefined()
  })

  it('le dialogue branche le hook sur son état ouvert (démontage et navigation = nettoyage de l’effet)', () => {
    const src = readFileSync(join(root, 'src', 'components', 'admin', 'ConfirmDialog.tsx'), 'utf8')
    expect(src).toMatch(/useInertApp\(open\)/)
    expect(src).toMatch(/return inertApp\(document\)/)
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
