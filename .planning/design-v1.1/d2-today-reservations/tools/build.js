// Générateur des maquettes D2 (HTML statique). Sortie : dossier du repo.
const fs = require('fs'), path = require('path');
const OUT = process.argv[2];

const ICONS = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  userx: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 8 5 5M22 8l-5 5"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  circlecheck: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  circlex: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  alertc: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  note: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  undo: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-2.93 1.41-1.41m11.32-11.32 1.41-1.41M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
  wifioff: '<path d="M12 20h.01M8.5 16.4a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 4.2-2.6M10.7 5.1A15 15 0 0 1 22 8.8M5 12.8a10 10 0 0 1 5.2-2.7M16.7 11.3c.9.4 1.7.9 2.3 1.5M2 2l20 20"/>',
};
const ic = (n, cls = '') => `<svg class="i ${cls}" aria-hidden="true" viewBox="0 0 24 24">${ICONS[n]}</svg>`;

const STATUS = {
  pending: ['À confirmer', 'warn', 'clock'],
  confirmed: ['Confirmée', 'ok', 'circlecheck'],
  completed: ['Terminée', 'info', 'check'],
  cancelled: ['Annulée', 'danger', 'circlex'],
  no_show: ['Absent', 'neutral', 'userx'],
};
const badge = (st) => `<span class="badge badge--${STATUS[st][1]}">${ic(STATUS[st][2], 'i--sm')}${STATUS[st][0]}</span>`;
const SRC = { site: 'Site', whatsapp: 'WhatsApp', telephone: 'Téléphone', sans_reservation: 'Sans réservation' };

// ---- Données d'exemple (fictives) : jeudi... samedi 31 octobre 2026, heure de Krabi ----
const NOW = '16:10', MAX = 40, BLOCK = 120;
const R = [
  { id: 1, t: '12:00', name: 'Martin Dubois', n: 2, st: 'completed', src: 'site', loc: 'FR', ph: '+66 80 000 0101' },
  { id: 2, t: '12:30', name: 'Famille Lefèvre', n: 4, st: 'completed', src: 'site', loc: 'FR', ph: '+66 80 000 0102', occ: 'Anniversaire', note: 'Chaise haute pour un enfant.', allergy: 'arachides' },
  { id: 3, t: '13:00', name: 'Olivier Bernard', n: 6, st: 'completed', src: 'telephone', loc: 'FR', ph: '+66 80 000 0103', note: 'Table près de la fenêtre.' },
  { id: 4, t: '13:30', name: 'Yuki Tanaka', n: 2, st: 'cancelled', src: 'site', loc: 'EN', ph: '+66 80 000 0104' },
  { id: 10, t: '18:00', name: 'Camille Roche', n: 2, st: 'confirmed', src: 'site', loc: 'FR', ph: '+66 80 000 0110' },
  { id: 11, t: '18:30', name: 'Léa et Hugo Marchand', n: 2, st: 'confirmed', src: 'site', loc: 'FR', ph: '+66 80 000 0111', occ: 'Dîner romantique', note: 'Table au calme si possible.' },
  { id: 12, t: '18:30', name: 'Famille Dupont', n: 6, st: 'confirmed', src: 'telephone', loc: 'FR', ph: '+66 80 000 0112', note: 'Deux enfants.' },
  { id: 13, t: '19:00', name: 'Anna Schmidt', n: 2, st: 'pending', src: 'site', loc: 'DE', ph: '+66 80 000 0113' },
  { id: 14, t: '19:00', name: 'Groupe Pellegrini', n: 8, st: 'confirmed', src: 'whatsapp', loc: 'EN', ph: '+66 80 000 0114', occ: "Repas d'affaires", note: 'Facture au nom de la société.', allergy: 'gluten (1 personne)' },
  { id: 15, t: '19:30', name: 'Sven Lindqvist', n: 3, st: 'pending', src: 'site', loc: 'SV', ph: '+66 80 000 0115' },
  { id: 16, t: '20:00', name: 'Karine Moreau', n: 6, st: 'confirmed', src: 'whatsapp', loc: 'FR', ph: '+66 80 000 0116', occ: 'Anniversaire', note: 'Gâteau apporté par le client.' },
  { id: 17, t: '20:00', name: 'Emma Johansson', n: 4, st: 'pending', src: 'site', loc: 'SV', ph: '+66 80 000 0117' },
  { id: 18, t: '20:30', name: 'Paul Girard', n: 2, st: 'confirmed', src: 'telephone', loc: 'FR', ph: '+66 80 000 0118' },
  { id: 19, t: '21:30', name: 'Noah Clément', n: 2, st: 'confirmed', src: 'site', loc: 'FR', ph: '+66 80 000 0119' },
];
const mins = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
const counted = (r) => r.st !== 'cancelled' && r.st !== 'no_show';
const occAt = (h) => R.filter(counted).filter((r) => mins(r.t) <= h * 60 && h * 60 < mins(r.t) + BLOCK).reduce((s, r) => s + r.n, 0);
const HOURS = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const occ = HOURS.map((h) => occAt(h));
const peak = (a, b) => Math.max(...HOURS.filter((h) => h >= a && h < b).map(occAt));
const peakH = (a, b) => HOURS.filter((h) => h >= a && h < b).find((h) => occAt(h) === peak(a, b));
const lunch = R.filter((r) => mins(r.t) < 900), dinner = R.filter((r) => mins(r.t) >= 900);
const sumN = (a) => a.filter(counted).reduce((s, r) => s + r.n, 0);
const pendingList = R.filter((r) => r.st === 'pending');
const counts = { all: R.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
R.forEach((r) => counts[r.st]++);
const level = (n) => (n >= MAX ? 'full' : n >= 30 ? 'warn' : 'ok');

// ---- Composants ----
const digits = (p) => p.replace(/\D/g, '');
function row(r, o = {}) {
  const busy = o.busy === r.id, fail = o.fail === r.id;
  const label = `${r.name}, ${r.t}`;
  const notes = [];
  if (r.occ) notes.push(`<p>${ic('gift', 'i--sm')}<span><span class="sr-only">Occasion : </span>${r.occ}</span></p>`);
  if (r.allergy) notes.push(`<p>${ic('alert', 'i--sm')}<span><span class="tag-allergy">Allergie</span> ${r.allergy}</span></p>`);
  if (r.note) notes.push(`<p>${ic('note', 'i--sm')}<span><span class="sr-only">Note : </span>${r.note}</span></p>`);
  let act = '';
  if (o.actions !== false) {
    const dis = busy ? ' disabled' : '';
    const spin = (txt, icon) => busy && o.busyBtn === txt ? `${ic('loader', 'i--sm spin')}${txt}…` : `${ic(icon, 'i--sm')}${txt}`;
    const cancel = `<button class="btn btn--danger-outline"${dis} aria-label="Annuler la réservation de ${label}">${ic('x', 'i--sm')}Annuler</button>`;
    if (r.st === 'pending') act = `<button class="btn btn--primary"${dis} aria-label="Confirmer la réservation de ${label}">${busy ? `${ic('loader', 'i--sm spin')}Confirmation…` : `${ic('check', 'i--sm')}Confirmer`}</button>${cancel}`;
    if (r.st === 'confirmed') act = `<button class="btn btn--primary"${dis} aria-label="Marquer terminée la réservation de ${label}">${ic('check', 'i--sm')}Terminer</button><button class="btn btn--secondary"${dis} aria-label="Marquer absent (no-show) : ${label}">${ic('userx', 'i--sm')}Absent</button>${cancel}`;
  }
  const err = fail ? `<div class="rsv__err inline-err" role="alert">${ic('alertc', 'i--sm')}<span>La réservation n'a pas été confirmée. Aucun changement n'a été enregistré.</span><button class="btn btn--danger-outline">${ic('undo', 'i--sm')}Réessayer</button></div>` : '';
  return `<article class="rsv${act ? '' : ' rsv--noactions'}${busy ? ' is-busy' : ''}" data-status="${r.st}"${busy ? ' aria-busy="true"' : ''}>
  <div class="rsv__time">${r.t}</div>
  <div class="rsv__id"><h3 class="rsv__name">${r.name}</h3><p class="rsv__meta">${SRC[r.src]} · ${r.loc}<span class="ph">${r.ph}</span></p></div>
  <div class="rsv__party"><span class="party" aria-label="${r.n} couverts">${ic('user', 'i--sm')}${r.n}</span></div>
  <div class="rsv__status">${badge(r.st)}</div>
  <div class="rsv__contact"><a class="btn btn--secondary btn--icon" href="tel:${r.ph.replace(/\s/g, '')}" aria-label="Appeler ${r.name}">${ic('phone')}</a><a class="btn btn--secondary btn--icon" href="https://wa.me/${digits(r.ph)}" target="_blank" rel="noopener" aria-label="WhatsApp ${r.name} (nouvel onglet)">${ic('chat')}</a></div>
  ${notes.length ? `<div class="rsv__notes">${notes.join('')}</div>` : ''}
  ${act ? `<div class="rsv__actions">${act}</div>` : ''}
  ${err}
</article>`;
}
const topbar = () => `<header class="topbar"><div class="wordmark wordmark-top">Gecko Cabane<small>Administration</small></div><a class="btn btn--primary" href="manual-form.html">${ic('plus')}Réservation</a></header>`;
function shell(active, inner, { overlay = '', inertApp = false, toast = '' } = {}) {
  const nav = [['today.html', 'Aujourd’hui', 'sun', 'today'], ['reservations.html', 'Réservations', 'list', 'rsv'], ['#', 'Plus', 'menu', 'more']];
  const side = nav.map(([h, l, i, k]) => `<a href="${h}"${k === active ? ' aria-current="page"' : ''}>${ic(i)}${l}</a>`).join('');
  return `<a class="skip" href="#main">Aller au contenu</a>
<div class="ribbon">Maquette D2 · données d’exemple · coque D1 provisoire</div>
<div class="app"${inertApp ? ' inert' : ''}>
  <aside class="sidebar"><div class="wordmark">Gecko Cabane<small>Administration</small></div><nav aria-label="Principal">${side}</nav><p class="who">exemple@geckocabane.test<br>Heure de Krabi (UTC+7)</p></aside>
  <div class="main">${topbar()}<main id="main" class="page">${inner}</main>
  <nav class="bottomnav" aria-label="Principal">${nav.map(([h, l, i, k]) => `<a href="${h}"${k === active ? ' aria-current="page"' : ''}>${ic(i)}${l}</a>`).join('')}</nav></div>
</div>${toast}${overlay}`;
}
function doc(title, body, extra = '') {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · Gecko Cabane Admin (maquette D2)</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="tokens.css"><link rel="stylesheet" href="d2.css">${extra}</head>
<body>${body}</body></html>`;
}

// ---- Aujourd'hui ----
const dateLabel = 'Samedi 31 octobre';
const head = (pill = true) => `<div class="head"><div><p class="eyebrow">${dateLabel} 2026 · heure de Krabi, ${NOW}</p><h1 class="h1">Aujourd’hui</h1></div>${pill ? (pendingList.length ? `<a class="badge badge--warn head__pill btn" style="min-height:44px" href="#a-confirmer">${ic('clock', 'i--sm')}${pendingList.length} à confirmer</a>` : `<span class="badge badge--ok">${ic('circlecheck', 'i--sm')}Tout est confirmé</span>`) : ''}</div>`;
function gauge(label, hours, [a, b], covers) {
  const p = peak(a, b), lv = level(p), at = peakH(a, b);
  const foot = p === 0 ? 'Aucune réservation' : lv === 'full' ? `<span class="badge badge--danger">${ic('ban', 'i--sm')}Complet</span>` : lv === 'warn' ? `<span class="badge badge--warn">${ic('alert', 'i--sm')}Presque complet</span>` : `Pic à ${at}h`;
  return `<div class="gauge"><p class="gauge__label">${label} · ${hours}</p><p class="gauge__n"><b>${p}</b><span>/ ${MAX}</span></p><div class="meter meter--${lv === 'ok' ? 'ok' : lv}" role="meter" aria-label="${label}, pic de couverts" aria-valuemin="0" aria-valuemax="${MAX}" aria-valuenow="${p}"><i style="width:${(p / MAX) * 100}%"></i></div><p class="gauge__foot">${foot}</p></div>`;
}
function gauges(empty) {
  const l = empty ? 0 : null;
  return `<section class="card a-gauges" aria-labelledby="g-t"><h2 class="card__title" id="g-t">Couverts réservés (pic de chaque service)</h2>
<div class="gauges">${gauge('Déjeuner', '12h–15h', [12, 15])}${gauge('Dîner', '18h–22h', [18, 22])}</div>
<p class="totals"><b>${sumN(R)} couverts</b> sur la journée · ${R.filter(counted).length} réservations · capacité ${MAX} couverts à la fois</p></section>`;
}
function strip({ full = false, vals = occ, closeBtn = true } = {}) {
  const cols = HOURS.map((h, i) => {
    const n = vals[i], lv = level(n);
    const cls = lv === 'full' ? 'is-full' : lv === 'warn' ? 'is-warn' : n === 0 ? 'is-idle' : '';
    const flag = lv === 'full' ? `<span class="cap__flag cap__flag--full">${ic('ban', 'i--sm')}</span>` : lv === 'warn' ? `<span class="cap__flag">${ic('alert', 'i--sm')}</span>` : '<span class="cap__flag"></span>';
    const txt = lv === 'full' ? 'complet' : lv === 'warn' ? 'presque complet' : 'libre';
    const shown = n;
    return `<li class="${cls}">${flag}<span class="cap__n">${shown}<span class="sr-only"> couverts sur ${MAX} à ${h}h, ${txt}</span></span><span class="cap__bar"><i style="height:${(shown / MAX) * 100}%"></i></span><span class="cap__h" aria-hidden="true">${h}h</span></li>`;
  }).join('');
  const closeBlock = full
    ? `<div class="close-evening"><div class="banner banner--danger" role="status">${ic('ban')}<div class="banner__body"><div><b>Complet ce soir</b><span class="t">Les réservations en ligne sont fermées pour le dîner (18h–22h). Les réservations existantes sont conservées.</span></div><button class="btn btn--secondary">${ic('undo', 'i--sm')}Rouvrir ce soir</button></div></div></div>`
    : `<div class="close-evening"><button class="btn btn--secondary btn--block" aria-haspopup="dialog">${ic('ban', 'i--sm')}Complet ce soir</button><p>Ferme la réservation en ligne pour le dîner. Un tap, avec confirmation.</p></div>`;
  return `<section class="card a-strip" aria-labelledby="c-t"><h2 class="card__title" id="c-t">Couverts occupés par heure</h2>
<ul class="cap" role="list">${cols}</ul>
<ul class="legend" role="list"><li><span class="sw"></span>Libre</li><li><span class="sw sw--warn"></span>${ic('alert', 'i--sm')}Presque complet (30 et plus)</li><li><span class="sw sw--full"></span>${ic('ban', 'i--sm')}Complet (${MAX})</li></ul>
<p class="totals">Barre pleine = ${MAX} couverts. Une réservation occupe sa place pendant 2 h.</p>${closeBtn ? closeBlock : ''}</section>`;
}
function attn(list, o = {}) {
  if (!list.length) return `<section class="card attn a-attn" id="a-confirmer" aria-labelledby="at-t"><div class="attn__head" style="color:var(--adm-ok)">${ic('circlecheck')}<h2 id="at-t">Rien à confirmer</h2></div><p style="padding:0 16px 16px;color:var(--adm-muted)">Toutes les réservations du jour sont traitées.</p></section>`;
  return `<section class="card attn a-attn" id="a-confirmer" aria-labelledby="at-t" style="padding:0;overflow:hidden"><div class="attn__head">${ic('clock')}<h2 id="at-t">${list.length} à confirmer</h2></div>${list.map((r) => row(r, o)).join('')}</section>`;
}
function arrivals(o = {}) {
  const byHour = (h) => R.filter((r) => +r.t.slice(0, 2) === h);
  const grp = (h) => { const L = byHour(h); if (!L.length) return ''; return `<div class="hour"><h3>${h}h</h3><span>${L.filter(counted).length} réservation${L.filter(counted).length > 1 ? 's' : ''} · ${sumN(L)} couverts</span></div>${L.map((r) => row(r, { actions: false })).join('')}`; };
  const pastL = R.filter((r) => mins(r.t) < 900);
  const past = `<details class="past"><summary>Déjeuner terminé · ${pastL.filter(counted).length} réservations · ${sumN(pastL)} couverts</summary>${[12, 13].map(grp).join('')}</details>`;
  return `<section class="a-arr" aria-labelledby="ar-t"><h2 class="sect-title" id="ar-t">Arrivées du jour</h2><div class="panel">${past}${[18, 19, 20, 21].map(grp).join('')}</div></section>`;
}
const SKEL = (n) => Array.from({ length: n }, () => `<div class="sk-row"><div class="sk" style="height:22px;width:55%"></div><div class="sk" style="height:16px;width:80%"></div><div class="sk" style="height:28px;width:35%"></div></div>`).join('');

function todayPage(variant) {
  let inner, opt = {};
  if (variant === 'loading') {
    inner = `${head(false)}<div class="today" aria-busy="true"><p class="sr-only" role="status">Chargement du service du jour…</p>
<section class="card a-gauges"><div class="sk" style="height:16px;width:60%"></div><div class="gauges"><div><div class="sk" style="height:48px;width:80px;margin:12px 0"></div><div class="sk" style="height:8px"></div></div><div><div class="sk" style="height:48px;width:80px;margin:12px 0"></div><div class="sk" style="height:8px"></div></div></div></section>
<section class="card a-attn" style="padding:0;overflow:hidden">${SKEL(2)}</section>
<section class="card a-strip"><div class="sk" style="height:16px;width:50%"></div><div class="sk" style="height:130px;margin-top:16px"></div></section>
<section class="a-arr"><div class="panel">${SKEL(3)}</div></section></div>`;
  } else if (variant === 'error') {
    inner = `${head(false)}<div class="card"><div class="state state--error" role="alert">${`<div class="state__ico">${ic('wifioff')}</div>`}<h2>Impossible de charger le service du jour</h2><p>Vérifiez la connexion, puis réessayez. Aucune réservation n’a été modifiée.</p><div class="row"><button class="btn btn--primary">${ic('undo', 'i--sm')}Réessayer</button></div></div></div>`;
  } else if (variant === 'empty') {
    const z = HOURS.map(() => 0);
    inner = `<div class="head"><div><p class="eyebrow">${dateLabel} 2026 · heure de Krabi, ${NOW}</p><h1 class="h1">Aujourd’hui</h1></div><span class="badge badge--ok">${ic('circlecheck', 'i--sm')}Rien à confirmer</span></div>
<div class="today"><section class="card a-gauges"><h2 class="card__title">Couverts réservés (pic de chaque service)</h2><div class="gauges"><div class="gauge"><p class="gauge__label">Déjeuner · 12h–15h</p><p class="gauge__n"><b>0</b><span>/ ${MAX}</span></p><div class="meter" role="meter" aria-label="Déjeuner, pic de couverts" aria-valuemin="0" aria-valuemax="${MAX}" aria-valuenow="0"><i style="width:0"></i></div><p class="gauge__foot">Aucune réservation</p></div><div class="gauge"><p class="gauge__label">Dîner · 18h–22h</p><p class="gauge__n"><b>0</b><span>/ ${MAX}</span></p><div class="meter" role="meter" aria-label="Dîner, pic de couverts" aria-valuemin="0" aria-valuemax="${MAX}" aria-valuenow="0"><i style="width:0"></i></div><p class="gauge__foot">Aucune réservation</p></div></div></section>
<section class="card a-attn"><div class="state"><div class="state__ico">${ic('cal')}</div><h2>Aucune arrivée aujourd’hui</h2><p>Aucune réservation n’est prévue pour ce jour. Ajoutez celles prises par téléphone ou WhatsApp.</p><div class="row"><a class="btn btn--secondary" href="manual-form.html">${ic('plus', 'i--sm')}Réservation</a></div></div></section>
${strip({ vals: z })}</div>`;
  } else if (variant === 'full') {
    inner = `${head()}<div class="today">${gauges()}${attn(pendingList)}${strip({ full: true })}${arrivals()}</div>`;
  } else {
    inner = `${head()}<div class="today">${gauges()}${attn(pendingList)}${strip()}${arrivals()}</div>`;
  }
  let overlay = '', inertApp = false;
  if (variant === 'confirm-full') {
    inner = `${head()}<div class="today">${gauges()}${attn(pendingList)}${strip()}${arrivals()}</div>`;
    inertApp = true;
    overlay = `<div class="scrim"></div><div class="dialog dialog--alert" role="alertdialog" aria-modal="true" aria-labelledby="d-t" aria-describedby="d-d"><h2 id="d-t">Fermer les réservations ce soir ?</h2>
<div class="dialog__facts"><b>Dîner du samedi 31 octobre, 18h–22h</b><span>${R.filter((r) => mins(r.t) >= 900 && counted(r)).length} réservations existantes conservées</span></div>
<p class="dialog__desc" id="d-d">Le site n’acceptera plus de nouvelle réservation pour ce soir. Vous pourrez rouvrir à tout moment.</p>
<div class="dialog__actions"><button class="btn btn--secondary">Annuler</button><button class="btn btn--primary" autofocus>${ic('ban', 'i--sm')}Oui, complet ce soir</button></div></div>`;
  }
  return doc('Aujourd’hui', shell('today', inner, { overlay, inertApp }));
}

// ---- Réservations ----
function controls({ dateTitle = 'Samedi 31 octobre', which = 'today', q = '', filter = 'all', c = counts, disabled = false } = {}) {
  const chip = (k, l) => `<button class="chip" aria-pressed="${filter === k}">${l} <b>${c[k]}</b></button>`;
  return `<div class="controls"><div class="datenav"><div class="datenav__title"><a class="btn btn--secondary btn--icon" href="#" aria-label="Jour précédent">${ic('left')}</a><strong aria-live="polite">${dateTitle}</strong><a class="btn btn--secondary btn--icon" href="#" aria-label="Jour suivant">${ic('right')}</a></div>
<nav class="seg" aria-label="Aller à"><a href="#"${which === 'yesterday' ? ' aria-current="true"' : ''}>Hier</a><a href="#"${which === 'today' ? ' aria-current="true"' : ''}>Aujourd’hui</a><a href="#"${which === 'tomorrow' ? ' aria-current="true"' : ''}>Demain</a></nav>
<label class="btn btn--secondary btn--icon datepick" aria-label="Choisir une date">${ic('cal')}<input type="date" value="2026-10-31" tabindex="0"></label></div>
<div class="field"><label class="sr-only" for="q">Rechercher une réservation</label>${ic('search', 'lead')}<input id="q" class="input" type="search" placeholder="Nom, téléphone, note…" value="${q}" autocomplete="off"></div>
<div class="chips" role="group" aria-label="Filtrer par statut">${chip('all', 'Toutes')}${chip('pending', 'À confirmer')}${chip('confirmed', 'Confirmées')}${chip('completed', 'Terminées')}${chip('cancelled', 'Annulées')}${chip('no_show', 'Absents')}</div></div>`;
}
const rhead = '<div class="rsv-head" aria-hidden="true"><span>Heure</span><span>Client</span><span>Couverts</span><span>Statut</span><span>Contact</span><span>Actions</span></div>';
function list(o = {}) {
  const svc = (label, L) => `<div class="hour"><h3>${label}</h3><span>${L.filter(counted).length} réservations · ${sumN(L)} couverts</span></div>${L.map((r) => row(r, o)).join('')}`;
  return `<div class="summary-line" style="margin-bottom:12px"><span><b>${R.filter(counted).length}</b> réservations</span><span><b>${sumN(R)}</b> couverts</span><span>Heures de Krabi (UTC+7)</span></div>
<section class="rsv-list" aria-label="Réservations du 31 octobre">${rhead}${svc('Déjeuner', lunch)}${svc('Dîner', dinner)}</section>`;
}
const rsvHead = `<div class="head"><div><p class="eyebrow">Gestion du service</p><h1 class="h1">Réservations</h1></div></div>`;
function rsvPage(variant) {
  let body = '', overlay = '', inertApp = false, toast = '';
  const c = variant === 'empty' || variant === 'noresult' ? { all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 } : counts;
  const ctl = (extra = {}) => controls({ c, ...extra });
  if (variant === 'loading') body = `${ctl()}<div aria-busy="true"><p class="sr-only" role="status">Chargement des réservations…</p><div class="rsv-list">${SKEL(5)}</div></div>`;
  else if (variant === 'empty') body = `${ctl({ dateTitle: 'Vendredi 30 octobre', which: 'yesterday' })}<div class="rsv-list"><div class="state"><div class="state__ico">${ic('cal')}</div><h2>Aucune réservation ce jour</h2><p>Vendredi 30 octobre. Ajoutez une réservation prise par téléphone ou WhatsApp.</p><div class="row"><a class="btn btn--primary" href="manual-form.html">${ic('plus', 'i--sm')}Réservation</a><a class="btn btn--secondary" href="#">Voir aujourd’hui</a></div></div></div>`;
  else if (variant === 'noresult') body = `${controls({ q: 'zzz', c: counts })}<div class="rsv-list"><div class="state"><div class="state__ico">${ic('search')}</div><h2>Aucun résultat pour « zzz »</h2><p>Aucune réservation de ce jour ne correspond. Vérifiez l’orthographe ou effacez la recherche.</p><div class="row"><button class="btn btn--secondary">${ic('x', 'i--sm')}Effacer la recherche</button></div></div></div>`;
  else if (variant === 'error') body = `${ctl()}<div class="rsv-list"><div class="state state--error" role="alert"><div class="state__ico">${ic('wifioff')}</div><h2>Impossible de charger les réservations</h2><p>Vérifiez la connexion, puis réessayez. Aucune réservation n’a été modifiée.</p><div class="row"><button class="btn btn--primary">${ic('undo', 'i--sm')}Réessayer</button></div></div></div>`;
  else if (variant === 'busy') body = `${ctl()}${list({ busy: 13 })}<p class="sr-only" role="status">Confirmation de la réservation d’Anna Schmidt en cours…</p>`;
  else if (variant === 'actionfail') {
    body = `${ctl()}${list({ fail: 13 })}`;
    toast = `<div class="toasts"><div class="toast toast--error" role="alert">${ic('alertc')}<span class="toast__t">Échec : la réservation d’Anna Schmidt n’a pas été confirmée.</span><button class="btn btn--ghost">Réessayer</button></div></div>`;
  } else if (variant === 'cancel') {
    body = `${ctl()}${list()}`; inertApp = true;
    overlay = `<div class="scrim"></div><div class="dialog dialog--alert" role="alertdialog" aria-modal="true" aria-labelledby="d-t" aria-describedby="d-d"><h2 id="d-t">Annuler cette réservation ?</h2>
<div class="dialog__facts"><b>Anna Schmidt</b><span>Samedi 31 octobre · 19:00 · 2 couverts</span></div>
<p class="dialog__desc" id="d-d">Un email d’annulation sera envoyé au client si une adresse est renseignée. Cette action ne peut pas être défaite ici.</p>
<div class="dialog__actions"><button class="btn btn--secondary" autofocus>Garder la réservation</button><button class="btn btn--danger">${ic('x', 'i--sm')}Annuler la réservation</button></div></div>`;
  } else if (variant === 'success') {
    body = `${ctl()}${list()}`;
    toast = `<div class="toasts"><div class="toast" role="status">${ic('circlecheck')}<span class="toast__t">Réservation d’Anna Schmidt confirmée.</span></div></div>`;
  } else body = `${ctl()}${list()}`;
  return doc('Réservations', shell('rsv', rsvHead + body, { overlay, inertApp, toast }));
}

// ---- Formulaire de saisie manuelle ----
function form(v) {
  const filled = v === 'error' || v === 'busy';
  const val = (a) => (filled ? ` value="${a}"` : '');
  const inv = v === 'invalid';
  const errMsg = (id, t) => `<p class="err" id="${id}">${ic('alertc', 'i--sm')}${t}</p>`;
  const busy = v === 'busy';
  const dis = busy ? ' readonly' : '';
  const alert = v === 'error' ? `<div class="form-alert" role="alert">${ic('alertc')}<div><b>Impossible d’ajouter la réservation</b><span>Vos informations sont conservées. Vérifiez la connexion, puis réessayez.</span></div></div>`
    : inv ? `<div class="form-alert" role="alert">${ic('alertc')}<div><b>3 champs à corriger</b><span>Nom, source et heure sont obligatoires.</span></div></div>` : '';
  const src = (k) => `<label><input type="radio" name="source" value="${k}"${filled && k === 'telephone' ? ' checked' : ''}${busy ? ' disabled' : ''}>${SRC[k]}</label>`;
  return `<section class="dialog dialog--sheet" role="dialog" aria-modal="true" aria-labelledby="mf-t">
<div class="sheet__head"><h2 id="mf-t" style="font-size:28px">Nouvelle réservation</h2><button class="btn btn--ghost btn--icon" aria-label="Fermer">${ic('x')}</button></div>
<form class="" onsubmit="return false" style="display:flex;flex-direction:column;min-height:0;flex:1" aria-busy="${busy}">
<div class="sheet__body">${alert}
<fieldset class="f"><legend>Source</legend><div class="radios" role="radiogroup" aria-required="true"${inv ? ' aria-invalid="true" aria-describedby="e-src"' : ''}>${['telephone', 'whatsapp', 'sans_reservation'].map(src).join('')}</div>${inv ? errMsg('e-src', 'Choisissez une source') : ''}</fieldset>
<div class="f"><label for="mr-name">Nom</label><input id="mr-name" name="customer_name" class="input" required maxlength="100" autocomplete="off"${val('Exemple : Claire Fontaine')}${inv ? ' aria-invalid="true" aria-describedby="e-name"' : ''}${dis}>${inv ? errMsg('e-name', 'Indiquez le nom du client') : ''}</div>
<div class="f"><label for="mr-phone">Téléphone</label><input id="mr-phone" name="customer_phone" class="input" type="tel" inputmode="tel" autocomplete="off" placeholder="+66 …"${val('+66 80 000 0199')}${dis}><p class="hint">Facultatif pour un client sans réservation</p></div>
<div class="row2"><div class="f"><label for="mr-date">Date</label><input id="mr-date" name="reservation_date" class="input" type="date" required value="2026-10-31"${dis}></div>
<div class="f"><label for="mr-time">Heure (Krabi)</label><input id="mr-time" name="reservation_time" class="input" type="time" required${filled ? ' value="19:30"' : ''}${inv ? ' aria-invalid="true" aria-describedby="e-time"' : ''}${dis}>${inv ? errMsg('e-time', 'Indiquez l’heure') : ''}</div></div>
<div class="f"><label for="mr-size">Couverts</label><div class="stepper"><button type="button" class="btn btn--secondary btn--icon" aria-label="Un couvert de moins"${busy ? ' disabled' : ''}>${ic('minus')}</button><input id="mr-size" name="party_size" class="input" type="number" min="1" max="50" step="1" required inputmode="numeric" value="${filled ? 4 : 2}"${dis}><button type="button" class="btn btn--secondary btn--icon" aria-label="Un couvert de plus"${busy ? ' disabled' : ''}>${ic('plus')}</button></div></div>
<div class="f"><label for="mr-email">Email (facultatif)</label><input id="mr-email" name="customer_email" class="input" type="email" autocomplete="off"${val('claire@exemple.test')}${dis}></div>
<div class="f"><label for="mr-notes">Notes</label><textarea id="mr-notes" name="admin_notes" class="textarea" rows="3" maxlength="2000" placeholder="Allergies, occasion, demande particulière…"${dis}>${filled ? 'Allergie crustacés. Anniversaire.' : ''}</textarea><p class="hint">Visible dans la liste. Jusqu’à 2000 caractères.</p></div>
</div>
<div class="sheet__foot"><button type="button" class="btn btn--secondary"${busy ? ' disabled' : ''}>Annuler</button><button type="submit" class="btn btn--primary"${busy ? ' disabled aria-disabled="true"' : ''}>${busy ? `${ic('loader', 'i--sm spin')}Ajout…` : `${ic('check', 'i--sm')}Ajouter la réservation`}</button></div></form></section>`;
}
function manualPage(v) {
  const base = `${controls()}${list()}`;
  return doc('Nouvelle réservation', shell('rsv', rsvHead + base, { inertApp: true, overlay: `<div class="scrim"></div>${form(v)}` }));
}

const pages = {
  'today.html': todayPage('default'),
  'today-loading.html': todayPage('loading'),
  'today-empty.html': todayPage('empty'),
  'today-error.html': todayPage('error'),
  'today-confirm-full.html': todayPage('confirm-full'),
  'today-full.html': todayPage('full'),
  'reservations.html': rsvPage('default'),
  'reservations-success.html': rsvPage('success'),
  'reservations-busy.html': rsvPage('busy'),
  'reservations-loading.html': rsvPage('loading'),
  'reservations-empty.html': rsvPage('empty'),
  'reservations-noresult.html': rsvPage('noresult'),
  'reservations-error.html': rsvPage('error'),
  'reservations-actionfail.html': rsvPage('actionfail'),
  'reservations-cancel.html': rsvPage('cancel'),
  'manual-form.html': manualPage('empty'),
  'manual-form-invalid.html': manualPage('invalid'),
  'manual-form-busy.html': manualPage('busy'),
  'manual-form-error.html': manualPage('error'),
};
for (const [f, h] of Object.entries(pages)) fs.writeFileSync(path.join(OUT, f), h);
console.log('pages', Object.keys(pages).length, 'occ', JSON.stringify(occ), 'counts', JSON.stringify(counts), 'covers', sumN(R), 'peakL', peak(12, 15), 'peakD', peak(18, 22));
fs.writeFileSync(path.join(__dirname, 'pages.json'), JSON.stringify(Object.keys(pages)));
