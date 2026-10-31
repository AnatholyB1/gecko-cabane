# Phase 12 : vérification en navigateur

Date : 2026-10-31. `next build` + `next start -p 3107`, variables publiques factices (Supabase sur un port fermé), Chromium headless (Playwright dans `C:\Users\Anatholy\AppData\Local\Temp\gecko-pw-p12`, hors du repo, script `measure.js`).

Méthode : sans session, la garde du middleware redirige vers `/admin/login`. Un crochet temporaire (variable `GECKO_P12_SHELL_TEST=1`, dans `src/middleware.ts` et `src/app/admin/(app)/layout.tsx`) a laissé passer les pages réelles ; il a été retiré avant tout commit (`git checkout --`). Les données API sont absentes (base factice) : les pages montrent leurs états vides ou d'erreur, ce qui ne change pas le shell.

| Mesure | 390 | 768 | 1024 | 1440 |
|---|---|---|---|---|
| Navigation | barre du bas fixe, 390 x 65, `bottom: 0` | rail fixe 88 px | barre latérale 256 px | barre latérale 256 px |
| Entrées / `aria-current` | 5 / 1 par page (+ 1 sous-entrée) | idem | idem | idem |
| Étiquette | 12 px, graisse 600 | 12 px | 16 px | 16 px |
| Débordement horizontal | 0 px (5 pages) | 0 | 0 | 0 |
| Onglets de section (Site public : 4, Réputation : 2) | visibles | visibles | masqués | masqués |
| Sous-navigation latérale | masquée | masquée | visible | visible |
| « + Réservation » | 144 x 44 | 144 x 44 | 144 x 44 | 144 x 44 |
| Cibles du shell < 44 px | 0 | 0 | 0 | 0 |
| Menu du compte : ouvre, 1er élément focalisé, Échap ferme et rend le focus à l'avatar | oui | oui | oui | oui |
| Focus clavier (Tab) | anneau plein 2 px vert sur tous les arrêts | idem | idem | idem |
| Clic « Exceptions » : ancre + entrée active | oui | oui | oui | oui |

Lien actif : pastille pleine `rgb(31,61,47)` sous l'icône (390, 768), fond plein vert + texte blanc pour la page, fond teinté pour la section parente (1024, 1440).

Cibles < 44 px relevées hors shell (pages héritées, réécrites en phases 13 à 16) : « + Ajouter » (horaires, 40 px), « + Nouvelle page » (carte, 40 px).

Non prouvé : comparaison pixel à pixel avec `shell.html` (les rendus PNG de D1 ne sont pas dans le dépôt) ; lecteur d'écran ; appareil tactile réel ; session réelle.
