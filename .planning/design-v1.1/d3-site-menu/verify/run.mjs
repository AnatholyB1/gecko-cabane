import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
const DIR = 'C:/gecko-cabane/.claude/worktrees/agent-a4d9152c2709e07d6/.planning/design-v1.1/d3-site-menu'
const SHOTS = path.join(DIR, 'screens'); fs.mkdirSync(SHOTS, { recursive: true })
const pages = JSON.parse(fs.readFileSync(path.join(DIR, '.pages.json'), 'utf8'))
const only = process.argv[2]
const VPS = [['390', { width: 390, height: 844 }, 2], ['768', { width: 768, height: 1024 }, 1], ['1440', { width: 1440, height: 900 }, 1]]
const browser = await chromium.launch({ executablePath: 'C:/Users/Anatholy/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe' })

const measure = () => {
  const out = { overflow: null, small: [], targets: [], contrast: [] }
  const doc = document.documentElement
  if (doc.scrollWidth > doc.clientWidth + 1) out.overflow = `${doc.scrollWidth}>${doc.clientWidth}`
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b) }
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { c: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 } }
  const bgOf = (el) => { let layers = []; let e = el; while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break } e = e.parentElement } let base = [255, 255, 255]; for (const l of layers.reverse()) base = base.map((v, i) => v * (1 - l.a) + l.c[i] * l.a); return base }
  const sr = (el) => { const r = el.getBoundingClientRect(); return el.closest('.sr-only') || r.width <= 1 }
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const label = (el) => (el.getAttribute('aria-label') || el.textContent || el.id || el.tagName).trim().slice(0, 40)
  // text size + contrast
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const seen = new Set()
  while (walker.nextNode()) {
    const n = walker.currentNode; const t = n.textContent.trim(); if (!t) continue
    const el = n.parentElement; if (seen.has(el) || !vis(el) || sr(el)) continue; seen.add(el)
    const s = getComputedStyle(el); const fs = parseFloat(s.fontSize)
    if (fs < 14) out.small.push(`${fs}px "${t.slice(0, 30)}"`)
    if (el.closest('.ph, [disabled]')) continue
    const fg = parse(s.color); if (!fg) continue
    const bg = bgOf(el); const fgc = fg.a < 1 ? fg.c.map((v, i) => v * fg.a + bg[i] * (1 - fg.a)) : fg.c
    const L1 = lum(fgc), L2 = lum(bg); const ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05)
    const large = fs >= 24 || (fs >= 18.66 && parseInt(s.fontWeight) >= 700)
    if (ratio < (large ? 3 : 4.5)) out.contrast.push(`${ratio.toFixed(2)} "${t.slice(0, 30)}"`)
  }
  // targets
  const sel = 'a[href],button,input:not([type=hidden]),select,textarea,[role=switch],[role=tab],[role=radio],[role=checkbox]'
  for (const el of document.querySelectorAll(sel)) {
    if (!vis(el) || sr(el) || el.closest('.ph')) continue
    if (el.matches('input[type=time],input[type=date]') && false) continue
    let t = el
    if (el.closest('.price') && el.tagName === 'INPUT') t = el.closest('.price')
    const r = t.getBoundingClientRect()
    if (r.width < 43.5 || r.height < 43.5) out.targets.push(`${Math.round(r.width)}x${Math.round(r.height)} ${label(el)}`)
  }
  return out
}

let bad = 0
const rows = []
for (const [vn, vp, dpr] of VPS) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dpr, locale: 'fr-FR' })
  for (const f of pages) {
    if (only && !f.includes(only)) continue
    const p = await ctx.newPage()
    await p.goto('file:///' + path.join(DIR, f).replace(/\\/g, '/'))
    await p.addStyleTag({ content: '*{animation:none!important;transition:none!important}' })
    let shot = await p.evaluate(() => document.body.dataset.shot)
    if (await p.evaluate(() => !!document.querySelector('.toast-wrap'))) { shot = 'viewport'; await p.evaluate(() => { const e = document.querySelector('.rowstatus, .alert, .item.off, .savebar'); if (e) e.scrollIntoView({ block: 'center' }) }) }
    if (shot !== 'viewport') await p.addStyleTag({ content: '.savebar,.addbar{position:static!important}' })
    await p.screenshot({ path: path.join(SHOTS, `${f.replace('.html', '')}__${vn}.png`), fullPage: shot !== 'viewport' })
    if (process.env.NEG) await p.evaluate(() => { document.querySelector('main').insertAdjacentHTML('afterbegin','<span style="font-size:12px;color:#aaa">negatif</span><button style="width:30px;height:30px">x</button>') })
    const m = await p.evaluate(measure)
    const issues = (m.overflow ? 1 : 0) + m.small.length + m.targets.length + m.contrast.length
    if (issues) { bad++; console.log(`[${vn}] ${f}`, m.overflow ? 'OVERFLOW ' + m.overflow : '', m.small.length ? 'SMALL ' + JSON.stringify(m.small.slice(0, 4)) : '', m.targets.length ? 'TARGET ' + JSON.stringify(m.targets.slice(0, 5)) : '', m.contrast.length ? 'CONTRAST ' + JSON.stringify(m.contrast.slice(0, 5)) : '') }
    rows.push({ vn, f, issues })
    await p.close()
  }
  await ctx.close()
}
await browser.close()
console.log(`done: ${rows.length} renders, ${bad} with issues`)
