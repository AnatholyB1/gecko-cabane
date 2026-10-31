/**
 * Emails du module « Accès » : invitation d'un administrateur, réinitialisation du mot de passe.
 * Texte seul + HTML minimal. Le lien est la seule donnée sensible : il n'apparaît jamais dans un sujet.
 * Fonctions pures (aucun envoi ici : voir deps.ts).
 */

import { escapeHtml, stripLineBreaks } from '../html'

const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Bangkok',
})

export function formatLongDate(date: Date): string {
  return FORMAT_DATE.format(date)
}

function wrap(title: string, body: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#F7F4EC;font-family:Arial,Helvetica,sans-serif;color:#1B2A22;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E2DCCB;">
<tr><td style="padding:28px 32px 8px;"><p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#7A5C16;">Gecko Cabane</p>
<h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;color:#1F3D2F;">${escapeHtml(title)}</h1></td></tr>
<tr><td style="padding:16px 32px 32px;font-size:16px;line-height:1.6;">${body}</td></tr>
</table></td></tr></table></body></html>`
}

function button(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td bgcolor="#1F3D2F" style="background:#1F3D2F;">
<a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:16px;text-decoration:none;">${escapeHtml(label)}</a></td></tr></table>`
}

export function invitationEmail(args: { link: string; expiresAt: Date; inviterEmail: string }): {
  subject: string
  html: string
  text: string
} {
  const until = formatLongDate(args.expiresAt)
  const subject = stripLineBreaks("Invitation à l'administration du Gecko Cabane")
  const text = [
    `${args.inviterEmail} vous invite à rejoindre l'administration du Gecko Cabane.`,
    `Ouvrez ce lien pour choisir votre mot de passe (valable jusqu'au ${until}, une seule fois) :`,
    args.link,
    "Vous aurez les mêmes droits que les autres administrateurs : réservations, carte, site, avis.",
    "Si vous n'attendiez pas cette invitation, ignorez cet email : aucun compte n'est créé tant que vous n'ouvrez pas le lien.",
  ].join('\n\n')
  const html = wrap(
    "Invitation à l'administration",
    `<p style="margin:0 0 12px;">${escapeHtml(args.inviterEmail)} vous invite à rejoindre l'administration du Gecko Cabane.</p>
<p style="margin:0 0 12px;">Le lien est valable jusqu'au ${escapeHtml(until)} et ne fonctionne qu'une seule fois. Vous y choisissez votre mot de passe.</p>
${button(args.link, 'Choisir mon mot de passe')}
<p style="margin:0 0 12px;font-size:14px;color:#5E6B62;">Si le bouton ne s'affiche pas, copiez ce lien : ${escapeHtml(args.link)}</p>
<p style="margin:0 0 12px;font-size:14px;color:#5E6B62;">Vous aurez les mêmes droits que les autres administrateurs : réservations, carte, site, avis.</p>
<p style="margin:0;font-size:14px;color:#5E6B62;">Vous n'attendiez pas cette invitation ? Ignorez cet email : aucun compte n'est créé tant que vous n'ouvrez pas le lien.</p>`,
  )
  return { subject, html, text }
}

export function resetEmail(args: { link: string; expiresAt: Date }): { subject: string; html: string; text: string } {
  const subject = stripLineBreaks('Réinitialisation du mot de passe, Gecko Cabane')
  const text = [
    "Une réinitialisation du mot de passe de l'administration du Gecko Cabane a été demandée.",
    'Ouvrez ce lien pour choisir un nouveau mot de passe (valable 1 heure, une seule fois) :',
    args.link,
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe ne change pas.",
  ].join('\n\n')
  const html = wrap(
    'Réinitialisation du mot de passe',
    `<p style="margin:0 0 12px;">Une réinitialisation du mot de passe de l'administration du Gecko Cabane a été demandée.</p>
<p style="margin:0 0 12px;">Le lien est valable 1 heure et ne fonctionne qu'une seule fois.</p>
${button(args.link, 'Choisir un nouveau mot de passe')}
<p style="margin:0 0 12px;font-size:14px;color:#5E6B62;">Si le bouton ne s'affiche pas, copiez ce lien : ${escapeHtml(args.link)}</p>
<p style="margin:0;font-size:14px;color:#5E6B62;">Vous n'êtes pas à l'origine de cette demande ? Ignorez cet email : votre mot de passe ne change pas.</p>`,
  )
  return { subject, html, text }
}
