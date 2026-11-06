/**
 * Audit P15 : correctifs de la passe de revue (interface seulement) et garde-fou des fichiers gelés.
 */
import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isManualFormDirty } from '../src/components/admin/reservations/ManualReservationForm'
import { mailtoLink } from '../src/utils/phone-links'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

// ---------------------------------------------------------------------------
// Fichiers gelés : contenu identique au commit c6bc779
// ---------------------------------------------------------------------------

const BASE = 'c6bc779'
const FROZEN_PATHS = [
  'src/app/api/reservations',
  'src/app/api/cron',
  'src/app/api/kpi',
  'src/utils/resend.ts',
  // resend-contacts.ts degele par le correctif Sentry GECKO-CABANE-R (quick 261106-op0), couvert par tests/resend-contacts.test.ts
  'src/utils/review-invitations.ts',
]
const FROZEN_PREFIXES = ['src/utils/kpi-']

/**
 * Seule exception décidée par le propriétaire (audit P14/P16, F-H1) : GET /api/kpi expose en lecture seule
 * le champ `mode` ('test' | 'live', lu de KPI_REPORT_MODE), sans autre effet. Le contenu attendu est la base
 * c6bc779 plus exactement ces trois remplacements.
 */
const OWNER_ALLOWED: Record<string, (base: string) => string> = {
  'src/app/api/kpi/route.ts': (base) =>
    base
      .replace("import { weekEndOf } from '@/utils/kpi-week'", "import { weekEndOf } from '@/utils/kpi-week'\nimport { resolveReportMode } from '@/utils/kpi-mode'")
      .replace("import type { ApiResponse, WeeklyKpiRow } from '@/types/database'", "import type { ApiResponse, KpiReportMode, WeeklyKpiRow } from '@/types/database'")
      .replace(
        `    return NextResponse.json<ApiResponse<{ weeks: WeeklyKpiRow[]; testReportsSent: number }>>({
      data: { weeks: rows, testReportsSent },
    })`,
        `    // Lecture seule du reglage serveur (KPI_REPORT_MODE), pour l'affichage de l'admin : aucun autre effet.
    const mode: KpiReportMode = resolveReportMode(process.env.KPI_REPORT_MODE)

    return NextResponse.json<ApiResponse<{ weeks: WeeklyKpiRow[]; testReportsSent: number; mode: KpiReportMode }>>({
      data: { weeks: rows, testReportsSent, mode },
    })`,
      ),
}

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })
}

function baseAvailable(): boolean {
  try {
    git('cat-file', '-e', `${BASE}^{commit}`)
    return true
  } catch {
    return false // clone superficiel (CI) : le commit de référence n'existe pas
  }
}

function walk(dir: string): string[] {
  const abs = join(root, dir)
  if (!existsSync(abs)) return []
  if (statSync(abs).isFile()) return [dir]
  return readdirSync(abs, { withFileTypes: true }).flatMap((e) => walk(`${dir}/${e.name}`))
}

const norm = (s: string) => s.replace(/\r\n/g, '\n')

describe.skipIf(!baseAvailable())(`fichiers gelés identiques à ${BASE} (comparaison de contenu)`, () => {
  // Vitest exécute le corps d'un describe même quand skipIf est vrai : ne pas appeler git sans le commit
  // de référence (clone superficiel de Vercel, où `git ls-tree` échoue et ferait échouer tout le build).
  const baseFiles = baseAvailable()
    ? git('ls-tree', '-r', '--name-only', BASE, '--', ...FROZEN_PATHS, 'src/utils')
        .split('\n')
        .filter(Boolean)
        .filter((f) => FROZEN_PATHS.some((p) => f === p || f.startsWith(`${p}/`)) || FROZEN_PREFIXES.some((p) => f.startsWith(p)))
    : []

  it('la liste de référence couvre l’API de réservation, les crons, les KPI et les emails', () => {
    for (const must of ['src/app/api/reservations/route.ts', 'src/app/api/reservations/manual/route.ts', 'src/app/api/cron/review-invitations/route.ts', 'src/app/api/kpi/route.ts', 'src/utils/resend.ts']) {
      expect(baseFiles).toContain(must)
    }
  })

  it.each(baseFiles)('%s : contenu inchangé', (file) => {
    expect(existsSync(join(root, file)), `${file} supprimé`).toBe(true)
    const base = norm(git('show', `${BASE}:${file}`))
    expect(norm(read(file))).toBe(file in OWNER_ALLOWED ? OWNER_ALLOWED[file](base) : base)
  })

  it('aucun fichier ajouté dans les dossiers gelés', () => {
    const now = [...FROZEN_PATHS.flatMap(walk), ...walk('src/utils').filter((f) => FROZEN_PREFIXES.some((p) => f.startsWith(p)))]
    expect(now.filter((f) => !baseFiles.includes(f))).toEqual([])
  })

  it('PUT n’accepte toujours pas « allergies » (lacune documentée, API figée)', () => {
    const route = norm(read('src/app/api/reservations/route.ts'))
    const put = route.slice(route.indexOf('export async function PUT'))
    expect(put).not.toMatch(/allergies/)
  })
})

// ---------------------------------------------------------------------------
// mailto
// ---------------------------------------------------------------------------

describe('mailtoLink', () => {
  it('encode l’adresse après validation stricte', () => {
    expect(mailtoLink('anna@example.com')).toBe('mailto:anna%40example.com')
    expect(mailtoLink('  anna+gecko@example.co.uk ')).toBe('mailto:anna%2Bgecko%40example.co.uk')
  })
  it.each(['a?bcc=x@y.zz', 'a&cc=x@y.zz', 'a,b@y.zz', 'a%0Abcc:x@y.zz', 'a@y.zz?subject=x', 'a b@y.zz', 'a@y', '<a@y.zz>', 'a;b@y.zz', '', 'a@@y.zz'])(
    'refuse %j (aucun lien)',
    (v) => expect(mailtoLink(v)).toBeNull(),
  )
  it('null / undefined : aucun lien', () => {
    expect(mailtoLink(null)).toBeNull()
    expect(mailtoLink(undefined)).toBeNull()
  })
  it('ReservationDetails n’interpole plus l’adresse brute', () => {
    const src = read('src/components/admin/reservations/ReservationDetails.tsx')
    expect(src).not.toMatch(/mailto:\$\{/)
    expect(src).toContain('mailtoLink(r.customer_email)')
  })
})

// ---------------------------------------------------------------------------
// Saisie manuelle : fermeture
// ---------------------------------------------------------------------------

describe('NewReservation : fermeture protégée', () => {
  const fd = (o: Record<string, string>) => {
    const f = new FormData()
    for (const [k, v] of Object.entries(o)) f.set(k, v)
    return f
  }
  it('saisie vide (valeurs par défaut seules) : pas de confirmation', () => {
    expect(isManualFormDirty(fd({ reservation_date: '2026-11-03', party_size: '2', customer_name: '  ' }))).toBe(false)
  })
  it.each([['customer_name', 'Anna'], ['customer_phone', '+66'], ['allergies', 'noix'], ['admin_notes', 'x'], ['source', 'telephone']])(
    '%s rempli : confirmation demandée',
    (k, v) => expect(isManualFormDirty(fd({ [k]: v }))).toBe(true),
  )
  it('le dialogue refuse la fermeture pendant l’envoi, confirme si saisie, double l’échec par un toast', () => {
    const src = read('src/components/admin/reservations/NewReservation.tsx')
    expect(src).toContain('if (submittingRef.current || closing.current) return')
    expect(src).toContain('isManualFormDirty(new FormData(form))')
    expect(src).toContain('toast.error(message')
    expect(src).toContain('disabled={submitting}')
    expect(src).toContain('window.history.replaceState(window.history.state')
    const form = read('src/components/admin/reservations/ManualReservationForm.tsx')
    expect(form).toContain('Vos informations sont conservées')
    expect(form).toContain('onPendingChange?.(true)')
  })
})

// ---------------------------------------------------------------------------
// Aujourd'hui
// ---------------------------------------------------------------------------

describe('TodayView', () => {
  const src = read('src/components/admin/reservations/TodayView.tsx')
  it('recharge au focus et à chaque minute, sans perdre l’état', () => {
    expect(src).toContain('useAutoRefresh(refetch')
    const clock = read('src/components/admin/reservations/use-clock.ts')
    expect(clock).toContain("window.addEventListener('focus'")
    expect(clock).toContain("document.addEventListener('visibilitychange'")
    expect(clock).toContain('setInterval(go, CLOCK_TICK_MS)')
    // le chargement n'efface pas la vue : l'écran de chargement n'apparaît que sans données
    expect(src).toContain('!summary && res.status === \'loading\'')
  })
  it('la carte « à confirmer » est limitée à 3 lignes et les en attente ne sont pas répétées', () => {
    expect(src).toContain('const PENDING_PREVIEW = 3')
    expect(src).toContain('Voir les ${summary.toConfirm.length - PENDING_PREVIEW} autres')
    expect(src).toContain("r.status !== 'pending'")
  })
  it('les jauges restent affichées à 0 sans réservation', () => {
    expect(src).not.toMatch(/rows\.length === 0 \? null/)
    expect(src).toContain('rows.length === 0 ? (')
    // plus de bloc qui remplace tout l'écran quand la liste est vide
    expect(src).toContain('{summary && rows ? (')
  })
  it('libellés des services dérivés de la coupure de 16 h, aria-valuenow borné', () => {
    expect(src).toContain('Déjeuner · avant ${SPLIT_HOUR}h')
    expect(src).toContain('Dîner · dès ${SPLIT_HOUR}h')
    expect(src).not.toMatch(/12h-15h|18h-22h/)
    expect(src).toContain('aria-valuenow={Math.min(peak, Math.max(max, 0))}')
  })
})

describe('ReservationRow : focus clavier', () => {
  const src = read('src/components/admin/reservations/ReservationRow.tsx')
  it('aria-disabled plutôt que disabled sur les boutons d’action', () => {
    expect(src).not.toMatch(/<Button[^>]*\sdisabled=\{busy\}/)
    expect(src).toContain('aria-disabled={busy || undefined}')
  })
  it('le focus est rendu à la ligne quand le bouton pressé disparaît', () => {
    expect(src).toContain('tabIndex={-1}')
    expect(src).toContain('rowRef.current?.focus')
  })
})

describe('ReservationsView : raccourcis de date', () => {
  it('Hier / Aujourd’hui / Demain suivent l’horloge partagée', () => {
    const src = read('src/components/admin/reservations/ReservationsView.tsx')
    expect(src).toContain('krabiTodayYmd(now)')
    expect(src).toContain('useNow()')
    expect(read('src/app/admin/(app)/reservations/page.tsx')).toContain('key={initialDate}')
  })
})

describe('reservations.css : zoom 200 %', () => {
  it('rien ne force la largeur des jauges ni de la barre de date', () => {
    const css = read('src/components/admin/reservations/reservations.css')
    expect(css).toContain('.rv-gauges > *, .rv-datebar > *')
    expect(css).toContain('min-width: 0')
  })
})
