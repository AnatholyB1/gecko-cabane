/**
 * Source UNIQUE de la navigation de l'admin (NAV-03).
 *
 * Alimente : la navigation principale (barre du bas, rail, barre latérale et
 * sous-entrées), les onglets de section, les cartes d'accueil et d'entrée de
 * section, le menu du compte. Ajouter ou retirer une entrée = modifier ce
 * fichier, rien d'autre. Aucun composant ne contient de libellé ni de lien
 * interne en dur (tests/admin-nav-single-source.test.ts).
 *
 * Profondeur maximale : 2 niveaux. Les URL ne changent jamais
 * (tests/admin-nav-links.test.ts).
 */
import {
  CalendarCheck,
  ClipboardList,
  ExternalLink,
  Globe,
  KeyRound,
  Star,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

export type NavChild = {
  id: string
  label: string
  /** Lien interne. Une ancre (`#exceptions`) désigne une section de la même page. */
  href: string
  /** Phrase de la carte de la page d'entrée de section. */
  description: string
}

export type NavItem = {
  id: string
  label: string
  href: string
  icon: LucideIcon
  /** Phrase de la carte d'accueil. */
  description: string
  children?: NavChild[]
  /**
   * Les sous-entrées sont aussi proposées en segments DANS la page (Réputation, phase 16) :
   * les onglets de section du layout sont alors omis (pas de double rangée). La barre
   * latérale (>= 1024) et les URL ne changent pas.
   */
  inPageSegments?: boolean
}

export const NAV: NavItem[] = [
  {
    id: 'today',
    label: "Aujourd'hui",
    href: '/admin',
    icon: CalendarCheck,
    description: 'Arrivées par heure, couverts sur 40, réservations à confirmer.',
  },
  {
    id: 'reservations',
    label: 'Réservations',
    href: '/admin/reservations',
    icon: ClipboardList,
    description: 'Liste du jour : confirmer, terminer ou annuler en un tap.',
  },
  {
    id: 'menu',
    label: 'Carte',
    href: '/admin/menu',
    icon: Utensils,
    description: 'Prix et disponibilité des plats, ajout rapide.',
  },
  {
    id: 'site',
    label: 'Site public',
    href: '/admin/site',
    icon: Globe,
    description: 'Ce que voient les visiteurs du site.',
    children: [
      { id: 'hours', label: 'Horaires', href: '/admin/hours', description: "Heures d'ouverture de chaque jour de la semaine." },
      { id: 'special-hours', label: 'Exceptions', href: '/admin/hours#exceptions', description: 'Jours fériés, événements, fermetures exceptionnelles.' },
      { id: 'announcement', label: 'Annonces', href: '/admin/announcement', description: 'Bannière affichée en haut du site, avec dates de début et de fin.' },
      { id: 'capacity', label: 'Capacité', href: '/admin/settings', description: "Couverts maximum et durée d'occupation d'un créneau." },
    ],
  },
  {
    id: 'reputation',
    label: 'Réputation',
    href: '/admin/reputation',
    icon: Star,
    description: 'Avis des clients et indicateurs de suivi.',
    inPageSegments: true,
    children: [
      { id: 'reviews', label: 'Avis', href: '/admin/avis', description: 'Visites de la page avis, clics par source, totaux et modèle WhatsApp.' },
      { id: 'kpi', label: 'Rapport KPI', href: '/admin/kpi', description: "Historique hebdomadaire et rapport du lundi." },
    ],
  },
]

/** Accueil de l'admin (lien du logotype). */
export const ADMIN_HOME_HREF = '/admin'
export const BRAND_NAME = 'Gecko Cabane'
export const BRAND_ARIA = "Gecko Cabane, accueil de l'administration"

/** Bouton « + Réservation » de l'en-tête : ouvre le dialogue global (phase 15) ; l'adresse reste valide et ouvre le même dialogue. */
export const NEW_RESERVATION_HREF = '/admin/reservations?nouvelle=1'
export const NEW_RESERVATION_LABEL = 'Réservation'
export const NEW_RESERVATION_ARIA = 'Nouvelle réservation'

export type AccountLink = {
  id: string
  label: string
  href: string
  icon: LucideIcon
  /** Ouvre le site public dans le même onglet (lien externe à l'admin). */
  external?: boolean
  /**
   * Entrée prévue dont la page n'existe pas encore : affichée désactivée,
   * jamais en lien (pas de 404). À retirer quand la page est livrée
   * (le test de liens échoue sinon).
   */
  planned?: string
}

export const ACCOUNT_LINKS: AccountLink[] = [
  { id: 'public-site', label: 'Voir le site public', href: '/', icon: ExternalLink, external: true },
  { id: 'access', label: 'Accès', href: '/admin/acces', icon: KeyRound, planned: 'phase 17' },
]

// ---------------------------------------------------------------------------
// État actif (fonctions pures, testées)
// ---------------------------------------------------------------------------

export function pathOf(href: string): string {
  return href.split('#')[0].split('?')[0]
}

export function hashOf(href: string): string {
  const i = href.indexOf('#')
  return i === -1 ? '' : href.slice(i)
}

/** `/admin` ne correspond qu'à lui-même ; les autres chemins : égalité ou préfixe de segment. */
export function pathMatches(href: string, pathname: string): boolean {
  const p = pathOf(href)
  if (p === '/admin') return pathname === '/admin'
  return pathname === p || pathname.startsWith(p + '/')
}

/** Le chemin courant appartient-il à l'entrée (sa page ou une de ses sous-pages) ? */
export function isInSection(item: NavItem, pathname: string): boolean {
  if (pathMatches(item.href, pathname)) return true
  return (item.children ?? []).some((c) => pathMatches(c.href, pathname))
}

/** `page` : la page courante est l'entrée elle-même ; `true` : section parente de la page courante. */
export function navCurrent(item: NavItem, pathname: string): 'page' | 'true' | undefined {
  if (!isInSection(item, pathname)) return undefined
  if (!item.children) return 'page'
  return pathOf(item.href) === pathname ? 'page' : 'true'
}

/**
 * Sous-entrée courante : même chemin ; si plusieurs sous-entrées partagent la
 * page (Horaires / Exceptions), l'ancre courante départage, à défaut la
 * première.
 */
export function activeChildId(item: NavItem, pathname: string, hash: string): string | undefined {
  const here = (item.children ?? []).filter((c) => pathMatches(c.href, pathname))
  if (here.length === 0) return undefined
  return (here.find((c) => hash !== '' && hashOf(c.href) === hash) ?? here.find((c) => hashOf(c.href) === '') ?? here[0]).id
}

/** Section de premier niveau qui contient le chemin courant (la plus spécifique d'abord). */
export function currentSection(nav: NavItem[], pathname: string): NavItem | undefined {
  return nav.find((n) => isInSection(n, pathname))
}

/**
 * Répartition des cartes d'accueil en grille de 6 colonnes (>= 1024) :
 * la première carte est pleine largeur (lead), puis 4+2, 3+3, 4+2…
 * Une carte seule en fin de liste prend toute la largeur.
 */
export function homeSpans(count: number): string[] {
  const out: string[] = []
  if (count > 0) out.push('lead')
  const rest = count - 1
  for (let i = 0; i < rest; i += 2) {
    const row = i / 2
    const pair = row % 2 === 0 ? ['s4', 's2'] : ['s3', 's3']
    if (i + 1 < rest) out.push(pair[0], pair[1])
    else out.push('s6')
  }
  return out
}
