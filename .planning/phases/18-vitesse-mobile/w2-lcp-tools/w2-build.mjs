// node w2-build.mjs <worktree> : build with a stub data server on 3108 (killed after), sentry plugin env moved away
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
const wt = process.argv[2]
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ''))
const sf = path.join(wt, '.env.sentry-build-plugin')
if (fs.existsSync(sf)) fs.renameSync(sf, sf + '.off')
const stub = spawn('node', [path.join(here, 'w2-stub.mjs')], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 1000))
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:3108', SUPABASE_URL: 'http://127.0.0.1:3108', SENTRY_AUTH_TOKEN: '' }
const r = spawnSync('npx', ['next', 'build'], { cwd: wt, env, shell: true, encoding: 'utf8', maxBuffer: 1 << 28 })
fs.writeFileSync(path.join(here, 'w2-build.log'), (r.stdout || '') + (r.stderr || ''))
stub.kill()
if (fs.existsSync(sf + '.off')) fs.renameSync(sf + '.off', sf)
console.log('build exit', r.status)
console.log(((r.stdout || '') + (r.stderr || '')).split('\n').slice(-12).join('\n'))
