/**
 * Writes the rendered newsletter emails (season campaign + J+2 / J+3) as HTML files
 * OUTSIDE the repository, for visual review. Offline: contacts nobody, sends nothing,
 * never reads a secret.
 *
 * Usage:
 *   node scripts/preview-newsletter-campaign.mjs [--out <dir>] [--local-base <url>]
 *
 * --out         target folder (default: <os tmpdir>/gecko-newsletter-preview)
 * --local-base  rewrite https://geckocabanerestaurant.com/email/ image URLs to
 *               <url>/email/ (serve public/ locally, e.g. http://localhost:3105) so
 *               the images show before they are deployed.
 *
 * Needs Node 22.18+ (native TypeScript type stripping).
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

// The source uses extensionless relative imports (bundler resolution): resolve them to .ts.
register(
  'data:text/javascript,' +
    encodeURIComponent(`
export async function resolve(specifier, context, next) {
  try { return await next(specifier, context) } catch (e) {
    if (specifier.startsWith('.') && !/\\.[a-z]+$/.test(specifier)) return next(specifier + '.ts', context)
    throw e
  }
}`),
  import.meta.url
)

const args = process.argv.slice(2)
const opt = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const out = opt('--out') ?? path.join(os.tmpdir(), 'gecko-newsletter-preview')
const localBase = opt('--local-base')

const root = path.resolve(import.meta.dirname, '..')
if (path.resolve(out).startsWith(root + path.sep)) {
  console.error('--out must be outside the repository.')
  process.exit(1)
}

const { sequenceEmail } = await import(pathToFileURL(path.join(root, 'src/utils/newsletter-emails.ts')).href)

const unsubscribe = 'https://geckocabanerestaurant.com/fr/newsletter/unsubscribe?r=1&s=PREVIEW-NOT-A-REAL-SIGNATURE'
const jobs = [
  ['campaign-fr', 'october_return', 'fr'],
  ['campaign-en', 'october_return', 'en'],
  ['j2-fr', 'after_visit_j2', 'fr'],
  ['j3-en', 'during_stay_j3', 'en'],
]

fs.mkdirSync(out, { recursive: true })
for (const [name, kind, locale] of jobs) {
  const mail = sequenceEmail(kind, locale, unsubscribe)
  let html = mail.html
  if (localBase) html = html.replaceAll('https://geckocabanerestaurant.com/email/', `${localBase.replace(/\/$/, '')}/email/`)
  fs.writeFileSync(path.join(out, `${name}.html`), html)
  fs.writeFileSync(path.join(out, `${name}.txt`), `Subject: ${mail.subject}\n\n${mail.text}\n`)
  console.log(`${name}: ${mail.subject}`)
}
console.log(`Written to ${out}`)
