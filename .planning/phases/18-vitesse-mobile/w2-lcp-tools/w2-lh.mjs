// node w2-lh.mjs <label> <runs> <worktree> [paths comma] : next start on 3108 (own PID only), N mobile Lighthouse runs per page, full LHR saved
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
const [label, runsArg, wt, pathsArg] = process.argv.slice(2)
const N = +runsArg
const paths = (pathsArg || '/fr,/en').split(',')
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ''))
const chromePath = 'C:/Users/Anatholy/AppData/Local/ms-playwright/chromium-1254/chrome-win64/chrome.exe'
const server = spawn(process.execPath, process.env.W2_DELAY ? [path.join(here, 'w2-delay-server.mjs'), wt, process.env.W2_DELAY] : [path.join(wt, 'node_modules/next/dist/bin/next'), 'start', '-p', '3108'], { cwd: wt, stdio: 'ignore', env: { ...process.env, SENTRY_AUTH_TOKEN: '' } })
await new Promise((r) => setTimeout(r, 4000))
// warm-up (not counted)
for (const p of paths) await fetch(`http://localhost:3108${p}`).then((r) => r.text())
const out = { label, env: { cpus: os.cpus().length, node: process.version, loadavgNote: 'n/a on win32' }, pages: {} }
try {
  for (const p of paths) {
    const runs = []
    for (let i = 0; i < N; i++) {
      const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox'] })
      const r = await lighthouse(`http://localhost:3108${p}`, { port: chrome.port, output: 'json', logLevel: 'error', formFactor: 'mobile', ...(process.env.W2_THROTTLE ? { throttlingMethod: process.env.W2_THROTTLE } : {}), onlyCategories: ['performance'], blockedUrlPatterns: ['*/monitoring*', '*/gcm/*'] })
      await chrome.kill()
      fs.writeFileSync(path.join(here, `w2-${label}-${p.replace(/\//g, '_')}-${i}.json`), JSON.stringify(r.lhr))
      const a = r.lhr.audits
      runs.push({
        perf: Math.round(r.lhr.categories.performance.score * 100),
        lcp: Math.round(a['largest-contentful-paint'].numericValue), tbt: Math.round(a['total-blocking-time'].numericValue),
        fcp: Math.round(a['first-contentful-paint'].numericValue), si: Math.round(a['speed-index'].numericValue), cls: +a['cumulative-layout-shift'].numericValue.toFixed(3),
        ttfb: Math.round(a['server-response-time']?.numericValue ?? 0), kib: Math.round(a['total-byte-weight'].numericValue / 1024),
        bench: r.lhr.environment.benchmarkIndex,
      })
      console.log(label, p, i + 1, JSON.stringify(runs[i]))
    }
    const s = [...runs].sort((x, y) => x.perf - y.perf)
    const med = (k) => [...runs].map((x) => x[k]).sort((x, y) => x - y)[Math.floor(N / 2)]
    out.pages[p] = { medianPerf: s[Math.floor(N / 2)].perf, min: s[0].perf, max: s[N - 1].perf, medLcp: med('lcp'), medTbt: med('tbt'), medFcp: med('fcp'), runs }
    console.log(label, p, 'MEDIAN', out.pages[p].medianPerf, `(${s[0].perf}-${s[N - 1].perf})`, 'LCP', out.pages[p].medLcp, 'TBT', out.pages[p].medTbt)
  }
} finally {
  server.kill()
}
fs.writeFileSync(path.join(here, `w2-${label}.json`), JSON.stringify(out, null, 1))
