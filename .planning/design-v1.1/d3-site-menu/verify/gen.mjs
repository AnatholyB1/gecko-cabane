import fs from 'node:fs'
import path from 'node:path'
const OUT = 'C:/gecko-cabane/.claude/worktrees/agent-a4d9152c2709e07d6/.planning/design-v1.1/d3-site-menu'

const P = {
  check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', plus: '<path d="M5 12h14M12 5v14"/>', minus: '<path d="M5 12h14"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>',
  pencil: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  cal: '<path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/>',
  mega: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  up: '<path d="m5 12 7-7 7 7M12 19V5"/>', down: '<path d="M12 5v14m7-7-7 7-7-7"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
  spin: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  sort: '<path d="m21 16-4 4-4-4M17 20V4m-6 4L7 4 3 8M7 4v16"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  chev: '<path d="m6 9 6 6 6-6"/>', chevr: '<path d="m9 18 6-6-6-6"/>',
  dots: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  dot: '<circle cx="12" cy="12" r="4" fill="currentColor"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  wifioff: '<path d="M12 20h.01M8.5 16.4a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 20 0M5 12.6a10 10 0 0 1 14 0"/>',
}
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${P[n]}</svg>`

const head = (title) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="tokens.css"><link rel="stylesheet" href="d3.css"></head>`
const shell = (title, main, extra = '', shot = 'full', nav = 'Site public') => `${head(title)}<body data-shot="${shot}"><div class="app">
<header class="topbar-ph ph" aria-label="Zone D1 : en-tête mobile (maquette)"><b>Gecko Cabane</b><span class="ph">Menu (D1)</span></header>
<aside class="rail-ph ph" aria-label="Zone D1 : navigation (maquette)">Navigation (primitives D1, non dessinée ici)</aside>
<main class="page">${main}</main></div>${extra}</body></html>`

const toast = (kind, text, act = '') => `<div class="toast-wrap"><div class="toast toast-${kind}" role="${kind === 'ok' ? 'status' : 'alert'}">${ic(kind === 'ok' ? 'check' : 'alert')}<span class="t">${text}</span>${act}<button class="btn btn-ghost btn-icon" aria-label="Fermer le message">${ic('x')}</button></div></div>`
const alertBox = (kind, title, text, btn = '') => `<div class="alert alert-${kind}" role="${kind === 'err' ? 'alert' : 'status'}">${ic(kind === 'err' ? 'alert' : kind === 'ok' ? 'check' : 'info')}<div><strong>${title}</strong><p>${text}</p>${btn}</div></div>`
const sw = (label, on, txt) => `<button class="sw" role="switch" aria-checked="${on}" aria-label="${label}"><span class="sw-track"><span class="sw-thumb">${ic(on ? 'check' : 'minus')}</span></span><span class="sw-text">${txt}</span></button>`
const retryBtn = `<button class="btn btn-secondary btn-sm">${ic('refresh')}Réessayer</button>`

// ---------- Site public ----------
const TABS = [['horaires', 'Horaires', 'clock'], ['exceptions', 'Exceptions', 'cal'], ['annonces', 'Annonces', 'mega'], ['capacite', 'Capacité', 'users']]
const siteHead = (active) => `<div class="hd"><div><h1>Site public</h1><div class="h1-rule"></div><p class="lede">Ce que voient vos clients sur geckocabanerestaurant.com : horaires, bannière d’annonce et couverts réservables.</p></div></div>
<nav class="tabs" role="tablist" aria-label="Sections du site public">${TABS.map(([k, l, i]) => `<a class="tab" role="tab" href="site-public-${k}.html" aria-selected="${k === active}" ${k === active ? 'aria-current="page"' : ''}>${ic(i)}${l}</a>`).join('')}</nav>`

const savebar = (mode, label) => {
  if (mode === 'clean') return `<div class="savebar"><div class="msg clean">${ic('check')}Tout est enregistré</div><div class="btns"><button class="btn btn-primary" disabled>${label}</button></div></div>`
  if (mode === 'saving') return `<div class="savebar"><div class="msg" role="status" style="color:var(--adm-muted)">${ic('spin', 'spin')}Enregistrement en cours…</div><div class="btns"><button class="btn btn-ghost" disabled>Annuler</button><button class="btn btn-primary" disabled aria-busy="true">${ic('spin', 'spin')}Enregistrement…</button></div></div>`
  return `<div class="savebar"><div class="msg dirty">${ic('dot')}Modifications non enregistrées</div><div class="btns"><button class="btn btn-ghost">Annuler</button><button class="btn btn-primary">${label}</button></div></div>`
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
function hoursForm(dirty, busy) {
  return DAYS.map((d, i) => {
    let open = true, o = '12:00', c = '22:00', mod = false
    if (dirty && d === 'Mardi') { open = false; mod = true }
    if (dirty && d === 'Dimanche') { c = '21:00'; mod = true }
    const id = 'h' + i
    return `<div class="hrow"><div class="hday"><span id="${id}-d">${d}</span>${mod ? `<span class="badge badge-warn">${ic('pencil')}Modifié</span>` : ''}</div>
<div>${sw('Ouvert le ' + d.toLowerCase(), open, open ? 'Ouvert' : 'Fermé')}</div>
${open ? `<div class="htimes"><label class="sr-only" for="${id}-o">Ouverture le ${d.toLowerCase()}</label><input class="in time" id="${id}-o" type="time" value="${o}" ${busy ? 'readonly' : ''}><span class="sep" aria-hidden="true">à</span><label class="sr-only" for="${id}-c">Fermeture le ${d.toLowerCase()}</label><input class="in time" id="${id}-c" type="time" value="${c}" ${busy ? 'readonly' : ''}></div>` : `<div class="hclosed">Fermé toute la journée</div>`}</div>`
  }).join('')
}
function hoursPreview(dirty) {
  const rows = DAYS.map((d) => {
    let t = '12:00 – 22:00'
    if (dirty && d === 'Mardi') t = 'Fermé'
    if (dirty && d === 'Dimanche') t = '12:00 – 21:00'
    return `<div class="pvh${d === 'Samedi' ? ' today' : ''}"><span>${d}${d === 'Samedi' ? ' (aujourd’hui)' : ''}</span><span>${t}</span></div>`
  }).join('')
  return preview('Horaires affichés sur le site', rows)
}
function preview(title, inner, note = 'Mise en forme indicative. Le site garde son propre style.') {
  return `<aside class="pv sticky" aria-label="Aperçu public"><div class="pv-h">${ic('eye')}Aperçu : ${title}</div><div class="pv-frame">${inner}</div><p class="pv-note">${note}</p></aside>`
}
const skel = (n) => Array.from({ length: n }, () => `<div class="sk" style="height:52px;margin:10px 0"></div>`).join('')

function panelWrap(title, icon, body, prev, extra = '') {
  return `<div class="split"><section class="card pad" aria-labelledby="pt"><div class="sec-title">${ic(icon)}<h2 id="pt">${title}</h2></div>${extra}${body}</section>${prev || ''}</div>`
}
const errLoad = (what) => `<div class="empty">${ic('wifioff')}<h2>Impossible de charger ${what}</h2><p>Vérifiez votre connexion, puis réessayez. Rien n’a été modifié.</p>${retryBtn}</div>`

const pages = {}

function horairesPage(st) {
  const dirty = ['non-enregistre', 'echec', 'enregistrement', 'quitter'].includes(st)
  let body, prev = hoursPreview(dirty), top = '', bar = ''
  if (st === 'chargement') { body = `<div aria-busy="true" role="status"><span class="sr-only">Chargement des horaires…</span>${skel(7)}</div>`; prev = '' }
  else if (st === 'erreur') { body = errLoad('les horaires'); prev = '' }
  else {
    body = `<form class="stack" style="margin-top:12px" ${st === 'enregistrement' ? 'aria-busy="true"' : ''}><div>${hoursForm(dirty, st === 'enregistrement')}</div>`
    const mode = st === 'enregistrement' ? 'saving' : dirty ? 'dirty' : 'clean'
    bar = savebar(mode, 'Enregistrer les horaires') + '</form>'
    body += bar
    if (st === 'echec') top = alertBox('err', 'Les horaires n’ont pas été enregistrés.', 'Le serveur n’a pas répondu. Vos modifications sont toujours affichées ci-dessous : rien n’est perdu. Réessayez.', retryBtn)
  }
  const extra = (st === 'succes' ? toast('ok', 'Horaires enregistrés.') : st === 'echec' ? toast('err', 'Échec de l’enregistrement des horaires.', retryBtn.replace('btn-secondary', 'btn-ghost')) : '') +
    (st === 'quitter' ? dlg('Quitter sans enregistrer ?', 'Vos modifications des horaires seront perdues.', 'Rester ici', 'Quitter sans enregistrer', 'btn-danger') : '')
  return shell('Site public : Horaires', siteHead('horaires') + panelWrap('Horaires de la semaine', 'clock', body, prev, top ? `<div style="margin-top:16px">${top}</div>` : ''), extra, st === 'quitter' ? 'viewport' : 'full')
}

const dlg = (title, text, cancel, ok, cls) => `<div class="scrim"><div class="dlg" role="alertdialog" aria-modal="true" aria-labelledby="dt" aria-describedby="dd"><h2 id="dt">${title}</h2><p id="dd">${text}</p><div class="acts"><button class="btn btn-secondary" autofocus>${cancel}</button><button class="btn ${cls}">${ic('trash')}${ok}</button></div></div></div>`.replace(ic('trash'), '')

const SPECIALS = [
  ['jeudi 24 décembre 2026', 'Réveillon de Noël', true, '12:00 – 23:00', 'Menu spécial sur réservation.'],
  ['vendredi 1 janvier 2027', 'Nouvel An', false, '', ''],
  ['mardi 13 avril 2027', 'Songkran', false, '', 'Fermeture exceptionnelle.'],
]
function specialsList() {
  return `<ul aria-label="Horaires exceptionnels à venir">${SPECIALS.map(([d, t, o, h, n], i) => `<li class="xrow"><div><div class="xdate">${d}</div><div class="xmeta"><span>${t}</span>${o ? `<span class="badge badge-ok">${ic('check')}Ouvert ${h}</span>` : `<span class="badge badge-err">${ic('ban')}Fermé</span>`}</div></div>
<button class="btn btn-quiet-danger btn-icon" aria-label="Supprimer l’exception du ${d}">${ic('trash')}</button>${n ? `<p class="xnote">${n}</p>` : ''}</li>`).join('')}</ul>`
}
function exceptionsPage(st) {
  const empty = st === 'vide'
  const fail = st === 'echec'
  const form = `<form class="stack" style="margin-top:12px" aria-labelledby="nf"><h3 id="nf" style="font:600 18px var(--adm-font)">Nouvelle exception</h3>
<div class="row2"><div class="field"><label class="lbl" for="x-date">Date</label><input class="in" id="x-date" type="date" value="${fail ? '2026-12-31' : ''}"></div>
<div class="field"><label class="lbl" for="x-title">Titre <span class="opt">(facultatif)</span></label><input class="in" id="x-title" value="${fail ? 'Dîner du Nouvel An' : ''}" placeholder="Nouvel An, fermeture annuelle…"></div></div>
<div>${sw('Ouvert ce jour', true, 'Ouvert')}</div>
<div class="htimes" style="padding:0"><label class="sr-only" for="x-o">Ouverture</label><input class="in time" id="x-o" type="time" value="${fail ? '18:00' : '12:00'}"><span class="sep" aria-hidden="true">à</span><label class="sr-only" for="x-c">Fermeture</label><input class="in time" id="x-c" type="time" value="${fail ? '23:00' : '22:00'}"></div>
<div class="field"><label class="lbl" for="x-note">Note <span class="opt">(facultatif)</span></label><input class="in" id="x-note" value="${fail ? 'Menu de fête, réservation conseillée' : ''}" placeholder="Information affichée avec l’horaire"></div>
<div><button class="btn btn-primary" type="button">${ic('plus')}Ajouter l’exception</button></div></form>`
  const list = empty ? `<div class="empty">${ic('cal')}<h2>Aucun horaire exceptionnel</h2><p>Le site affiche les horaires de la semaine. Ajoutez une date pour une fermeture ou une ouverture particulière.</p></div>` : st === 'chargement' ? `<div aria-busy="true" role="status"><span class="sr-only">Chargement des exceptions…</span>${skel(3)}</div>` : st === 'erreur' ? errLoad('les horaires exceptionnels') : specialsList()
  const prevInner = empty || st === 'chargement' || st === 'erreur' ? `<p>Aucune exception à venir.</p>` : SPECIALS.map(([d, t, o, h]) => `<div class="pvh"><span>${d.replace(/^\w+ /, '')}</span><span>${o ? h : 'Fermé'}</span></div>`).join('')
  const body = `<div style="margin-top:12px">${fail ? alertBox('err', 'L’exception n’a pas été ajoutée.', 'Le serveur n’a pas répondu. Les champs ci-dessous sont conservés. Réessayez.', retryBtn) : ''}</div>${st === 'chargement' || st === 'erreur' ? '' : form}`
  const main = siteHead('exceptions') + `<div class="split"><div class="stack"><section class="card pad" aria-labelledby="pt"><div class="sec-title">${ic('cal')}<h2 id="pt">Horaires exceptionnels</h2></div>${body}</section>
<section class="card pad" aria-labelledby="lt"><h2 id="lt">Dates à venir</h2><div style="margin-top:8px">${list}</div></section></div>${preview('prochaines exceptions', prevInner)}</div>`
  const extra = (st === 'succes' ? toast('ok', 'Exception ajoutée.') : fail ? toast('err', 'Échec : l’exception n’a pas été ajoutée.', retryBtn.replace('btn-secondary', 'btn-ghost')) : '') +
    (st === 'suppression' ? dlg('Supprimer cette exception ?', 'Le jeudi 24 décembre 2026 (Réveillon de Noël) reprendra les horaires normaux de la semaine. Cette action est définitive.', 'Annuler', 'Supprimer l’exception', 'btn-danger') : '')
  return shell('Site public : Exceptions', main, extra, st === 'suppression' ? 'viewport' : 'full')
}

const COLORS = [['amber', 'Orange'], ['green', 'Vert'], ['red', 'Rouge'], ['blue', 'Bleu'], ['purple', 'Violet']]
function annoncesPage(st) {
  const empty = st === 'vide', dirty = st === 'non-enregistre' || st === 'echec' || st === 'enregistrement'
  const color = dirty ? 'blue' : 'amber'
  const title = empty ? '' : dirty ? 'Menu de fête' : 'Fermeture exceptionnelle'
  const content = empty ? '' : dirty ? 'Menu de fête du 24 au 26 décembre. Réservation conseillée.' : 'Le restaurant sera fermé le 13 avril pour Songkran. Réservations rouvertes dès le 14.'
  const active = !empty
  const form = `<form class="stack" style="margin-top:16px" ${st === 'enregistrement' ? 'aria-busy="true"' : ''}>
<div>${sw('Afficher la bannière sur le site', active, active ? 'Bannière affichée' : 'Bannière masquée')}</div>
<div class="field"><label class="lbl" for="a-t">Titre <span class="opt">(facultatif)</span></label><input class="in" id="a-t" value="${title}" placeholder="Fermeture exceptionnelle, menu spécial, événement…"></div>
<div class="field"><label class="lbl" for="a-c">Message</label><textarea class="in" id="a-c" placeholder="Écrivez votre annonce ici…" ${st === 'echec' ? '' : ''}>${content}</textarea></div>
<div class="field" role="radiogroup" aria-labelledby="a-col"><span class="lbl" id="a-col">Couleur de la bannière</span><div class="swatches">${COLORS.map(([v, l]) => `<button type="button" class="swatch" role="radio" aria-checked="${v === color}"><i class="sw-${v}"></i>${l}${v === color ? ic('check') : ''}</button>`).join('')}</div></div>
<div class="row2"><div class="field"><label class="lbl" for="a-s">Début <span class="opt">(facultatif)</span></label><input class="in" id="a-s" type="date" value="${empty ? '' : dirty ? '2026-12-20' : '2027-03-30'}"></div>
<div class="field"><label class="lbl" for="a-e">Fin <span class="opt">(facultatif)</span></label><input class="in" id="a-e" type="date" value="${empty ? '' : dirty ? '2026-12-26' : '2027-04-13'}"></div></div>
${savebar(st === 'enregistrement' ? 'saving' : dirty ? 'dirty' : 'clean', 'Enregistrer l’annonce')}</form>`
  const body = st === 'chargement' ? `<div aria-busy="true" role="status"><span class="sr-only">Chargement de l’annonce…</span>${skel(5)}</div>` : st === 'erreur' ? errLoad('l’annonce') : form
  const status = empty ? `<span class="badge badge-mute">${ic('ban')}Aucune bannière</span>` : dirty ? `<span class="badge badge-info">${ic('cal')}Programmée du 20 au 26 décembre 2026</span>` : `<span class="badge badge-info">${ic('cal')}Programmée du 30 mars au 13 avril 2027</span>`
  const prevInner = st === 'chargement' || st === 'erreur' ? '<p>Aperçu indisponible.</p>' : empty ? `<p>Aucune bannière n’est affichée sur le site.</p><div style="margin-top:10px">${status}</div>` :
    `<div class="bn bn-${color}">${ic('mega')}<div>${title ? `<strong>${title}</strong>` : ''}${content}</div></div><div style="margin-top:10px">${status}</div>`
  const top = st === 'echec' ? alertBox('err', 'L’annonce n’a pas été enregistrée.', 'Le serveur n’a pas répondu. Votre texte et vos choix sont conservés. Réessayez.', retryBtn) : ''
  const main = siteHead('annonces') + panelWrap('Annonce du site', 'mega', body, preview('bannière en haut du site', prevInner), top ? `<div style="margin-top:16px">${top}</div>` : '')
  const extra = st === 'succes' ? toast('ok', 'Annonce enregistrée.') : st === 'echec' ? toast('err', 'Échec de l’enregistrement de l’annonce.', retryBtn.replace('btn-secondary', 'btn-ghost')) : ''
  return shell('Site public : Annonces', main, extra)
}

function capacitePage(st) {
  const bad = st === 'invalide', dirty = st === 'non-enregistre' || st === 'echec' || bad
  const covers = dirty && !bad ? 36 : 40, dur = bad ? 20 : dirty ? 90 : 120
  const fmt = (m) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`
  const presets = [60, 90, 120, 150, 180]
  const form = `<form class="stack" style="margin-top:16px">
<div class="field"><label class="lbl" for="cv">Couverts maximum par service</label><div class="stepper"><button type="button" class="btn btn-secondary" aria-label="Diminuer le nombre de couverts">${ic('minus')}</button><input class="in" id="cv" inputmode="numeric" value="${covers}" aria-describedby="cv-h"><button type="button" class="btn btn-secondary" aria-label="Augmenter le nombre de couverts">${ic('plus')}</button><span class="unit">couverts</span></div>
<p class="hint" id="cv-h">Nombre maximum de clients accueillis en même temps. Vérifié à chaque réservation en ligne. Entre 1 et 200.</p></div>
<div class="field"><label class="lbl" for="du">Durée d’occupation d’un créneau</label><div class="stepper"><button type="button" class="btn btn-secondary" aria-label="Diminuer la durée de 15 minutes">${ic('minus')}</button><input class="in" id="du" inputmode="numeric" value="${dur}" ${bad ? 'aria-invalid="true" aria-describedby="du-e"' : 'aria-describedby="du-h"'}><button type="button" class="btn btn-secondary" aria-label="Augmenter la durée de 15 minutes">${ic('plus')}</button><span class="unit">minutes${bad ? '' : ' (' + fmt(dur) + ')'}</span></div>
${bad ? `<p class="err-msg" id="du-e">${ic('alert')}Entrez une durée entre 30 et 480 minutes. Vous avez saisi 20.</p>` : `<p class="hint" id="du-h">Temps pendant lequel une réservation compte dans les couverts après son heure d’arrivée : repas et marge de service. Entre 30 et 480 minutes, par pas de 15.</p>`}
<div class="chips" role="radiogroup" aria-label="Durées courantes" style="margin-top:6px">${presets.map((m) => `<button type="button" class="chip" role="radio" aria-checked="${m === dur}">${m === dur ? ic('check') : ''}${fmt(m)}</button>`).join('')}</div></div>
${savebar(bad ? 'dirty' : dirty ? 'dirty' : 'clean', 'Enregistrer la capacité')}</form>`
  const body = st === 'chargement' ? `<div aria-busy="true" role="status"><span class="sr-only">Chargement des réglages…</span>${skel(4)}</div>` : st === 'erreur' ? errLoad('les réglages') : form
  const tlStart = 19, w = Math.min(dur / 60, 3)
  const prevInner = st === 'chargement' || st === 'erreur' ? '<p>Aperçu indisponible.</p>' : `<p><b>${covers} couverts</b> maximum en même temps. Une réservation à 19:00 occupe ${bad ? 'la durée saisie' : fmt(dur)}, jusqu’à ${bad ? '…' : (() => { const e = 19 * 60 + dur; return String(Math.floor(e / 60)).padStart(2, '0') + ':' + String(e % 60).padStart(2, '0') })()}.</p>
<div class="tl" role="img" aria-label="Frise de 12 heures à 22 heures : la réservation de 19 heures occupe ${bad ? 'la durée saisie' : fmt(dur)}"><div class="tl-bar"><div class="tl-fill" style="left:${(tlStart - 12) * 10}%;width:${bad ? 0 : w * 10}%"></div></div><div class="tl-ticks" aria-hidden="true"><span>12h</span><span>14h</span><span>16h</span><span>18h</span><span>20h</span><span>22h</span></div></div>`
  const top = st === 'echec' ? alertBox('err', 'La capacité n’a pas été enregistrée.', 'Le serveur n’a pas répondu. Vos valeurs sont conservées. Réessayez.', retryBtn) : ''
  const main = siteHead('capacite') + panelWrap('Capacité et durée d’occupation', 'users', body, preview('réservation en ligne', prevInner, 'Illustration indicative. Les disponibilités réelles sont calculées à la réservation.'), top ? `<div style="margin-top:16px">${top}</div>` : '')
  const extra = st === 'succes' ? toast('ok', 'Capacité enregistrée.') : st === 'echec' ? toast('err', 'Échec de l’enregistrement de la capacité.', retryBtn.replace('btn-secondary', 'btn-ghost')) : ''
  return shell('Site public : Capacité', main, extra)
}

// ---------- Carte ----------
const MENU = {
  dejeuner: [
    ['Entrées', [
      ['Nems de crevettes', 'Herbes fraîches, sauce nuoc-mâm douce', 350, true, false, false, false, 'crustacés, gluten'],
      ['Salade de papaye verte', 'Tomate, haricots, cacahuètes, citron vert', 290, true, false, true, true, 'arachides, poisson'],
      ['Velouté de potiron', 'Lait de coco, gingembre', 260, true, true, false, true, ''],
    ]],
    ['Plats', [
      ['Tom Kha Gai', 'Poulet, lait de coco, galanga, citronnelle', 380, true, false, false, true, 'lait'],
      ['Curry vert de canard', 'Aubergines thaïes, basilic, piment frais', 520, false, false, true, true, ''],
      ['Filet de poisson, beurre blanc citronnelle', 'Poisson du jour, riz parfumé', 640, true, false, false, false, 'poisson, lait'],
      ['Pad thaï aux légumes', 'Nouilles de riz, tofu, cacahuètes', 340, true, true, false, true, 'arachides, soja'],
    ]],
    ['Desserts', [
      ['Riz gluant à la mangue', 'Lait de coco, graines de sésame', 220, true, true, false, true, 'sésame'],
      ['Tarte fine ananas-gingembre', 'Pâte feuilletée, glace vanille', 240, true, true, false, false, 'gluten, lait, œufs'],
    ]],
  ],
}
const flags = (it) => [it[4] ? `<span class="fl">${ic('leaf')}Végétarien</span>` : '', it[5] ? `<span class="fl">${ic('flame')}Épicé</span>` : '', it[6] ? `<span class="fl">${ic('check')}Sans gluten</span>` : ''].join('')
function itemRow(it, o = {}) {
  const [name, desc, price, avail] = it
  const id = 'p' + Math.abs([...name].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7))
  let pv = price, cls = '', status = ''
  if (o.edit === name) { pv = 395; cls = ' dirty'; status = `<div class="price-actions"><button class="btn btn-primary btn-sm">${ic('check')}Valider</button><button class="btn btn-ghost btn-sm">Annuler</button></div>` }
  if (o.saving === name) { pv = 395; cls = ' dirty'; status = `<div class="rowstatus saving" role="status">${ic('spin', 'spin')}Enregistrement…</div>` }
  if (o.saved === name) { pv = 395; status = `<div class="rowstatus saved" role="status">${ic('check')}Enregistré</div>` }
  if (o.fail === name) { pv = 395; cls = ' invalid'; status = `<div class="rowstatus err" id="${id}-e" role="alert">${ic('alert')}<span>Le prix n’a pas été enregistré. 395 ฿ saisi, rien n’est perdu.</span></div><div class="price-actions"><button class="btn btn-secondary btn-sm">${ic('refresh')}Réessayer</button><button class="btn btn-ghost btn-sm">Annuler</button></div>` }
  const mv = o.reorder ? `<div class="mv"><button class="btn btn-secondary btn-icon" aria-label="Monter ${name}">${ic('up')}</button><button class="btn btn-secondary btn-icon" aria-label="Descendre ${name}">${ic('down')}</button></div>` : `<button class="btn btn-secondary btn-sm" aria-label="Détails de ${name}">${ic('pencil')}Détails</button>`
  return `<li class="item${avail ? '' : ' off'}"><div class="i-main"><p class="i-name">${name}</p><p class="i-desc">${desc}</p><div class="i-meta">${flags(it)}</div>${it[7] ? `<p class="i-all">Allergènes : ${it[7]}</p>` : ''}</div>
<div class="i-avail">${sw('Disponibilité de ' + name, avail, avail ? 'Disponible' : 'Indisponible')}</div>
<div class="i-price price-cell"><div class="price${cls}"><label class="sr-only" for="${id}">Prix de ${name} en bahts</label><input id="${id}" inputmode="decimal" value="${pv}" ${o.fail === name ? `aria-invalid="true" aria-describedby="${id}-e"` : ''}><span aria-hidden="true">฿</span></div>${status}</div>
<div class="i-act">${mv}</div></li>`
}
function catBlock(c, open, o) {
  const [name, items] = c
  const off = items.filter((i) => !i[3]).length
  return `<section class="cat" aria-label="${name}"><div class="cat-wrap"><button class="cat-h" aria-expanded="${open}"><span class="chev">${ic(open ? 'chev' : 'chevr')}</span><h2>${name}</h2><span class="count">${items.length} plats${off ? ` · ${off} indisponible${off > 1 ? 's' : ''}` : ''}</span></button>${o.reorder ? `<div class="mv" style="margin-right:8px"><button class="btn btn-secondary btn-icon" aria-label="Monter ${name}">${ic('up')}</button><button class="btn btn-secondary btn-icon" aria-label="Descendre ${name}">${ic('down')}</button></div>` : `<button class="btn btn-ghost btn-icon" aria-label="Options de la catégorie ${name}" aria-haspopup="menu">${ic('dots')}</button>`}</div>
${open ? `<ul>${items.map((i) => itemRow(i, o)).join('')}</ul>` : ''}</section>`
}
const sheetAdd = (kept) => `<div class="scrim sheet-scrim"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sa"><div class="sheet-h"><h2 id="sa">Ajouter un plat</h2><button class="btn btn-ghost btn-icon" aria-label="Fermer">${ic('x')}</button></div>
<div class="sheet-b"><div class="field"><label class="lbl" for="q-c">Catégorie</label><select class="in" id="q-c"><option>Plats</option><option>Entrées</option><option>Desserts</option></select></div>
<div class="field"><label class="lbl" for="q-n">Nom du plat</label><input class="in" id="q-n" value="${kept ? 'Soupe de poisson' : ''}" autofocus></div>
<div class="field"><label class="lbl" for="q-p">Prix <span class="opt">(en bahts)</span></label><div class="price" style="width:100%"><input id="q-p" inputmode="decimal" value="${kept ? '' : ''}" placeholder="0" aria-label="Prix en bahts"><span aria-hidden="true">฿</span></div></div>
<div>${sw('Disponible', true, 'Disponible')}</div><p class="hint">Description, allergènes et photo se complètent ensuite dans « Détails ».</p></div>
<div class="sheet-f"><button class="btn btn-primary">${ic('plus')}Ajouter le plat</button><button class="btn btn-secondary">Ajouter et en saisir un autre</button></div></div></div>`
const sheetDetails = (it) => `<div class="scrim sheet-scrim"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sd"><div class="sheet-h"><h2 id="sd">Modifier le plat</h2><button class="btn btn-ghost btn-icon" aria-label="Fermer">${ic('x')}</button></div>
<div class="sheet-b"><div class="field"><label class="lbl" for="d-n">Nom du plat</label><input class="in" id="d-n" value="${it[0]}"></div>
<div class="field"><label class="lbl" for="d-d">Description</label><textarea class="in" id="d-d">${it[1]}</textarea></div>
<div class="row2"><div class="field"><label class="lbl" for="d-p">Prix <span class="opt">(฿)</span></label><input class="in" id="d-p" inputmode="decimal" value="${it[2]}"></div><div class="field"><label class="lbl" for="d-l">Libellé de prix <span class="opt">(remplace le prix)</span></label><input class="in" id="d-l" placeholder="ex. 350 / 520"></div></div>
<div class="field"><span class="lbl">Photo du plat</span><div class="photo-ph">${ic('image')}<span>Emplacement photo : aucune photo enregistrée</span></div><div class="row2" style="margin-top:6px"><button class="btn btn-secondary btn-sm">Téléverser une image</button><input class="in" aria-label="Adresse de l’image" placeholder="Coller l’adresse d’une image"></div></div>
<div class="field"><label class="lbl" for="d-a">Allergènes</label><input class="in" id="d-a" value="${it[7]}" placeholder="ex. crustacés, arachides"></div>
<div class="field"><span class="lbl">Caractéristiques</span>
<button type="button" class="checkrow" role="checkbox" aria-checked="true"><span class="box">${ic('check')}</span>Disponible</button>
<button type="button" class="checkrow" role="checkbox" aria-checked="${it[4]}"><span class="box">${it[4] ? ic('check') : ''}</span>${ic('leaf')}Végétarien</button>
<button type="button" class="checkrow" role="checkbox" aria-checked="${it[5]}"><span class="box">${it[5] ? ic('check') : ''}</span>${ic('flame')}Épicé</button>
<button type="button" class="checkrow" role="checkbox" aria-checked="${it[6]}"><span class="box">${it[6] ? ic('check') : ''}</span>Sans gluten (confirmé par la cheffe)</button></div>
<button class="btn btn-quiet-danger">${ic('trash')}Supprimer ce plat</button></div>
<div class="sheet-f"><button class="btn btn-primary">Enregistrer le plat</button><button class="btn btn-ghost">Annuler</button></div></div></div>`

function cartePage(st) {
  const o = {}
  if (st === 'prix-edition') o.edit = 'Tom Kha Gai'
  if (st === 'prix-enregistrement') o.saving = 'Tom Kha Gai'
  if (st === 'prix-succes') o.saved = 'Tom Kha Gai'
  if (st === 'prix-echec') o.fail = 'Tom Kha Gai'
  if (st === 'reordonner') o.reorder = true
  const cats = MENU.dejeuner
  let list
  if (st === 'chargement') list = `<div aria-busy="true" role="status"><span class="sr-only">Chargement de la carte…</span>${[0, 1].map(() => `<div class="cat"><div class="sk" style="height:60px;margin:0;border-radius:0"></div>${skel(3).replace(/margin:10px 0/g, 'margin:12px 16px')}</div>`).join('')}</div>`
  else if (st === 'erreur') list = `<div class="cat">${errLoad('la carte')}</div>`
  else if (st === 'vide') list = `<div class="cat"><div class="empty">${ic('utensils')}<h2>Cette page de carte est vide</h2><p>Créez une première catégorie, par exemple « Entrées », puis ajoutez vos plats.</p><button class="btn btn-primary">${ic('plus')}Ajouter une catégorie</button></div></div>`
  else if (st === 'recherche-vide') list = `<div class="cat"><div class="empty">${ic('search')}<h2>Aucun plat ne correspond</h2><p>Aucun résultat pour « bœuf ». Vérifiez l’orthographe ou effacez la recherche.</p><button class="btn btn-secondary">Effacer la recherche</button></div></div>`
  else list = cats.map((c, i) => catBlock(c, st === 'replie' ? i === 1 : true, o)).join('') + `<section class="cat" aria-label="Boissons"><div class="cat-wrap"><button class="cat-h" aria-expanded="false"><span class="chev">${ic('chevr')}</span><h2>Boissons</h2><span class="count">0 plat</span></button></div></section>`
  const hasContent = !['chargement', 'erreur', 'vide'].includes(st)
  const total = 9
  const q = st === 'recherche-vide' ? 'bœuf' : ''
  const main = `<div class="hd"><div><h1>Carte</h1><div class="h1-rule"></div><p class="lede">Prix et disponibilité des plats, visibles sur le site public.</p></div>
<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-secondary hd-add" ${hasContent ? '' : 'disabled'}>${ic('sort')}${o.reorder ? 'Terminer' : 'Réorganiser'}</button><button class="hd-add btn btn-primary">${ic('plus')}Ajouter un plat</button></div></div>
<div class="ctrl"><nav class="tabs" role="tablist" aria-label="Pages de la carte"><a class="tab" role="tab" href="carte.html" aria-selected="true">Déjeuner <span class="count">(${hasContent ? total : 0})</span></a><a class="tab" role="tab" href="carte.html" aria-selected="false">Dîner <span class="count">(14)</span></a></nav>
<div class="search"><label class="sr-only" for="q">Rechercher un plat</label>${ic('search')}<input class="in" id="q" type="search" placeholder="Rechercher un plat" value="${q}"></div>
<button class="btn btn-secondary hd-add" style="display:none"></button></div>
${hasContent && st !== 'recherche-vide' ? `<div class="summary"><span>${total} plats</span><span class="badge badge-err">${ic('ban')}1 indisponible</span>${o.reorder ? `<span class="badge badge-info">${ic('sort')}Mode réorganisation : utilisez les flèches</span>` : ''}</div>` : ''}
${list}
<div class="addbar"><button class="btn btn-primary btn-block" ${hasContent ? '' : 'disabled'}>${ic('plus')}Ajouter un plat</button></div>`
  let extra = ''
  if (st === 'prix-succes') extra = toast('ok', 'Prix de « Tom Kha Gai » enregistré : 395 ฿.')
  if (st === 'prix-echec') extra = toast('err', 'Échec : le prix de « Tom Kha Gai » n’a pas été enregistré.', retryBtn.replace('btn-secondary', 'btn-ghost'))
  if (st === 'dispo-echec') extra = toast('err', 'Échec : « Curry vert de canard » est resté indisponible.', retryBtn.replace('btn-secondary', 'btn-ghost'))
  if (st === 'dispo-succes') extra = toast('ok', '« Curry vert de canard » est indisponible sur le site.')
  if (st === 'ajout-rapide') extra = sheetAdd(false)
  if (st === 'ajout-echec') extra = sheetAdd(true) + toast('err', 'Échec : le plat n’a pas été ajouté.', '')
  if (st === 'details') extra = sheetDetails(MENU.dejeuner[1][1][0])
  if (st === 'suppression') extra = dlg('Supprimer ce plat ?', '« Tom Kha Gai » disparaîtra de la carte du site public. Cette action est définitive. Pour le retirer temporairement, marquez-le plutôt comme indisponible.', 'Annuler', 'Supprimer le plat', 'btn-danger')
  if (st === 'suppression-categorie') extra = dlg('Supprimer la catégorie « Desserts » ?', 'Ses 2 plats seront supprimés avec elle. Cette action est définitive.', 'Annuler', 'Supprimer la catégorie et ses plats', 'btn-danger')
  if (st === 'quitter') extra = dlg('Fermer sans enregistrer ?', 'Les modifications de « Tom Kha Gai » seront perdues.', 'Continuer la modification', 'Fermer sans enregistrer', 'btn-danger')
  const vp = ['ajout-rapide', 'ajout-echec', 'details', 'suppression', 'suppression-categorie', 'quitter'].includes(st)
  let html = shell('Carte', main, extra, vp ? 'viewport' : 'full')
  if (st === 'quitter') html = html.replace('</body>', '</body>').replace(/(<\/main>)/, '$1') ;
  if (st === 'quitter') html = html.replace('</div></body>', '</div></body>')
  return html
}

const sets = {
  'site-public-horaires': [horairesPage, ['', 'chargement', 'erreur', 'non-enregistre', 'enregistrement', 'succes', 'echec', 'quitter']],
  'site-public-exceptions': [exceptionsPage, ['', 'chargement', 'erreur', 'vide', 'succes', 'echec', 'suppression']],
  'site-public-annonces': [annoncesPage, ['', 'chargement', 'erreur', 'vide', 'non-enregistre', 'enregistrement', 'succes', 'echec']],
  'site-public-capacite': [capacitePage, ['', 'chargement', 'erreur', 'non-enregistre', 'invalide', 'succes', 'echec']],
  carte: [cartePage, ['', 'chargement', 'erreur', 'vide', 'recherche-vide', 'replie', 'prix-edition', 'prix-enregistrement', 'prix-succes', 'prix-echec', 'dispo-succes', 'dispo-echec', 'ajout-rapide', 'ajout-echec', 'details', 'suppression', 'suppression-categorie', 'quitter', 'reordonner']],
}
const files = []
for (const [base, [fn, states]] of Object.entries(sets)) for (const s of states) {
  const name = s ? `${base}--${s}.html` : `${base}.html`
  fs.writeFileSync(path.join(OUT, name), fn(s)); files.push(name)
}
fs.writeFileSync(path.join(OUT, '.pages.json'), JSON.stringify(files))
console.log(files.length, 'pages')
