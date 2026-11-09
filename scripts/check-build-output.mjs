// Build-output contract: run AFTER `next build` (`npm run check:build-output`).
// Reads .next/prerender-manifest.json and .next/routes-manifest.json and requires that the public
// pages are prerendered (SSG/ISR) for every locale, and that wifi / review / newsletter stay dynamic.
// Skips (exit 0, with a message) when .next does not exist, so it never breaks a fresh checkout.
// Not part of `vitest run` on purpose: vitest runs BEFORE `next build` and could read a stale .next.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(process.cwd(), '.next')
const prerenderPath = join(dir, 'prerender-manifest.json')
const routesPath = join(dir, 'routes-manifest.json')

if (!existsSync(prerenderPath) || !existsSync(routesPath)) {
  console.log('check-build-output: SKIP (no .next build output; run `npm run build` first)')
  process.exit(0)
}

const locales = ['fr', 'en', 'de', 'sv']
const prerendered = new Set(Object.keys(JSON.parse(readFileSync(prerenderPath, 'utf8')).routes))
const routes = JSON.parse(readFileSync(routesPath, 'utf8'))
const dynamicPages = new Set(routes.dynamicRoutes.map((r) => r.page))

// Must be prerendered for every locale: /<locale>, menu, privacy, the 5 guide pages.
const staticPaths = [
  '',
  '/menu',
  '/privacy',
  '/french-restaurant-krabi',
  '/getting-here-from-ao-nang',
  '/romantic-dinner-krabi',
  '/where-to-eat-krabi-town',
  '/wine-belgian-beer-krabi',
]
// Must never be prerendered (per-request: credentials, tokens, session).
const dynamicPaths = ['/not-found-fallback', '/wifi', '/review', '/newsletter', '/newsletter/confirm', '/newsletter/unsubscribe']

const errors = []
for (const l of locales) {
  for (const p of staticPaths) {
    if (!prerendered.has(`/${l}${p}`)) errors.push(`expected prerendered: /${l}${p}`)
  }
  for (const p of dynamicPaths) {
    if (prerendered.has(`/${l}${p}`)) errors.push(`must be dynamic, found prerendered: /${l}${p}`)
  }
}
for (const p of dynamicPaths) {
  if (!dynamicPages.has(`/[locale]${p}`)) errors.push(`expected dynamic route entry: /[locale]${p}`)
}

if (errors.length > 0) {
  console.error('check-build-output: FAIL\n- ' + errors.join('\n- '))
  process.exit(1)
}
console.log(`check-build-output: OK (${locales.length} locales, ${staticPaths.length} static + ${dynamicPaths.length} dynamic routes checked)`)
