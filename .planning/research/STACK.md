# Technology Stack: Admin redesign (v1.1)

**Project:** Gecko Cabane, milestone v1.1 "Refonte de l'admin"
**Researched:** 2026-10-31
**Scope:** only NEW capabilities for the admin UI. Next.js 16, React 19 + Compiler, Tailwind v4, Supabase and Vitest are unchanged.

## Verdict

Add **one** runtime dependency (`@base-ui/react`) and **one** tiny helper (`clsx`). Everything else is built in-house on Tailwind v4 or on native HTML. `lucide-react` is already installed. Do NOT adopt the shadcn CLI, a data-table library, a date-picker library or a form library.

## Recommended Stack

### New dependencies
| Technology | Version (npm, verified 2026-10-31) | Purpose | Why |
|---|---|---|---|
| `@base-ui/react` | `^1.9.0` (stable 1.x, peer React 17-19, last published 2026-10-09) | Headless, unstyled primitives: Dialog, AlertDialog, Select, Menu, Popover, Tabs, Switch, Checkbox, Tooltip, Field, Toast | A single package covers every interactive primitive the 14 pages need, and it is tree-shakeable. It is unstyled and exposes `data-*` state attributes, so Tailwind v4 variants style it directly (`data-[open]:`, `data-[checked]:`). It is React 19 native (ref-as-prop, no forwardRef wrappers) and compatible with the React Compiler. It ships a Toast, so `sonner` is not needed. It is built by the Radix/MUI authors and actively released, which makes it the safer long-term bet. |
| `clsx` | `^2.1.1` | Conditional class strings | 0 deps. Needed for variant helpers. Do not add `tailwind-merge` or `class-variance-authority`: write variants as plain `Record<Variant, string>` maps. |

### Already present (reuse)
| Library | Version | Use |
|---|---|---|
| `lucide-react` | 1.58 installed (1.65 latest) | Icons, with `aria-hidden` and a text label or `aria-label`. Currently used only on the public site. Import named icons only. |
| `zod` | 4.3.6 | It is only a transitive dependency today. **Declare it in `package.json`** (`^4.3.6`) and reuse it for client form validation. It is already used by the MCP route. |
| `libphonenumber-js` | ^1.12 | Phone display and formatting in reservation lists. |

### Built in-house (src/components/admin/)
Small components, about 20-60 lines each, on Tailwind v4 tokens:
- `Button` (variants: primary, secondary, ghost, danger; sizes: md with a 44px touch target, sm for dense desktop), `IconButton`.
- `Input`, `Textarea`, `NativeSelect`, `Field` (label, hint, error, with `aria-describedby`).
- `Card`/`Panel`, `PageHeader`, `Badge`/`StatusPill` (reservation statuses), `EmptyState`, `Skeleton`, `Spinner`.
- `DataTable`: semantic `<table>` on `md:` and up, and a stacked card list below. It has sticky header, sortable column buttons and `aria-sort`, and filtering done client-side from the already-fetched array. A dedicated library is not warranted here. Reservations, menu items and reviews are tens to a few hundred rows, and the API stays unchanged.
- `AdminShell`: sidebar on `lg:`, bottom tab bar or top drawer (Base UI Dialog) on mobile, active-route highlight via `usePathname`.
- Toast wrapper around Base UI `Toast` (provider mounted in `admin/layout.tsx`).
- `ConfirmDialog` (AlertDialog) used for destructive actions, replacing `window.confirm`.

### Dates, times, forms
- **Native `<input type="date|time|number">`**. This is the best option on a chef's phone and a waiter's tablet (OS pickers, keyboard-free, free accessibility). Do NOT add `react-day-picker` (v10.0.2 is a major, new line, and ships its own CSS) or any custom calendar. Revisit only if a calendar overview of reservations becomes a requested feature.
- **No `react-hook-form`.** The forms are small (hours, announcement, settings, menu item). Use React 19 `useActionState` or plain `useState` plus `zod` `safeParse`, and keep the existing `src/utils/validation.ts` helpers.
- **No `@tanstack/react-table`.** v9.3.1 is a fresh major (v8 line previously dominant). It is headless, but is overkill and a migration risk for sorting and filtering over small arrays.

## Alternatives Considered
| Category | Recommended | Alternative | Why not |
|---|---|---|---|
| Primitives | Base UI 1.9 | `radix-ui` 1.8.1 (unified package) | A fully valid choice, and the one most shadcn docs and snippets use. It is the fallback if Base UI Toast or Select misbehaves. Slightly higher risk of slow maintenance. Needs `sonner` or a custom toast for notifications. |
| Primitives | Base UI | `react-aria-components` 1.22.1 | The best accessibility, DatePicker and Table included, but a heavy API, a larger bundle, and its own styling conventions (`data-*` plus render props). Too much for ~12 primitives. Choose it only if a real date/range picker is required. |
| Components | In-house, copy patterns | shadcn/ui CLI | It pulls `tailwind-merge`, `cva`, `tw-animate-css`, a `components.json`, and an HSL/OKLCH token system that collides with the existing `--gc-*` and legacy tokens. The result is also generic-looking, and the brief asks for a sober, dense, bespoke tool look. Borrow its markup patterns manually only. |
| Toast | Base UI Toast | `sonner` 2.0.8 | Good and tiny (peer React 18/19), and the right fallback. It is only worth adding if Base UI Toast proves awkward (confidence MEDIUM on Toast ergonomics). |
| Icons | `lucide-react` (existing) | Heroicons, Phosphor | A second icon set for no gain. |
| Data table | In-house | TanStack Table 9 | See above. |

## Integration points (read before building)

1. **`globals.css` is public-site-themed and global.** `body` is dark void/ivory in Cormorant serif. `select`, `input[type=date|time]` are forced to `color-scheme: dark`, `::-webkit-scrollbar` is gold, and `button:focus-visible` has a gold outline. The admin is a light work tool, so:
   - Wrap the admin in a root class (e.g. `.admin-root` set in `src/app/admin/layout.tsx`) and add scoped admin tokens: a neutral surface scale plus a single accent (reuse `--gc-jungle` or `--primary` as the accent for brand continuity). Expose them via `@theme inline` as `--color-adm-*`, so that `bg-adm-surface` and `text-adm-muted` become utilities, without touching the public tokens.
   - Override the global form rules inside `.admin-root` (`color-scheme: light`, a light background on selects and date inputs), or move those rules under a `.public-root`-style selector. Scope the scrollbar too.
   - Set the admin font explicitly. Use Raleway (already loaded) or the system sans, with `tabular-nums` for times and prices. Do not inherit Cormorant: it is too thin and low-contrast for dense data.
2. **Portals.** Base UI Dialog, Select, Menu and Toast render into `document.body`, outside `.admin-root`. Either pass the portal `container` to the admin root, or define the admin tokens on `:root` with distinct `--adm-*` names (recommended: no coupling to the portal container). Never rely on descendant selectors for popups.
3. **Legacy token usage.** The admin pages use `var(--primary)` arbitrary values. New components must use the `bg-(--adm-x)` or `@theme` utilities. Migrate page by page, then remove the legacy block once no `src/app/admin` file references it (grep gate).
4. **'use client' boundaries.** Base UI components are client components. Keep the in-house wrappers in files marked `'use client'`. Pure presentational ones (`Badge`, `Card`, `PageHeader`) stay server-compatible with no directive. This lets page shells become Server Components later without a rewrite.
5. **React Compiler.** The wrappers must not mutate props or refs during render. Base UI 1.x is documented as compatible, but run the admin through `npm run build` and check for dev-mode compiler bailouts early.
6. **Ergonomics targets.** Touch targets of at least 44x44 on the phone and tablet breakpoints (`min-h-11`), compact `h-8` rows at `lg:`. Use `focus-visible` rings with 3:1 contrast against the new light surface (the current 1px gold outline is invisible on light backgrounds). Add an `aria-live` region for async status. Honour the existing `prefers-reduced-motion` rule, which already exists globally.
7. **Tests.** Vitest runs in the node environment with `tests/**/*.test.ts`, so UI components will not be unit-tested without adding jsdom and Testing Library. Do NOT add them for this milestone. Keep logic (status transitions, filtering and sorting helpers, capacity calculations) in pure `src/utils/*.ts` functions that the existing setup can test. Verify visuals manually plus one Playwright smoke pass on the three breakpoints, only if the user wants it.
8. **Removal of tables.** Deleting `/admin/tables`, `/api/tables/*` and assignment UI drops about 800 lines, and no new dependency is involved. The `build` script runs Vitest first, so delete or update the tests that cover the removed routes in the same change.

## What NOT to add
- shadcn CLI, `tailwind-merge`, `class-variance-authority`, `tw-animate-css`.
- `@tanstack/react-table`, `react-day-picker`, `react-hook-form`, `@tanstack/react-query` (the pages use plain `fetch`, and the API is frozen).
- A second primitive family (do not mix Radix and Base UI).
- A charting library for KPI unless the KPI page already needs one. Use CSS/SVG sparklines first. Out of scope for this research.
- A dark-mode toggle: the single light admin theme is enough.
- Framer Motion and similar libraries (CSS transitions only).

## Installation

```bash
npm install @base-ui/react@^1.9.0 clsx@^2.1.1
npm install zod@^4.3.6   # declare the already-used transitive dependency
```

## Confidence
| Claim | Level | Basis |
|---|---|---|
| Versions (base-ui 1.9.0, radix-ui 1.8.1, react-aria-components 1.22.1, sonner 2.0.8, tanstack table 9.3.1, react-day-picker 10.0.2, lucide-react 1.65) | HIGH | `npm view` on 2026-10-31 |
| React 19 peer compatibility | HIGH | npm peerDependencies |
| Base UI as the primitive choice, covering Toast, AlertDialog, Select, Field | MEDIUM | Prior knowledge of its component list. Context7 docs were not queried (no MCP available), so run `npx ctx7@latest docs` on `@base-ui/react` Toast and Select before the shell phase. |
| React Compiler compatibility of Base UI | MEDIUM | Not verified here, so validate in the first phase |
| Native date inputs over a picker library | HIGH | Device mix (phone and tablet), and the lack of a calendar requirement |
| In-house table over a library | MEDIUM | Depends on the row counts staying in the hundreds. Reservations volume is about 40 covers per day. |

## Sources
- npm registry (`npm view`), 2026-10-31: `@base-ui/react`, `radix-ui`, `react-aria-components`, `sonner`, `@tanstack/react-table`, `react-day-picker`, `lucide-react`, `clsx`
- Repository: `package.json`, `src/app/globals.css`, `src/app/admin/*` (about 3800 lines across 10 pages)
