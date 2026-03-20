# Gecko Cabane — Claude Instructions

## Projet

Site web du restaurant **Gecko Cabane**, un restaurant Franco-Thaï gastronomique situé à Krabi, Thaïlande.  
Stack : **Next.js 16** (App Router) · **TypeScript** · **Tailwind CSS v4** · **Supabase** (PostgreSQL + Auth) · **next-intl** (i18n).

---

## Architecture

```
src/
  app/
    [locale]/          # Pages publiques (fr | en)
    admin/             # Interface d'administration (non localisée)
    api/               # Route Handlers Next.js (REST)
    auth/callback/     # Callback OAuth Supabase
  components/          # Composants réutilisables (client/server)
  i18n/                # Config next-intl
  types/database.ts    # Types TypeScript partagés
  utils/supabase/      # Clients Supabase (server, client, middleware)
  middleware.ts        # Auth Supabase + routing i18n
messages/
  fr.json              # Traductions françaises (locale par défaut)
  en.json              # Traductions anglaises
supabase/migrations/   # Migrations SQL (Supabase CLI)
```

## Commandes

```bash
npm run dev     # Serveur de développement (localhost:3000)
npm run build   # Build de production
npm run lint    # ESLint
```

---

## Règles de développement

### Internationalisation (i18n)
- La locale par défaut est **`fr`**. Les deux locales supportées sont `fr` et `en`.
- Toute chaîne de texte visible dans `src/app/[locale]/` **doit** passer par `useTranslations()` (client) ou `getTranslations()` (server).
- Ajouter systématiquement la clé dans **les deux** fichiers `messages/fr.json` et `messages/en.json`.
- Les pages admin (`src/app/admin/`) sont en français fixe, sans i18n.

### Supabase
- Utiliser `createServerClient` (depuis `src/utils/supabase/server.ts`) dans les Server Components et Route Handlers.
- Utiliser `createBrowserClient` (depuis `src/utils/supabase/client.ts`) dans les Client Components.
- Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client.
- Les variables d'environnement requises : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Les migrations SQL se trouvent dans `supabase/migrations/` (numérotées séquentiellement).

### Tailwind CSS v4
- Le projet utilise Tailwind v4. Les classes arbitraires avec variables CSS s'écrivent `bg-(--var-name)` ou `text-primary` (via `@theme inline` dans `globals.css`), **pas** `bg-[var(--var-name)]`.
- Les variables CSS du thème sont définies dans `src/app/globals.css` (`:root` + `@theme inline`).
- Variables disponibles : `--primary`, `--primary-dark`, `--accent`, `--accent-light`, `--warm-white`, `--warm-gray`, `--warm-gold`, `--jungle-dark`, `--bamboo`, `--tropical`, `--leaf-green`, `--moss`.

### Composants
- Les composants qui utilisent des hooks React (`useState`, `useEffect`, etc.) ou des événements doivent commencer par `'use client'`.
- Les Server Components sont privilégiés pour les fetches de données initiales.
- Ne pas ajouter de logique métier dans les composants UI — la garder dans les Route Handlers ou les utilitaires.

### API Routes
- Toutes les routes API sont dans `src/app/api/`.
- Valider systématiquement les entrées utilisateur (types, longueurs, formats) avant tout traitement.
- Retourner des erreurs structurées : `{ error: string }` avec le bon code HTTP.
- Ne jamais retourner de stack traces en production.

### Types
- Tous les types de base de données sont centralisés dans `src/types/database.ts`.
- Toujours typer les réponses API avec `ApiResponse<T>`.

---

## Modèle de données (Supabase / PostgreSQL)

| Table | Description |
|-------|-------------|
| `opening_hours` | Horaires par jour de la semaine (0=Dimanche) |
| `special_hours` | Horaires exceptionnels par date |
| `announcements` | Bannières d'annonce (avec plages de dates) |
| `menu_pages` | Pages de menu (ex: Déjeuner, Dîner) |
| `menu_categories` | Catégories au sein d'une page |
| `menu_items` | Plats avec prix, allergènes, drapeau végétarien/épicé |
| `reservations` | Réservations clients avec statut workflow |

Statuts de réservation : `pending` → `confirmed` → `completed` / `cancelled` / `no_show`.

---

## Contexte métier

- Restaurant à **Krabi Town**, Thaïlande (Maharat Road).
- **Chef Jariya** — cuisine Franco-Thaï gastronomique.
- **40 couverts maximum**. Fermé le mardi. Cuisine jusqu'à 22h.
- Tél : `+66 81 958 5945`.
- Droit applicable : lois thaïlandaises (DBD, PDPA B.E. 2562, Excise Act B.E. 2560).
- Créé par [selenium-studio.com](https://selenium-studio.com) & [anatholy-bricon.com](https://anatholy-bricon.com).
