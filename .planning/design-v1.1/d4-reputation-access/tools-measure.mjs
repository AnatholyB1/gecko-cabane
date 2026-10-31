import { chromium } from 'playwright-core'
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const DIR = process.argv[2]
const SHOTS = process.argv[3] !== 'noshots'
const CAP = join(DIR, 'captures')
mkdirSync(CAP, { recursive: true })
const axeSrc = readFileSync(join(process.cwd(), 'node_modules/axe-core/axe.min.js'), 'utf8')
const VPS = [
  { n: '390', width: 390, height: 844, dpr: 2 },
  { n: '768', width: 768, height: 1024, dpr: 1 },
  { n: '1440', width: 1440, height: 900, dpr: 1 },
]
const browser = await chromium.launch({
  executablePath: 'C:/Users/Anatholy/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe',
  headless: true,
})
const files = readdirSync(DIR).filter((f) => f.endsWith('.html'))
const report = []
for (const f of files) {
  for (const vp of VPS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr })
    const page = await ctx.newPage()
    await page.goto(pathToFileURL(join(DIR, f)).href)
    await page.waitForTimeout(150)
    await page.addScriptTag({ content: axeSrc })
    const res = await page.evaluate(async () => {
      const out = { overflow: null, small: [], targets: [], contrast: [], axe: [] }
      const de = document.documentElement
      if (de.scrollWidth > window.innerWidth + 1) out.overflow = `${de.scrollWidth} > ${window.innerWidth}`
      const vis = (el) => {
        if (el.closest('dialog:not([open])')) return false
        const r = el.getClientRects()
        if (!r.length) return false
        const cs = getComputedStyle(el)
        return cs.visibility !== 'hidden' && cs.display !== 'none'
      }
      const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] } }
      const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 })
      const bgOf = (el) => {
        const stack = []
        for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a === 1) break } }
        let base = { r: 255, g: 255, b: 255, a: 1 }
        for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base)
        return base
      }
      const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b) }
      const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) }
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      const seen = new Set()
      while (walker.nextNode()) {
        const t = walker.currentNode
        if (!t.nodeValue.trim()) continue
        const el = t.parentElement
        if (!el || seen.has(el) || el.closest('script,style,.sr,svg,.skip')) continue
        if (!vis(el)) continue
        seen.add(el)
        const cs = getComputedStyle(el)
        const fs = parseFloat(cs.fontSize)
        if (fs < 14) out.small.push(`${el.tagName.toLowerCase()}.${el.className} ${fs}px "${t.nodeValue.trim().slice(0, 30)}"`)
        if (el.closest('[disabled],[aria-disabled="true"]')) continue
        const fg = parse(cs.color); const bg = bgOf(el)
        const fgc = fg.a < 1 ? over(fg, bg) : fg
        const r = ratio(fgc, bg)
        const bold = parseInt(cs.fontWeight) >= 700
        const large = fs >= 24 || (fs >= 18.66 && bold)
        const need = large ? 3 : 4.5
        if (r < need) out.contrast.push(`${r.toFixed(2)}<${need} ${el.tagName.toLowerCase()}.${el.className} "${t.nodeValue.trim().slice(0, 30)}"`)
      }
      document.querySelectorAll('a,button,input:not([type=hidden]),select,textarea,summary').forEach((el) => {
        if (el.closest('.skip') || el.classList.contains('skip')) return
        if (!vis(el)) return
        if (el.closest('dialog') && !el.closest('dialog[open]')) return
        const cs = getComputedStyle(el)
        if (el.tagName === 'A' && cs.display === 'inline') return // lien dans un texte : exemption WCAG 2.5.8
        const r = el.getBoundingClientRect()
        if (r.height < 43.5 || r.width < 43.5) out.targets.push(`${el.tagName.toLowerCase()}.${el.className} ${r.width.toFixed(0)}x${r.height.toFixed(0)} "${(el.textContent || el.id).trim().slice(0, 24)}"`)
      })
      const ax = await axe.run(document, { resultTypes: ['violations'] })
      out.axe = ax.violations.map((v) => `${v.id}(${v.nodes.length}) ${v.nodes[0].target.join(' ')}`)
      return out
    })
    report.push({ f, vp: vp.n, ...res })
    if (SHOTS) await page.screenshot({ path: join(CAP, `${f.replace('.html', '')}-${vp.n}.png`), fullPage: true })
    await ctx.close()
  }
}
await browser.close()
let bad = 0
const lines = []
for (const r of report) {
  const issues = []
  if (r.overflow) issues.push(`OVERFLOW ${r.overflow}`)
  r.small.forEach((x) => issues.push(`SMALL ${x}`))
  r.targets.forEach((x) => issues.push(`TARGET ${x}`))
  r.contrast.forEach((x) => issues.push(`CONTRAST ${x}`))
  r.axe.forEach((x) => issues.push(`AXE ${x}`))
  if (issues.length) { bad++; lines.push(`## ${r.f} @${r.vp}`, ...issues.map((i) => '  ' + i)) }
}
writeFileSync(join(process.cwd(), 'last-report.txt'), lines.join('\n'))
console.log(`pages x viewports: ${report.length}, with issues: ${bad}`)
console.log(lines.slice(0, 120).join('\n'))
