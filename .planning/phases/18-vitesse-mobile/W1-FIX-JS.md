# W1-FIX-JS : PERF-04, reduction du JavaScript

Branche `fix/w1-js` (base `milestone/v1.2`, fusionnee a nouveau avant rendu). Design, textes et comportement inchanges.

## Methode

Build de production local (Turbopack, `next build` + `next start -p 3108`), mobile 390x844 Chromium, `networkidle`, octets reels des reponses `script` (brut et gzip recalcule). Supabase pointe vers un faux serveur local qui repond `[]` (aucune base ni service reel). Le build en worktree exige `turbopack.root` : mis temporairement, non commite. Sentry (envoi des source maps) desactive pendant les mesures. Chaque mesure avant/apres = meme machine, meme config, meme faux serveur.

## Mesure : d'ou vient le JS de /fr (avant)

| Chunk | Brut | Gzip | Contenu |
|---|---|---|---|
| `ccf1…` | 401 Ko | 125 Ko | runtime Next + React DOM + coeur Sentry |
| `639f…` | 119 Ko | 29 Ko | **libphonenumber-js/min** (formulaire de reservation) |
| `dfb0…` | 119 Ko | 32 Ko | Next client router / React |
| `5c94…` | 54 Ko | 18 Ko | Sentry (tracing, logs) |
| `55df…`, `8f3a…`, `dd1a…`, `f183…` | 41/40/44/40 Ko | 12/13/12/11 Ko | next-intl, composants clients (reservation, contact) |

Experience : `instrumentation-client.ts` vide (hors commit) fait tomber /fr de 850 Ko / 265 Ko gzip a 620 Ko / 191 Ko gzip : **Sentry client coute ~230 Ko brut / ~74 Ko gzip**, soit le premier poste. Les messages next-intl ne sont pas dans un chunk JS mais dans le HTML (flux RSC) : 42 Ko de `fr.json` serialises en entier sur chaque page.

## Changements

1. `NextIntlClientProvider` ne recoit plus que les namespaces lus par des composants clients publics (`src/utils/client-messages.ts`, 14 namespaces, `pickMessages`). `tests/client-messages.test.ts` echoue si un composant client lit un namespace absent de la liste, ou appelle `useTranslations()` sans namespace, ou si un namespace manque dans une des 4 langues.
2. `libphonenumber-js/min` n'est plus dans le chunk initial : `ReservationForm` l'importe dynamiquement a la premiere saisie du telephone (et a l'envoi, avant de construire le numero E.164 : jamais le repli). `isEmailValid` et `phoneCountryForLocale` ont ete deplaces dans `src/utils/form-basics.ts` (re-exportes par `validation.ts`, donc imports existants et tests inchanges) pour que le composant ne tire plus `validation.ts`. Tant que la librairie n'est pas chargee, aucune erreur de format n'est affichee (pas de faux rouge).

## Avant / apres (build, mobile, octets reels)

| Page | Avant brut / gzip | Apres brut / gzip | Gain gzip |
|---|---|---|---|
| /fr scripts | 971 118 / 294 717 | 850 533 / 264 839 | -10,1 % |
| /fr HTML | 219 168 / 45 591 | 188 360 / 36 124 | -20,8 % |
| /fr total (scripts + HTML) | 1 190 286 / 340 308 | 1 038 893 / 300 963 | **-11,6 %** |
| /en scripts | 971 118 / 294 717 | 850 533 / 264 839 | -10,1 % |
| /en HTML | 213 492 / 43 876 | 185 839 / 35 224 | -19,7 % |
| /fr/menu scripts | 984 585 / 300 501 | 864 000 / 270 623 | -9,9 % |
| /fr/menu HTML | 87 348 / 23 652 | 57 190 / 13 834 | -41,5 % |

(Faux serveur de donnees : le menu est vide dans cette mesure, seules les differences comptent.)

Lighthouse mobile local, mediane de 3 (machine chargee, variance forte, TBT +-50 ms, score +-2 points) :

| | Avant | Apres |
|---|---|---|
| /fr score / TBT / LCP / octets | 92 / 338 ms / 1067 ms / 738 Kio | 93 / 311 ms / 918 ms / 673 Kio |
| /en score / TBT / LCP / octets | 92 / 361 ms / 1066 ms / 738 Kio | 92 / 348 ms / 913 ms / 673 Kio |

Le gain d'octets est reel (-9 %) ; le gain de score est dans le bruit. Le LCP baisse de ~150 ms mais, vu la variance machine, a ne pas sur-interpreter.

## Verification de non-regression

- Captures pleine page /fr, /en, /fr/menu en iPhone 14 et 1440 px, avant/apres : **0 pixel de difference** (pixelmatch) sur les 6 captures, contre deux captures de reference.
- Interactions (iPhone 14 et 1440, 0 erreur console/page, aucun envoi reel) : formulaire de reservation visible ; saisie de telephone declenche le chargement differe (3 a 4 chunks) puis `aria-invalid` passe correctement a `false` (numero FR valide) puis `true` (« 12 ») ; FloatingContact present (lien WhatsApp) ; selecteur de langue : 3 liens ; popup newsletter s'ouvre (mobile : timer/scroll ; bureau : intention de sortie simulee) avec son texte francais, rien soumis.

## Non reductible / non fait, et pourquoi

- **Sentry client (~74 Ko gzip)** : c'est le plus gros poste restant. Le retirer du chemin critique (init differe apres `load`/inactivite avec file d'attente des erreurs precoces) fait perdre la transaction de chargement de page et les erreurs/breadcrumbs avant l'init, donc change l'observabilite (traces a 20 %). Decision proprietaire, pas prise ici. Les integrations par defaut du SDK Next ne sont pas desactivees pour la meme raison.
- **Runtime Next + React DOM (~190 Ko gzip cumules)** : incompressible.
- **Polyfills (14 Ko)** : non retente (un `browserslist` moderne a deja ete teste sans effet) ; Lighthouse ne signale plus de JS legacy.
- **`ReservationForm` (~13 Ko gzip) et `FloatingContact` (~5 Ko)** : les differer sans decalage de mise en page demanderait de reserver une hauteur exacte dans 4 langues x tous gabarits, ou de perdre le rendu serveur ; gain trop petit pour ce risque. `NewsletterPopup` est deja differe.
- Composants clients de l'accueil : tous utilisent des hooks/evenements (effets, fetch, IntersectionObserver), aucun ne peut passer en Server Component sans changer le comportement.
- Le JS inutilise signale par Lighthouse reste ~55 Kio : majoritairement Sentry et le runtime.

## Resultat

Gain total -11,6 % d'octets gzip (scripts + HTML) sur /fr, au-dessus du seuil de 5 %, sans changement visuel ni fonctionnel. PERF-04 est partiellement tenu : le poids de depart est bien reduit, mais la cible « ~60 Ko de JS inutilise » ne l'est pas tant que Sentry reste au chemin critique.
