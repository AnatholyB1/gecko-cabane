import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = process.argv[2]
const w = (name, html) => { let n = 0; html = html.replace(/aria-label="Tableau, défilement horizontal possible"/g, () => `aria-label="Tableau ${++n}, défilement horizontal possible"`); writeFileSync(join(OUT, name), html, 'utf8') }

const ICONS = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  userplus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  circle: '<circle cx="12" cy="12" r="10"/>',
  warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  retry: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  copy: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  up: '<path d="m5 12 7-7 7 7M12 19V5"/>',
  down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  flat: '<path d="M5 12h14"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
}
const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('')}</svg>`
const ico = (n, extra = '') => `<svg class="i ${extra}" aria-hidden="true" focusable="false"><use href="#i-${n}"/></svg>`

const head = (title) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="admin.css">
</head>`

const dlgScript = (autoOpen) => `<script>
document.querySelectorAll('[data-open]').forEach(function(b){b.addEventListener('click',function(){document.getElementById(b.dataset.open).showModal()})});
document.querySelectorAll('dialog [data-close]').forEach(function(b){b.addEventListener('click',function(){b.closest('dialog').close()})});
document.querySelectorAll('.toggle').forEach(function(b){b.addEventListener('click',function(){var i=document.getElementById(b.dataset.for);var s=i.type==='password';i.type=s?'text':'password';b.textContent=s?'Masquer':'Afficher';b.setAttribute('aria-pressed',String(s))})});
${autoOpen ? `document.getElementById('${autoOpen}').showModal();` : ''}
</script>`

const NAV = [
  ['home', "Aujourd'hui", 'today'],
  ['calendar', 'Réservations', 'resa'],
  ['utensils', 'Menu', 'menu'],
  ['star', 'Réputation', 'reputation'],
  ['users', 'Accès', 'acces'],
]

function shell({ title, active, noteText, body, autoOpen = '', dialogs = '' }) {
  const links = (cls) => NAV.map(([ic, lb, key]) => `<a href="#" ${key === active ? 'aria-current="page"' : ''}>${ico(ic)}<span>${lb}</span></a>`).join('')
  return `${head(title)}
<body>
${sprite}
<a class="skip" href="#contenu">Aller au contenu</a>
<aside class="proto-note" aria-label="Note de maquette">${ico('info')}<span>Maquette D4 (statique). ${noteText} Coquille de navigation indicative : D1 fait foi.</span></aside>
<div class="shell">
  <aside class="side" aria-label="Navigation principale">
    <a class="brand" href="#"><span class="brand-mark" aria-hidden="true">GC</span>Gecko Cabane</a>
    <nav aria-label="Principale">${links()}</nav>
  </aside>
  <div class="main">
    <header class="topbar"><a class="brand" href="#"><span class="brand-mark" aria-hidden="true">GC</span>Gecko Cabane</a></header>
    <main id="contenu" class="page">
${body}
    </main>
    <nav class="tabbar" aria-label="Principale (mobile)">${links()}</nav>
  </div>
</div>
${dialogs}
${dlgScript(autoOpen)}
</body></html>`
}

/* ---------------- Réputation : en-tête ---------------- */
const repHead = (tab) => `
<header class="head">
  <div>
    <p class="eyebrow">Gecko Cabane</p>
    <h1 class="title">Réputation</h1>
    <hr class="brass-rule">
  </div>
  <div class="head-row">
    <nav class="seg" aria-label="Sections de Réputation">
      <a href="reputation-avis.html" ${tab === 'avis' ? 'aria-current="page"' : ''}>${ico('star')}Avis</a>
      <a href="reputation-kpi.html" ${tab === 'kpi' ? 'aria-current="page"' : ''}>${ico('chart')}Rapport KPI</a>
    </nav>
  </div>
</header>`

const loadingLine = `<div class="loading-line" role="status"><span class="spinner" aria-hidden="true"></span>Chargement…</div>`
const skel = (h, w = '100%') => `<div class="skel" style="height:${h}px;width:${w}" aria-hidden="true"></div>`

/* ---------------- AVIS ---------------- */
const MONTHS = ['2026-10', '2026-09', '2026-08', '2026-07', '2026-06', '2026-05']
const monthSelect = `<div class="field" style="grid-auto-flow:column;align-items:center;gap:10px"><label for="avis-month">Mois</label><select id="avis-month" class="select" style="width:auto">${MONTHS.map((m) => `<option>${m}</option>`).join('')}</select></div>`

const summary = (exemple = true) => `
<section aria-labelledby="h-synthese" class="stack">
  <div class="panel-head" style="margin-bottom:0">
    <div><h2 class="sec" id="h-synthese">Note et totaux</h2><p>Vue d'ensemble de vos avis Google et TripAdvisor.</p></div>
    ${exemple ? '<span class="example-chip">Chiffres d\'exemple</span>' : ''}
  </div>
  <dl class="band">
    <div><dt>Note moyenne (exemple)</dt><dd class="num">4,6 <small>/ 5</small></dd></div>
    <div><dt>Avis Google (exemple)</dt><dd class="num">187</dd></div>
    <div><dt>Avis TripAdvisor (exemple)</dt><dd class="num">94</dd></div>
    <div><dt>Nouveaux avis ce mois (exemple)</dt><dd class="num">+11</dd></div>
  </dl>
  <div class="panel">
    <h3 class="sub" id="h-dist" style="margin-bottom:16px">Répartition des notes <span class="muted" style="font-weight:400">(Google, exemple)</span></h3>
    <ul class="dist" aria-labelledby="h-dist">
      ${[['5 étoiles', 71, 132], ['4 étoiles', 19, 35], ['3 étoiles', 6, 11], ['2 étoiles', 2, 4], ['1 étoile', 2, 5]].map(([l, p, n]) => `<li><span>${l}</span><span class="bar" aria-hidden="true"><i style="width:${p}%"></i></span><span class="v num">${n} avis · ${p} %</span></li>`).join('')}
    </ul>
  </div>
</section>`

const suiviTable = `
<div class="tscroll" tabindex="0" role="region" aria-label="Tableau, défilement horizontal possible"><table>
  <caption class="sr">Visites et clics du mois 2026-10 par source</caption>
  <thead><tr><th scope="col">Source</th><th scope="col">Visites /review</th><th scope="col">Clics Google</th><th scope="col">Clics TripAdvisor</th></tr></thead>
  <tbody>
    <tr><th scope="row">Carte QR en salle</th><td>64</td><td>41</td><td>9</td></tr>
    <tr><th scope="row">Email J+1</th><td>38</td><td>26</td><td>7</td></tr>
    <tr><th scope="row">WhatsApp</th><td>21</td><td>15</td><td>3</td></tr>
    <tr><th scope="row">Lien direct</th><td>6</td><td>3</td><td>1</td></tr>
    <tr class="total"><th scope="row">Total</th><td>129</td><td>85</td><td>20</td></tr>
  </tbody>
</table></div>
<p class="hint" style="margin-top:10px">Chiffres d'exemple. Sources réelles : celles de la page /review.</p>`

const suiviEmpty = `<div class="empty"><span class="ico">${ico('chart')}</span><h3 class="sub">Aucune donnée pour ce mois</h3><p class="muted" style="max-width:56ch">Les visites de la page /review apparaîtront ici dès qu'un client ouvrira le lien d'avis.</p></div>`

const totalsForm = (vals = ['187', '94'], opts = {}) => `
<form aria-labelledby="h-totaux" onsubmit="return false">
  <div class="formgrid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));align-items:end">
    <div class="field"><label for="total-google">Google</label><input id="total-google" class="input" type="number" inputmode="numeric" min="0" max="100000" step="1" value="${vals[0]}"></div>
    <div class="field"><label for="total-tripadvisor">TripAdvisor</label><input id="total-tripadvisor" class="input" type="number" inputmode="numeric" min="0" max="100000" step="1" value="${vals[1]}"></div>
    <div><button type="submit" class="btn btn-primary" ${opts.saving ? 'disabled aria-busy="true"' : ''}>${opts.saving ? 'Enregistrement…' : 'Enregistrer les totaux'}</button></div>
  </div>
</form>`

const evolution = `
<div class="tscroll" tabindex="0" role="region" aria-label="Tableau, défilement horizontal possible" style="margin-top:20px"><table>
  <caption class="sr">Évolution des totaux d'avis par mois</caption>
  <thead><tr><th scope="col">Mois</th><th scope="col">Google</th><th scope="col">Écart</th><th scope="col">TripAdvisor</th><th scope="col">Écart</th></tr></thead>
  <tbody>
    <tr><th scope="row">2026-10</th><td>187</td><td>+6</td><td>94</td><td>+2</td></tr>
    <tr><th scope="row">2026-09</th><td>181</td><td>+9</td><td>92</td><td>+3</td></tr>
    <tr><th scope="row">2026-08</th><td>172</td><td>+4</td><td>89</td><td>0</td></tr>
    <tr><th scope="row">2026-07</th><td>168</td><td>—</td><td>89</td><td>—</td></tr>
  </tbody>
</table></div>`

const wa = `
<details class="fold panel">
  <summary><span><span class="sub" style="font-size:20px;font-family:var(--adm-font-display);color:var(--adm-brand)">Message WhatsApp (invitation d'avis)</span></span>${ico('chev')}</summary>
  <div class="two-col" style="margin-top:16px">
    ${[['fr', 'Français', 'Bonjour, merci pour votre visite au Gecko Cabane. Votre avis nous aide beaucoup : [lien d\'avis]. (texte d\'exemple)', false], ['en', 'English', 'Hello, thank you for visiting Gecko Cabane. Your review means a lot to us: [review link]. (sample text)', true]].map(([k, l, t, r]) => `
    <div class="tpl">
      <div class="row"><label for="wa-${k}" class="label">${l}</label>${r ? `<span class="badge partial">${ico('alert')}à relire</span>` : ''}</div>
      <textarea id="wa-${k}" class="textarea" readonly rows="4">${t}</textarea>
      <div class="row"><button type="button" class="btn btn-primary">${ico('copy')}Copier</button><a class="btn btn-secondary" href="#">${ico('ext')}Ouvrir WhatsApp</a></div>
    </div>`).join('')}
  </div>
</details>`

function avis(state) {
  const loading = state === 'chargement', error = state === 'erreur', empty = state === 'vide'
  let body = repHead('avis')
  if (loading) {
    body += `<div aria-busy="true">${loadingLine}
      <div class="stack">${skel(104)}${skel(220)}${skel(260)}</div></div>`
    return body
  }
  if (error) {
    body += `<div class="notice err" role="alert">${ico('alert')}<div><strong>Impossible de charger les statistiques.</strong><span class="body">Réessayez ou rechargez la page.</span></div><a class="btn btn-secondary act" href="reputation-avis.html">${ico('retry')}Réessayer</a></div>`
    return body
  }
  body += `<div class="stack">`
  if (empty) {
    body += `<section class="panel"><div class="empty"><span class="ico">${ico('star')}</span><h2 class="sec">Pas encore d'avis enregistrés</h2><p class="muted" style="max-width:58ch">Saisissez les totaux Google et TripAdvisor du mois pour suivre leur évolution. La note moyenne et la répartition apparaîtront dès qu'une source les fournit.</p><a class="btn btn-primary" href="#totaux">Saisir les totaux du mois</a></div></section>`
  } else {
    body += summary()
  }
  body += `
  <section class="panel" aria-labelledby="h-suivi">
    <div class="panel-head"><div><h2 class="sec" id="h-suivi">Suivi mensuel</h2><p>D'où viennent les visiteurs de la page d'avis.</p></div>${monthSelect}</div>
    ${empty ? suiviEmpty : suiviTable}
  </section>
  <section class="panel" id="totaux" aria-labelledby="h-totaux">
    <div class="panel-head"><div><h2 class="sec" id="h-totaux">Totaux du mois (saisie manuelle)</h2><p>Les nombres d'avis affichés sur Google et TripAdvisor, relevés à la main. Laissez un champ vide pour le conserver tel quel.</p></div></div>
    ${totalsForm(empty ? ['', ''] : ['187', '94'])}
    ${state === 'enregistre' ? '' : ''}
    ${empty ? '' : evolution}
  </section>
  ${wa}
  </div>`
  return body
}

function avisSaved() {
  let b = avis('donnees')
  b = b.replace('<div class="stack">', `<div class="stack"><div class="notice ok" role="status">${ico('check')}<div><strong>Totaux enregistrés.</strong></div></div>`)
  return b
}
function avisInvalid() {
  let b = avis('donnees')
  b = b.replace('<div class="stack">', `<div class="stack"><div class="notice err" role="alert">${ico('alert')}<div><strong>Valeur invalide : entrez un nombre entier.</strong><span class="body">Le total Google doit être compris entre 0 et 100 000.</span></div></div>`)
  return b
}

const avisNote = (s) => `Avis, état « ${s} ». Tous les chiffres sont des exemples (rien de réel). La note moyenne et la répartition ne sont pas collectées aujourd'hui : source à confirmer.`
for (const [slug, s, fn] of [
  ['reputation-avis.html', 'données', () => avis('donnees')],
  ['reputation-avis-chargement.html', 'chargement', () => avis('chargement')],
  ['reputation-avis-vide.html', 'vide', () => avis('vide')],
  ['reputation-avis-erreur.html', 'erreur de chargement', () => avis('erreur')],
  ['reputation-avis-enregistre.html', 'totaux enregistrés', avisSaved],
  ['reputation-avis-invalide.html', 'saisie invalide', avisInvalid],
]) {
  w(slug, shell({ title: 'Réputation, Avis', active: 'reputation', noteText: avisNote(s), body: fn() }))
}

/* ---------------- KPI ---------------- */
const delta = (txt, dir, good) => `<span class="delta ${good === null ? 'flat' : good ? 'good' : 'bad'}">${ico(dir)}${txt}<span class="sr">${good === null ? '' : good ? ', favorable' : ', défavorable'}</span></span>`

const WEEKS = [
  { ws: '2026-10-19', we: '2026-10-25', r: '38', c: '112', ns: '2,6 %', gc: '214', pos: '8,4', ta: 'n° 14', gr: '187', partial: true, miss: [] },
  { ws: '2026-10-12', we: '2026-10-18', r: '31', c: '94', ns: '6,5 %', gc: '188', pos: '9,1', ta: 'n° 15', gr: '181', partial: false, miss: [] },
  { ws: '2026-10-05', we: '2026-10-11', r: '29', c: '81', ns: '0,0 %', gc: '171', pos: '9,3', ta: 'n° 15', gr: '176', partial: false, miss: [] },
  { ws: '2026-09-28', we: '2026-10-04', r: '33', c: '97', ns: '3,0 %', gc: '165', pos: '9,8', ta: 'non disponible', gr: '172', partial: false, miss: ['Rang TripAdvisor'] },
]
const partialBadge = `<span class="badge partial" style="margin-left:8px">${ico('clock')}partiel</span>`

const histTable = `
<div class="only-wide">
<div class="tscroll" tabindex="0" role="region" aria-label="Tableau, défilement horizontal possible"><table>
  <caption class="sr">KPI par semaine (exemple)</caption>
  <thead><tr><th scope="col">Semaine</th><th scope="col">Nouvelles réservations</th><th scope="col">Couverts</th><th scope="col">Taux de no-show</th><th scope="col">Clics Google</th><th scope="col">Position moyenne</th><th scope="col">Rang TripAdvisor</th><th scope="col">Avis Google (total)</th><th scope="col" style="text-align:left">Sources non disponibles</th></tr></thead>
  <tbody>
  ${WEEKS.map((x, i) => `<tr ${i === 0 ? 'class="sel"' : ''}><th scope="row"><button type="button" class="rowbtn" aria-pressed="${i === 0}">${x.ws} → ${x.we}</button>${x.partial ? partialBadge : ''}</th><td>${x.r}</td><td>${x.c}</td><td>${x.ns}</td><td>${x.gc}</td><td>${x.pos}</td><td>${x.ta}</td><td>${x.gr}</td><td style="text-align:left">${x.miss.length ? x.miss.join(', ') : '—'}</td></tr>`).join('')}
  </tbody>
</table></div>
<p class="hint" style="margin-top:10px">Les 15 indicateurs figurent dans le détail de chaque semaine. Chiffres d'exemple.</p>
</div>
<div class="only-mobile weeks">
  ${WEEKS.map((x, i) => `<article class="week" ${i === 0 ? 'aria-current="true"' : ''}>
    <button type="button" aria-pressed="${i === 0}"><span>${x.ws} → ${x.we}${x.partial ? partialBadge : ''}</span>${ico('chev')}</button>
    <dl><div><dt>Réservations</dt><dd class="num">${x.r}</dd></div><div><dt>Couverts</dt><dd class="num">${x.c}</dd></div><div><dt>Taux de no-show</dt><dd class="num">${x.ns}</dd></div><div><dt>Clics Google</dt><dd class="num">${x.gc}</dd></div><div><dt>Rang TripAdvisor</dt><dd class="num">${x.ta}</dd></div><div><dt>Avis Google (total)</dt><dd class="num">${x.gr}</dd></div>
    </dl><p class="miss" style="padding:0 16px 16px;margin-top:-4px">Sources non disponibles : ${x.miss.length ? x.miss.join(', ') : '—'}</p>
  </article>`).join('')}
</div>`

const CMP = [
  ['Nouvelles réservations', '38', '+23 %', 'up', true], ['Couverts', '112', '+19 %', 'up', true], ['No-show', '1', '−50 %', 'down', true],
  ['Taux de no-show', '2,6 %', '−3,9 pts', 'down', true], ['Inscriptions newsletter confirmées', '12', '+33 %', 'up', true], ['Désinscriptions newsletter', '1', '+1', 'up', false],
  ['Abonnés newsletter actifs', '342', '+3 %', 'up', true], ['Clics Google (Search Console)', '214', '+14 %', 'up', true], ['Impressions Google', '5 480', '+12 %', 'up', true],
  ['CTR Google', '3,9 %', '+0,1 pts', 'up', true], ['Position moyenne Google', '8,4', '−0,7', 'down', true], ['Rang TripAdvisor', 'n° 14', '+1 place', 'up', true],
  ['Avis Google (total)', '187', '+3 %', 'up', true], ['Nouveaux avis Google', '6', '+20 %', 'up', true], ['Note la plus basse (Google)', '3', '−25 %', 'down', false],
]

function manualForm(minRating = '3') {
  const alertOn = Number(minRating) > 0 && Number(minRating) <= 3
  return `
<form onsubmit="return false" aria-labelledby="h-saisie" class="stack">
  <div><h3 class="sub" id="h-saisie" style="font-size:20px;font-family:var(--adm-font-display);color:var(--adm-brand)">Saisie manuelle de la semaine</h3>
  <p class="muted" style="margin-top:4px;max-width:64ch">Avis Google (hors collecte automatique). Facultatif : le rapport part sans cette saisie.</p></div>
  <div class="grid3">
    <div class="field"><label for="k-total">Total d'avis Google</label><input id="k-total" class="input" type="number" inputmode="numeric" min="0" max="100000" value="187"></div>
    <div class="field"><label for="k-new">Nouveaux avis de la semaine</label><input id="k-new" class="input" type="number" inputmode="numeric" min="0" max="1000" value="6"></div>
    <div class="field"><label for="k-min">Note minimale reçue</label><select id="k-min" class="select" aria-describedby="k-min-hint">${['', 1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${String(n) === minRating ? 'selected' : ''}>${n === '' ? '—' : n}</option>`).join('')}</select></div>
  </div>
  <div class="notice warn" id="k-min-hint" role="note">${ico('send')}<div><strong>Une note de 3 ou moins déclenche un email d'alerte immédiat au propriétaire.</strong><span class="body">Vous devrez le confirmer avant l'enregistrement.</span></div></div>
  <div class="field"><label for="k-note">Note libre (500 caractères maximum)</label><textarea id="k-note" class="textarea" maxlength="500" rows="3">Un client a laissé 3 étoiles pour l'attente au bar (exemple).</textarea><span class="hint">Jamais incluse dans un rapport live.</span></div>
  <div class="row"><button type="submit" class="btn btn-primary" data-open="dlg-alerte">Enregistrer la saisie</button></div>
</form>`
}

function detail() {
  return `
<section class="panel stack" aria-labelledby="h-detail">
  <div class="panel-head" style="margin-bottom:0"><div><h2 class="sec" id="h-detail">Semaine du 2026-10-19 → 2026-10-25</h2><p>Exemple. Comparaison avec la semaine précédente (2026-10-12).</p></div></div>
  <div>
    <h3 class="sub" style="margin-bottom:8px">Comparaison à la semaine précédente (2026-10-12)</h3>
    <ul class="cmp">${CMP.map(([l, v, d, dir, good]) => `<li><span>${l}</span><span class="num"><strong>${v}</strong>${delta(d, dir, good)}</span></li>`).join('')}</ul>
  </div>
  <div>
    <h3 class="sub" style="margin-bottom:8px">Alertes</h3>
    <div class="alerts">
      <div class="notice err" role="note">${ico('alert')}<div><strong>Critique</strong><span class="body">Un avis de 3 étoiles ou moins a été reçu cette semaine.</span></div></div>
      <div class="notice warn" role="note">${ico('clock')}<div><strong>À surveiller</strong><span class="body">Search Console : données partielles (le dimanche est incomplet).</span></div></div>
    </div>
  </div>
  <div>
    <h3 class="sub" style="margin-bottom:8px">Lecture et actions</h3>
    <p class="row" style="margin-bottom:12px"><span class="badge neutral">${ico('info')}texte de repli sans IA</span></p>
    <div class="two-col">
      <div><h4 class="sub" style="font-size:15px">Lecture</h4><ul style="list-style:disc;padding-left:20px;margin-top:6px"><li>Les réservations progressent de 23 % (exemple).</li><li>Un avis bas isolé, sans tendance (exemple).</li></ul></div>
      <div><h4 class="sub" style="font-size:15px">Actions recommandées</h4><ul style="list-style:disc;padding-left:20px;margin-top:6px"><li>Répondre à l'avis de 3 étoiles (exemple).</li><li>Vérifier l'attente au bar le week-end (exemple).</li></ul></div>
    </div>
  </div>
  <hr style="border:0;height:1px;background:var(--adm-line);margin:24px 0 0">
  ${manualForm()}
</section>`
}

const guard = (count, { loading = false, err = false } = {}) => `
<section class="guard" aria-labelledby="h-guard">
  <div style="display:grid;gap:10px">
    <p class="row"><span class="badge test">${ico('shield')}TEST</span><span class="eyebrow" style="color:var(--adm-warn)">Mode actuel</span></p>
    <h2 id="h-guard">Rapports TEST envoyés : ${loading || err ? '…' : count} / 2</h2>
    <p class="muted" style="color:var(--adm-ink)">Passage en live : décision du propriétaire après 2 rapports TEST vérifiés (au plus tôt mi-novembre 2026).</p>
    <p class="rule-text">Aucun envoi live avant le 2026-11-16 et sans accord du propriétaire.</p>
  </div>
</section>`

const sendPanel = (disabledReason = '') => `
<section class="panel" aria-labelledby="h-envoi">
  <div class="panel-head"><div><h2 class="sec" id="h-envoi">Envoi du rapport</h2><p>Rien n'est envoyé en ouvrant cette page. Chaque envoi demande une action et une confirmation.</p></div></div>
  <div class="two-col" style="gap:24px">
    <div class="lock">
      <h3 class="sub">Envoyer un rapport TEST</h3>
      <p class="muted">Envoie le rapport de la semaine sélectionnée au propriétaire uniquement, avec le préfixe [TEST].</p>
      <div><button type="button" class="btn btn-secondary" ${disabledReason ? 'disabled aria-describedby="why-test"' : 'data-open="dlg-test"'}>${ico('send')}Envoyer un rapport TEST</button></div>
      ${disabledReason ? `<p class="hint" id="why-test">${disabledReason}</p>` : ''}
    </div>
    <div class="lock">
      <h3 class="sub row" style="gap:10px">Passage en live <span class="badge live">${ico('lock')}live verrouillé</span></h3>
      <ul class="checks">
        <li class="no">${ico('circle')}<span><strong>2 rapports TEST vérifiés</strong> : 1 sur 2, à remplir.</span></li>
        <li class="no">${ico('circle')}<span><strong>Date</strong> : au plus tôt le 2026-11-16 (dans 16 jours), à remplir.</span></li>
        <li class="no">${ico('circle')}<span><strong>Accord du propriétaire</strong> : non donné, à remplir.</span></li>
      </ul>
      <p class="hint">Le mode live n'est jamais activable depuis cette page : il se règle côté serveur, après accord du propriétaire.</p>
    </div>
  </div>
</section>`

const dlgTest = `
<dialog id="dlg-test" aria-labelledby="dlg-test-t" aria-describedby="dlg-test-d">
  <div class="dlg">
    <h2 id="dlg-test-t">Envoyer un rapport TEST ?</h2>
    <p id="dlg-test-d">Le rapport de la semaine du 2026-10-19 au 2026-10-25 sera envoyé une seule fois, au propriétaire uniquement. Aucun client ni destinataire live ne le reçoit.</p>
    <dl class="facts">
      <div><dt>Mode</dt><dd><span class="badge test">${ico('shield')}TEST</span></dd></div>
      <div><dt>Destinataire</dt><dd>Adresse du propriétaire</dd></div>
      <div><dt>Sujet</dt><dd>[TEST] Rapport KPI de la semaine</dd></div>
    </dl>
    <div class="dlg-actions">
      <button type="button" class="btn btn-secondary" data-close autofocus>Annuler</button>
      <button type="button" class="btn btn-primary" data-close>${ico('send')}Envoyer le rapport TEST</button>
    </div>
  </div>
</dialog>`
const dlgAlerte = `
<dialog id="dlg-alerte" aria-labelledby="dlg-al-t" aria-describedby="dlg-al-d">
  <div class="dlg">
    <h2 id="dlg-al-t">Enregistrer et envoyer l'alerte ?</h2>
    <p id="dlg-al-d">Une note minimale de 3 envoie immédiatement un email d'alerte au propriétaire. Vous pouvez aussi enregistrer en choisissant une note supérieure à 3.</p>
    <dl class="facts">
      <div><dt>Semaine</dt><dd>2026-10-19 → 2026-10-25</dd></div>
      <div><dt>Note minimale</dt><dd>3</dd></div>
      <div><dt>Destinataire</dt><dd>Adresse du propriétaire</dd></div>
    </dl>
    <div class="dlg-actions">
      <button type="button" class="btn btn-secondary" data-close autofocus>Annuler</button>
      <button type="button" class="btn btn-primary" data-close>${ico('send')}Enregistrer et envoyer l'alerte</button>
    </div>
  </div>
</dialog>`

function kpi(state) {
  const loading = state === 'chargement', error = state === 'erreur', empty = state === 'vide'
  let body = repHead('kpi')
  if (loading) {
    body += `<div aria-busy="true">${loadingLine}<div class="stack">${guard(0, { loading: true })}${skel(200)}${skel(280)}</div></div>`
    return body
  }
  body += `<div class="stack">`
  if (error) {
    body += `<div class="notice err" role="alert">${ico('alert')}<div><strong>Impossible de charger les KPI.</strong><span class="body">Réessayez ou rechargez la page.</span></div><a class="btn btn-secondary act" href="reputation-kpi.html">${ico('retry')}Réessayer</a></div>`
    body += guard(0, { err: true })
    body += sendPanel("Indisponible tant que les KPI ne sont pas chargés.")
    return body + '</div>'
  }
  body += guard(empty ? 0 : 1)
  body += sendPanel(empty ? "Aucune semaine à envoyer pour l'instant." : '')
  if (empty) {
    body += `<section class="panel"><div class="empty"><span class="ico">${ico('chart')}</span><h2 class="sec">Aucune semaine enregistrée</h2><p class="muted">Le premier relevé apparaîtra ici après la collecte du lundi.</p></div></section>`
  } else {
    body += `<section class="panel" aria-labelledby="h-hist"><div class="panel-head"><div><h2 class="sec" id="h-hist">KPI hebdomadaires</h2><p>Historique semaine par semaine (12 dernières semaines). Une valeur absente s'affiche « non disponible », jamais 0.</p></div><span class="example-chip">Chiffres d'exemple</span></div>${histTable}</section>`
    body += detail()
  }
  return body + '</div>'
}

const kpiNote = (s) => `Rapport KPI, état « ${s} ». Chiffres d'exemple. Aucun envoi réel : la maquette n'envoie rien.`
for (const [slug, s, st, dl, auto] of [
  ['reputation-kpi.html', 'données', 'donnees', '', ''],
  ['reputation-kpi-chargement.html', 'chargement', 'chargement', '', ''],
  ['reputation-kpi-vide.html', 'vide', 'vide', '', ''],
  ['reputation-kpi-erreur.html', 'erreur de chargement', 'erreur', '', ''],
  ['reputation-kpi-dialogue-test.html', 'dialogue de confirmation, envoi TEST', 'donnees', '', 'dlg-test'],
  ['reputation-kpi-dialogue-alerte.html', 'dialogue de confirmation, alerte note ≤ 3', 'donnees', '', 'dlg-alerte'],
]) {
  w(slug, shell({ title: 'Réputation, Rapport KPI', active: 'reputation', noteText: kpiNote(s), body: kpi(st), dialogs: dlgTest + dlgAlerte, autoOpen: auto }))
}

/* ---------------- AUTH ---------------- */
function authShell({ title, noteText, brandBlock, main }) {
  return `${head(title)}
<body>
${sprite}
<aside class="proto-note" aria-label="Note de maquette">${ico('info')}<span>Maquette D4 (statique). ${noteText}</span></aside>
<div class="auth">
  <header class="auth-brand">
    <div class="crest" aria-hidden="true">GC</div>
    <div>
      <p class="eyebrow">Espace de gestion</p>
      <p class="wordmark" style="margin-top:8px">Gecko Cabane</p>
      <hr class="brass-rule">
      <p class="tag" style="margin-top:16px">Cuisine franco-thaïe, Krabi. Réservations, carte et avis, au même endroit.</p>
    </div>
    <p class="foot">Accès réservé à l'équipe du restaurant.</p>
  </header>
  <main class="auth-main" id="contenu">${main}</main>
</div>
${dlgScript('')}
</body></html>`
}

function login(state) {
  const sending = state === 'envoi'
  const msg = {
    identifiants: ['Email ou mot de passe incorrect.', 'Vérifiez votre saisie, puis réessayez.'],
    acces: ["Ce compte n'a pas accès à l'administration Gecko Cabane.", "Si vous devriez y avoir accès, demandez une invitation à un administrateur."],
  }[state]
  const ok = state === 'deconnecte'
  return `
<p class="eyebrow">Connexion</p>
<h1 style="margin-top:6px">Bienvenue</h1>
<p class="muted" style="margin-top:8px">Connectez-vous pour accéder à l'administration.</p>
${msg ? `<div class="notice err" role="alert" style="margin-top:24px">${ico('alert')}<div><strong>${msg[0]}</strong><span class="body">${msg[1]}</span></div></div>` : ''}
${ok ? `<div class="notice ok" role="status" style="margin-top:24px">${ico('check')}<div><strong>Vous êtes déconnecté.</strong></div></div>` : ''}
<form onsubmit="return false" ${sending ? 'aria-busy="true"' : ''}>
  <div class="field"><label for="email">Adresse email</label><input id="email" name="email" class="input" type="email" autocomplete="username" inputmode="email" required placeholder="vous@exemple.com" value="${state === 'identifiants' || sending ? 'jariya@exemple.com' : ''}" ${state === 'identifiants' ? 'aria-invalid="true" aria-describedby="login-err"' : ''}></div>
  <div class="field"><label for="password">Mot de passe</label>
    <div class="pwwrap"><input id="password" name="password" class="input" type="password" autocomplete="current-password" required ${sending ? 'value="exemple-mdp"' : ''}><button type="button" class="toggle" data-for="password" aria-pressed="false">Afficher</button></div>
  </div>
  <button type="submit" class="btn btn-primary btn-block" ${sending ? 'disabled aria-busy="true"' : ''}>${sending ? '<span class="spinner" aria-hidden="true" style="border-color:rgba(255,255,255,.5);border-top-color:#fff"></span>Connexion…' : 'Se connecter'}</button>
</form>
<div class="auth-links">
  <a href="#">Mot de passe oublié ?</a>
  <a href="#">${ico('back')}Retour au site</a>
</div>`
}
for (const [slug, s, label] of [
  ['login.html', 'defaut', 'repos'], ['login-erreur.html', 'identifiants', 'identifiants incorrects'],
  ['login-acces.html', 'acces', 'compte sans accès admin'], ['login-envoi.html', 'envoi', 'envoi en cours'], ['login-deconnecte.html', 'deconnecte', 'déconnexion confirmée'],
]) w(slug, authShell({ title: 'Connexion, Gecko Cabane', noteText: `Connexion, état « ${label} ». Aucun identifiant réel.`, main: login(s) }))

/* ---------------- INVITATION ---------------- */
const people = [
  ['Jariya (vous)', 'jariya@exemple.com', 'ok', 'Actif', 'check', 'Depuis 2026-03-02', []],
  ['Anatholy', 'anatholy@exemple.com', 'ok', 'Actif', 'check', 'Depuis 2026-03-02', ['Retirer']],
  ['marie@exemple.com', '', 'info', 'Invitation en attente', 'clock', 'Envoyée le 2026-10-29, expire le 2026-11-05', ['Renvoyer', 'Révoquer']],
  ['paul@exemple.com', '', 'neutral', 'Invitation expirée', 'x', 'Envoyée le 2026-10-12, expirée le 2026-10-19', ['Renvoyer', 'Révoquer']],
]
const personRow = ([n, e, tone, st, ic, meta, acts]) => `
<li class="person">
  <div><p class="who">${n}</p><p class="meta">${e ? e + ' · ' : ''}${meta}</p></div>
  <span class="badge ${tone}">${ico(ic)}${st}</span>
  <div class="acts">${acts.map((a) => `<button type="button" class="btn btn-secondary" ${a === 'Retirer' || a === 'Révoquer' ? 'data-open="dlg-revoke"' : ''}>${a}</button>`).join('')}</div>
</li>`

const inviteForm = (st) => `
<form onsubmit="return false" aria-labelledby="h-inv" class="stack">
  <div><h2 class="sec" id="h-inv">Inviter un administrateur</h2><p class="muted" style="margin-top:4px;max-width:60ch">La personne reçoit un email avec un lien valable 7 jours. Elle choisit elle-même son mot de passe. Aucun compte n'est créé avant qu'elle accepte.</p></div>
  <div class="formgrid two">
    <div class="field"><label for="inv-email">Adresse email de la personne</label><input id="inv-email" class="input" type="email" inputmode="email" autocomplete="off" placeholder="prenom@exemple.com" ${st === 'invalide' ? 'value="marie@exemple" aria-invalid="true" aria-describedby="inv-err"' : ''} required>
      ${st === 'invalide' ? `<span class="field-err" id="inv-err">${ico('alert')}Adresse email invalide : vérifiez qu'elle contient un « @ » et un domaine.</span>` : ''}</div>
    <div><button type="submit" class="btn btn-primary btn-block" data-open="dlg-invite">${ico('mail')}Envoyer l'invitation</button></div>
  </div>
</form>`

const dlgInvite = `
<dialog id="dlg-invite" aria-labelledby="di-t" aria-describedby="di-d"><div class="dlg">
  <h2 id="di-t">Envoyer l'invitation ?</h2>
  <p id="di-d">Un email d'invitation sera envoyé à cette adresse. Le lien permet de créer un accès administrateur : n'invitez que des personnes de confiance.</p>
  <dl class="facts"><div><dt>Destinataire</dt><dd>marie@exemple.com</dd></div><div><dt>Validité du lien</dt><dd>7 jours</dd></div><div><dt>Droits</dt><dd>Administrateur complet</dd></div></dl>
  <div class="dlg-actions"><button type="button" class="btn btn-secondary" data-close autofocus>Annuler</button><button type="button" class="btn btn-primary" data-close>${ico('send')}Envoyer l'invitation</button></div>
</div></dialog>`
const dlgRevoke = `
<dialog id="dlg-revoke" aria-labelledby="dr-t" aria-describedby="dr-d"><div class="dlg">
  <h2 id="dr-t">Révoquer cet accès ?</h2>
  <p id="dr-d">Le lien d'invitation envoyé à marie@exemple.com cessera de fonctionner immédiatement. Vous pourrez réinviter cette personne plus tard.</p>
  <div class="dlg-actions"><button type="button" class="btn btn-secondary" data-close autofocus>Garder l'invitation</button><button type="button" class="btn btn-danger" data-close>Révoquer l'invitation</button></div>
</div></dialog>`

function invitation(state) {
  let b = `
<header class="head"><div><p class="eyebrow">Gecko Cabane</p><h1 class="title">Accès</h1><hr class="brass-rule"></div>
<p class="lede">Les administrateurs du restaurant et les invitations en cours. L'inscription publique n'existe plus : on entre par invitation.</p></header>`
  if (state === 'chargement') return b + `<div aria-busy="true">${loadingLine}<div class="stack">${skel(150)}${skel(240)}</div></div>`
  if (state === 'erreur') return b + `<div class="notice err" role="alert">${ico('alert')}<div><strong>Impossible de charger la liste des administrateurs.</strong><span class="body">Réessayez ou rechargez la page.</span></div><a class="btn btn-secondary act" href="invitation.html">${ico('retry')}Réessayer</a></div>`
  b += `<div class="stack">`
  if (state === 'envoyee') b += `<div class="notice ok" role="status">${ico('check')}<div><strong>Invitation envoyée à marie@exemple.com.</strong><span class="body">Le lien est valable jusqu'au 2026-11-07. Rien d'autre n'a été créé.</span></div></div>`
  if (state === 'erreur-envoi') b += `<div class="notice err" role="alert">${ico('alert')}<div><strong>L'invitation n'a pas pu être envoyée.</strong><span class="body">Aucun email n'est parti. Réessayez dans un instant ; si cela persiste, contactez l'équipe technique.</span></div></div>`
  b += `<section class="panel">${inviteForm(state === 'invalide' ? 'invalide' : '')}</section>`
  b += `<section class="panel" aria-labelledby="h-liste"><div class="panel-head"><div><h2 class="sec" id="h-liste">Administrateurs et invitations</h2></div><span class="example-chip">Adresses d'exemple</span></div>`
  if (state === 'vide') b += `<ul class="people">${personRow(people[0])}</ul><div class="empty" style="margin-top:12px;border-top:1px solid var(--adm-line);padding-top:16px"><span class="ico">${ico('userplus')}</span><h3 class="sub">Vous êtes le seul administrateur</h3><p class="muted" style="max-width:56ch">Invitez un proche collaborateur pour qu'il puisse gérer les réservations en votre absence.</p></div>`
  else b += `<ul class="people">${people.map(personRow).join('')}</ul>`
  b += `</section>
<section class="panel" aria-labelledby="h-parcours"><h2 class="sec" id="h-parcours" style="margin-bottom:16px">Comment ça se passe</h2>
<ol class="steps"><li><div><strong>Vous invitez</strong><p class="muted">Saisissez l'email, confirmez l'envoi.</p></div></li><li><div><strong>La personne reçoit un lien</strong><p class="muted">Valable 7 jours, à usage unique.</p></div></li><li><div><strong>Elle choisit son mot de passe</strong><p class="muted">Son accès est créé à ce moment, puis elle arrive dans l'administration.</p></div></li></ol></section></div>`
  return b
}
for (const [slug, s, label] of [
  ['invitation.html', 'donnees', 'liste et formulaire'], ['invitation-chargement.html', 'chargement', 'chargement'], ['invitation-vide.html', 'vide', 'vide (seul admin)'],
  ['invitation-erreur.html', 'erreur', 'erreur de chargement'], ['invitation-envoyee.html', 'envoyee', 'invitation envoyée'], ['invitation-erreur-envoi.html', 'erreur-envoi', "échec d'envoi"], ['invitation-invalide.html', 'invalide', 'email invalide'],
]) w(slug, shell({ title: 'Accès, invitation', active: 'acces', noteText: `Invitation d'un admin, état « ${label} ». Adresses d'exemple, aucun email réel n'est envoyé.`, body: invitation(s), dialogs: dlgInvite + dlgRevoke }))
w('invitation-dialogue.html', shell({ title: 'Accès, invitation', active: 'acces', noteText: "Invitation, dialogue de confirmation d'envoi. Aucun email réel.", body: invitation('donnees'), dialogs: dlgInvite + dlgRevoke, autoOpen: 'dlg-invite' }))

/* ---- Page publique d'acceptation (lien reçu par email) ---- */
const rules = (a, b, c) => `<ul class="rules" id="pw-rules" aria-label="Critères du mot de passe">
  <li class="${a ? 'yes' : 'no'}">${ico(a ? 'check' : 'circle')}<span>12 caractères minimum${a ? ' : rempli' : ' : à remplir'}</span></li>
  <li class="${b ? 'yes' : 'no'}">${ico(b ? 'check' : 'circle')}<span>Une lettre et un chiffre${b ? ' : rempli' : ' : à remplir'}</span></li>
  <li class="${c ? 'yes' : 'no'}">${ico(c ? 'check' : 'circle')}<span>Les deux saisies sont identiques${c ? ' : rempli' : ' : à remplir'}</span></li></ul>`
function accept(state) {
  if (state === 'expiree') return `<p class="eyebrow">Invitation</p><h1 style="margin-top:6px">Ce lien n'est plus valable</h1>
<div class="notice warn" role="alert" style="margin-top:24px">${ico('clock')}<div><strong>L'invitation a expiré ou a déjà été utilisée.</strong><span class="body">Demandez à un administrateur de vous en envoyer une nouvelle.</span></div></div>
<div class="auth-links"><a href="login.html">Aller à la connexion</a><a href="#">${ico('back')}Retour au site</a></div>`
  if (state === 'ok') return `<p class="eyebrow">Invitation</p><h1 style="margin-top:6px">Votre accès est prêt</h1>
<div class="notice ok" role="status" style="margin-top:24px">${ico('check')}<div><strong>Mot de passe enregistré.</strong><span class="body">Vous pouvez entrer dans l'administration.</span></div></div>
<div style="margin-top:24px"><a class="btn btn-primary btn-block" href="login.html">Aller à l'administration</a></div>`
  const sending = state === 'envoi', bad = state === 'invalide'
  return `<p class="eyebrow">Invitation</p><h1 style="margin-top:6px">Choisissez votre mot de passe</h1>
<p class="muted" style="margin-top:8px">Jariya vous a invité à rejoindre l'administration du Gecko Cabane.</p>
<form onsubmit="return false" ${sending ? 'aria-busy="true"' : ''}>
  <div class="field"><label for="a-email">Adresse email</label><input id="a-email" class="input" type="email" value="marie@exemple.com" readonly aria-readonly="true" style="background:var(--adm-surface-2)"></div>
  <div class="field"><label for="a-pw">Mot de passe</label><div class="pwwrap"><input id="a-pw" class="input" type="password" autocomplete="new-password" aria-describedby="pw-rules" ${bad ? 'aria-invalid="true" value="court"' : sending ? 'value="exemple-mdp-12345"' : ''}><button type="button" class="toggle" data-for="a-pw" aria-pressed="false">Afficher</button></div>
    ${bad ? `<span class="field-err">${ico('alert')}Le mot de passe est trop court.</span>` : ''}</div>
  <div class="field"><label for="a-pw2">Confirmez le mot de passe</label><input id="a-pw2" class="input" type="password" autocomplete="new-password" ${sending ? 'value="exemple-mdp-12345"' : ''}></div>
  ${sending ? rules(true, true, true) : bad ? rules(false, true, false) : rules(false, false, false)}
  <button type="submit" class="btn btn-primary btn-block" ${sending ? 'disabled aria-busy="true"' : ''}>${sending ? '<span class="spinner" aria-hidden="true" style="border-color:rgba(255,255,255,.5);border-top-color:#fff"></span>Création…' : 'Créer mon accès'}</button>
</form>`
}
for (const [slug, s, label] of [
  ['invitation-accepter.html', 'defaut', 'défaut'], ['invitation-accepter-invalide.html', 'invalide', 'mot de passe refusé'], ['invitation-accepter-envoi.html', 'envoi', 'création en cours'],
  ['invitation-accepter-ok.html', 'ok', 'succès'], ['invitation-expiree.html', 'expiree', 'lien expiré ou utilisé'],
]) w(slug, authShell({ title: 'Invitation, Gecko Cabane', noteText: `Page publique ouverte depuis l'email d'invitation, état « ${label} ». Adresse d'exemple.`, main: accept(s) }))

/* ---------------- ERREURS ---------------- */
function errPage(code, icon, title, text, actions, extra = '') {
  return `<div class="err-page" role="region" aria-labelledby="e-t"><p class="err-code" aria-hidden="true">${code}</p><div style="display:grid;gap:10px"><p class="eyebrow">${icon}</p><h1 class="title" id="e-t" style="font-size:clamp(30px,5vw,40px)">${title}</h1><p class="lede">${text}</p></div>${extra}<div class="err-actions">${actions}</div></div>`
}
const e404 = errPage('404', 'Page introuvable', 'Cette page n\'existe pas', "L'adresse est peut-être incorrecte, ou la page a été déplacée. Rien n'a été modifié.", `<a class="btn btn-primary" href="#">${ico('home')}Retour à Aujourd'hui</a><a class="btn btn-secondary" href="reputation-avis.html">${ico('star')}Aller à Réputation</a>`)
const e500 = errPage('500', 'Erreur', 'Une erreur est survenue', "Votre travail n'a pas été perdu : ce qui était déjà enregistré l'est toujours. Réessayez ; si le problème continue, transmettez la référence ci-dessous à l'équipe technique.", `<button type="button" class="btn btn-primary">${ico('retry')}Réessayer</button><a class="btn btn-secondary" href="#">${ico('home')}Retour à Aujourd'hui</a>`, `<p class="ref">Référence (exemple) : <span class="num">a1f3-09c2</span></p>`)
const e403 = errPage('403', 'Accès refusé', "Ce compte n'a pas accès à cette zone", "Vous êtes connecté, mais votre compte n'est pas administrateur du Gecko Cabane. Demandez une invitation à un administrateur.", `<a class="btn btn-primary" href="login.html">Changer de compte</a><a class="btn btn-secondary" href="#">${ico('back')}Retour au site</a>`)
const eOff = errPage('', 'Hors connexion', 'Connexion perdue', "Les données affichées peuvent ne pas être à jour. Aucune action n'a été envoyée. Reconnectez-vous puis réessayez.", `<button type="button" class="btn btn-primary">${ico('retry')}Réessayer</button>`)
for (const [slug, body, label] of [['erreurs.html', e404, '404'], ['erreurs-500.html', e500, '500'], ['erreurs-403.html', e403, '403'], ['erreurs-hors-ligne.html', eOff, 'hors connexion']])
  w(slug, shell({ title: 'Erreur, Gecko Cabane', active: 'today', noteText: `Erreur ${label} dans la coquille admin. Pas de trace technique affichée ; référence en exemple.`, body }))
console.log('ok')
