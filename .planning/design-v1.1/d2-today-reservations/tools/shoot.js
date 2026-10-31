const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const DIR = process.argv[2];
const SHOTS = path.join(DIR, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const pages = JSON.parse(fs.readFileSync(path.join(__dirname, 'pages.json'), 'utf8'));
const VPS = [['390', 390, 844, 2], ['768', 768, 1024, 1], ['1440', 1440, 900, 1]];
const OVERLAY = /confirm-full|cancel|manual-form|actionfail/;

function measure() {
  const lum = (c) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const blend = (f, b) => [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3]));
  const bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c[3] > 0) { stack.push(c); if (c[3] >= 1) break; } } let base = [255, 255, 255]; for (let i = stack.length - 1; i >= 0; i--) base = blend(stack[i], base); return base; };
  const visible = (el) => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'; };
  const out = { overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth, smallText: [], smallTargets: [], lowContrast: [] };
  const isSr = (el) => !!el.closest('.sr-only');
  // texte
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (w.nextNode()) {
    const t = w.currentNode; if (!t.textContent.trim()) continue; const el = t.parentElement;
    if (!el || seen.has(el) || isSr(el) || ['SCRIPT', 'STYLE', 'OPTION'].includes(el.tagName)) continue; if (!visible(el)) continue; seen.add(el);
    const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize);
    if (fs < 14) out.smallText.push(`${el.tagName}.${el.className} ${fs}px "${t.textContent.trim().slice(0, 30)}"`);
    const fg = parse(cs.color); if (!fg) continue; const bg = bgOf(el); const f = blend(fg, bg);
    const L1 = lum(f), L2 = lum(bg); const cr = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const large = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight) >= 700); const need = large ? 3 : 4.5;
    if (cr < need && !(el.closest('[disabled]') || el.disabled)) out.lowContrast.push(`${cr.toFixed(2)}<${need} ${el.tagName}.${el.className} "${t.textContent.trim().slice(0, 25)}"`);
  }
  // cibles
  const sel = 'a[href], button, input:not([type=hidden]), select, textarea, summary, label.btn, [role=button]';
  document.querySelectorAll(sel).forEach((el) => {
    if (isSr(el) || el.closest('.skip')) return;
    let box = el;
    if (el.matches('input[type=radio]')) box = el.closest('label');
    if (el.matches('input[type=date]') && el.closest('.datepick')) box = el.closest('.datepick');
    if (!visible(box) && !(el.matches('input[type=date]'))) return;
    const r = box.getBoundingClientRect(); if (r.width < 1) return;
    if (r.width < 43.5 || r.height < 43.5) out.smallTargets.push(`${el.tagName}.${(box.className || '').toString().slice(0, 30)} ${Math.round(r.width)}x${Math.round(r.height)} "${(box.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 25)}"`);
  });
  // premier écran (390) : position des éléments clés
  const g = document.querySelector('.a-gauges'), a = document.querySelector('.a-attn');
  out.fold = { gaugesBottom: g ? Math.round(g.getBoundingClientRect().bottom) : null, attnTop: a ? Math.round(a.getBoundingClientRect().top) : null, attnBtn: (() => { const b = document.querySelector('.a-attn .btn--primary'); return b ? Math.round(b.getBoundingClientRect().bottom) : null; })() };
  return out;
}

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/Anatholy/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe' });
  const report = []; let bad = 0;
  for (const [vn, w, h, dpr] of VPS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, locale: 'fr-FR' });
    for (const p of pages) {
      const page = await ctx.newPage();
      await page.goto('file:///' + path.join(DIR, p).replace(/\\/g, '/'), { waitUntil: 'load', timeout: 20000 }).catch(() => {});
      await page.evaluate(() => document.fonts.ready).catch(() => {});
      await page.waitForTimeout(150);
      const m = await page.evaluate(measure);
      const name = p.replace('.html', '');
      await page.screenshot({ path: path.join(SHOTS, `${name}-${vn}.png`), fullPage: !OVERLAY.test(p) });
      const issues = m.smallText.length + m.smallTargets.length + m.lowContrast.length + (m.overflowX > 0 ? 1 : 0);
      bad += issues;
      report.push({ page: p, vp: vn, ...m });
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'report.json'), JSON.stringify(report, null, 1));
  for (const r of report) {
    const n = r.smallText.length + r.smallTargets.length + r.lowContrast.length + (r.overflowX > 0 ? 1 : 0);
    if (n) console.log(`\n${r.page} @${r.vp}: overflowX=${r.overflowX} text=${r.smallText.length} targets=${r.smallTargets.length} contrast=${r.lowContrast.length}`, [...r.smallText.slice(0, 3), ...r.smallTargets.slice(0, 4), ...r.lowContrast.slice(0, 4)].join('\n   '));
  }
  console.log('\nTOTAL issues', bad, '| fold@390 today:', JSON.stringify(report.find((r) => r.page === 'today.html' && r.vp === '390').fold));
})();
