/**
 * DSN-07 : la page kit interne affiche tous les composants et états, et n'est liée depuis
 * aucune navigation.
 */
import { describe, expect, it, vi } from 'vitest'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { AdminProviders } from '../src/components/admin/AdminProviders'
import { KitClient } from '../src/app/admin/(app)/kit/KitClient'

const root = join(__dirname, '..')
async function loadKitPage() {
  const mod = await import('../src/app/admin/(app)/kit/page')
  const run = (env: string) => () => {
    vi.stubEnv('NODE_ENV', env)
    try {
      return mod.default()
    } finally {
      vi.unstubAllEnvs()
    }
  }
  return { AdminKitPage404: { production: run('production'), development: run('development'), test: run('test') } }
}

const html = renderToStaticMarkup(h(AdminProviders, null, h(KitClient)))

describe('DSN-07 page kit', () => {
  it('affiche une section par composant et par état', () => {
    for (const id of ['tokens', 'buttons', 'fields', 'cards', 'table', 'pageheader', 'dialog', 'toast', 'states']) {
      expect(html, id).toContain(`id="${id}"`)
    }
  })

  it('un seul h1 ; la démo PageHeader est un h2', () => {
    expect(html.match(/<h1/g)).toHaveLength(1)
  })

  it('montre les cinq états de Button et les cinq statuts avec icône et libellé', () => {
    expect(html).toContain('adm-btn--primary')
    expect(html).toContain('adm-btn--danger')
    expect(html).toContain('adm-btn--ghost')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('disabled=""')
    for (const label of ['En attente', 'Confirmée', 'Terminée', 'Annulée', 'Non présenté']) expect(html).toContain(label)
  })

  it('montre champ en erreur, tableau, chargement, vide et erreur', () => {
    expect(html).toContain('aria-invalid="true"')
    expect(html).toContain('<table class="adm-table"')
    expect(html).toContain('role="status"')
    expect(html).toContain('Aucune réservation ce jour')
    expect(html).toContain('Réessayer')
  })

  it('hors développement (production), /admin/kit répond 404 ; en développement, elle s’affiche', async () => {
    const { AdminKitPage404 } = await loadKitPage()
    expect(AdminKitPage404.production).toThrow(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/)
    expect(AdminKitPage404.development()).toBeTruthy()
    expect(AdminKitPage404.test()).toBeTruthy()
  })

  it('la garde 404 est dans la page, sans variable d’environnement qui la désactive', () => {
    const src = readFileSync(join(root, 'src/app/admin/(app)/kit/page.tsx'), 'utf8')
    expect(src).toContain("process.env.NODE_ENV === 'production'")
    expect(src).toContain('notFound()')
  })

  it('aucune navigation ne lie /admin/kit (page interne, sans lien)', () => {
    const offenders: string[] = []
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => {
        const f = join(dir, n)
        return statSync(f).isDirectory() ? walk(f) : /\.tsx?$/.test(n) ? [f] : []
      })
    for (const dir of ['src/components', 'src/app']) {
      for (const f of walk(join(root, dir))) {
        const rel = relative(root, f).split('\\').join('/')
        if (rel.startsWith('src/app/admin/(app)/kit/')) continue
        if (/['"`]\/admin\/kit/.test(readFileSync(f, 'utf8'))) offenders.push(rel)
      }
    }
    expect(offenders).toEqual([])
  })
})
