# Phase 11 : Fondation du système de design, CONTEXT

Date : 2026-10-31. Branche : `phase/11-design-foundation` (depuis `milestone/v1.1`). Exigences : DSN-01 à DSN-07.
Références : `11-SPIKE.md` (verdict Base UI), `.planning/design-v1.1/d1-system-shell/` (contrat D1, `tokens.css`, `kit.css`, `kit.html`), `09-BRIEF-DESIGN.md`, `09-TEST-IMPACT.md`.
Les maquettes D1 sont en cours de validation par le propriétaire : le contrat est implémenté tel quel, les retouches visuelles viendront en suivi (elles ne touchent que `admin.css`).

## Décisions

- **D-01 (DSN-01)** : adopter `@base-ui/react@^1.9.0` (jamais `@base-ui-components/react`). Imports par sous-chemin (`@base-ui/react/alert-dialog`, `/toast`). Tout fichier qui les utilise commence par `'use client'`.
- **D-02 (DSN-02)** : une feuille dédiée `src/app/admin/admin.css`, importée par `src/app/admin/layout.tsx`. Les jetons `--adm-*` sont définis sur `.adm-root, .adm-portal` (piège n°1 du spike : les portails sortent de `.adm-root`). Les portails reçoivent `className="adm-portal"`. Le layout admin N'enveloppe PAS les pages existantes : elles gardent leur apparence jusqu'aux phases 12 à 16. Le composant `AdminRoot` (serveur) pose `.adm-root` ; la phase 12 l'utilisera dans le shell.
- **D-03 (DSN-02)** : neutralisation du site public : `.adm-root` et `.adm-portal` redéfinissent fond, couleur, police, `color-scheme: light`, focus visible (2 px vert), scrollbar. Le fond du `body` est ivoire quand une page contient `.adm-root` (`body:has(.adm-root)`) pour éviter le fond sombre en surscroll. `isolation: isolate` sur `.adm-root` (piège n°3).
- **D-04 (DSN-02)** : Inter via `next/font/google` (`--font-adm-sans`, latin + latin-ext) chargée uniquement par le code admin (`src/components/admin/font.ts`) ; Cormorant Garamond réutilise `--font-cormorant` du layout racine, uniquement pour `PageHeader`. `tabular-nums` sur `.adm-root`. Le portail porte aussi la classe de la variable Inter (prop `portalClass` d'`AdminRoot`).
- **D-05 (DSN-03)** : CSS en classes `adm-*` écrites à la main dans `admin.css`, portées de `kit.css` (1:1 avec la maquette). Pas de classes Tailwind arbitraires : plus fidèle, plus facile à retoucher. Le shell (navigation, en-tête, accueil) est hors phase (phase 12).
- **D-06 (DSN-03)** : `Select` = `<select>` natif stylé (contrat D1 : date/heure natives, champs 44 px, pas de listbox personnalisée). Base UI ne sert que pour le dialogue de confirmation et le toast (là où le comportement accessible fait la différence). Le Select Base UI reste disponible si un besoin futur le justifie.
- **D-07 (DSN-03)** : `Input`, `Select`, `Textarea` portent eux-mêmes `label`, `hint`, `error`, `optional` (via `Field`) et câblent `aria-describedby` / `aria-invalid`. `Field` reste exporté pour les contrôles personnalisés. Les icônes de bouton seul exigent `aria-label` (union de types).
- **D-08 (DSN-03)** : `ConfirmDialog` (AlertDialog Base UI, `role="alertdialog"`, focus initial sur l'action non destructrice, focus rendu au déclencheur, Échap et clic sur le fond ferment) + `ConfirmProvider` / `useConfirm()` qui renvoie `Promise<boolean>` : `if (!(await confirm({...}))) return` remplace `if (!confirm(...)) return` ligne pour ligne (migration des phases 13 à 16).
- **D-09 (DSN-03)** : `ToastProvider` / `useToast()` : `success` (priorité basse, 5 s, `polite`) et `error` (priorité haute, reste jusqu'à fermeture, `role="alert"`). CSS officielle de l'empilement (piège n°4), viewport décalable par `--adm-toast-offset` (la barre du bas du shell, phase 12).
- **D-10 (DSN-04)** : `LoadingState`, `EmptyState`, `ErrorState` communs ; `describeError()` traduit une erreur de `adminFetch` en texte.
- **D-11 (DSN-05)** : `adminFetch<T>` (JSON, `{ error: string }` → `AdminFetchError` avec `status`, réseau coupé = statut 0, `AbortError` relancé tel quel). `useAdminQuery<T>(url)` = `useReducer` + un seul `useEffect` qui appelle `startAdminQuery(url, dispatch)` (fonction pure testable, renvoie l'annulation). Pas de setState synchrone dans l'effet, pas de ref lue au rendu : compatible React Compiler. L'état affiché est dérivé (`deriveQueryView`) : changement d'URL = `loading` sans donnée périmée ; `refetch` = `loading` en conservant les données.
- **D-12 (DSN-06)** : les cinq `confirm(` natifs restent dans les pages (phases 13 à 16). Un test de cliquet les inventorie : la liste ne peut que diminuer.
- **D-13 (DSN-07)** : page `/admin/kit` (sous la garde admin du middleware, sans lien de navigation, `noindex` hérité). Composant client `KitClient` ; données d'exemple.
- **D-14 (contrainte i18n)** : `tests/i18n-hardcoded.test.ts` exempte `src/components/admin/` (l'admin est en français fixe) via `isAdminComponentPath()`. Un test garantit que l'exemption ne couvre que ce dossier (pas `src/components/admin-x`, pas `src/components/seo`, pas `src/app/[locale]`) et qu'aucun fichier hors `src/app/admin` n'importe `@/components/admin`.
- **D-15 (tests)** : Vitest tourne en `node`, sans DOM. Rendu statique par `renderToStaticMarkup` (balisage, ARIA), logique pure testée directement, annulation testée sur `startAdminQuery` avec un `fetch` factice. Aucun test ne lit le source, sauf l'inventaire des `confirm(` (cliquet) et l'import interdit.

## Exigence -> test

| Exigence | Test | Preuve navigateur |
|---|---|---|
| DSN-01 | `tests/deps.test.ts` (existant), `tests/admin-ui-deps.test.ts` : `@base-ui/react` déclaré, ancien nom absent | `next build` + compilateur React |
| DSN-02 | `tests/admin-ui-tokens.test.ts` : `admin.css` définit les jetons du contrat sur `.adm-root, .adm-portal`, `tabular-nums`, pas de variable publique | `getComputedStyle` : police Inter, fond ivoire, pas de fuite du fond sombre |
| DSN-03 | `tests/admin-ui-primitives.test.ts` : Button (5 états), Field/Input (ARIA), Card, Badge/StatusBadge (5 statuts icône + libellé), DataTable (caption, `th scope`, `data-label`), PageHeader (un `h1`) | page kit aux 4 largeurs |
| DSN-04 | `tests/admin-ui-primitives.test.ts` : rôles `status` / `alert`, libellé lecteur d'écran | idem |
| DSN-05 | `tests/admin-fetch.test.ts`, `tests/use-admin-query.test.ts` : JSON, erreurs typées, annulation (signal), dérivation d'état, rendu initial du hook | n/a |
| DSN-06 | `tests/admin-ui-confirm.test.ts` : balisage `alertdialog`, inventaire cliquet des `confirm(` | dialogue : Échap, focus piégé puis rendu |
| DSN-07 | `tests/admin-kit.test.ts` : la page kit rend tous les composants et états, aucune entrée de navigation ne pointe vers `/admin/kit` | 4 largeurs : pas de débordement, cibles, texte |
| Contrainte i18n | `tests/i18n-hardcoded.test.ts` + `tests/admin-component-exemption.test.ts` | n/a |
