import { chromium } from 'playwright-core'
import fs from 'node:fs'

const exe = 'C:/Users/Anatholy/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'
const exe2 = fs.existsSync(exe) ? exe : 'C:/Users/Anatholy/AppData/Local/ms-playwright/chromium-1248/chrome-win/chrome.exe'
const variant = process.argv[2] // 'base' | 'fallback'
const url = variant === 'base' ? 'http://localhost:3104/monitoring-spike' : 'http://localhost:3104/monitoring-spike/fallback'
const out = process.argv[3]
const results = []
const ok = (name, pass, info = '') => { results.push({ name, pass, info }); console.log((pass ? 'PASS' : 'FAIL') + ' ' + name + (info ? ' :: ' + info : '')) }

const browser = await chromium.launch({ executablePath: exe2, headless: true })
const page = await browser.newPage({ viewport: { width: 900, height: 700 } })
const consoleErrs = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consoleErrs.push(m.type() + ': ' + m.text().slice(0, 200)) })
page.on('pageerror', (e) => consoleErrs.push('pageerror: ' + e.message.slice(0, 200)))
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

// Bundle weight for the page
const res = await page.evaluate(() => performance.getEntriesByType('resource').filter(r => r.name.includes('/_next/static') && r.name.endsWith('.js')).map(r => ({ n: r.name.split('/').pop(), t: r.transferSize, d: r.decodedBodySize })))
console.log('JS chunks', res.length, 'decoded KB', Math.round(res.reduce((a, r) => a + r.d, 0) / 1024), 'transfer KB', Math.round(res.reduce((a, r) => a + r.t, 0) / 1024))

// Leak check
const leak = await page.evaluate(() => {
  const root = document.querySelector('[data-testid=root]')
  const cs = getComputedStyle(root)
  const body = getComputedStyle(document.body)
  return { rootBg: cs.backgroundColor, rootFont: cs.fontFamily.slice(0, 40), bodyBg: body.backgroundColor, bodyFont: body.fontFamily.slice(0, 40) }
})
console.log('LEAK', JSON.stringify(leak))
ok('adm-root a son propre fond/police (pas ceux du body public)', leak.rootBg !== leak.bodyBg && !leak.rootFont.includes('Cormorant'), JSON.stringify(leak))
await page.screenshot({ path: `${out}-1-initial.png` })

// ---- Dialog
const trigger = page.getByTestId('open-dialog')
await trigger.focus()
await trigger.press('Enter')
await page.waitForTimeout(400)
const dlg = page.getByTestId('dialog')
ok('dialog visible', await dlg.isVisible())
const role = await dlg.evaluate((e) => ({ role: e.getAttribute('role'), tag: e.tagName, modal: e.getAttribute('aria-modal'), lb: e.getAttribute('aria-labelledby'), db: e.getAttribute('aria-describedby') }))
console.log('DLG ATTRS', JSON.stringify(role))
const dlgBg = await dlg.evaluate((e) => getComputedStyle(e).backgroundColor)
ok('variables --adm-* resolues dans le portail du dialog', dlgBg === 'rgb(255, 255, 255)', 'bg=' + dlgBg)
await page.screenshot({ path: `${out}-2-dialog.png` })
const inside = () => page.evaluate(() => { const d = document.querySelector('[data-testid=dialog]'); return !!d && d.contains(document.activeElement) })
ok('focus initial dans le dialog', await inside())
let trapped = true
const seq = []
const bad=[]
for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(60); if (!(await inside())) { trapped = false; bad.push('tab'+i+':'+await page.evaluate(() => document.activeElement?.outerHTML.slice(0,80))) }; seq.push(await page.evaluate(() => document.activeElement?.getAttribute('data-testid') || document.activeElement?.tagName)) }
for (let i = 0; i < 4; i++) { await page.keyboard.press('Shift+Tab'); await page.waitForTimeout(60); if (!(await inside())) { trapped = false; bad.push('stab'+i+':'+await page.evaluate(() => document.activeElement?.outerHTML.slice(0,80))) } }
console.log('BAD',JSON.stringify(bad))
ok('Tab / Shift+Tab piegent le focus (12 appuis)', trapped, seq.join('>'))
const bgReach = await page.evaluate(() => document.querySelector('[data-testid=toast-ok]')?.closest('main')?.hasAttribute('inert') || document.querySelector('main')?.getAttribute('aria-hidden'))
console.log('background inert/aria-hidden:', bgReach)
await page.keyboard.press('Escape')
await page.waitForTimeout(500)
ok('Echap ferme', !(await dlg.count()) || !(await dlg.isVisible()))
const af = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
ok('focus restitue au declencheur apres Echap', af === 'open-dialog', 'active=' + af)

// confirm path with mouse
await trigger.click()
await page.waitForTimeout(300)
await page.getByTestId('dialog-confirm').click()
await page.waitForTimeout(600)
const af2 = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
ok('focus restitue au declencheur apres Confirmer (souris)', af2 === 'open-dialog', 'active=' + af2)

// ---- Toast
const live = async () => page.evaluate(() => [...document.querySelectorAll('[aria-live],[role=alert],[role=status],[role=region],section[aria-label]')].map((e) => ({ tag: e.tagName, role: e.getAttribute('role'), live: e.getAttribute('aria-live'), atomic: e.getAttribute('aria-atomic'), label: e.getAttribute('aria-label'), text: (e.textContent || '').trim().slice(0, 60) })))
await page.getByTestId('toast-ok').click()
await page.waitForTimeout(500)
const l1 = await live()
console.log('LIVE (succes)', JSON.stringify(l1))
const hasLiveText = l1.some((x) => (x.live || x.role === 'status' || x.role === 'alert') && x.text.includes('Enregistr'))
ok('toast succes expose dans une region live', hasLiveText)
await page.getByTestId('toast-err').click()
await page.waitForTimeout(500)
const l2 = await live()
console.log('LIVE (erreur)', JSON.stringify(l2))
ok('toast erreur expose dans une region live', l2.some((x) => (x.live || x.role === 'status' || x.role === 'alert') && x.text.includes('Erreur')))
await page.screenshot({ path: `${out}-3-toasts.png` })
// toast auto-dismiss
await page.waitForTimeout(6500)
const remaining = await page.evaluate(() => document.body.innerText.includes('Enregistré'))
ok('toast auto-ferme (<7s)', !remaining)

// ---- Select
const sel = page.getByTestId('select')
await sel.focus()
const nameInfo = await sel.evaluate((e) => ({ tag: e.tagName, role: e.getAttribute('role'), expanded: e.getAttribute('aria-expanded'), haspopup: e.getAttribute('aria-haspopup'), labelledby: e.getAttribute('aria-labelledby'), text: e.textContent?.trim() }))
console.log('SELECT TRIGGER', JSON.stringify(nameInfo))
await page.keyboard.press('Enter')
await page.waitForTimeout(300)
const opts = await page.evaluate(() => ({ listbox: !!document.querySelector('[role=listbox]'), options: [...document.querySelectorAll('[role=option]')].map((o) => o.textContent?.trim()), selected: document.querySelector('[role=option][aria-selected=true]')?.textContent?.trim() }))
console.log('SELECT OPEN', JSON.stringify(opts))
if (variant === 'base') {
  ok('select ouvert au clavier avec listbox/options', opts.listbox && opts.options.length === 5)
  await page.screenshot({ path: `${out}-4-select-open.png` })
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  ok('ArrowDown x2 + Enter choisit une valeur', (await page.getByTestId('select-value').textContent()) !== 'pending', await page.getByTestId('select-value').textContent())
  const af3 = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
  ok('focus revient au trigger du select', af3 === 'select', 'active=' + af3)
  await sel.press('Enter'); await page.waitForTimeout(400); console.log('open2', await page.evaluate(() => !!document.querySelector('[role=listbox]'))); await page.keyboard.press('Escape'); await page.waitForTimeout(600)
  ok('Echap ferme le select (aria-expanded=false, focus sur le combobox)', await page.evaluate(() => document.querySelector('[data-testid=select]').getAttribute('aria-expanded') === 'false' && document.activeElement?.getAttribute('data-testid') === 'select'))
} else {
  await page.keyboard.press('Escape')
  await sel.selectOption('cancelled')
  ok('select natif: selectOption', (await page.getByTestId('select-value').textContent()) === 'cancelled')
}
console.log('CONSOLE', JSON.stringify(consoleErrs))
fs.writeFileSync(`${out}-results.json`, JSON.stringify({ results, res, consoleErrs, leak }, null, 1))
await browser.close()
