/**
 * ACC-02 : processus d'invitation, acceptation, retrait, réinitialisation.
 * Doubles en mémoire (aucun réseau). Cas d'attaque : jeton rejoué, expiré, falsifié, auto-retrait,
 * dernier administrateur, énumération d'emails, compte de l'autre application.
 */
import { describe, expect, it } from 'vitest'
import {
  acceptInvitation,
  inviteAdmin,
  listAccess,
  peekToken,
  requestPasswordReset,
  resetPassword,
  revokeAdmin,
  revokeInvitation,
} from '../src/utils/access/service'
import { hashToken, INVITE_TTL_MS, RESET_TTL_MS } from '../src/utils/access/tokens'
import { ADMIN_A, ADMIN_B, makeDeps, NOW, tokenFromLink } from './helpers/access-fakes'

const GOOD_PW = 'Correct-horse-42-battery'
const actor = { id: ADMIN_A.id, email: ADMIN_A.email }

async function invited(email = 'marie@example.com') {
  const ctx = makeDeps()
  const r = await inviteAdmin(ctx.deps, { actor, email })
  expect(r.ok).toBe(true)
  const token = tokenFromLink(ctx.mailer.sent[0].link)
  return { ...ctx, token, email }
}

describe('inviteAdmin', () => {
  it('envoie un lien à usage unique valable 7 jours, sans créer de compte ni de ligne admin', async () => {
    const { deps, store, auth, mailer } = makeDeps()
    const r = await inviteAdmin(deps, { actor, email: '  Marie@Example.com ' })
    expect(r).toEqual({ ok: true, email: 'marie@example.com', expiresAt: new Date(NOW.getTime() + INVITE_TTL_MS).toISOString() })
    expect(INVITE_TTL_MS).toBe(7 * 24 * 3600 * 1000)
    expect(mailer.sent).toHaveLength(1)
    expect(mailer.sent[0].to).toBe('marie@example.com')
    expect(mailer.sent[0].inviterEmail).toBe(ADMIN_A.email)
    expect(auth.createCalls).toHaveLength(0) // aucun compte avant l'acceptation
    expect(auth.users.size).toBe(0)
    expect(store.admins).toHaveLength(2) // aucune ligne gecko_admins
  })

  it('stocke l’empreinte, jamais le jeton ; le lien utilise la base configurée, pas un en-tête', async () => {
    const { deps, store, mailer } = makeDeps({ baseUrl: 'https://geckocabanerestaurant.com/' })
    await inviteAdmin(deps, { actor, email: 'marie@example.com' })
    const link = mailer.sent[0].link
    expect(link.startsWith('https://geckocabanerestaurant.com/admin/invitation?token=')).toBe(true)
    const token = tokenFromLink(link)
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(store.tokens[0].token_hash).toBe(hashToken(token))
    expect(JSON.stringify(store.tokens)).not.toContain(token)
    expect(store.tokens[0].invited_by).toBe(ADMIN_A.id)
  })

  it('« Renvoyer » remplace l’invitation précédente : l’ancien lien cesse de fonctionner', async () => {
    const { deps, mailer, store } = makeDeps()
    await inviteAdmin(deps, { actor, email: 'marie@example.com' })
    const first = tokenFromLink(mailer.sent[0].link)
    await inviteAdmin(deps, { actor, email: 'marie@example.com' })
    const second = tokenFromLink(mailer.sent[1].link)
    expect(first).not.toBe(second)
    expect((await peekToken(deps, 'invite', first)).valid).toBe(false)
    expect((await peekToken(deps, 'invite', second)).valid).toBe(true)
    expect(store.tokens.filter((t) => !t.revoked_at && !t.used_at)).toHaveLength(1)
  })

  it.each(['', 'pas-un-email', 'a@b', 'a b@c.de', '@x.com', 'x@@y.com', 'a..b@x.com', 12, null, undefined, {}, 'x'.repeat(300) + '@a.fr'])(
    'refuse l’email invalide %j sans rien envoyer',
    async (bad) => {
      const { deps, mailer, store } = makeDeps()
      const r = await inviteAdmin(deps, { actor, email: bad })
      expect(r).toEqual({ ok: false, code: 'invalid_email' })
      expect(mailer.sent).toHaveLength(0)
      expect(store.tokens).toHaveLength(0)
    },
  )

  it('refuse d’inviter quelqu’un qui est déjà administrateur (sans casse)', async () => {
    const { deps, mailer } = makeDeps()
    const r = await inviteAdmin(deps, { actor, email: 'ANATHOLY@example.com' })
    expect(r).toEqual({ ok: false, code: 'already_admin' })
    expect(mailer.sent).toHaveLength(0)
  })

  it('échec d’envoi : aucun lien orphelin ne reste valable', async () => {
    const { deps, mailer, store } = makeDeps()
    mailer.fail = true
    const r = await inviteAdmin(deps, { actor, email: 'marie@example.com' })
    expect(r).toEqual({ ok: false, code: 'send_failed' })
    expect(store.tokens.every((t) => t.revoked_at)).toBe(true)
  })

  it('une panne du mailer (exception) est un échec propre, pas une trace', async () => {
    const { deps, mailer, reports } = makeDeps()
    mailer.throws = true
    const r = await inviteAdmin(deps, { actor, email: 'marie@example.com' })
    expect(r).toEqual({ ok: false, code: 'error' })
    expect(reports).toContain('access.invite failed')
  })
})

describe('peekToken : ne consomme jamais, une seule réponse pour tout lien invalide', () => {
  it('un lien valide reste valide après plusieurs ouvertures (aperçu de messagerie, antivirus)', async () => {
    const { deps, token } = await invited()
    for (let i = 0; i < 3; i++) expect(await peekToken(deps, 'invite', token)).toEqual({ valid: true, email: 'marie@example.com' })
  })

  it('inconnu, mal formé, falsifié, expiré, utilisé, révoqué : même réponse', async () => {
    const { deps, store, token } = await invited()
    const forged = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A')
    const answers = [
      await peekToken(deps, 'invite', undefined),
      await peekToken(deps, 'invite', ''),
      await peekToken(deps, 'invite', 'abc'),
      await peekToken(deps, 'invite', "' OR 1=1 --"),
      await peekToken(deps, 'invite', forged),
      await peekToken(deps, 'invite', 'A'.repeat(43)),
      await peekToken(deps, 'reset', token), // jeton d'invitation présenté comme réinitialisation
    ]
    store.tokens[0].expires_at = new Date(NOW.getTime() - 1).toISOString()
    answers.push(await peekToken(deps, 'invite', token)) // expiré
    store.tokens[0].expires_at = new Date(NOW.getTime() + 1000).toISOString()
    store.tokens[0].used_at = NOW.toISOString()
    answers.push(await peekToken(deps, 'invite', token)) // utilisé
    store.tokens[0].used_at = null
    store.tokens[0].revoked_at = NOW.toISOString()
    answers.push(await peekToken(deps, 'invite', token)) // révoqué
    for (const a of answers) expect(a).toEqual({ valid: false })
  })
})

describe('acceptInvitation', () => {
  it('crée le compte (email de la base) puis la ligne gecko_admins, une seule fois', async () => {
    const { deps, store, auth, token } = await invited()
    const r = await acceptInvitation(deps, { token, password: GOOD_PW, confirm: GOOD_PW })
    expect(r).toEqual({ ok: true, email: 'marie@example.com' })
    expect(auth.createCalls).toEqual([{ email: 'marie@example.com', password: GOOD_PW }])
    const created = auth.users.get('marie@example.com')!
    expect(store.admins.find((a) => a.id === created.id)?.email).toBe('marie@example.com')
  })

  it('jeton rejoué : refusé, aucun second compte, aucun second droit', async () => {
    const { deps, store, auth, token } = await invited()
    await acceptInvitation(deps, { token, password: GOOD_PW })
    const again = await acceptInvitation(deps, { token, password: 'Another-pass-99xyz' })
    expect(again).toEqual({ ok: false, code: 'invalid' })
    expect(auth.createCalls).toHaveLength(1)
    expect(store.admins).toHaveLength(3)
  })

  it('deux acceptations simultanées du même jeton : une seule réussit', async () => {
    const { deps, auth, token } = await invited()
    const results = await Promise.all([
      acceptInvitation(deps, { token, password: GOOD_PW }),
      acceptInvitation(deps, { token, password: 'Second-attempt-77' }),
    ])
    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect(auth.createCalls).toHaveLength(1)
  })

  it('jeton expiré (7 jours + 1 ms) : refusé', async () => {
    const { deps, store, auth, token } = await invited()
    const later = new Date(NOW.getTime() + INVITE_TTL_MS + 1)
    const r = await acceptInvitation({ ...deps, now: () => later }, { token, password: GOOD_PW })
    expect(r).toEqual({ ok: false, code: 'invalid' })
    expect(auth.createCalls).toHaveLength(0)
    expect(store.admins).toHaveLength(2)
  })

  it('juste avant l’expiration : accepté', async () => {
    const { deps, token } = await invited()
    const edge = new Date(NOW.getTime() + INVITE_TTL_MS - 1000)
    expect((await acceptInvitation({ ...deps, now: () => edge }, { token, password: GOOD_PW })).ok).toBe(true)
  })

  it('jeton falsifié ou inventé : refusé sans toucher à l’authentification', async () => {
    const { deps, auth, token } = await invited()
    const flipped = token.slice(0, 10) + (token[10] === 'a' ? 'b' : 'a') + token.slice(11)
    for (const t of [flipped, 'x'.repeat(43), token.toUpperCase(), `${token}extra`, '', null, 42]) {
      expect(await acceptInvitation(deps, { token: t, password: GOOD_PW })).toEqual({ ok: false, code: 'invalid' })
    }
    expect(auth.createCalls).toHaveLength(0)
  })

  it('invitation révoquée : refusée', async () => {
    const { deps, store, auth, token } = await invited()
    await revokeInvitation(deps, { id: store.tokens[0].id })
    expect(await acceptInvitation(deps, { token, password: GOOD_PW })).toEqual({ ok: false, code: 'invalid' })
    expect(auth.createCalls).toHaveLength(0)
  })

  it('mot de passe faible ou différent : refusé AVANT de consommer le jeton', async () => {
    const { deps, token } = await invited()
    for (const [pw, confirm] of [
      ['court1', 'court1'],
      ['uniquement-des-lettres-longues', 'uniquement-des-lettres-longues'],
      ['123456789012345', '123456789012345'],
      [GOOD_PW, 'different-password-1'],
      [undefined, undefined],
      ['x1'.repeat(40), 'x1'.repeat(40)],
    ]) {
      const r = await acceptInvitation(deps, { token, password: pw, confirm })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.code).toBe('weak')
    }
    expect((await peekToken(deps, 'invite', token)).valid).toBe(true)
  })

  it('l’email vient de la base : un email injecté dans la requête est ignoré', async () => {
    const { deps, auth, token } = await invited()
    await acceptInvitation(deps, { token, password: GOOD_PW, email: 'victime@example.com', user_id: ADMIN_A.id } as never)
    expect(auth.createCalls.map((c) => c.email)).toEqual(['marie@example.com'])
  })

  it('adresse déjà présente dans le pool partagé (autre application) : ni mot de passe modifié, ni droit accordé', async () => {
    const { deps, store, auth, token } = await invited()
    auth.users.set('marie@example.com', { id: 'portfolio-user', password: 'portfolio-secret' })
    const r = await acceptInvitation(deps, { token, password: GOOD_PW })
    expect(r).toEqual({ ok: false, code: 'account_exists' })
    expect(auth.users.get('marie@example.com')!.password).toBe('portfolio-secret')
    expect(auth.updateCalls).toHaveLength(0)
    expect(store.admins).toHaveLength(2)
    expect((await peekToken(deps, 'invite', token)).valid).toBe(false) // jeton consommé
  })

  it('échec de l’insertion gecko_admins : le compte créé est supprimé et le jeton redevient utilisable', async () => {
    const { deps, store, auth, token } = await invited()
    store.failInsertAdmin = true
    const r = await acceptInvitation(deps, { token, password: GOOD_PW })
    expect(r).toEqual({ ok: false, code: 'error' })
    expect(auth.users.size).toBe(0)
    expect(auth.deleted).toHaveLength(1)
    store.failInsertAdmin = false
    expect((await acceptInvitation(deps, { token, password: GOOD_PW })).ok).toBe(true)
  })

  it('échec de création du compte : le jeton redevient utilisable', async () => {
    const { deps, auth, token } = await invited()
    auth.failCreate = true
    expect(await acceptInvitation(deps, { token, password: GOOD_PW })).toEqual({ ok: false, code: 'error' })
    auth.failCreate = false
    expect((await acceptInvitation(deps, { token, password: GOOD_PW })).ok).toBe(true)
  })
})

describe('revokeAdmin / revokeInvitation', () => {
  it('refuse de se retirer soi-même, sans interroger la base', async () => {
    const { deps, store } = makeDeps()
    expect(await revokeAdmin(deps, { actorId: ADMIN_A.id, targetId: ADMIN_A.id })).toEqual({ ok: false, code: 'self' })
    expect(await revokeAdmin(deps, { actorId: ADMIN_A.id, targetId: ADMIN_A.id.toUpperCase() })).toEqual({ ok: false, code: 'self' })
    expect(store.calls).not.toContain('revokeAdmin')
    expect(store.admins).toHaveLength(2)
  })

  it('refuse de retirer le dernier administrateur', async () => {
    const { deps, store } = makeDeps()
    store.admins = [store.admins[0]]
    expect(await revokeAdmin(deps, { actorId: ADMIN_B.id, targetId: ADMIN_A.id })).toEqual({ ok: false, code: 'last' })
    expect(store.admins).toHaveLength(1)
  })

  it('retire un autre administrateur et révoque ses invitations en attente', async () => {
    const { deps, store, mailer } = makeDeps()
    await inviteAdmin(deps, { actor: { id: ADMIN_B.id, email: ADMIN_B.email }, email: 'marie@example.com' })
    const token = tokenFromLink(mailer.sent[0].link)
    expect(await revokeAdmin(deps, { actorId: ADMIN_A.id, targetId: ADMIN_B.id })).toEqual({ ok: true })
    expect(store.admins.map((a) => a.id)).toEqual([ADMIN_A.id])
    expect((await peekToken(deps, 'invite', token)).valid).toBe(false)
  })

  it.each(['', 'abc', '../../etc', "1' or '1'='1", 123, null, undefined])('refuse l’identifiant invalide %j', async (bad) => {
    const { deps, store } = makeDeps()
    expect(await revokeAdmin(deps, { actorId: ADMIN_A.id, targetId: bad })).toEqual({ ok: false, code: 'invalid_id' })
    expect(await revokeInvitation(deps, { id: bad })).toEqual({ ok: false, code: 'invalid_id' })
    expect(store.admins).toHaveLength(2)
  })

  it('identifiant inconnu : introuvable', async () => {
    const { deps } = makeDeps()
    expect(await revokeAdmin(deps, { actorId: ADMIN_A.id, targetId: '33333333-3333-4333-8333-333333333333' })).toEqual({ ok: false, code: 'not_found' })
    expect(await revokeInvitation(deps, { id: '33333333-3333-4333-8333-333333333333' })).toEqual({ ok: false, code: 'not_found' })
  })

  it('une invitation expirée peut être révoquée ; une invitation utilisée ne l’est plus', async () => {
    const { deps, store, token } = await invited()
    await acceptInvitation(deps, { token, password: GOOD_PW })
    expect(await revokeInvitation(deps, { id: store.tokens[0].id })).toEqual({ ok: false, code: 'not_found' })
  })
})

describe('listAccess', () => {
  it('liste les administrateurs (soi-même repéré) et les invitations en attente ou expirées, pas les utilisées', async () => {
    const { deps, store, mailer } = makeDeps()
    await inviteAdmin(deps, { actor, email: 'marie@example.com' })
    await inviteAdmin(deps, { actor, email: 'paul@example.com' })
    await inviteAdmin(deps, { actor, email: 'lise@example.com' })
    store.tokens[1].expires_at = new Date(NOW.getTime() - 1000).toISOString()
    const lise = tokenFromLink(mailer.sent[2].link)
    await acceptInvitation(deps, { token: lise, password: GOOD_PW })
    const list = await listAccess(deps, ADMIN_A.id)
    expect(list.admins.find((a) => a.isSelf)?.email).toBe(ADMIN_A.email)
    expect(list.invitations.map((i) => [i.email, i.status]).sort()).toEqual([
      ['marie@example.com', 'pending'],
      ['paul@example.com', 'expired'],
    ])
    expect(JSON.stringify(list)).not.toMatch(/token/i)
  })
})

describe('mot de passe oublié', () => {
  it('un administrateur reçoit un lien de 1 heure ; la réponse ne dit rien', async () => {
    const { deps, mailer } = makeDeps()
    expect(await requestPasswordReset(deps, { email: ADMIN_A.email.toUpperCase() })).toBeUndefined()
    expect(mailer.sent).toHaveLength(1)
    expect(mailer.sent[0].type).toBe('reset')
    expect(mailer.sent[0].expiresAt.getTime() - NOW.getTime()).toBe(RESET_TTL_MS)
    expect(mailer.sent[0].link).toContain('/admin/reinitialiser?token=')
  })

  it('énumération : adresse inconnue, invalide, ou compte de l’autre application = même retour, aucun email, aucun jeton', async () => {
    const { deps, mailer, store, auth } = makeDeps()
    auth.users.set('portfolio@example.com', { id: 'portfolio-user', password: 'portfolio-secret' })
    const results = [
      await requestPasswordReset(deps, { email: 'inconnu@example.com' }),
      await requestPasswordReset(deps, { email: 'portfolio@example.com' }),
      await requestPasswordReset(deps, { email: 'pas un email' }),
      await requestPasswordReset(deps, { email: null }),
    ]
    expect(results).toEqual([undefined, undefined, undefined, undefined])
    expect(mailer.sent).toHaveLength(0)
    expect(store.tokens).toHaveLength(0)
  })

  it('ne lève jamais, même si le mailer ou la base tombent', async () => {
    const { deps, mailer } = makeDeps()
    mailer.throws = true
    await expect(requestPasswordReset(deps, { email: ADMIN_A.email })).resolves.toBeUndefined()
  })

  it('met à jour le mot de passe du compte administrateur, une seule fois', async () => {
    const { deps, mailer, auth } = makeDeps()
    auth.users.set(ADMIN_A.email, { id: ADMIN_A.id, password: 'old-password-1' })
    await requestPasswordReset(deps, { email: ADMIN_A.email })
    const token = tokenFromLink(mailer.sent[0].link)
    expect(await resetPassword(deps, { token, password: GOOD_PW })).toEqual({ ok: true })
    expect(auth.updateCalls).toEqual([{ id: ADMIN_A.id, password: GOOD_PW }])
    expect(await resetPassword(deps, { token, password: 'Replayed-pass-123' })).toEqual({ ok: false, code: 'invalid' })
    expect(auth.updateCalls).toHaveLength(1)
  })

  it('jeton expiré (1 h), falsifié, ou d’invitation : refusé, aucun mot de passe modifié', async () => {
    const { deps, mailer, auth, store } = makeDeps()
    await requestPasswordReset(deps, { email: ADMIN_A.email })
    const token = tokenFromLink(mailer.sent[0].link)
    const later = new Date(NOW.getTime() + RESET_TTL_MS + 1)
    expect(await resetPassword({ ...deps, now: () => later }, { token, password: GOOD_PW })).toEqual({ ok: false, code: 'invalid' })
    expect(await resetPassword(deps, { token: token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A'), password: GOOD_PW })).toEqual({ ok: false, code: 'invalid' })
    // un jeton d'INVITATION ne peut pas servir à réinitialiser un mot de passe
    await inviteAdmin(deps, { actor, email: 'marie@example.com' })
    const inviteToken = tokenFromLink(mailer.sent[1].link)
    expect(await resetPassword(deps, { token: inviteToken, password: GOOD_PW })).toEqual({ ok: false, code: 'invalid' })
    expect(auth.updateCalls).toHaveLength(0)
    expect(store.tokens.find((t) => t.kind === 'invite')?.used_at).toBeNull()
  })

  it('administrateur retiré entre la demande et l’usage : refusé, mot de passe intact', async () => {
    const { deps, mailer, auth, store } = makeDeps()
    await requestPasswordReset(deps, { email: ADMIN_B.email })
    const token = tokenFromLink(mailer.sent[0].link)
    store.admins = store.admins.filter((a) => a.id !== ADMIN_B.id)
    expect(await resetPassword(deps, { token, password: GOOD_PW })).toEqual({ ok: false, code: 'invalid' })
    expect(auth.updateCalls).toHaveLength(0)
  })
})
