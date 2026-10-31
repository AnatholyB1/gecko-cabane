import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const DIR = 'C:/gecko-cabane/.claude/worktrees/agent-aac5029c88381e664/.planning/design-v1.1/d1-system-shell'
const RENDERS = DIR + '/renders'
const SHOTS = process.argv.includes('--no-shots') === false
const sizes = [
  { w: 360, h: 780, dpr: 2, touch: true, shot: false },
  { w: 390, h: 844, dpr: 2, touch: true, shot: true },
  { w: 768, h: 1024, dpr: 1, touch: true, shot: true },
  { w: 1024, h: 768, dpr: 1, touch: true, shot: false },
  { w: 1440, h: 900, dpr: 1, touch: false, shot: true },
]
const shellVariants = ['home', 'site', 'empty', 'loading', 'error', 'home&menu=1', 'site&toast=1']

let browser
try { browser = await chromium.launch() } catch (e) {
  const base = 'C:/Users/Anatholy/AppData/Local/ms-playwright'
  const cands = fs.readdirSync(base).filter(d => d.startsWith('chromium-')).sort().reverse()
  let exe
  for (const c of cands) { const p = `${base}/${c}/chrome-win64/chrome.exe`; if (fs.existsSync(p)) { exe = p; break } }
  if (!exe) throw e
  browser = await chromium.launch({ executablePath: exe })
}

function measure() {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] } }
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 })
  const bgOf = (el) => { const stack = []; for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break } } let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base); return base }
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0' && !el.closest('[hidden]') && !el.closest('.sr-only') && !el.closest('.skip') && !el.closest('dialog:not([open])') }
  const out = { overflow: null, smallText: [], navLabels: [], targets: [], contrast: [], coarse: matchMedia('(pointer: coarse)').matches }
  out.overflow = { scrollWidth: document.documentElement.scrollWidth, innerWidth: innerWidth, bodyScroll: document.body.scrollWidth }
  const W = innerWidth
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const seen = new Set()
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    if (!t.textContent.trim()) continue
    const el = t.parentElement; if (!el || seen.has(el) || el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'TITLE') continue
    seen.add(el); if (!visible(el)) continue
    const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize)
    const label = (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : el.tagName.toLowerCase()) + ' "' + t.textContent.trim().slice(0, 24) + '"'
    if (fs < 14) { if (el.classList.contains('adm-nav-label')) out.navLabels.push({ label, fs }); else out.smallText.push({ label, fs }) }
    const fg0 = parse(cs.color); if (!fg0) continue
    const bg = bgOf(el); const fg = over(fg0, bg)
    const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
    const large = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight) >= 700)
    const need = large ? 3 : 4.5
    const disabled = el.closest(':disabled') ? true : false
    out.contrast.push({ label, ratio: Math.round(ratio * 100) / 100, need, disabled, ok: ratio >= need })
  }
  const sel = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=menuitem]'
  const fine = matchMedia('(pointer: fine)').matches && W >= 1024
  for (const el of document.querySelectorAll(sel)) {
    if (!visible(el)) continue
    let box = el
    if (el.matches('input[type=checkbox],input[type=radio]')) box = el.closest('label') || el
    const r = box.getBoundingClientRect()
    const min = fine ? 36 : 44
    const label = (el.getAttribute('aria-label') || el.textContent.trim() || el.id || el.tagName).slice(0, 28)
    out.targets.push({ label, w: Math.round(r.width), h: Math.round(r.height), min, ok: r.width >= min - 0.5 && r.height >= min - 0.5 })
  }
  return out
}

const report = []
const pages = [{ name: 'kit', url: 'kit.html' }, ...shellVariants.map(v => ({ name: 'shell-' + v, url: 'shell.html?v=' + v })) ]
for (const sz of sizes) {
  const ctx = await browser.newContext({ viewport: { width: sz.w, height: sz.h }, deviceScaleFactor: sz.dpr, hasTouch: sz.touch, isMobile: sz.touch && sz.w < 768 })
  for (const pg of pages) {
    const page = await ctx.newPage()
    await page.goto(pathToFileURL(path.join(DIR, pg.url.split('?')[0])).href + (pg.url.includes('?') ? '?' + pg.url.split('?')[1] : ''))
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(250)
    const m = await page.evaluate(measure)
    const fails = {
      overflow: m.overflow.scrollWidth > m.overflow.innerWidth || m.overflow.bodyScroll > m.overflow.innerWidth,
      smallText: m.smallText, navLabels: m.navLabels.length ? { n: m.navLabels.length, fs: m.navLabels[0].fs } : null,
      targets: m.targets.filter(t => !t.ok),
      contrast: m.contrast.filter(c => !c.ok && !c.disabled),
      contrastDisabled: m.contrast.filter(c => !c.ok && c.disabled).length,
      minContrast: Math.min(...m.contrast.filter(c => !c.disabled).map(c => c.ratio)),
      nTargets: m.targets.length, nText: m.contrast.length, coarse: m.coarse
    }
    report.push({ page: pg.name, w: sz.w, ...fails })
    if (sz.shot && SHOTS) {
      const base = pg.name.replace('&menu=1', '-menu').replace('&toast=1', '-toast')
      if (pg.name === 'kit') await page.screenshot({ path: `${RENDERS}/kit-${sz.w}.png`, fullPage: true, scale: 'css' })
      else await page.screenshot({ path: `${RENDERS}/${base}-${sz.w}.png`, fullPage: false })
    }
    await page.close()
  }
  await ctx.close()
}

// Comportements : dialogue natif (Echap + restitution du focus), menu compte, reduced-motion
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' })
const page = await ctx.newPage()
await page.goto(pathToFileURL(path.join(DIR, 'kit.html')).href)
await page.click('#open-dlg')
const opened = await page.evaluate(() => document.getElementById('dlg').open)
const focusIn = await page.evaluate(() => document.activeElement && document.activeElement.closest('dialog') !== null)
await page.keyboard.press('Escape')
const closed = await page.evaluate(() => !document.getElementById('dlg').open)
const restored = await page.evaluate(() => document.activeElement && document.activeElement.id === 'open-dlg')
const skelAnim = await page.evaluate(() => { const e = document.querySelector('.adm-skel'); return getComputedStyle(e).animationName })
const p2 = await ctx.newPage()
await p2.goto(pathToFileURL(path.join(DIR, 'shell.html')).href + '?v=site')
await p2.click('#acct')
const menuOpen = await p2.evaluate(() => !document.getElementById('acct-menu').hidden)
await p2.keyboard.press('Escape')
const menuClosed = await p2.evaluate(() => document.getElementById('acct-menu').hidden && document.activeElement.id === 'acct')
const behav = { dialogOpened: opened, focusInsideDialog: focusIn, escCloses: closed, focusRestored: restored, reducedMotionSkeletonAnimation: skelAnim, accountMenuOpen: menuOpen, accountMenuEscFocusBack: menuClosed }
await browser.close()

fs.writeFileSync('C:/Users/Anatholy/AppData/Local/Temp/gecko-pw-d1/report.json', JSON.stringify({ report, behav }, null, 1))
let bad = 0
for (const r of report) {
  const issues = []
  if (r.overflow) issues.push('OVERFLOW')
  if (r.smallText.length) issues.push('smallText:' + r.smallText.map(s => s.label + '=' + s.fs).slice(0, 3).join('|'))
  if (r.targets.length) issues.push('targets:' + r.targets.map(t => `${t.label}(${t.w}x${t.h}<${t.min})`).slice(0, 4).join('|'))
  if (r.contrast.length) issues.push('contrast:' + r.contrast.map(c => `${c.label}=${c.ratio}`).slice(0, 4).join('|'))
  if (issues.length) { bad++; console.log('FAIL', r.page, r.w, issues.join(' ; ')) }
}
console.log('pages x sizes:', report.length, 'with failures:', bad)
console.log('navLabels(12px exception) sample:', JSON.stringify(report.find(r => r.navLabels && r.w === 390)?.navLabels))
console.log('min contrast overall:', Math.min(...report.map(r => r.minContrast)))
console.log('coarse@1024:', report.find(r => r.w === 1024).coarse, 'coarse@1440:', report.find(r => r.w === 1440).coarse)
console.log(JSON.stringify(behav))
