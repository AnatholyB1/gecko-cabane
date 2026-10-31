# 12-REVIEW-FIXES : correctifs des findings d'audit P11 et P12

Branche `fix/p11-p12-audit` (depuis `milestone/v1.1` au merge `28fab0a`). Rapport source : `12-AUDIT.md`.

| Finding | Disposition | Commit |
|---|---|---|
| F-01 HAUTE focus qui s'échappe du dialogue | CORRIGÉ. `inert` posé sur `.adm-app` (conteneur du shell, pas le portail) tant que le dialogue est ouvert, via `useInertApp(open)` ; retiré par le nettoyage de l'effet (fermeture, démontage, navigation) ; ne retire jamais un `inert` posé par un tiers. Preuve navigateur ci-dessous. | `abf2ad9` |
| F-02 HAUTE focus masqué (2.4.11) | CORRIGÉ. `scroll-padding-top` (en-tête 60 + 8) et, sous 768 px, `scroll-padding-bottom` (barre 64 + 16 + zone sûre) sur `html:has(.adm-root)`. Mesure : 11 premiers arrêts du kit à 390 px, masqués avant 3/11, après 0/11. | `66b9109` |
| F-04 MOYENNE menu du compte | CORRIGÉ. Disclosure simple : plus de `role="menu"`, `menuitem`, `aria-haspopup` ; plus de focus automatique ; ferme sur Échap (rend le focus à l'avatar seulement s'il était dans le menu), sur sortie du focus (`relatedTarget` hors du menu) et au clic extérieur. | `66b9109` |
| F-05 MOYENNE barre de défilement | CORRIGÉ dans `admin.css` seulement : `html:has(.adm-root)` : `color-scheme: light`, pistes et pouce `initial`. `globals.css` non modifié, `/fr` inchangé (`:has(.adm-root)` faux, `color-scheme` normal). | `66b9109` |
| F-06 MOYENNE DataTable < 768 px | CORRIGÉ. Rôles explicites `table`, `rowgroup`, `row`, `columnheader`, `cell` : la sémantique survit au `display: block`. | `f2f0475` |
| F-07 MOYENNE `<main>` imbriqué | CORRIGÉ. `KitClient` : `<div className="adm-kit">`. Le test `admin-route-group` couvre désormais tous les `.tsx` de `(app)` ET `components/admin` (seul `AdminShell` peut avoir `<main>`). | `f2f0475` |
| DSN-06 dernier `confirm()` natif | DÉJÀ MIGRÉ en phase 13 (`hours/page.tsx` n'en contient plus) ; grep large de `confirm(` dans `src/app/admin` et `src/components` : 0 appel natif. Cliquet à zéro conservé ; il scanne maintenant aussi `src/components/admin` ; motif étendu à `globalThis.confirm` ; tests ajoutés : faux exemple natif détecté, faux exemple `useConfirm` non détecté, inventaire vide. | `abf2ad9` |
| F-08 `Description` p dans p | CORRIGÉ. Chaîne : `<p>` natif ; contenu riche : `<div>` (mesuré : 0 `p p` / `p dl`). | `abf2ad9` |
| F-10 désactivé primaire 2,73:1 | CORRIGÉ. Fond `#667A6D` + texte blanc = 4,60:1 (AA, bien qu'exempt WCAG 1.4.3) ; texte désactivé secondaire `#5F665F` = 5,0:1. Choix : plus sombre que l'ancien mais encore nettement distinct du primaire actif `#1F3D2F`, `cursor: not-allowed` et absence de relief en plus : l'état ne trompe pas. | `66b9109` |
| F-11 `role="alert"` + `aria-describedby` | CORRIGÉ. `role="alert"` retiré de `Field` ; l'erreur reste annoncée par `aria-describedby`. Les pages migrées annoncent un résumé unique (toast). | `f2f0475` |
| F-14 401 sans reconnexion | CORRIGÉ. `ErrorState` affiche un lien « Se reconnecter » (`/admin/login`) quand l'erreur est une `AdminFetchError` 401. | `f2f0475` |
| F-20 toasts surnuméraires tabulables | CORRIGÉ. `.adm-toast[data-limited] { visibility: hidden }` : mesuré 3 toasts surnuméraires sur 7, `visibility: hidden`, bouton Fermer non focalisable. | `66b9109` |
| F-19 tests CSS fragiles | CORRIGÉ pour `admin-shell` (CSS normalisé en espaces simples, blocs `@media` captés sans `\n`). `admin-ui-tokens` tolérait déjà `\s`. | `66b9109` |

## Non traités (hors périmètre demandé)

F-03 (testTimeout 30 s : déjà en place sur `milestone/v1.1`), F-09 (cibles 36 px en pointeur fin dès 1024 px : choix du contrat D1), F-12, F-13, F-15, F-16, F-17, F-18.

## Preuves navigateur

Chromium headless (Playwright dans `C:\Users\Anatholy\AppData\Local\Temp\gecko-pw-f12`, hors repo), `next build` + `next start -p 3117` depuis une copie hors `.claude`, Supabase factice (`127.0.0.1:9`), route de test temporaire `src/app/monitoring-test` (hors matcher du middleware), supprimée, non commitée. Serveur arrêté par le PID qui écoutait sur 3117.

- F-01 : Tab / Maj+Tab sans pause, 4 répétitions x 12 frappes par largeur : 390 px et 1024 px, 96 Tab, 0 sortie dans `.adm-app` (plus de passage sur le lien d'évitement ni la navigation). Restent des arrêts transitoires sur les gardes de focus de Base UI et `body` (28 sur 96), qui ne sont pas du contenu de l'app. `inert` posé 4/4, retiré après fermeture 4/4, focus rendu au déclencheur 4/4, à chaque largeur.
- F-04 : aucun `role=menu` ; Tab hors du menu le ferme ; Échap avec le focus ailleurs ferme sans déplacer le focus ; Échap dans le menu rend le focus à l'avatar.
- F-06 : arbre d'accessibilité à 390 px : `table`, `rowgroup`, `row`, `columnheader` conservés avec `td` en `display: block`.
- F-07 : 1 seul `<main>` dans la page.

## Limites

- Build : dans le worktree imbriqué (`.claude/worktrees/...`), `next build` échoue sur `next/font/google` (Turbopack, module-not-found sur les CSS de police) ; il passe dans une copie hors `.claude` (node_modules copié, un lien symbolique est refusé par Turbopack).
- Le CSS du kit mesuré en navigateur a été injecté depuis `admin.css` (la route de test, hors `/admin`, n'était pas servie avec la feuille `admin.css` dans le build) : les règles sont donc celles du fichier, mais non servies par le pipeline Next dans cette route.
- F-05 : vérifié par styles calculés (`color-scheme`, `:has(.adm-root)` vrai dans l'admin, faux sur `/fr`) ; la capture du bord droit en Chromium headless ne montre pas de bande sombre dans l'admin, mais l'aspect de la barre réelle (barre classique d'un poste) n'est pas prouvé.
- Lecteur d'écran réel, appareil tactile réel : non prouvés.
