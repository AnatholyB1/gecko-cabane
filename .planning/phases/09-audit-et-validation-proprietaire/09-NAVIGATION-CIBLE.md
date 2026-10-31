# Phase 9 : Navigation cible (AUDIT-02)

**Statut :** PROPOSITION, à valider par le propriétaire. Aucun code.
**Principe :** 2 niveaux au plus, 5 entrées de premier niveau, **aucune URL existante ne change** (sauf `/admin/tables` et `/admin/signup`, supprimées). Les pages gardent leur URL et deviennent des sections (niveau 2) de leur entrée.

## 1. Arbre cible

```
Aujourd'hui          /admin                       (accueil du service du jour)
Réservations         /admin/reservations          (liste dense, date, recherche) + bouton global « + Réservation »
Carte                /admin/menu                  (pages en onglets)
                       └ /admin/menu/[pageId]     (onglet d'une page ; URL conservée)
Site public          /admin/hours                 > Horaires (dont horaires exceptionnels)
                     /admin/announcement          > Annonces
                     /admin/settings              > Capacité (couverts max, durée d'occupation d'un créneau)
Réputation           /admin/avis                  > Avis (clics, modèles WhatsApp)
                     /admin/kpi                   > KPI (rapport hebdomadaire)
─ hors navigation ─
Connexion            /admin/login                 (sans shell)
```

Compte, déconnexion et « Voir le site public » : dans l'en-tête du shell (téléphone : tiroir ou menu du compte), jamais dans la barre de navigation principale. Un **seul** formulaire de déconnexion (`logoutAction`), au lieu des trois formulaires `/api/auth/logout` actuels.

Niveau 1 = barre de navigation ; niveau 2 = onglets en tête de page (Horaires | Annonces | Capacité ; Avis | KPI ; pages de carte). Pas de menu à 3 niveaux, pas de sous-menu déroulant.

## 2. Comportement par taille d'écran (cadre pour la phase 12)

| Écran | Navigation | Niveau 2 |
|-------|-----------|----------|
| Téléphone (cheffe), < 768 px | barre du bas à 5 entrées, icône + libellé, 44 px minimum | onglets défilants en haut de page |
| Tablette (serveurs), 768-1023 px | rail d'icônes à gauche avec libellés courts | onglets en haut de page |
| Ordinateur (développeur, propriétaire), ≥ 1024 px | barre latérale avec libellés | onglets en haut de page |

Action globale « + Réservation » : bouton flottant sur téléphone, bouton dans l'en-tête sur tablette / ordinateur ; ouvre la saisie manuelle (`POST /api/reservations/manual`) depuis n'importe quelle page. Lien actif visible par le texte et la forme, pas par la couleur seule.

Les 5 entrées viennent d'**un seul fichier** `nav.ts` (NAV-03) : barre du bas, rail, barre latérale et éventuelle recherche lisent la même liste. C'est la correction de la cause du lien mort actuel vers `/admin/tables` (doublon des cartes d'accueil et des actions rapides).

## 3. Table de correspondance anciennes URL vers nouvelles

| Ancienne URL | Nouvelle entrée de navigation | URL après refonte | Action |
|--------------|-------------------------------|-------------------|--------|
| `/admin` | Aujourd'hui | `/admin` | **conservée** (contenu remplacé) |
| `/admin/reservations` | Réservations | `/admin/reservations` | **conservée** |
| `/admin/tables` | (supprimée) | 404, ou redirection vers `/admin/reservations` (décision 5.5 de l'audit) | supprimée en phase 10 |
| `/admin/menu` | Carte | `/admin/menu` | **conservée** (liste fusionnée avec le détail) |
| `/admin/menu/[pageId]` | Carte, onglet | `/admin/menu/[pageId]` | **conservée** (renvoie au même écran avec l'onglet sélectionné) |
| `/admin/hours` | Site public > Horaires | `/admin/hours` | **conservée** |
| `/admin/announcement` | Site public > Annonces | `/admin/announcement` | **conservée** |
| `/admin/settings` | Site public > Capacité | `/admin/settings` | **conservée** |
| `/admin/avis` | Réputation > Avis | `/admin/avis` | **conservée** |
| `/admin/kpi` | Réputation > KPI | `/admin/kpi` | **conservée, impérativement** |
| `/admin/login` | hors navigation | `/admin/login` | **conservée** |
| `/admin/signup` | hors navigation | redirection vers `/admin/login` | supprimée en phase 17 (ACC-02) |
| `/auth/callback` | hors navigation | `/auth/callback` | conservée (valider `next`, voir audit 2.12) |

### URL à conserver, et pourquoi

- `/admin/kpi` : URL écrite en dur dans l'email du rapport hebdomadaire (`ADMIN_KPI_URL` dans `src/app/api/cron/weekly-kpi/route.ts`), dans l'alerte d'avis (`adminUrl` dans `src/app/api/kpi/route.ts`) et dans les tests `kpi-manual` et `kpi-report-email`. Toute modification casse des emails déjà envoyés.
- `/admin`, `/admin/login` : redirections de `src/middleware.ts` (`loginUrl`, redirection d'un utilisateur connecté vers `/admin`), `loginAction`, `logoutAction`, `/api/auth/logout`, `/auth/callback` (`next` par défaut). `robots.ts` interdit `/admin`.
- `/admin/reservations`, `/admin/avis` : cités dans la documentation d'exploitation (`.planning/DEPLOY-CHECKLIST-v1.0.md`) et susceptibles d'être en favori sur les téléphones de la cheffe et des serveurs.
- Les autres URL n'ont aucune raison de changer : elles n'ont **aucune valeur de refactoring** et leur déplacement multiplie les risques (tests qui lisent le source, favoris).

### Route group `admin/(app)`

Le shell est monté par un route group `src/app/admin/(app)/layout.tsx` ; les pages conservées y sont déplacées par `git mv`. Les parenthèses n'apparaissent pas dans l'URL : **les URL ci-dessus restent identiques**. Restent hors du groupe : `src/app/admin/layout.tsx` (métadonnées `robots: noindex`, lu par `tests/seo-pages.test.ts`), `login/`, `signup/` jusqu'à sa suppression, `actions.ts`. Détail des tests concernés : `09-TEST-IMPACT.md`.

## 4. Garde-fous attendus en phase 12

1. Un test de liens énumère les URL de `nav.ts` et vérifie que chaque `href` interne pointe vers un `page.tsx` existant (NAV-04).
2. Un test négatif échoue si `src/app/admin/tables` ou `src/app/api/tables` réapparaît (TAB-06).
3. Le test `kpi-admin-wiring` (qui compte les `href="/admin/kpi"` de l'ancienne page d'accueil) est remplacé par un test qui lit `nav.ts`.
4. Aucune entrée de navigation ne mène à une 404, y compris pendant la période de transition (chaque PR garde la navigation cohérente avec les pages existantes).

## 5. Décisions attendues

- Valider les **5 entrées** (Aujourd'hui, Réservations, Carte, Site public, Réputation) et leur ordre.
- Valider que les **URL restent inchangées** (sauf tables et signup).
- Choisir 404 franche ou redirection pour `/admin/tables`.
