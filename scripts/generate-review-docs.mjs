#!/usr/bin/env node
/**
 * Offline generator of the side-by-side review documents (Phase 6, D-06).
 *
 * Usage: node scripts/generate-review-docs.mjs <loc>
 *
 * Reads scripts/translation-scope.json, messages/fr.json and messages/<loc>.json and writes
 * docs/ph6/review/<loc>/<file>.md for every scope file. When the target file already exists,
 * the reviewer's corrections (last column, per key) and the sign-off line are preserved.
 * The sign-off line is never ticked or filled by this script.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const loc = process.argv[2]
if (!loc || !/^[a-z]{2}$/.test(loc)) {
  console.error('Usage: node scripts/generate-review-docs.mjs <loc>   (e.g. de)')
  process.exit(1)
}

const readJson = (p) => JSON.parse(readFileSync(p, 'utf-8'))
const scope = readJson(join(root, 'scripts/translation-scope.json'))
const fr = readJson(join(root, 'messages/fr.json'))
const en = readJson(join(root, 'messages/en.json'))
const target = readJson(join(root, `messages/${loc}.json`))

const SIGN_DEFAULT = '- [ ] Validé par écrit par : ____  Date : ____  Canal de la validation : ____'
const SIGN_RE = /^- \[( |x)\] Validé par écrit par :.*$/m

function leaves(obj, prefix = '') {
  if (typeof obj !== 'object' || obj === null) return [prefix]
  return Object.entries(obj).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k))
}
const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
const cell = (v) =>
  String(v ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>')

const enLeaves = leaves(en).filter((k) => k !== '')

function existingCorrections(doc) {
  const map = new Map()
  for (const line of doc.split('\n')) {
    if (!line.startsWith('| `')) continue
    const cells = line.split(/(?<!\\)\|/)
    const key = (cells[1] ?? '').trim().replace(/^`|`$/g, '')
    const corr = (cells[4] ?? '').trim()
    if (key) map.set(key, corr)
  }
  return map
}

const outDir = join(root, 'docs/ph6/review', loc)
mkdirSync(outDir, { recursive: true })

for (const [file, def] of Object.entries(scope.files)) {
  const keys = enLeaves.filter((k) => def.prefixes.some((p) => k === p || k.startsWith(`${p}.`)))
  const outPath = join(outDir, `${file}.md`)
  const prev = existsSync(outPath) ? readFileSync(outPath, 'utf-8') : ''
  const corrections = existingCorrections(prev)
  const sign = (prev.match(SIGN_RE) ?? [SIGN_DEFAULT])[0]
  const LOC = loc.toUpperCase()

  const rows = keys.map((k) => {
    const frVal = get(fr, k) ?? ''
    const tVal = get(target, k) ?? ''
    return `| \`${k}\` | ${cell(frVal)} | ${cell(tVal)} | ${corrections.get(k) ?? ''} |`
  })

  const doc = [
    `# Relecture ${LOC} — ${file}`,
    '',
    `Page : ${file}`,
    `pageKey : ${def.pageKey === null ? '(partagé, aucune page propre)' : def.pageKey === '' ? '/ (accueil)' : def.pageKey}`,
    `Statut : à relire (brouillon rédigé par Claude, non publié)`,
    '',
    'Instructions pour le relecteur :',
    `- Lisez le texte ${LOC} en regard du texte français.`,
    '- Écrivez vos corrections dans la dernière colonne, ligne par ligne.',
    '- Ne modifiez pas les autres colonnes.',
    '- Les balises comme <chef>, <seats>, <link> et les accolades {date} sont techniques : ne les changez pas.',
    '- Quand tout est relu, remplissez la ligne de validation ci-dessous (nom, date, canal).',
    '',
    `| Clé | FR | ${LOC} | Corrections du relecteur |`,
    '| --- | --- | --- | --- |',
    ...rows,
    '',
    '## Validation écrite',
    '',
    sign,
    '',
  ].join('\n')

  writeFileSync(outPath, doc, 'utf-8')
  console.log(`${outPath}  (${rows.length} clés)`)
}
