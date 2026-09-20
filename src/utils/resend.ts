import { Resend } from 'resend'

let client: Resend | null = null

/** Lazily-created Resend client (avoids throwing at import time when the key is unset). */
export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!client) client = new Resend(process.env.RESEND_API_KEY)
  return client
}

export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'Gecko Cabane <reservations@geckocabanerestaurant.com>'

export const RESTAURANT_NOTIFICATION_EMAIL = process.env.RESTAURANT_NOTIFICATION_EMAIL

const DAY_LABELS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MONTH_LABELS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

/** Formats a YYYY-MM-DD date string as "lundi 12 janvier 2027" (French, no timezone conversion). */
export function formatReservationDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  return `${DAY_LABELS[d.getUTCDay()]} ${day} ${MONTH_LABELS[month - 1]} ${year}`
}

interface ReservationDetails {
  customer_name: string
  customer_email?: string | null
  customer_phone: string
  reservation_date: string
  reservation_time: string
  party_size: number
  occasion?: string | null
}

function baseTemplate(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#F5EEDA;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5EEDA;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#FAF0E6;border:1px solid #E8DCC8;">
            <tr>
              <td style="background:#0D1F17;padding:28px 32px;text-align:center;">
                <p style="margin:0;color:#C69B3C;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Gecko Cabane</p>
                <p style="margin:6px 0 0;color:#FAF0E6;opacity:0.6;font-size:12px;">Cuisine Franco-Thaï · Krabi</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;color:#1A0E00;font-size:20px;font-weight:normal;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #E8DCC8;text-align:center;">
                <p style="margin:0;color:#5C4A3A;font-size:12px;">
                  1/36-37 Soi Ruamjit, Maharat Road, Krabi Town 81000, Thaïlande<br />
                  +66 81 958 5945
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function detailsTable(r: ReservationDetails): string {
  const rows: [string, string][] = [
    ['Date', formatReservationDate(r.reservation_date)],
    ['Heure', r.reservation_time],
    ['Couverts', String(r.party_size)],
  ]
  if (r.occasion) rows.push(['Occasion', r.occasion])
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
  ${rows
    .map(
      ([label, value]) => `
  <tr>
    <td style="padding:6px 0;color:#5C4A3A;font-size:13px;text-transform:uppercase;letter-spacing:1px;width:120px;">${label}</td>
    <td style="padding:6px 0;color:#1A0E00;font-size:15px;">${value}</td>
  </tr>`
    )
    .join('')}
</table>`
}

export function customerPendingEmail(r: ReservationDetails) {
  const html = baseTemplate(
    `Merci pour votre demande, ${r.customer_name}`,
    `
    <p style="color:#5C4A3A;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Nous avons bien reçu votre demande de réservation. Notre équipe la confirmera sous peu par téléphone ou par email.
    </p>
    ${detailsTable(r)}
    <p style="color:#5C4A3A;font-size:13px;font-style:italic;margin:0;">
      Cette réservation est en attente de confirmation — elle n'est définitive qu'une fois validée par le restaurant.
    </p>`
  )
  return { subject: 'Votre demande de réservation — Gecko Cabane', html }
}

export function restaurantNotificationEmail(r: ReservationDetails) {
  const html = baseTemplate(
    'Nouvelle demande de réservation',
    `
    ${detailsTable(r)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;border-top:1px solid #E8DCC8;padding-top:16px;">
      <tr>
        <td style="padding:4px 0;color:#5C4A3A;font-size:13px;text-transform:uppercase;letter-spacing:1px;width:120px;">Client</td>
        <td style="padding:4px 0;color:#1A0E00;font-size:15px;">${r.customer_name}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#5C4A3A;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Téléphone</td>
        <td style="padding:4px 0;color:#1A0E00;font-size:15px;">${r.customer_phone}</td>
      </tr>
      ${
        r.customer_email
          ? `<tr>
        <td style="padding:4px 0;color:#5C4A3A;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Email</td>
        <td style="padding:4px 0;color:#1A0E00;font-size:15px;">${r.customer_email}</td>
      </tr>`
          : ''
      }
    </table>`
  )
  return { subject: `Nouvelle réservation — ${r.customer_name} (${r.party_size} pers.)`, html }
}

export function customerStatusEmail(r: ReservationDetails, status: 'confirmed' | 'cancelled') {
  const title = status === 'confirmed' ? 'Réservation confirmée' : 'Réservation annulée'
  const intro =
    status === 'confirmed'
      ? `Votre réservation est confirmée, ${r.customer_name}. Nous avons hâte de vous accueillir.`
      : `Votre réservation a été annulée, ${r.customer_name}. N'hésitez pas à nous contacter pour en planifier une nouvelle.`
  const html = baseTemplate(
    title,
    `
    <p style="color:#5C4A3A;font-size:15px;line-height:1.6;margin:0 0 20px;">${intro}</p>
    ${detailsTable(r)}`
  )
  return {
    subject: status === 'confirmed' ? 'Réservation confirmée — Gecko Cabane' : 'Réservation annulée — Gecko Cabane',
    html,
  }
}
