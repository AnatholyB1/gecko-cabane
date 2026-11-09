// node w2-exp.mjs <wt> <path> <runs> : real CDP throttling (1.6Mbps / 150ms RTT / CPU x4), HTML rewritten on the fly per variant (no rebuild); median FCP/LCP
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import path from 'node:path'
const [wt, p0, runsArg] = process.argv.slice(2)
const N = +runsArg || 5
const server = spawn(process.execPath, [path.join(wt, 'node_modules/next/dist/bin/next'), 'start', '-p', '3108'], { cwd: wt, stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 4000))
const cssCache = {}
const inl = async (h) => { const m = h.match(/<link rel="stylesheet" href="([^"]+)"[^>]*>/); if (!m) return h; cssCache[m[1]] ??= await (await fetch('http://localhost:3108' + m[1])).text(); return h.replace(m[0], '<style>' + cssCache[m[1]] + '</style>') }
const variants = {
  inlineCss: inl,
  inlineCssNoFontPre: async (h) => (await inl(h)).replace(/<link rel="preload"[^>]*as="font"[^>]*>/g, ''),
  base: (h) => h,
  noFontPreload: (h) => h.replace(/<link rel="preload"[^>]*as="font"[^>]*>/g, ''),
  noHeroPreload: (h) => h.replace(/<link rel="preload"[^>]*as="image"[^>]*>/g, ''),
  noPreloadAny: (h) => h.replace(/<link rel="preload"[^>]*>/g, ''),
  noScripts: (h) => h.replace(/<script[^>]*src=[^>]*><\/script>/g, '').replace(/<script>self\.__next_f[\s\S]*?<\/script>/g, ''),
  onlyCinzelDecoPreload: (h) => { let i = 0; return h.replace(/<link rel="preload"[^>]*as="font"[^>]*>/g, (m) => (i++ === 2 ? m : '')) },
}
const only = (process.env.W2_VARIANTS || Object.keys(variants).join(',')).split(',')
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)]
try {
  const browser = await chromium.launch()
  for (const name of only) {
    const fcps = [], lcps = []
    for (let i = 0; i < N; i++) {
      const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true })
      const page = await ctx.newPage()
      await page.route('**/' + p0, async (route) => {
        const resp = await route.fetch()
        const body = await variants[name](await resp.text())
        await route.fulfill({ response: resp, body })
      })
      const cdp = await ctx.newCDPSession(page)
      await cdp.send('Network.enable')
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 562.5, downloadThroughput: (1.6 * 1024 * 1024 * 0.9) / 8, uploadThroughput: (750 * 1024) / 8 })
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
      await page.addInitScript(() => {
        window.__m = {}
        new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__m.fcp = e.startTime }).observe({ type: 'paint', buffered: true })
        new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
      })
      await page.goto('http://localhost:3108/' + p0, { waitUntil: 'load' })
      await page.waitForTimeout(1500)
      const m = await page.evaluate(() => window.__m)
      fcps.push(Math.round(m.fcp)); lcps.push(Math.round(m.lcp))
      await ctx.close()
    }
    console.log(name.padEnd(22), 'FCP med', med(fcps), 'LCP med', med(lcps), '| FCP', fcps.join(','), '| LCP', lcps.join(','))
  }
  await browser.close()
} finally {
  server.kill()
}
