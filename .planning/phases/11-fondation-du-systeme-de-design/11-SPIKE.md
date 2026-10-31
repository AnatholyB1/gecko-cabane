# 11-SPIKE : DSN-01, Base UI pour les primitives de l'admin

Date du spike : 2026-10-31. Branche : `spike/11-base-ui` (depuis `milestone/v1.1`, HEAD `c6bc779`). Rien du spike n'est fusionnable hors de ce dossier : la page jetable et la dépendance ont été retirées avant commit.

## Verdict : ADOPTER Base UI (`@base-ui/react`)

Repli (`<dialog>` natif + `sonner`) non retenu, mais validé comme plan B viable.

Raisons : Base UI fournit les trois primitives avec le comportement accessible complet (focus piégé, restitution du focus, `role="alertdialog"`, toast avec région `aria-live` et priorité assertive pour les erreurs, Select en `combobox`/`listbox` sans retomber sur le `<select>` natif). Le coût est de +55 Ko transférés / +157 Ko décodés (trois composants) contre +11 / +38 Ko pour le repli. Le surcoût est ponctuel et ne touche que l'admin (non indexée, 1 à 2 utilisateurs). Aucun avertissement du React Compiler.

## Versions exactes (vérifiées sur le registre npm le 2026-10-31)

| Paquet | Version | Note |
|---|---|---|
| `@base-ui/react` | **1.9.0** (dist-tag `latest`) | Le paquet actuel. Peers : react 17/18/19, `@types/react`, `date-fns` et `@date-fns/tz` (optionnels, calendrier seulement) |
| `@base-ui-components/react` | 1.0.0-rc.0 | ANCIEN nom, abandonné. Ne pas l'installer. La doc installée le dit : « renamed to `@base-ui/react` » |
| `sonner` (repli) | 2.0.8 | |
| Next / React / compiler | 16.1.6 / 19.2.3 / babel-plugin-react-compiler 1.0.0 | inchangés |
| Chromium de test | ms-playwright chromium-1248, `playwright-core` (dossier temp hors repo) | pas une dépendance du projet |

La documentation lue est celle installée : `node_modules/@base-ui/react/docs/react/components/{alert-dialog,dialog,toast,select}.md` et `overview/quick-start.md`.

## Ce qui a été construit (jetable, voir `spike-code/`)

Page `/monitoring-spike` (hors matcher du middleware : le matcher exclut `monitoring...`, donc pas d'auth ni d'i18n ; un `src/app/admin/_spike` n'est pas routable car `_dossier` est privé, et `/admin/*` exige un compte admin). Contenu :
- `AlertDialog` de confirmation (Trigger, Backdrop, Popup, Title, Description, Close).
- `Toast` (Provider, Portal, Viewport, Root, Title, Description, Close) avec `type` success/error et `priority` low/high.
- `Select` (items, Label, Trigger, Value, Portal, Positioner, Popup, List, Item).
- Styles : variables `--adm-*` + Tailwind v4 (`bg-(--adm-surface)`, `rounded-(--adm-radius)`), aucune variable publique `--gc-*`.
- Variante repli `/monitoring-spike/fallback` : `<dialog>` natif + `showModal()`, `sonner`, `<select>` natif.

## Preuves

### Build et React Compiler
- `npx next build` : OK, les routes `/monitoring-spike` et `/monitoring-spike/fallback` sont générées, aucune sortie `warn`/`error`.
- `npx eslint src/app/monitoring-spike` : « No issues found » (eslint-config-next 16 inclut les règles React Compiler / hooks).
- Compilateur lancé directement avec un logger (script hors repo) : `CompileSuccess` pour `Demo`, `ToastList`, `SpikeClient` (3 mémoïsations `_c(`) et `FallbackClient`. Aucun `CompileError` ni bailout.
- `npm run build` (qui enchaîne `vitest run && next build`) s'arrête sur 4 tests ÉCHOUÉS PRÉEXISTANTS, sans lien avec le spike : `tests/kpi-docs.test.ts` (KPI-02, KPI-05, KPI-08, ROADMAP phase 8) lit `.planning/REQUIREMENTS.md` et `ROADMAP.md`, dont le contenu a changé avec la roadmap v1.1. Reproduit sur `milestone/v1.1` sans le spike. À corriger côté planning, hors périmètre. Le build Next a donc été validé via `npx next build`.

### Navigateur réel (Chromium headless 1248, `next start -p 3104`, script `spike-code/playwright-run.mjs`)

Base UI : 15 contrôles sur 15 PASS, console propre (aucune erreur ni warning).

| Contrôle | Résultat |
|---|---|
| Dialog : `role="alertdialog"`, `aria-labelledby`/`aria-describedby` renseignés | PASS |
| Focus initial dans le dialog | PASS |
| 8 Tab + 4 Shift+Tab : le focus reste dans le dialog (alterne Garder/Confirmer) | PASS |
| Arrière-plan rendu inert | PASS (`inert` posé) |
| Échap ferme | PASS |
| Focus restitué au bouton déclencheur après Échap | PASS (`active=open-dialog`) |
| Focus restitué après « Confirmer » à la souris | PASS |
| Toast succès : région `role="region" aria-live="polite" aria-label="Notifications"` contient le texte | PASS |
| Toast erreur (`priority: 'high'`) : en plus un nœud `role="alert" aria-atomic="true"` (annonce assertive) | PASS |
| Toast auto-fermé avant 7 s (défaut 5 s) | PASS |
| Select : trigger `role="combobox" aria-haspopup="listbox" aria-expanded`, nommé par `aria-labelledby` | PASS |
| Select ouvert à Entrée : `role="listbox"`, 5 `role="option"`, `aria-selected` sur la valeur courante | PASS |
| ArrowDown x2 + Entrée : valeur changée (`pending` vers `completed`) | PASS |
| Focus revient au trigger du Select | PASS |
| Échap ferme le Select (`aria-expanded=false`, focus sur le combobox) | PASS |

Repli `<dialog>` + sonner + `<select>` natif : tout PASS sauf une nuance. Le piège de focus du `<dialog>` modal natif ne fait pas de boucle : après le dernier bouton, Tab sort vers l'interface du navigateur (`document.activeElement` = BODY) puis revient. La page derrière reste inerte, Échap et la restitution du focus fonctionnent nativement. Sonner : `<section aria-live="polite" aria-label="Notifications alt+T">` pour tous les toasts, sans canal assertif pour les erreurs.

Captures : `spike-code/shots/base-2-dialog.png`, `base-3-toasts.png`, `base-4-select-open.png`.

### Pas de fuite des styles publics
`globals.css` pose sur `body` un fond sombre `#0D1F17` et la police Cormorant Garamond ; `html { scroll-behavior: smooth }` ; `button:focus-visible` global. Mesure : `.adm-root` calcule `rgb(244,241,234)` + `system-ui` alors que `body` reste `rgb(13,31,23)` + Cormorant. Donc le conteneur admin masque ces styles, mais il faut le poser explicitement (voir pièges). Les variables `--adm-*` ne sont pas utilisées sur le site public.

### Poids du bundle (JS chargé, mesuré par `PerformanceResourceTiming`)

| Page | Chunks | Décodé | Transféré (compressé) |
|---|---|---|---|
| `/admin/login` (référence) | 9 | 689 Ko | 211 Ko |
| Repli dialog + sonner + select natif | 10 | 727 Ko (+38) | 222 Ko (+11) |
| Base UI (AlertDialog + Toast + Select) | 11 | 846 Ko (+157) | 266 Ko (+55) |

Le surcoût Base UI inclut floating-ui (Select). Chaque primitive ajoutée ensuite (Popover, Tooltip, Menu) réutilise ce socle.

## Comparaison

| Critère | Base UI 1.9.0 | `<dialog>` + sonner |
|---|---|---|
| Poids | +55 Ko transférés | +11 Ko |
| Dialog | piège de focus bouclé, `alertdialog`, restitution du focus, backdrop animable, rendu en portail | natif, bon et gratuit, mais Tab sort vers l'UI navigateur ; pas de rôle `alertdialog` sans l'ajouter à la main |
| Toast | région live + `role="alert"` assertif pour `priority: 'high'`, F6 pour naviguer, swipe, file de toasts, manager global | sonner : simple, joli par défaut, mais uniquement `polite`, style à surcharger |
| Select | combobox/listbox stylable, clavier complet, typeahead | `<select>` natif : excellent clavier et lecteur d'écran, mais popup non stylable |
| Effort | moyen : composants non stylés, tout le CSS est à écrire (empilement des toasts compris) | faible |
| Risque React Compiler | aucun constaté (consomme refs et contextes en interne, hors du code compilé de l'app) | aucun constaté |
| Cohérence design | une seule API pour tout le système (Popover, Tooltip, Tabs, Menu à venir) | deux paradigmes, Select/menus à bricoler |

Le repli reste un bon plan B si la phase 11 veut réduire la dépendance : natif pour le Dialog, `<select>` natif pour les formulaires, sonner seul. Il perd l'annonce assertive des erreurs et un Select stylé.

## Pièges rencontrés (à retenir pour la phase 11)

1. **Portails et variables CSS.** Dialog, Select et Toast se rendent dans un `<div>` ajouté à `<body>`, donc HORS de `.adm-root`. Les variables `--adm-*` y valent `undefined` (mesuré : popup `rgba(0,0,0,0)`). Correctif validé : définir les tokens sur `.adm-root, .adm-portal` (bloc séparé des règles de mise en page) et passer `className="adm-portal"` à chaque `*.Portal`. Alternative : prop `container` pointant vers un nœud dans `.adm-root`.
2. **Fuite du site public vers l'admin.** Le layout racine charge `globals.css` pour tout : `body` sombre + Cormorant + `button:focus-visible`. Le conteneur admin doit redéfinir fond, texte, police et le focus visible (règle `.adm-root button:focus-visible`, et `.adm-portal` aussi pour les portails). Ne rien attendre d'un reset implicite.
3. **Empilement (stacking).** Le quick-start demande `isolation: isolate` sur la racine de l'app pour que les portails passent au-dessus. Posé sur `.adm-root`. Les popups reçoivent un `z-index` explicite (`z-50`).
4. **Toasts non empilés par défaut.** Base UI ne fournit que des variables (`--toast-index`, `--toast-offset-y`...) ; sans la CSS de transformation de la doc, les toasts se superposent (visible dans `base-3-toasts.png`). Reprendre le CSS « Tailwind » de `toast.md` pour la phase 11.
5. **Select : le `role="listbox"` reste monté après fermeture.** Tester `aria-expanded` et le focus, pas l'absence du nœud.
6. **Priorité des toasts.** `priority: 'high'` produit le `role="alert"` assertif : le réserver aux erreurs. Le succès reste en `low` (poli).
7. **Mon propre test a été fragile** : sans `waitForTimeout(60)` entre les Tab, le piège de focus paraissait échouer (les gardes de focus sont asynchrones). Garder l'attente dans les tests de phase 11.
8. **Route de test.** Une page sous `/admin/*` impose l'auth, `_dossier` n'est pas routable. Le chemin `/monitoring-spike` n'est possible que parce que le matcher exclut `monitoring` ; ne pas copier ce contournement en prod. Pour les tests de la phase 11, passer par une page admin réelle ou un test composant.
9. **Scripts d'installation npm** : `npm install` affiche des `allow-scripts` pour sharp, swc, unrs-resolver ; sans effet sur le build. Aucun nouveau script n'est demandé par Base UI.
10. **Tests préexistants rouges** (voir plus haut) : `tests/kpi-docs.test.ts` x4 bloque `npm run build` sur `milestone/v1.1`.

## Gabarit d'installation pour la phase 11

```bash
npm install @base-ui/react@^1.9.0          # jamais npm ci ; jamais @base-ui-components/react
# repli éventuel uniquement : npm install sonner@^2.0.8
```

Contraintes : `tests/deps.test.ts` interdit Playwright comme dépendance. Imports par chemin, sous-paquet par composant (`@base-ui/react/alert-dialog`, `/toast`, `/select`), pour limiter le bundle. Tout fichier qui les utilise commence par `'use client'`.

Structure recommandée :
```
src/app/admin/_components/ui/   (dossier privé, hors routes)
  AdminShell.tsx   // <div class="adm-root">, isolation: isolate, <Toast.Provider> + <Toast.Portal className="adm-portal">
  ConfirmDialog.tsx // AlertDialog.* avec onConfirm, trigger en prop, Portal className="adm-portal"
  useAdminToast.ts  // wrapper Toast.useToastManager : success() = low, error() = high
  AdminSelect.tsx   // Select.* avec items
src/app/admin/admin.css (ou section dans globals.css) // .adm-root, .adm-portal { tokens --adm-* } + règles de base
```
Tokens : `--adm-bg`, `--adm-surface`, `--adm-ink`, `--adm-ink-soft`, `--adm-line`, `--adm-accent`, `--adm-danger`, `--adm-ok`, `--adm-focus`, `--adm-radius`, `--adm-shadow` (valeurs de `spike-code/spike.css`). Utilisation Tailwind : `bg-(--adm-surface) text-(--adm-ink) rounded-(--adm-radius)`. Le layout `src/app/admin/layout.tsx` enveloppe `children` dans `AdminShell`. Textes admin en français fixe (pas d'i18n).

Critères d'acceptation à reprendre : les contrôles du tableau « Navigateur réel » ci-dessus, en gardant `spike-code/playwright-run.mjs` comme base (Playwright HORS du repo), plus `eslint` et la compilation du React Compiler sur les nouveaux composants.

## Non prouvé

- Lecteur d'écran réel (NVDA, VoiceOver) : seuls les attributs ARIA et les régions live ont été vérifiés dans le DOM, pas l'annonce vocale.
- Comportement tactile / mobile (swipe des toasts, Select sur iOS).
- Navigation par F6 vers la région des toasts et pause au survol/focus.
- Empilement visuel des toasts avec la CSS officielle (non appliquée dans le spike).
- Dialog contrôlé depuis un Server Action ou avec un formulaire à l'intérieur (soumission, état pending).
- `next dev` / Turbopack : tout a été mesuré sur `next build` + `next start`.
- Poids exact en production Vercel (mesures locales via ressources du navigateur).
