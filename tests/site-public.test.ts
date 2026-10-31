/**
 * SITE-01 / SITE-02 : composants de « Site public » (rendu statique, Base UI et Next.js simulés)
 * et câblage : mêmes composants pour les onglets et les anciennes adresses, mêmes routes API,
 * aucun confirm() natif, aucun mot « table » affiché, garde « modifications non enregistrées ».
 * Le comportement interactif (clic, focus, toast, échec simulé) est prouvé en navigateur
 * (voir .planning/phases/13-site-public/13-VERIFICATION.md).
 */
import { describe, it, expect, vi } from 'vitest'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { AdminProviders } from '../src/components/admin/AdminProviders'
import { guardTarget } from '../src/components/admin/site/use-unsaved-guard'
import { SitePublic } from '../src/components/admin/site/SitePublic'
import { HoursForm } from '../src/components/admin/site/HoursSection'
import { AnnouncementFormView } from '../src/components/admin/site/AnnouncementSection'
import { CapacityFormView } from '../src/components/admin/site/CapacitySection'
import { SaveBar, SaveFailure, SiteSwitch } from '../src/components/admin/site/site-ui'
import { EMPTY_ANNOUNCEMENT, toHourRows } from '../src/components/admin/site/site-logic'

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/site',
  useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }),
}))

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const SITE_DIR = 'src/components/admin/site'
const siteFiles = readdirSync(join(root, SITE_DIR)).filter((f) => /\.(tsx?|css)$/.test(f))

const inProviders = (el: ReturnType<typeof h>) => renderToStaticMarkup(h(AdminProviders, null, el))
/** Texte visible (balises et attributs retirés). */
const text = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')

const WEEK = toHourRows(
  [0, 1, 2, 3, 4, 5, 6].map((d) => ({
    id: d,
    day_of_week: d,
    day_name: '',
    is_open: d !== 2,
    open_time: d !== 2 ? '12:00:00' : null,
    close_time: d !== 2 ? '22:00:00' : null,
    created_at: '',
    updated_at: '',
  })),
)

describe('SITE-01 « Site public » : un écran, 4 onglets', () => {
  it('rend la tablist accessible, 4 onglets, l’onglet initial sélectionné et son panneau', () => {
    const html = renderToStaticMarkup(h(SitePublic, { initialTab: 'annonces' }))
    expect(html).toContain('role="tablist"')
    expect(html).toContain('aria-label="Sections du site public"')
    expect(html.match(/role="tab"/g)).toHaveLength(4)
    for (const label of ['Horaires', 'Exceptions', 'Annonces', 'Capacité']) expect(text(html)).toContain(label)
    expect(html).toMatch(/id="site-tab-annonces"[^>]*aria-selected="true"/)
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1)
    expect(html).toContain('role="tabpanel"')
    expect(html).toContain('aria-labelledby="site-tab-annonces"')
    // un seul h1, titre « Site public »
    expect(html.match(/<h1/g)).toHaveLength(1)
    expect(html).toContain('Site public')
  })

  it('état de chargement annoncé (status + aria-busy) tant que les données ne sont pas là', () => {
    for (const tab of ['horaires', 'exceptions', 'annonces', 'capacite'] as const) {
      const html = inProviders(h(SitePublic, { initialTab: tab }))
      expect(html, tab).toContain('role="status"')
      expect(html, tab).toContain('aria-busy="true"')
    }
  })

  it('les onglets sont des liens d’ancre (partagés avec la navigation latérale)', () => {
    const html = renderToStaticMarkup(h(SitePublic))
    for (const id of ['horaires', 'exceptions', 'annonces', 'capacite']) expect(html).toContain(`href="#${id}"`)
  })
})

describe('SITE-01 anciennes adresses : mêmes composants, aucune logique dupliquée', () => {
  const pages: [string, string][] = [
    ['src/app/admin/(app)/hours/page.tsx', 'horaires'],
    ['src/app/admin/(app)/announcement/page.tsx', 'annonces'],
    ['src/app/admin/(app)/settings/page.tsx', 'capacite'],
  ]
  it.each(pages)('%s rend <SitePublic initialTab="%s" /> et rien d’autre', (file, tab) => {
    const src = read(file)
    expect(src).toContain(`<SitePublic initialTab="${tab}" />`)
    expect(src).not.toMatch(/fetch\(|useState|useEffect|confirm\(/)
    expect(src.split('\n').length).toBeLessThan(12)
  })

  it('/admin/site rend <SitePublic /> (onglet par défaut Horaires)', () => {
    expect(read('src/app/admin/(app)/site/page.tsx')).toContain('<SitePublic />')
  })
})

describe('SITE-01 Horaires', () => {
  const html = inProviders(h(HoursForm, { initial: WEEK }))

  it('7 jours lundi → dimanche, interrupteurs avec libellé texte, heures 12:00 / 22:00', () => {
    const days = [...html.matchAll(/class="adm-site-hday"><span>([^<]+)<\/span>/g)].map((m) => m[1])
    expect(days).toEqual(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'])
    expect(html.match(/role="switch"/g)).toHaveLength(7)
    expect(html).toContain('aria-label="Ouvert le lundi"')
    expect(html).toContain('Fermé toute la journée') // mardi
    expect(html).toContain('value="12:00"')
    expect(html).toContain('value="22:00"')
  })

  it('état initial propre : « Tout est enregistré », bouton Enregistrer désactivé, aucun badge Modifié', () => {
    expect(text(html)).toContain('Tout est enregistré')
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Enregistrer les horaires/)
    expect(text(html)).not.toContain('Modifié')
  })

  it('aperçu public présent (jamais replié) avec le jour courant', () => {
    expect(html).toContain('aria-label="Aperçu public"')
    expect(text(html)).toContain('(aujourd’hui)')
  })
})

describe('SITE-01 Annonces et Capacité', () => {
  it('Annonces : interrupteur, 5 couleurs en radiogroup, début/fin facultatifs, aucune bannière à l’état vierge', () => {
    const html = inProviders(h(AnnouncementFormView, { initial: EMPTY_ANNOUNCEMENT }))
    expect(html).toContain('role="radiogroup"')
    expect(html.match(/role="radio"/g)).toHaveLength(5)
    for (const c of ['Orange', 'Vert', 'Rouge', 'Bleu', 'Violet']) expect(text(html)).toContain(c)
    expect(text(html)).toContain('Bannière masquée')
    expect(text(html)).toContain('Aucune bannière n’est affichée sur le site.')
    expect(text(html)).toContain('Aucune bannière')
    expect(text(html)).toContain('(facultatif)')
    expect(text(html)).toContain('Enregistrer l’annonce')
  })

  it('Capacité : libellé « Durée d’occupation d’un créneau », compteurs, puces, aperçu, aucun mot « table »', () => {
    const html = inProviders(h(CapacityFormView, { initial: { covers: '40', duration: '120' } }))
    const t = text(html)
    expect(t).toContain('Couverts maximum par service')
    expect(t).toContain('Durée d’occupation d’un créneau')
    expect(t).toContain('2 h 00')
    expect(t).toContain('Une réservation à 19:00 occupe 2 h 00, jusqu’à 21:00.')
    expect(html.match(/role="radio"/g)).toHaveLength(5)
    expect(html).toContain('aria-label="Diminuer la durée de 15 minutes"')
    expect(t).not.toMatch(/\btables?\b/i)
    expect(t).toContain('Enregistrer la capacité')
  })

  it('aucun texte affiché de la section ne contient « table »', () => {
    const htmls = [
      inProviders(h(HoursForm, { initial: WEEK })),
      inProviders(h(AnnouncementFormView, { initial: EMPTY_ANNOUNCEMENT })),
      inProviders(h(CapacityFormView, { initial: { covers: '40', duration: '120' } })),
      renderToStaticMarkup(h(SitePublic)),
    ]
    for (const html of htmls) expect(text(html)).not.toMatch(/\btables?\b/i)
  })
})

describe('SITE-02 primitives de retour', () => {
  it('SiteSwitch : role=switch, aria-checked, libellé texte + icône (jamais la couleur seule)', () => {
    const on = renderToStaticMarkup(h(SiteSwitch, { checked: true, onChange: () => {}, label: 'Ouvert le lundi', onText: 'Ouvert', offText: 'Fermé' }))
    const off = renderToStaticMarkup(h(SiteSwitch, { checked: false, onChange: () => {}, label: 'Ouvert le lundi', onText: 'Ouvert', offText: 'Fermé' }))
    expect(on).toContain('aria-checked="true"')
    expect(off).toContain('aria-checked="false"')
    expect(text(on)).toContain('Ouvert')
    expect(text(off)).toContain('Fermé')
    expect(on).toContain('<svg')
    expect(off).toContain('<svg')
  })

  it('SaveBar : propre → « Tout est enregistré » ; modifié → « Modifications non enregistrées » + Annuler ; en cours → « Enregistrement… » (aria-busy)', () => {
    const noop = () => {}
    const clean = renderToStaticMarkup(h(SaveBar, { dirty: false, saving: false, label: 'Enregistrer X', onCancel: noop, onSave: noop }))
    expect(text(clean)).toContain('Tout est enregistré')
    expect(clean).not.toContain('Annuler')
    const dirty = renderToStaticMarkup(h(SaveBar, { dirty: true, saving: false, label: 'Enregistrer X', onCancel: noop, onSave: noop }))
    expect(text(dirty)).toContain('Modifications non enregistrées')
    expect(text(dirty)).toContain('Annuler')
    const saving = renderToStaticMarkup(h(SaveBar, { dirty: true, saving: true, label: 'Enregistrer X', onCancel: noop, onSave: noop }))
    expect(saving).toContain('aria-busy="true"')
    expect(text(saving)).toContain('Enregistrement…')
    expect(saving).toMatch(/<button[^>]*disabled[^>]*>[^<]*Annuler|disabled=""[^>]*>Annuler/)
  })

  it('SaveFailure : alerte assertive qui nomme l’échec, ce qui est conservé et Réessayer', () => {
    const html = renderToStaticMarkup(h(SaveFailure, { title: 'Les horaires n’ont pas été enregistrés.', reason: 'La connexion a été perdue.', onRetry: () => {}, retrying: false }))
    expect(html).toContain('role="alert"')
    expect(text(html)).toContain('Les horaires n’ont pas été enregistrés.')
    expect(text(html)).toContain('rien n’est perdu')
    expect(text(html)).toContain('Réessayer')
  })
})

describe('SITE-02 garde « modifications non enregistrées »', () => {
  const here = { origin: 'http://localhost:3103', pathname: '/admin/site', search: '', hash: '' }
  it('un onglet de la section déclenche la garde, pas l’ancre « Aller au contenu »', () => {
    expect(guardTarget('#annonces', here)).toEqual({ kind: 'hash', hash: '#annonces' })
    expect(guardTarget('/admin/site#capacite', here)).toEqual({ kind: 'hash', hash: '#capacite' })
    expect(guardTarget('#adm-main', here)).toBeNull()
  })
  it('une autre page interne déclenche la garde ; l’externe et la même adresse non', () => {
    expect(guardTarget('/admin/menu', here)).toEqual({ kind: 'path', to: '/admin/menu' })
    expect(guardTarget('/admin/reservations?nouvelle=1', here)).toEqual({ kind: 'path', to: '/admin/reservations?nouvelle=1' })
    expect(guardTarget('https://exemple.fr/x', here)).toBeNull()
    expect(guardTarget('/admin/site', here)).toBeNull()
    expect(guardTarget('/admin/site#annonces', { ...here, hash: '#annonces' })).toBeNull()
  })
  it('les composants de formulaire montent la garde', () => {
    for (const f of ['HoursSection', 'ExceptionsSection', 'AnnouncementSection', 'CapacitySection']) {
      expect(read(`${SITE_DIR}/${f}.tsx`), f).toContain('useUnsavedGuard(')
    }
    const hook = read(`${SITE_DIR}/use-unsaved-guard.ts`)
    expect(hook).toContain('beforeunload')
    expect(hook).toContain('Quitter sans enregistrer ?')
    expect(hook).toContain('Rester ici')
  })
})

describe('SITE-02 câblage : retour à chaque modification, mêmes routes API', () => {
  it('chaque enregistrement émet un toast de succès et, en cas d’échec, un toast d’erreur', () => {
    const expected: [string, string[]][] = [
      ['HoursSection', ["toast.success('Horaires enregistrés.')", "toast.error('Horaires non enregistrés'"]],
      ['AnnouncementSection', ["toast.success('Annonce enregistrée.')", "toast.error('Annonce non enregistrée'"]],
      ['CapacitySection', ["toast.success('Capacité enregistrée.')", "toast.error('Capacité non enregistrée'"]],
      ['ExceptionsSection', ["'Exception ajoutée.'", "toast.success('Exception supprimée.')", "toast.error('Exception non ajoutée'", "toast.error('Exception non supprimée'"]],
    ]
    for (const [file, needles] of expected) {
      const src = read(`${SITE_DIR}/${file}.tsx`)
      for (const n of needles) expect(src, `${file} : ${n}`).toContain(n)
    }
  })

  it('un échec ne réinitialise jamais la saisie : le catch ne touche ni aux lignes ni au formulaire', () => {
    for (const f of ['HoursSection', 'AnnouncementSection', 'CapacitySection', 'ExceptionsSection']) {
      const src = read(`${SITE_DIR}/${f}.tsx`)
      const catches = [...src.matchAll(/catch \(e\) \{([\s\S]*?)\n    \} finally/g)].map((m) => m[1])
      expect(catches.length, f).toBeGreaterThan(0)
      for (const c of catches) expect(c, f).not.toMatch(/setRows|setForm|setSaved|setForm\(EMPTY|refetch\(/)
    }
  })

  it('les sections n’appellent que les 4 routes API existantes, via adminFetch (aucun fetch nu)', () => {
    const all = siteFiles.filter((f) => f.endsWith('.tsx')).map((f) => read(`${SITE_DIR}/${f}`)).join('\n')
    expect(all).not.toMatch(/(?<![.\w])fetch\(/)
    const routes = new Set([...all.matchAll(/['"`](\/api\/[a-z-]+)/g)].map((m) => m[1]))
    expect([...routes].sort()).toEqual(['/api/announcement', '/api/hours', '/api/settings', '/api/special-hours'])
    expect(all).toContain("method: 'PUT', json: hoursPayload")
    expect(all).toContain("method: 'POST', json: exceptionPayload")
    expect(all).toContain("method: 'DELETE'")
    expect(all).toContain("method: 'PUT', json: announcementPayload")
    expect(all).toContain("method: 'PUT', json: capacityPayload")
  })

  it('états chargement / vide / erreur via les composants communs ; suppression via useConfirm', () => {
    const exc = read(`${SITE_DIR}/ExceptionsSection.tsx`)
    expect(exc).toContain('LoadingState')
    expect(exc).toContain('ErrorState')
    expect(exc).toContain('EmptyState')
    expect(exc).toContain('Aucun horaire exceptionnel')
    expect(exc).toContain('useConfirm()')
    expect(exc).toContain('Supprimer cette exception ?')
    for (const f of ['HoursSection', 'AnnouncementSection', 'CapacitySection']) {
      const src = read(`${SITE_DIR}/${f}.tsx`)
      expect(src, f).toContain('LoadingState')
      expect(src, f).toContain('ErrorState')
      expect(src, f).toContain('Impossible de charger')
    }
  })

  it('plus aucun confirm() natif, alert() ni emoji dans la section', () => {
    for (const f of siteFiles) {
      const src = read(`${SITE_DIR}/${f}`)
      expect(src, f).not.toMatch(/(?<![\w.$])confirm\(\s*['"`]|window\.confirm\(|(?<![\w.])alert\(/)
      expect(src, f).not.toMatch(/\p{Extended_Pictographic}/u)
    }
  })
})

describe('SITE-01 navigation et styles', () => {
  it('« Site public » porte ses propres onglets : les 4 sous-entrées pointent vers les onglets de /admin/site', async () => {
    const { NAV } = await import('../src/app/admin/(app)/nav')
    const site = NAV.find((n) => n.id === 'site')!
    expect(site.ownTabs).toBe(true)
    expect(site.children!.map((c) => c.href)).toEqual(['/admin/site#horaires', '/admin/site#exceptions', '/admin/site#annonces', '/admin/site#capacite'])
    expect(site.children!.map((c) => c.legacy)).toEqual(['/admin/hours', undefined, '/admin/announcement', '/admin/settings'])
  })

  it('site.css : aperçu collant à droite dès 1180 px, texte >= 14 px, mouvement réduit respecté, aucune ombre', () => {
    const css = read(`${SITE_DIR}/site.css`).replace(/\r\n/g, '\n')
    expect(css).toMatch(/@media \(min-width: 1180px\)[\s\S]*grid-template-columns: minmax\(0, 1fr\) 360px[\s\S]*position: sticky/)
    const sizes = [...css.matchAll(/font(?:-size)?:[^;]*?(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]))
    expect(sizes.length).toBeGreaterThan(5)
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(14)
    expect(css).toContain('prefers-reduced-motion: no-preference')
    expect(css).not.toMatch(/box-shadow:[^;]*\d+px \d+px/) // pas d'ombre portée (le contour 1 px « inset 0 0 0 1px » est un filet)
  })

  it('toasts en haut sur téléphone (décision du propriétaire)', () => {
    const css = read('src/app/admin/admin.css').replace(/\r\n/g, '\n')
    expect(css).toMatch(/@media \(max-width: 767px\) \{\n  \.adm-toast-viewport \{ top: calc\(/)
  })
})
