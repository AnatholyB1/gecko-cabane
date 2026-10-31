/**
 * ACC-01 / ACC-02 : contrôles statiques (suppression de /admin/signup, secrets, migrations,
 * pas de message brut, pas de texte libre dans l'adresse de connexion).
 */
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { ACCOUNT_LINKS, NAV } from '../src/app/admin/(app)/nav'
import { formatDay } from '../src/components/admin/access/access-logic'
import { invitationEmail, resetEmail } from '../src/utils/access/email'
import { passwordRules, validatePassword } from '../src/utils/access/validation'

const root = join(__dirname, '..')
const read = (f: string) => readFileSync(join(root, f), 'utf8')
const posix = (p: string) => relative(root, p).split('\\').join('/')

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}
const srcFiles = walk(join(root, 'src')).filter((f) => /\.(ts|tsx)$/.test(f))
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

describe('ACC-02 /admin/signup est supprimé et ne doit pas revenir', () => {
  it('aucune page, action ni dossier signup sous src/app/admin', () => {
    expect(existsSync(join(root, 'src/app/admin/signup'))).toBe(false)
    expect(existsSync(join(root, 'src/app/admin/(app)/signup'))).toBe(false)
    const offenders = walk(join(root, 'src/app'))
      .map(posix)
      .filter((f) => /(^|\/)signup(\/|$)/i.test(f))
    expect(offenders).toEqual([])
  })

  it('aucun code de src ne cite /admin/signup, signupAction ni auth.signUp', () => {
    const offenders = srcFiles
      .filter((f) => /\/admin\/signup|signupAction|\.signUp\s*\(/.test(stripComments(readFileSync(f, 'utf8'))))
      .map(posix)
    expect(offenders).toEqual([])
  })

  it('aucun lien de navigation ne mène à signup', () => {
    const all = [...NAV.flatMap((n) => [n.href, ...(n.children ?? []).map((c) => c.href)]), ...ACCOUNT_LINKS.map((l) => l.href)]
    expect(all.filter((h) => /signup/i.test(h))).toEqual([])
  })

  it('la route /api/auth/login (doublon sans contrôle gecko_is_admin, message brut) est supprimée', () => {
    expect(existsSync(join(root, 'src/app/api/auth/login'))).toBe(false)
  })
})

describe('ACC-02 entrée « Accès » active', () => {
  it('nav.ts : Accès pointe vers /admin/acces, sans « planned »', () => {
    const access = ACCOUNT_LINKS.find((l) => l.id === 'access')
    expect(access).toMatchObject({ label: 'Accès', href: '/admin/acces' })
    expect(access?.planned).toBeUndefined()
    expect(existsSync(join(root, 'src/app/admin/(app)/acces/page.tsx'))).toBe(true)
  })
})

describe('secrets : la clé service-role ne passe jamais côté client', () => {
  const clientFiles = srcFiles.filter((f) => /^\s*['"]use client['"]/.test(readFileSync(f, 'utf8')))
  it('il existe des composants client à contrôler', () => {
    expect(clientFiles.length).toBeGreaterThan(10)
  })
  it('aucun composant client n’importe le client service-role, deps.ts ni la clé', () => {
    const offenders = clientFiles
      .filter((f) => /SUPABASE_SERVICE_ROLE_KEY|createAdminClient|@\/utils\/access\/deps|@\/utils\/supabase\/server|utils\/access\/service/.test(stripComments(readFileSync(f, 'utf8')).replace(/import type[^\n]*\n/g, '')))
      .map(posix)
    expect(offenders).toEqual([])
  })
  it('SUPABASE_SERVICE_ROLE_KEY n’est lu que dans src/utils/supabase/server.ts', () => {
    const readers = srcFiles.filter((f) => stripComments(readFileSync(f, 'utf8')).includes('SUPABASE_SERVICE_ROLE_KEY')).map(posix)
    expect(readers.filter((f) => f !== 'src/utils/supabase/server.ts')).toEqual([])
  })
  it('aucune variable NEXT_PUBLIC_ ne porte un jeton ou une clé secrète du module', () => {
    const all = srcFiles.map((f) => stripComments(readFileSync(f, 'utf8'))).join('\n')
    expect(all).not.toMatch(/NEXT_PUBLIC_[A-Z_]*(SERVICE|SECRET|TOKEN)/)
  })
})

describe('connexion : pas de message brut, pas de texte libre dans l’adresse', () => {
  it('loginAction ne renvoie jamais error.message', () => {
    const src = stripComments(read('src/app/admin/login/actions.ts'))
    expect(src).not.toMatch(/error\.message/)
    expect(src).toContain('safeAdminRedirect(redirectTo)')
    expect(src).not.toMatch(/redirectTo \|\| '\/admin'/)
  })
  it('la page de connexion ne lit que des codes (e, m) et filtre la redirection', () => {
    const src = stripComments(read('src/app/admin/login/page.tsx'))
    expect(src).not.toMatch(/params\.error|params\.message/)
    expect(src).toContain('isLoginErrorCode(params.e)')
    expect(src).toContain('safeAdminRedirect(params.redirect)')
  })
  it('le middleware transmet un code, pas une phrase', () => {
    const src = stripComments(read('src/middleware.ts'))
    expect(src).toContain("searchParams.set('e', 'noaccess')")
    expect(src).not.toMatch(/searchParams\.set\('error'/)
  })
  it('le callback d’authentification n’affiche pas de texte libre', () => {
    expect(read('src/app/auth/callback/route.ts')).not.toMatch(/login\?error=/)
  })
})

describe('pages à jeton : pas de fuite par Referer, pas de cache', () => {
  it.each(['invitation', 'reinitialiser'])('%s : referrer no-referrer, rendu dynamique', (p) => {
    const src = read(`src/app/admin/${p}/page.tsx`)
    expect(src).toContain("referrer: 'no-referrer'")
    expect(src).toContain("dynamic = 'force-dynamic'")
  })
  it('le jeton n’est envoyé qu’en POST (corps), jamais en GET', () => {
    const src = read('src/app/admin/_auth/NewPasswordForm.tsx')
    expect(src).toContain("method: 'POST'")
    expect(src).not.toMatch(/fetch\([^)]*token=/)
  })
})

describe('ACC-01 migration 020 : revoke seulement', () => {
  const file = readdirSync(join(root, 'supabase/migrations')).find((f) => /^020_revoke_public_gecko_table_reads\.sql$/.test(f))
  const raw = file ? read(`supabase/migrations/${file}`) : ''
  const code = raw.replace(/--.*$/gm, '').toLowerCase()

  it('existe, avec le numéro suivant', () => {
    expect(file).toBeDefined()
  })
  it('retire les 4 politiques publiques et le SELECT anon, rien d’autre', () => {
    for (const t of ['gecko_tables', 'gecko_table_configurations', 'gecko_table_configuration_tables', 'gecko_table_assignments']) {
      expect(code).toMatch(new RegExp(`drop policy if exists "public read ${t}" on public\\.${t};`))
      expect(code).toMatch(new RegExp(`public\\.${t}\\b`))
    }
    expect(code).toMatch(/revoke select on[\s\S]*from anon;/)
  })
  it('ne contient aucune instruction destructive de données ni de structure', () => {
    for (const bad of [/\bdrop\s+table\b/, /\btruncate\b/, /\bdelete\s+from\b/, /\binsert\s+into\b/, /\bupdate\s+public\./, /\balter\s+table\b/, /\bdrop\s+column\b/, /\bcascade\b/, /\bgrant\b/]) {
      expect(code, String(bad)).not.toMatch(bad)
    }
    expect(code.match(/\bdrop\b/g)).toHaveLength(4) // exactement les 4 politiques
  })
  it('ne touche pas aux politiques administrateur', () => {
    expect(code).not.toMatch(/admin manage/)
  })
  it('contient un rollback commenté qui recrée les 4 politiques', () => {
    const rollback = raw.split('\n').filter((l) => l.startsWith('--   ')).join('\n')
    expect((rollback.match(/create policy/g) ?? []).length).toBe(4)
    expect(rollback).toMatch(/grant select on[\s\S]*to anon/)
    expect(raw).toMatch(/DO NOT APPLY without the owner/)
  })
  it('aucune autre migration ne contient de revoke des lectures publiques (un seul fichier)', () => {
    const others = readdirSync(join(root, 'supabase/migrations')).filter((f) => f !== file && /gecko_table/.test(read(`supabase/migrations/${f}`)) && /revoke select/i.test(read(`supabase/migrations/${f}`)))
    expect(others).toEqual([])
  })
})

describe('ACC-02 migration 021 : table de jetons réservée au service role', () => {
  const sql = read('supabase/migrations/021_gecko_access_tokens.sql')
  const code = sql.replace(/--.*$/gm, '').toLowerCase()
  it('table gecko_ préfixée, RLS activée sans politique, aucun privilège public', () => {
    expect(code).toContain('create table if not exists public.gecko_access_tokens')
    expect(code).toMatch(/alter table public\.gecko_access_tokens enable row level security/)
    expect(code).not.toMatch(/create policy/)
    expect(code).toMatch(/revoke all on public\.gecko_access_tokens from public, anon, authenticated/)
  })
  it('stocke une empreinte (64 hex) unique, jamais le jeton', () => {
    expect(code).toMatch(/token_hash text not null unique/)
    expect(code).toMatch(/\^\[0-9a-f\]\{64\}\$/)
    expect(code).not.toMatch(/\btoken text\b/)
  })
  it('un seul jeton vivant par type et par adresse ; emails en minuscules', () => {
    expect(code).toMatch(/create unique index if not exists gecko_access_tokens_one_live[\s\S]*where used_at is null and revoked_at is null/)
    expect(code).toContain('email = lower(email)')
  })
  it('gecko_revoke_admin : service_role seulement, verrou, refuse soi-même et le dernier', () => {
    expect(code).toMatch(/revoke all on function public\.gecko_revoke_admin\(uuid, uuid\) from public, anon, authenticated/)
    expect(code).toMatch(/grant execute on function public\.gecko_revoke_admin\(uuid, uuid\) to service_role/)
    expect(code).toContain('lock table public.gecko_admins')
    expect(code).toContain("return 'self'")
    expect(code).toContain("return 'last'")
    expect(code).toContain('security definer')
    expect(code).toContain('set search_path = public')
  })
  it('n’altère aucune table existante', () => {
    expect(code).not.toMatch(/alter table public\.gecko_(?!access_tokens)/)
    expect(code).not.toMatch(/drop table/)
  })
})

describe('emails', () => {
  const link = 'https://geckocabanerestaurant.com/admin/invitation#token=' + 'A'.repeat(43)
  it('invitation : lien dans le texte et le HTML, jamais dans le sujet, destinataire échappé', () => {
    const m = invitationEmail({ link, expiresAt: new Date('2026-11-08T00:00:00Z'), inviterEmail: '<script>x</script>@e.fr' })
    expect(m.text).toContain(link)
    expect(m.html).toContain(link)
    expect(m.subject).not.toContain('token')
    expect(m.html).not.toContain('<script>')
    expect(m.text).toContain('7 novembre 2026'.replace('7', '8')) // 8 novembre 2026, heure de Krabi
    expect(m.subject).not.toMatch(/[\r\n]/)
  })
  it('réinitialisation : 1 heure, jamais le lien dans le sujet', () => {
    const m = resetEmail({ link: link.replace('invitation', 'reinitialiser'), expiresAt: new Date() })
    expect(m.text).toContain('1 heure')
    expect(m.subject).not.toContain('http')
  })
})

describe('validation et formatage', () => {
  it('critères du mot de passe : 12 caractères, lettre et chiffre, saisies identiques', () => {
    expect(passwordRules('', '').every((r) => !r.ok)).toBe(true)
    expect(passwordRules('Abcdefghij12', 'Abcdefghij12').every((r) => r.ok)).toBe(true)
    expect(passwordRules('Abcdefghij12', 'autre').find((r) => r.id === 'same')?.ok).toBe(false)
    expect(validatePassword('Abcdefghij12', 'Abcdefghij12')).toBeNull()
    expect(validatePassword('Abcdefghij1')).toMatch(/12 caractères/)
    expect(validatePassword('Ab1'.repeat(30))).toMatch(/72/)
  })
  it('formatDay : date calendaire de Krabi', () => {
    expect(formatDay('2026-11-07T20:00:00.000Z')).toBe('2026-11-08') // 03:00 le lendemain à Krabi (UTC+7)
    expect(formatDay('n’importe quoi')).toBe('-')
  })
})
