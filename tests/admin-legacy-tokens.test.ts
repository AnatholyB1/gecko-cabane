/**
 * QA-03 : aucun ancien jeton de couleur du site public (`--primary`, `--warm-*`, `--jungle-dark`, ...)
 * dans `src/app/admin`. L'admin n'utilise que les jetons `--adm-*` (admin.css).
 * Le détecteur est testé sur un faux exemple pour prouver qu'il échoue quand il doit.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(__dirname, '..')
const ADMIN_DIR = join(root, 'src/app/admin')

const LEGACY = '(?:primary-dark|primary|accent-light|accent|warm-white|warm-gray|warm-gold|jungle-dark|bamboo|tropical|leaf-green|moss|gc-[a-z0-9-]+)'
// `var(--primary)`, `bg-(--primary)`, `bg-[var(--primary)]`, `text-(--warm-gray)`, `(--gc-jungle)` ; jamais `--adm-accent`.
const TOKEN_REF = new RegExp(`(?:var\\(|\\(|\\[)\\s*--${LEGACY}(?![a-z0-9-])`, 'g')
// Utilitaires Tailwind liés au thème du site public (`@theme inline`) : `text-primary`, `bg-warm-white`, ...
const THEME_CLASS = new RegExp(`(?<![\\w-])(?:bg|text|border|ring|fill|stroke|from|to|via|outline|divide|decoration|shadow)-(?:primary-dark|primary|accent-light|accent|warm-white|warm-gray|warm-gold|jungle-dark|bamboo|tropical|leaf-green|moss)(?![\\w-])`, 'g')

export function findLegacyTokens(source: string): string[] {
  return [...(source.match(TOKEN_REF) ?? []), ...(source.match(THEME_CLASS) ?? [])]
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return walk(p)
    return /\.(tsx?|css|mdx?)$/.test(name) ? [p] : []
  })
}

describe('QA-03 : aucun ancien jeton dans src/app/admin', () => {
  it('le détecteur échoue sur un faux exemple (et épargne les jetons --adm-*)', () => {
    expect(findLegacyTokens('.x { color: var(--primary); }')).toHaveLength(1)
    expect(findLegacyTokens('className="bg-(--primary-dark) text-(--warm-gray)"')).toHaveLength(2)
    expect(findLegacyTokens('className="bg-[var(--jungle-dark)]"')).toHaveLength(1)
    expect(findLegacyTokens('className="text-primary bg-warm-white"')).toHaveLength(2)
    expect(findLegacyTokens('.x { color: var(--gc-jungle); }')).toHaveLength(1)
    expect(findLegacyTokens('.x { color: var(--adm-accent); background: var(--adm-brand); }')).toEqual([])
    expect(findLegacyTokens('.adm-btn--primary { --_bg: var(--adm-brand); } // primary action')).toEqual([])
  })

  it('le dossier admin est lu (garde contre un test vide)', () => {
    expect(walk(ADMIN_DIR).length).toBeGreaterThan(20)
  })

  it('aucun fichier de src/app/admin ne référence un ancien jeton', () => {
    const offenders: string[] = []
    for (const file of walk(ADMIN_DIR)) {
      const hits = findLegacyTokens(readFileSync(file, 'utf8'))
      if (hits.length) offenders.push(`${file.slice(root.length + 1)} : ${hits.join(', ')}`)
    }
    expect(offenders).toEqual([])
  })
})
