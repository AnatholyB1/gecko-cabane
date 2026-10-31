# Audit phases 11 et 12 (revue, accessibilité, objectifs)

Date : 2026-10-31. Branche `audit/p11-p12` (depuis `milestone/v1.1`, HEAD `a399cdf`). Lecture seule sur le code.
Périmètre : `src/components/admin/**`, `src/app/admin/admin.css`, `src/app/admin/(app)/{layout.tsx,nav.ts,kit}`.
Exigences : DSN-01 à 07 (phase 11), NAV-01 à 05 (phase 12).

Méthode : `npm install`, `next build` (OK), `next start -p 3113` avec Supabase factice (`127.0.0.1:9`, aucun service réel), route de test temporaire `src/app/monitoring-test` (hors matcher du middleware : le préfixe `monitoring` est exclu), qui monte `AdminRoot` + `AdminShell` + `KitClient`. Route supprimée, jamais commitée. Playwright dans `C:\Users\Anatholy\AppData\Local\Temp\gecko-pw-a11` (hors repo, pas une dépendance). Largeurs 360, 390, 768, 1024, 1440.

Note : `11-VERIFICATION.md` n'existe pas (le dossier de phase 11 ne contient que `11-CONTEXT.md` et `11-SPIKE.md`). Les exigences DSN ont donc été vérifiées directement. Les claims de `12-VERIFICATION.md` ont été refaits : navigation (5 entrées, `aria-current`), 0 cible < 44 px dans le shell à 390/768/1024/1440, 0 débordement horizontal, étiquette 12 px (mobile) et 16 px (1024), ancre « Exceptions », Échap du menu du compte : CONFIRMÉS.

## Gate

| Contrôle | Résultat |
|---|---|
| `next build` | OK |
| `tsc --noEmit` | OK, 0 erreur |
| `npm run lint` | 0 erreur, 3 avertissements (hors périmètre : `generate-review-print.mjs`, `[locale]/page.tsx`, `announcement/page.tsx`) |
| `npx vitest run` | 1781 pass / 1 skip quand il passe, MAIS INSTABLE : 5 exécutions complètes sur 9 ont échoué (voir F-03) |

## Verdict par exigence

| Exigence | Verdict | Remarque |
|---|---|---|
| DSN-01 spike | VERIFIED | `11-SPIKE.md` : verdict Base UI, build React Compiler sans avertissement, focus restitué. La course de focus du F-01 n'avait pas été sondée (frappes espacées). |
| DSN-02 tokens `--adm-*` | PARTIAL | Corps clair, Inter, `tabular-nums`, focus propre : OK dans `.adm-root` et `.adm-portal`. Fuites résiduelles : barre de défilement de la fenêtre (F-05), `scroll-behavior: smooth` de `html`. |
| DSN-03 primitives | VERIFIED | Button, Field, Input, Card, Badge, DataTable, PageHeader, ConfirmDialog, Toast présents, contrastes AA OK. Réserves F-09, F-11, F-12. |
| DSN-04 états | VERIFIED | LoadingState / EmptyState / ErrorState communs. Réserve : `h3` sans `h2` (F-13). |
| DSN-05 useAdminQuery/adminFetch | VERIFIED | Annulation, clé url+tentative, vue dérivée, pas de réponse obsolète affichée, aucun avertissement du compilateur. Réserve : 401 sans lien de reconnexion (F-14). |
| DSN-06 confirm() natifs | PARTIAL | 1 `confirm()` natif reste : `src/app/admin/(app)/hours/page.tsx:147` (cliquet `tests/admin-ui-confirm.test.ts`, page prévue en phase 17). Le dialogue lui-même a le défaut F-01. |
| DSN-07 page kit | PARTIAL | Page présente et lisible aux 4 largeurs, mais `<main>` imbriqué (F-07). |
| NAV-01 shell `(app)` | VERIFIED | Layout garde + `AdminRoot` + `AdminShell`. `notFound()` cohérent avec le middleware (voir « Garde admin »). |
| NAV-02 barre/rail/barre latérale | PARTIAL | Mises en page confirmées. Échec WCAG 2.4.11 sur téléphone (F-02). |
| NAV-03 `nav.ts` source unique | VERIFIED | Le test unique est instable seulement par délai (F-03). |
| NAV-04 URL conservées + test de liens | VERIFIED | Lien actif correct sur sous-routes, query et ancres (tableau plus bas). |
| NAV-05 login/signup hors shell | VERIFIED | Hors du groupe `(app)`, test `admin-route-group`. |

## Findings

Format : `SEV | fichier:ligne | problème | correctif`.

### Critique

Aucune.

### Haute

**F-01** HAUTE | `src/components/admin/ConfirmDialog.tsx:44-61` | CONFIRME (défaut signalé par P16). Le piège de focus de Base UI laisse échapper le focus quand les Tab arrivent plus vite qu'une image (rafale, répétition rapide, clavier virtuel). Séquence mesurée : dernier bouton, puis garde de focus `SPAN[data-base-ui-focus-guard]`, puis `BODY`, puis `A.adm-skip` (« Aller au contenu »), puis `A.adm-nav-link` (« Aujourd'hui ») : le focus atteint le lien d'évitement et la navigation DERRIÈRE le voile. Cause : Base UI pose seulement `aria-hidden="true"` sur `.adm-root` (constaté : `aria-hidden=true`, `inert=false`), les liens restent focalisables. Mesure (3 passes x 10 Tab, dialogue ouvert) : écart entre Tab 0 ms : 18/30 arrêts hors dialogue (dont 4 sur le lien d'évitement et 4 sur la navigation à 390 px) ; 1024 px : 13/30 (1 sur le lien d'évitement) ; écart >= 20 ms : 0/120. Pas de reproduction avec des frappes espacées (le spike et `12-VERIFICATION` n'avaient donc rien vu). Même résultat sur les deux dialogues du kit et avec un toast présent. | Rendre le reste de la page inerte pendant que le dialogue est ouvert. Dans `ConfirmDialog`, effet `useEffect(() => { const el = document.querySelector('.adm-app'); if (!el || !open) return; el.setAttribute('inert', ''); return () => el.removeAttribute('inert') }, [open])` (idem pour `Sheet.tsx` du menu). VÉRIFIÉ en navigateur par injection de `inert` sur `.adm-app` : 48 Tab/Shift+Tab en rafale à 390 et 1024 px, 0 arrêt sur lien d'évitement, navigation ou en-tête ; focus bien restitué au déclencheur (4/4 par largeur). Retirer `inert` au passage à `open=false` est sans risque (la restitution du focus de Base UI a lieu après la sortie).

**F-02** HAUTE | `src/app/admin/admin.css:~96` (aucun `scroll-padding`) et `.adm-nav` (ligne ~392, barre fixe) | Échec WCAG 2.2 SC 2.4.11 (focus non masqué) sur téléphone. Au clavier à 390 px, 6 arrêts de focus sur 11 (premiers échantillons) sont masqués par la barre du bas fixe de 65 px (« Enregistrement… », « Mise à jour… », « Essayer », champs de saisie à y = 738-756 px sous une barre qui commence à 735 px). À 768 et 1024 px : 0 arrêt masqué. `scroll-padding` mesuré : `auto/auto`. L'en-tête collant de 60 px expose le même risque en Maj+Tab. | Ajouter dans `admin.css` : `html:has(.adm-root) { scroll-padding-top: calc(var(--adm-header-h) + 8px); } @media (max-width: 767.98px) { html:has(.adm-root) { scroll-padding-bottom: calc(var(--adm-bottombar-h) + 16px + env(safe-area-inset-bottom, 0px)); } }`. Le défaut touchera toutes les pages migrées (phases 13 à 16).

### Moyenne

**F-03** MOYENNE | `vitest.config.ts:10-13` | Le gate `npm run build` (qui lance `vitest run`) est instable : 5 exécutions complètes sur 9 ont échoué avec `Test timed out in 5000ms` (imports dynamiques à froid), à chaque fois sur des fichiers différents (`admin-nav-single-source`, `admin-shell`, `kpi-admin-wiring`, `admin-component-exemption`). Le commit `a399cdf` a corrigé un seul fichier avec `vi.setConfig`. Les tests passent isolément (3/3). Charge machine élevée pendant l'audit (autres agents), mais Vercel est plus lent qu'un poste de dev. | Ajouter `testTimeout: 30_000` (et `hookTimeout`) dans `test` de `vitest.config.ts`, retirer les `vi.setConfig` locaux.

**F-04** MOYENNE | `src/components/admin/shell/AccountMenu.tsx:61` (+ `:39-40`) | `role="menu"` promet le motif ARIA menu, non respecté : ArrowDown, ArrowUp et Fin ne bougent pas le focus (mesuré : reste sur le premier élément) ; le menu reste ouvert quand Tab sort du menu (focus dans la page, menu toujours affiché) ; Échap alors que le focus est ailleurs vole le focus vers l'avatar. | Soit retirer `role="menu"`/`menuitem` et `aria-haspopup="menu"` (disclosure avec liens et bouton, motif simple et valide), soit implémenter flèches, Fin/Début, fermeture au `focusout` et Échap uniquement si le focus est dans le menu. Préférer la disclosure : 3 entrées.

**F-05** MOYENNE | `src/app/globals.css:83-86` (fuite dans l'admin ; correctif dans `admin.css`) | La barre de défilement de la fenêtre garde le style du site public (piste `--gc-void` sombre, pouce doré, 6 px) : bande sombre visible au bord droit de la page admin (capture `edge.png`). Les règles `.adm-root *::-webkit-scrollbar` ne visent pas la fenêtre. | Dans `admin.css` : `html:has(.adm-root)::-webkit-scrollbar { width: auto; height: auto } html:has(.adm-root)::-webkit-scrollbar-track { background: initial } html:has(.adm-root)::-webkit-scrollbar-thumb { background: initial }` ou, mieux, borner les règles de `globals.css` au site public.

**F-06** MOYENNE | `src/app/admin/admin.css:253-254` (DataTable < 768 px) | `display: block` sur `table`, `tbody`, `tr`, `td` et en-tête rendu hors écran : sous 768 px les rôles de tableau sont perdus par certains lecteurs d'écran (Safari/VoiceOver notamment) et les en-têtes ne sont plus associés aux cellules (le libellé ne vient que du `::before` CSS). Non vérifié avec un vrai lecteur d'écran (HUMAN_NEEDED). | Ajouter `role="table"`, `role="row"`, `role="cell"` / `columnheader` explicites dans `DataTable.tsx`, ou garder `display: grid` sur les lignes avec rôles ARIA.

**F-07** MOYENNE | `src/app/admin/(app)/kit/KitClient.tsx:112` | `<main className="adm-kit">` à l'intérieur de `<main id="adm-main">` du shell : deux landmarks `main` imbriqués (2 `<main` mesurés dans le DOM). Le test `admin-route-group` ne contrôle que `page.tsx`, pas `KitClient`. | Remplacer par `<div className="adm-kit">` et étendre le test à tout `src/app/admin/(app)/**` (et `components/admin/**` pour `<main`).

### Basse (13)

- **F-08** BASSE | `src/components/admin/ConfirmDialog.tsx:52` | `AlertDialog.Description` rend un `<p>` : le kit y passe un `<p>` (`KitClient.tsx:100`) et P16 une `<dl>` (`KpiPanel.tsx:183`) : HTML invalide (p dans p, dl dans p). Correctif : `render={<div />}` quand la description n'est pas une chaîne.
- **F-09** BASSE | `src/app/admin/admin.css:175-177` | Cibles 36 px (bouton `sm`, icône `sm`, fermeture du toast) avec pointeur fin à partir de 1024 px : 13 cibles < 44 px mesurées dans le kit à 1024 et 1440 px. Conforme WCAG 2.5.8 (24 px) et au contrat D1, mais contraire à l'objectif « cibles 44 px ». À acter ou à retirer.
- **F-10** BASSE | `src/app/admin/admin.css` (`.adm-btn--primary:disabled`, `.adm-btn:disabled`) | États désactivés : blanc sur `#8EA196` = 2,73:1 et `#6F776F` sur `#F1ECE0` = 3,92:1. Exempts de WCAG 1.4.3, mais le bouton primaire désactivé est à peine lisible. Assombrir à `#6F8578` (>= 3,5:1) si le libellé doit se lire.
- **F-11** BASSE | `src/components/admin/Field.tsx:40` | `role="alert"` plus `aria-describedby` sur le même message : double lecture, et rafale d'annonces assertives quand plusieurs champs échouent ensemble. Garder `aria-describedby` seul et annoncer un résumé unique.
- **F-12** BASSE | `src/components/admin/Button.tsx` | Le mode `loading` ne fait pas annoncer le changement de libellé (pas de région `aria-live`) ; il ne pose pas `disabled`, donc le bouton reste tabulable (voulu). Documenter ou annoncer via le toast.
- **F-13** BASSE | `src/components/admin/states.tsx:32,59` | EmptyState et ErrorState rendent toujours un `h3` : saut de niveau h1 vers h3 sur toute page migrée. Prop `as` ou `h2`.
- **F-14** BASSE | `src/components/admin/admin-fetch.ts:32,84` | 401 : message « Session expirée. Reconnectez-vous. » sans lien ni redirection ; le bouton « Réessayer » ne peut pas aboutir. Afficher un lien vers `/admin/login`.
- **F-15** BASSE | `src/app/admin/(app)/layout.tsx:25` | `redirect('/admin/login')` sans `?redirect=` (le middleware, lui, le pose). `notFound()` si le RPC échoue ponctuellement : un vrai admin voit un 404 sans nouvelle tentative. Passer `?redirect` ; accepté pour le 404 (cas rare).
- **F-16** BASSE | `src/components/admin/shell/use-location-hash.ts:9-25` | Patch global et permanent de `history.pushState/replaceState` (jamais restauré, un seul patch par module) ; correct mais intrusif. Préférer l'événement de navigation de Next si disponible.
- **F-17** BASSE | `src/app/admin/admin.css:~400` | Barre du bas : `li { display: contents }` retire la sémantique de liste dans certains navigateurs (Safari). Acceptable ; ajouter `role="list"` sur le `ul` si besoin.
- **F-18** BASSE | `src/components/admin/shell/MainNav.tsx` (ordre du DOM) | La navigation fixe en bas est en tête du DOM : l'ordre de tabulation (navigation avant le contenu) ne suit pas l'ordre visuel sur téléphone. Le lien d'évitement compense. Acceptable.
- **F-19** BASSE | `tests/admin-shell.test.ts:206-238`, `tests/admin-ui-tokens.test.ts:34-58` | Tests qui lisent `admin.css` avec des regex sur le formatage exact (`\.adm-col \{ margin-left: ...`, règle sur une ligne) : cassent si le CSS est reformaté, pas à cause de CRLF (`admin-shell` normalise `\r\n`, les autres utilisent `\s`). Passe sur le checkout CRLF de la machine ; non rejoué en LF (pas de modification du dépôt). Prévoir un parseur CSS ou des assertions sur le rendu.
- **F-20** BASSE | `src/components/admin/Toast.tsx:38-45`, `admin.css` | Toast : 4 visibles (`limit=4`) mais 6 présents dans le DOM, les 2 surnuméraires à `opacity: 0` gardent leur bouton de fermeture tabulable (6 boutons « Fermer » comptés). Succès 5 s (mesuré 5,5 s), erreur persistante (`alertdialog`, toujours là après 6,8 s), région `aria-live="polite"` étiquetée « Notifications », F6 la focalise (OK), 44 px en mobile / 36 px en desktop. Ajouter `visibility: hidden` sur `[data-limited]`.

### Réussites vérifiées (sondes propres)

- **Contrastes AA** (script sur les jetons, 40 paires) : tous >= 4,5:1 pour le texte (le plus bas : `muted` sur `tint` 4,70, `muted` sur `surface-2` 4,74), badges ok/warn/danger/info/neutre 5,05 à 6,13, bouton danger blanc 6,57, anneau de focus 9,99 à 11,89 sur tous les fonds, bordure de champ 3,43 à 3,76 (3:1 non-texte). Seuls échecs : états désactivés (F-10).
- **Fuite du site public dans les portails** : dialogue et toast portent `.adm-portal` ; police Inter, `rgb(27,42,34)` sur blanc, fond `rgb(247,244,236)` mesurés (le `body` reste Cormorant/sombre mais est masqué par `body:has(.adm-root)`). Focus global doré écrasé par `.adm-root/.adm-portal`. Fuites restantes : F-05 et `html { scroll-behavior: smooth }` (neutralisé par `prefers-reduced-motion` global).
- **ConfirmDialog** : `role="alertdialog"`, titre et description reliés, focus initial sur l'action non destructrice, Échap ferme (résultat « Garder »), clic sur le fond ferme, focus rendu au déclencheur après Échap, fond et confirmation (4/4), 44 px à 390 et 1024 px, feuille ancrée en bas sous 768 px. Une seule faille : F-01.
- **Navigation clavier** : tous les arrêts de Tab du shell atteignables, anneau 2 px visible, Échap du menu du compte rend le focus à l'avatar, lien d'évitement présent et visible au focus.
- **Lien actif** (1024 px, par `pushState`) : `/admin` seul actif sur lui-même ; `/admin/reservations` et `?nouvelle=1` : Réservations ; `/admin/menu/abc` : Carte ; `/admin/hours`, `#exceptions`, `/admin/announcement`, `/admin/settings` : Site public (`aria-current=true`) avec la sous-entrée exacte (Horaires, Exceptions, Annonces, Capacité) ; `/admin/avis`, `/admin/kpi` : Réputation + sous-entrée ; `/admin/hours-old` : aucune entrée (pas de faux positif de préfixe). Onglets de section présents sous 1024 px, absents pour Réputation (segments dans la page).
- **Garde admin du layout** : middleware déconnecte un non-membre et redirige vers `/admin/login?error=` ; le layout `(app)` fait `notFound()` seulement si le RPC échoue ou répond faux après le middleware (course ou erreur passagère) : jamais de redirection vers la connexion, donc pas de boucle (la connexion renvoie un compte connecté vers `/admin`). Pas de fuite d'existence : un visiteur anonyme est redirigé vers la connexion pour tout `/admin/*`, existant ou non. Non rejoué avec un vrai compte non membre (aucun service réel).
- **React Compiler / hooks** : build sans avertissement, lint 0 erreur. `useAdminQuery` : un seul effet, `dispatch` asynchrone, annulation par `AbortController`, clé `url#tentative` (courses et réponses tardives ignorées), vue dérivée sans donnée périmée entre deux URL ; `ConfirmProvider` : une demande en cours est abandonnée (`false`), un seul résolveur dans un `ref` modifié hors rendu. Aucun overflow horizontal aux 5 largeurs.
- **Poids** : shell + kit = environ 1010 Ko bruts / 319 Ko gzip de JS contre 800 / 249 pour `/admin/login` (le socle React/Next/Sentry domine) ; soit environ +210 Ko / +70 Ko pour Base UI, lucide et le shell. Conforme au spike (+55 Ko transférés). Aucune police préchargée en excès. Le site public n'importe jamais `@/components/admin` (test `admin-component-exemption`).
- Console du navigateur : 0 erreur, 0 avertissement pendant dialogues, toasts, menu et navigation.

## Anciens jetons restants dans `src/app/admin` (liste pour la phase 17)

Aucun ancien jeton (`var(--primary)`, `--warm-*`, `--jungle-*`, `--gc-*`) dans `admin.css` ni `src/components/admin/**` (test `admin-ui-tokens` OK). Pages non encore migrées, qui utilisent encore les classes Tailwind du site public (`bg-gc-*`, `text-gc-*`, `bg-(--…)`) :

| Fichier | Lignes concernées | Particularités |
|---|---|---|
| `src/app/admin/(app)/hours/page.tsx` | 26 | `confirm()` natif ligne 147 (DSN-06), ni `useAdminQuery` ni `adminFetch` |
| `src/app/admin/(app)/announcement/page.tsx` | 16 | variable `announcement` inutilisée (lint ligne 18) |
| `src/app/admin/(app)/settings/page.tsx` | 8 | ni `useAdminQuery` ni `adminFetch` |
| `src/app/admin/login/page.tsx` | 10 | hors shell par conception (NAV-05) |
| `src/app/admin/signup/page.tsx` | 6 | hors shell par conception (NAV-05) |

Autres cibles < 44 px déjà relevées par P12 : « + Ajouter » (horaires, 40 px) : page à migrer.

## Reste à faire côté humain

- HUMAN_NEEDED : lecteur d'écran réel (NVDA/VoiceOver) pour la table en cartes (F-06), les annonces du toast et le menu du compte ; appareil tactile réel pour les cibles et la barre du bas (marge de sécurité de l'encoche).
- HUMAN_NEEDED : session réelle non membre, pour confirmer `notFound()` face au middleware.
