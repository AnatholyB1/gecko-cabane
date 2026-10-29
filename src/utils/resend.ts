import { Resend } from 'resend'
import { escapeHtml, stripLineBreaks } from './html'

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

import type { EmailLocale } from './email-locales'
export { EMAIL_LOCALES } from './email-locales'
export type { EmailLocale } from './email-locales'

const WHATSAPP_DISPLAY = '+66 81 958 5945'

const COPY: Record<
  EmailLocale,
  {
    dateLocale: string
    tagline: string
    address: string
    labels: { date: string; time: string; guests: string; occasion: string }
    pendingTitle: (name: string) => string
    pendingIntro: string
    pendingNote: string
    pendingSubject: string
    changeLine: string
    confirmedTitle: string
    cancelledTitle: string
    confirmedIntro: (name: string) => string
    cancelledIntro: (name: string) => string
    confirmedSubject: string
    cancelledSubject: string
  }
> = {
  fr: {
    dateLocale: 'fr-FR',
    tagline: 'Cuisine Franco-Thaï · Krabi',
    address: '1/36-37 Soi Ruamjit, Maharat Road, Krabi Town 81000, Thaïlande',
    labels: { date: 'Date', time: 'Heure', guests: 'Couverts', occasion: 'Occasion' },
    pendingTitle: (n) => `Merci pour votre demande, ${n}`,
    pendingIntro:
      'Nous avons bien reçu votre demande de réservation. Notre équipe la confirmera sous peu par téléphone ou par email.',
    pendingNote:
      "Cette réservation est en attente de confirmation — elle n'est définitive qu'une fois validée par le restaurant.",
    pendingSubject: 'Votre demande de réservation — Gecko Cabane',
    changeLine: `Pour modifier ou annuler, écrivez-nous sur WhatsApp au ${WHATSAPP_DISPLAY}.`,
    confirmedTitle: 'Réservation confirmée',
    cancelledTitle: 'Réservation annulée',
    confirmedIntro: (n) => `Votre réservation est confirmée, ${n}. Nous avons hâte de vous accueillir.`,
    cancelledIntro: (n) =>
      `Votre réservation a été annulée, ${n}. N'hésitez pas à nous contacter pour en planifier une nouvelle.`,
    confirmedSubject: 'Réservation confirmée — Gecko Cabane',
    cancelledSubject: 'Réservation annulée — Gecko Cabane',
  },
  en: {
    dateLocale: 'en-GB',
    tagline: 'French-Thai cuisine · Krabi',
    address: '1/36-37 Soi Ruamjit, Maharat Road, Krabi Town 81000, Thailand',
    labels: { date: 'Date', time: 'Time', guests: 'Guests', occasion: 'Occasion' },
    pendingTitle: (n) => `Thank you for your request, ${n}`,
    pendingIntro:
      'We have received your reservation request. The restaurant will confirm it shortly by email.',
    pendingNote:
      'This reservation is pending confirmation — it is only final once the restaurant has confirmed it.',
    pendingSubject: 'Your reservation request at Gecko Cabane',
    changeLine: `To change or cancel, message us on WhatsApp at ${WHATSAPP_DISPLAY}.`,
    confirmedTitle: 'Reservation confirmed',
    cancelledTitle: 'Reservation cancelled',
    confirmedIntro: (n) => `Your reservation is confirmed, ${n}. We look forward to welcoming you.`,
    cancelledIntro: (n) =>
      `Your reservation has been cancelled, ${n}. Please get in touch if you would like to book another table.`,
    confirmedSubject: 'Reservation confirmed — Gecko Cabane',
    cancelledSubject: 'Reservation cancelled — Gecko Cabane',
  },
  de: {
    dateLocale: 'de-DE',
    tagline: 'Französisch-thailändische Küche · Krabi',
    address: '1/36-37 Soi Ruamjit, Maharat Road, Krabi Town 81000, Thailand',
    labels: { date: 'Datum', time: 'Uhrzeit', guests: 'Gäste', occasion: 'Anlass' },
    pendingTitle: (n) => `Danke für Ihre Anfrage, ${n}`,
    pendingIntro:
      'Wir haben Ihre Reservierungsanfrage erhalten. Das Restaurant bestätigt sie in Kürze per E-Mail.',
    pendingNote:
      'Diese Reservierung ist noch nicht bestätigt – sie ist erst verbindlich, wenn das Restaurant sie bestätigt hat.',
    pendingSubject: 'Ihre Reservierungsanfrage im Gecko Cabane',
    changeLine: `Für Änderungen oder Stornierungen schreiben Sie uns bitte per WhatsApp an ${WHATSAPP_DISPLAY}.`,
    confirmedTitle: 'Reservierung bestätigt',
    cancelledTitle: 'Reservierung storniert',
    confirmedIntro: (n) => `Ihre Reservierung ist bestätigt, ${n}. Wir freuen uns darauf, Sie zu begrüßen.`,
    cancelledIntro: (n) =>
      `Ihre Reservierung wurde storniert, ${n}. Melden Sie sich gern bei uns, wenn Sie einen neuen Tisch reservieren möchten.`,
    confirmedSubject: 'Reservierung bestätigt – Gecko Cabane',
    cancelledSubject: 'Reservierung storniert – Gecko Cabane',
  },
  sv: {
    dateLocale: 'sv-SE',
    tagline: 'Fransk-thailändskt kök · Krabi',
    address: '1/36-37 Soi Ruamjit, Maharat Road, Krabi Town 81000, Thailand',
    labels: { date: 'Datum', time: 'Tid', guests: 'Gäster', occasion: 'Tillfälle' },
    pendingTitle: (n) => `Tack för din förfrågan, ${n}`,
    pendingIntro:
      'Vi har tagit emot din bokningsförfrågan. Restaurangen bekräftar den inom kort via e-post.',
    pendingNote:
      'Bokningen väntar på bekräftelse – den är först bindande när restaurangen har bekräftat den.',
    pendingSubject: 'Din bokningsförfrågan på Gecko Cabane',
    changeLine: `Vill du ändra eller avboka, skriv till oss på WhatsApp på ${WHATSAPP_DISPLAY}.`,
    confirmedTitle: 'Bokningen är bekräftad',
    cancelledTitle: 'Bokningen är avbokad',
    confirmedIntro: (n) => `Din bokning är bekräftad, ${n}. Vi ser fram emot att få ta emot dig.`,
    cancelledIntro: (n) =>
      `Din bokning har avbokats, ${n}. Hör gärna av dig om du vill boka ett nytt bord.`,
    confirmedSubject: 'Bokningen är bekräftad – Gecko Cabane',
    cancelledSubject: 'Bokningen är avbokad – Gecko Cabane',
  },
}

/** Formats a YYYY-MM-DD date as a long date ("samedi 24 octobre 2026" / "Saturday 24 October 2026"). */
export function formatReservationDate(dateStr: string, locale: EmailLocale = 'fr'): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  const parts = new Intl.DateTimeFormat(COPY[locale].dateLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('weekday')} ${get('day')} ${get('month')} ${get('year')}`
}

export interface ReservationDetails {
  customer_name: string
  customer_email?: string | null
  customer_phone: string
  reservation_date: string
  reservation_time: string
  party_size: number
  occasion?: string | null
  locale?: EmailLocale
}

function baseTemplate(
  title: string,
  bodyHtml: string,
  locale: EmailLocale = 'fr',
  footerNote?: string,
  footerHtml?: string
): string {
  const c = COPY[locale]
  const noteHtml = footerNote ? `${escapeHtml(footerNote)}<br />\n                  ` : ''
  return `
<!DOCTYPE html>
<html lang="${locale}">
  <body style="margin:0;padding:0;background:#F5EEDA;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5EEDA;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#FAF0E6;border:1px solid #E8DCC8;">
            <tr>
              <td style="background:#0D1F17;padding:28px 32px;text-align:center;">
                <p style="margin:0;color:#C69B3C;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Gecko Cabane</p>
                <p style="margin:6px 0 0;color:#FAF0E6;opacity:0.6;font-size:12px;">${c.tagline}</p>
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
                  ${noteHtml}${c.address}<br />
                  ${WHATSAPP_DISPLAY}
                </p>
                ${footerHtml ?? ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function detailsTable(r: ReservationDetails, locale: EmailLocale = 'fr'): string {
  const l = COPY[locale].labels
  const rows: [string, string][] = [
    [l.date, escapeHtml(formatReservationDate(r.reservation_date, locale))],
    [l.time, escapeHtml(r.reservation_time)],
    [l.guests, escapeHtml(r.party_size)],
  ]
  if (r.occasion) rows.push([l.occasion, escapeHtml(r.occasion)])
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

export function customerPendingEmail(r: ReservationDetails, locale: EmailLocale = 'fr') {
  const c = COPY[locale]
  const html = baseTemplate(
    c.pendingTitle(escapeHtml(r.customer_name)),
    `
    <p style="color:#5C4A3A;font-size:15px;line-height:1.6;margin:0 0 20px;">
      ${c.pendingIntro}
    </p>
    ${detailsTable(r, locale)}
    <p style="color:#5C4A3A;font-size:13px;font-style:italic;margin:0 0 12px;">
      ${c.pendingNote}
    </p>
    <p style="color:#5C4A3A;font-size:13px;margin:0;">${c.changeLine}</p>`,
    locale
  )
  return { subject: c.pendingSubject, html }
}

/** Staff notification: always French, shows the guest language. */
export function restaurantNotificationEmail(r: ReservationDetails) {
  const lang = (r.locale ?? 'fr').toUpperCase()
  const html = baseTemplate(
    'Nouvelle demande de réservation',
    `
    ${detailsTable(r, 'fr')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;border-top:1px solid #E8DCC8;padding-top:16px;">
      <tr>
        <td style="padding:4px 0;color:#5C4A3A;font-size:13px;text-transform:uppercase;letter-spacing:1px;width:120px;">Client</td>
        <td style="padding:4px 0;color:#1A0E00;font-size:15px;">${escapeHtml(r.customer_name)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#5C4A3A;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Téléphone</td>
        <td style="padding:4px 0;color:#1A0E00;font-size:15px;">${escapeHtml(r.customer_phone)}</td>
      </tr>
      ${
        r.customer_email
          ? `<tr>
        <td style="padding:4px 0;color:#5C4A3A;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Email</td>
        <td style="padding:4px 0;color:#1A0E00;font-size:15px;">${escapeHtml(r.customer_email)}</td>
      </tr>`
          : ''
      }
      <tr>
        <td style="padding:4px 0;color:#5C4A3A;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Langue du client</td>
        <td style="padding:4px 0;color:#1A0E00;font-size:15px;">${escapeHtml(lang)}</td>
      </tr>
    </table>`,
    'fr'
  )
  return { subject: `Nouvelle réservation — ${stripLineBreaks(r.customer_name)} (${r.party_size} pers.)`, html }
}

export function customerStatusEmail(
  r: ReservationDetails,
  status: 'confirmed' | 'cancelled',
  locale: EmailLocale = 'fr'
) {
  const c = COPY[locale]
  const name = escapeHtml(r.customer_name)
  const confirmed = status === 'confirmed'
  const html = baseTemplate(
    confirmed ? c.confirmedTitle : c.cancelledTitle,
    `
    <p style="color:#5C4A3A;font-size:15px;line-height:1.6;margin:0 0 20px;">${
      confirmed ? c.confirmedIntro(name) : c.cancelledIntro(name)
    }</p>
    ${detailsTable(r, locale)}`,
    locale
  )
  return { subject: confirmed ? c.confirmedSubject : c.cancelledSubject, html }
}

// ---------------------------------------------------------------------------
// Review invitation (Phase 4, REV-03). Transactional tone: no incentive (D-18).
// ---------------------------------------------------------------------------

const REVIEW_COPY: Record<
  EmailLocale,
  {
    greeting: (name: string) => string
    invite: { subject: string; title: string; body: string }
    reminder: { subject: string; title: string; body: string }
    cta: string
    fallback: (url: string) => string
    footer: string
  }
> = {
  fr: {
    greeting: (n) => `Bonjour ${n},`,
    invite: {
      subject: 'Votre visite au Gecko Cabane',
      title: 'Merci de votre visite',
      body: "Merci d'être venus chez nous. Si vous avez une minute, un avis nous aide beaucoup.",
    },
    reminder: {
      subject: 'Un petit mot sur votre visite ?',
      title: 'Un dernier petit mot',
      body: 'Nous ne vous écrirons pas à ce sujet une troisième fois. Si le coeur vous en dit, votre avis nous aide beaucoup.',
    },
    cta: 'Donner mon avis',
    fallback: (u) => `Si le bouton ne s'affiche pas, copiez ce lien : ${u}`,
    footer: 'Vous recevez ce message suite à votre réservation au Gecko Cabane.',
  },
  en: {
    greeting: (n) => `Hello ${n},`,
    invite: {
      subject: 'Your visit to Gecko Cabane',
      title: 'Thank you for your visit',
      body: 'Thank you for visiting us. If you have a minute, a review helps us a great deal.',
    },
    reminder: {
      subject: 'A quick word about your visit?',
      title: 'One last note',
      body: 'We will not write about this a third time. If you feel like it, your review helps us a great deal.',
    },
    cta: 'Leave a review',
    fallback: (u) => `If the button does not show, copy this link: ${u}`,
    footer: 'You are receiving this message following your reservation at Gecko Cabane.',
  },
  de: {
    greeting: (n) => `Guten Tag ${n},`,
    invite: {
      subject: 'Ihr Besuch im Gecko Cabane',
      title: 'Danke für Ihren Besuch',
      body: 'Danke, dass Sie bei uns zu Gast waren. Wenn Sie eine Minute Zeit haben, hilft uns eine Bewertung sehr.',
    },
    reminder: {
      subject: 'Ein kurzes Wort zu Ihrem Besuch?',
      title: 'Ein letztes Wort',
      body: 'Wir schreiben Ihnen dazu kein drittes Mal. Wenn Sie Lust haben, hilft uns Ihre Bewertung sehr.',
    },
    cta: 'Bewertung abgeben',
    fallback: (u) => `Falls die Schaltfläche nicht angezeigt wird, kopieren Sie diesen Link: ${u}`,
    footer: 'Sie erhalten diese Nachricht im Anschluss an Ihre Reservierung im Gecko Cabane.',
  },
  sv: {
    greeting: (n) => `Hej ${n},`,
    invite: {
      subject: 'Ditt besök på Gecko Cabane',
      title: 'Tack för ditt besök',
      body: 'Tack för att du åt hos oss. Har du en minut över hjälper en recension oss väldigt mycket.',
    },
    reminder: {
      subject: 'Några ord om ditt besök?',
      title: 'Ett sista litet ord',
      body: 'Vi skriver inte till dig om detta en tredje gång. Känner du för det hjälper din recension oss väldigt mycket.',
    },
    cta: 'Lämna en recension',
    fallback: (u) => `Om knappen inte visas, kopiera den här länken: ${u}`,
    footer: 'Du får det här meddelandet efter din bokning på Gecko Cabane.',
  },
}

export function reviewInvitationEmail(
  locale: EmailLocale,
  url: string,
  kind: 'invite' | 'reminder',
  name?: string | null
): { subject: string; html: string; text: string } {
  const c = REVIEW_COPY[locale]
  const k = c[kind]
  const first = (name ?? '').trim().split(/\s+/)[0] ?? ''
  const greetingText = first ? c.greeting(first) : ''
  const greetingHtml = first
    ? `<p style="color:#5C4A3A;font-size:15px;line-height:1.6;margin:0 0 12px;">${escapeHtml(c.greeting(first))}</p>`
    : ''
  const safeUrl = escapeHtml(url)
  const html = baseTemplate(
    escapeHtml(k.title),
    `
    ${greetingHtml}
    <p style="color:#5C4A3A;font-size:15px;line-height:1.6;margin:0 0 24px;">${escapeHtml(k.body)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td bgcolor="#0C3C2D" style="background:#0C3C2D;">
          <a href="${safeUrl}" style="display:inline-block;padding:16px 32px;color:#FAF0E6;font-size:14px;text-transform:uppercase;letter-spacing:2px;text-decoration:none;">${escapeHtml(c.cta)}</a>
        </td>
      </tr>
    </table>
    <p style="color:#5C4A3A;font-size:14px;font-style:italic;line-height:1.5;margin:0;">${escapeHtml(
      c.fallback('')
    )}${safeUrl}</p>`,
    locale,
    c.footer
  )
  const text = [greetingText, k.body, `${c.cta}: ${url}`, c.footer]
    .filter(Boolean)
    .join('\n\n')
  return { subject: stripLineBreaks(k.subject), html, text }
}

