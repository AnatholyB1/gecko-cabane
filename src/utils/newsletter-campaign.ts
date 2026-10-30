/**
 * Season campaign email "Retrouvez la table" (kind `october_return`, sent in November).
 * Pure module. Built for Gmail, Outlook (Word engine) and Apple Mail: nested tables,
 * inline styles, bulletproof buttons (VML for Outlook), no modern CSS. Every image is a
 * real photo of the restaurant hosted on the site domain, with full alt text and a text
 * fallback. No offer, price, rating or review count appears (nothing unverifiable).
 */

import { escapeHtml, stripLineBreaks } from './html'
import { SITE_URL } from './seo'
import { guideUrl } from './newsletter-links'

export type CampaignLocale = 'fr' | 'en'

export const CAMPAIGN_UTM = 'utm_source=newsletter&utm_medium=email&utm_campaign=season-2026'

export const CAMPAIGN_IMAGES = {
  hero: '/email/campaign-hero.jpg',
  massaman: '/email/campaign-tile-massaman.jpg',
  bourguignon: '/email/campaign-tile-bourguignon.jpg',
  entrance: '/email/campaign-tile-entrance.jpg',
  sign: '/email/campaign-tile-sign.jpg',
} as const

const PHONE_DISPLAY = '+66 81 958 5945'
const PHONE_TEL = 'tel:+66819585945'
const WHATSAPP_URL = 'https://wa.me/66819585945'
const ADDRESS = '1/36-37 Soi Ruamjit, Maharat Road, Krabi Town 81000, Thailand'

const COPY = {
  fr: {
    subject: 'Retrouvez la table au Gecko Cabane',
    preview: 'La saison commence à Krabi : Jariya et l’équipe vous attendent sur Maharat Road.',
    heroAlt:
      'Une table en bois sombre éclairée à la bougie, avec un verre en cristal et un petit gecko doré, au milieu des plantes tropicales du Gecko Cabane',
    title: 'Retrouvez la table',
    hook:
      'La haute saison commence à Krabi. Jariya et l’équipe vous accueillent de nouveau sur Maharat Road, pour une cuisine franco-thaï.',
    tiles: [
      { key: 'massaman', caption: 'Souris d’agneau au curry Massaman', alt: 'Souris d’agneau au curry Massaman servie avec du riz et un bâton de cannelle' },
      { key: 'bourguignon', caption: 'Bœuf bourguignon', alt: 'Bœuf bourguignon avec sa purée, des carottes et du pain de campagne' },
      { key: 'entrance', caption: 'L’entrée du restaurant', alt: 'L’entrée éclairée du restaurant Gecko Cabane le soir, entre les plantes et les lanternes' },
      { key: 'sign', caption: 'L’enseigne, le soir', alt: 'L’enseigne lumineuse Gecko Cabane Restaurant avec son gecko, de nuit' },
    ],
    book: 'Réserver une table',
    guide: 'Le guide gourmand de Krabi Town',
    infoTitle: 'Infos pratiques',
    closed: 'Ouvert tous les jours',
    kitchen: 'Cuisine ouverte jusqu’à 22h00',
    whatsapp: 'WhatsApp',
    signoff: 'À bientôt, Jariya et l’équipe de Gecko Cabane',
    why: 'Vous recevez cet email parce que vous êtes inscrit(e) à la newsletter de Gecko Cabane.',
    unsubscribe: 'Se désinscrire',
    legal: 'Conformément au PDPA B.E. 2562 et au RGPD.',
  },
  en: {
    subject: 'Come back to the table at Gecko Cabane',
    preview: 'The season is starting in Krabi: Jariya and the team are waiting on Maharat Road.',
    heroAlt:
      'A dark wooden table lit by a single candle, with a crystal glass and a small golden gecko, among the tropical plants of Gecko Cabane',
    title: 'Come back to the table',
    hook:
      'High season is starting in Krabi. Jariya and the team welcome you again on Maharat Road, for French-Thai cooking.',
    tiles: [
      { key: 'massaman', caption: 'Lamb shank in Massaman curry', alt: 'Lamb shank in Massaman curry served with rice and a cinnamon stick' },
      { key: 'bourguignon', caption: 'Beef bourguignon', alt: 'Beef bourguignon with mashed potatoes, carrots and country bread' },
      { key: 'entrance', caption: 'The restaurant entrance', alt: 'The lit entrance of Gecko Cabane restaurant in the evening, among plants and lanterns' },
      { key: 'sign', caption: 'The sign at night', alt: 'The illuminated Gecko Cabane Restaurant sign with its gecko, at night' },
    ],
    book: 'Book a table',
    guide: 'The Krabi Town food guide',
    infoTitle: 'Good to know',
    closed: 'Open every day',
    kitchen: 'Kitchen open until 10:00 pm',
    whatsapp: 'WhatsApp',
    signoff: 'See you soon, Jariya and the Gecko Cabane team',
    why: 'You receive this email because you subscribed to the Gecko Cabane newsletter.',
    unsubscribe: 'Unsubscribe',
    legal: 'In line with PDPA B.E. 2562 and GDPR.',
  },
} as const

const FONT = "Georgia,'Times New Roman',serif"

function img(src: string, alt: string, width: number, extra = ''): string {
  return `<img src="${SITE_URL}${src}" width="${width}" alt="${escapeHtml(alt)}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0;outline:none;text-decoration:none;font-family:${FONT};font-size:13px;line-height:1.4;color:#5C4A3A;${extra}" />`
}

/** Bulletproof button: VML round rect for Outlook, padded link everywhere else. */
function bulletproofButton(href: string, label: string, primary: boolean): string {
  const bg = primary ? '#0C3C2D' : '#FAF0E6'
  const fg = primary ? '#FAF0E6' : '#0C3C2D'
  const border = '#0C3C2D'
  const h = escapeHtml(href)
  const l = escapeHtml(label)
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 14px;">
  <tr>
    <td align="center" bgcolor="${bg}" style="background:${bg};border:2px solid ${border};">
      <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${h}" style="height:48px;v-text-anchor:middle;width:300px;" arcsize="0%" strokecolor="${border}" strokeweight="2px" fillcolor="${bg}"><w:anchorlock/><center style="color:${fg};font-family:${FONT};font-size:14px;letter-spacing:2px;text-transform:uppercase;">${l}</center></v:roundrect><![endif]-->
      <!--[if !mso]><!-- --><a href="${h}" style="display:block;min-width:240px;padding:15px 28px;color:${fg};font-family:${FONT};font-size:14px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;text-align:center;">${l}</a><!--<![endif]-->
    </td>
  </tr>
</table>`
}

export function campaignBookUrl(locale: CampaignLocale): string {
  return `${SITE_URL}/${locale}?${CAMPAIGN_UTM}#reservation`
}

export function campaignGuideUrl(locale: CampaignLocale): string {
  return guideUrl(locale)
}

export interface CampaignEmail {
  subject: string
  html: string
  text: string
}

export function campaignEmail(locale: CampaignLocale, unsubscribeUrl: string): CampaignEmail {
  const c = COPY[locale]
  const book = campaignBookUrl(locale)
  const guide = campaignGuideUrl(locale)

  const tile = (t: (typeof c.tiles)[number], side: 'l' | 'r') => `<td width="50%" valign="top" style="padding:0 ${side === 'l' ? '6px 0 0' : '0 0 6px'};">
            ${img(CAMPAIGN_IMAGES[t.key], t.alt, 270)}
            <p style="margin:6px 0 16px;font-family:${FONT};font-size:14px;line-height:1.4;color:#5C4A3A;text-align:center;">${escapeHtml(t.caption)}</p>
          </td>`
  const row = (a: (typeof c.tiles)[number], b: (typeof c.tiles)[number]) =>
    `<tr>${tile(a, 'l')}${tile(b, 'r')}</tr>`

  const html = `<!DOCTYPE html>
<html lang="${locale}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light only" />
<title>${escapeHtml(c.subject)}</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin:0;padding:0;background:#F5EEDA;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#F5EEDA;font-size:1px;line-height:1px;">${escapeHtml(c.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5EEDA;">
  <tr>
    <td align="center" style="padding:20px 8px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FAF0E6;">
        <tr>
          <td bgcolor="#0D1F17" style="background:#0D1F17;padding:0;line-height:0;font-size:0;">${img(CAMPAIGN_IMAGES.hero, c.heroAlt, 600, 'color:#FAF0E6;')}</td>
        </tr>
        <tr>
          <td bgcolor="#0D1F17" align="center" style="background:#0D1F17;padding:14px 24px;font-family:${FONT};">
            <span style="color:#C69B3C;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Gecko Cabane</span><br />
            <span style="color:#FAF0E6;font-size:12px;">${locale === 'fr' ? 'Cuisine Franco-Thaï · Krabi' : 'French-Thai cuisine · Krabi'}</span>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:32px 32px 8px;font-family:${FONT};">
            <h1 style="margin:0 0 14px;font-family:${FONT};font-size:30px;line-height:1.2;font-weight:normal;color:#1A0E00;">${escapeHtml(c.title)}</h1>
            <p style="margin:0 0 24px;font-family:${FONT};font-size:17px;line-height:1.55;color:#5C4A3A;">${escapeHtml(c.hook)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${row(c.tiles[0], c.tiles[1])}
              ${row(c.tiles[2], c.tiles[3])}
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:8px 32px 8px;">
            ${bulletproofButton(book, c.book, true)}
            ${bulletproofButton(guide, c.guide, false)}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #E8DCC8;">
              <tr>
                <td align="center" style="padding:20px 0 4px;font-family:${FONT};font-size:15px;line-height:1.6;color:#5C4A3A;">
                  <strong style="color:#1A0E00;font-weight:normal;font-size:13px;letter-spacing:2px;text-transform:uppercase;">${escapeHtml(c.infoTitle)}</strong><br />
                  ${escapeHtml(c.closed)} · ${escapeHtml(c.kitchen)}<br />
                  ${escapeHtml(ADDRESS)}<br />
                  <a href="${PHONE_TEL}" style="color:#0C3C2D;">${PHONE_DISPLAY}</a> · <a href="${WHATSAPP_URL}" style="color:#0C3C2D;">${escapeHtml(c.whatsapp)}</a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:16px 0 8px;font-family:${FONT};font-size:15px;font-style:italic;color:#5C4A3A;">${escapeHtml(c.signoff)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" bgcolor="#F0E4CF" style="background:#F0E4CF;padding:18px 32px;font-family:${FONT};font-size:12px;line-height:1.6;color:#5C4A3A;">
            ${escapeHtml(c.why)}<br />
            <a href="${escapeHtml(unsubscribeUrl)}" style="color:#5C4A3A;text-decoration:underline;">${escapeHtml(c.unsubscribe)}</a><br />
            ${escapeHtml(c.legal)}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  const text = [
    c.title,
    c.hook,
    ...c.tiles.map((t) => `- ${t.caption}`),
    `${c.book}: ${book}`,
    `${c.guide}: ${guide}`,
    `${c.closed} · ${c.kitchen}`,
    ADDRESS,
    `${PHONE_DISPLAY} · ${c.whatsapp}: ${WHATSAPP_URL}`,
    c.signoff,
    `${c.unsubscribe}: ${unsubscribeUrl}`,
    c.legal,
  ].join('\n\n')

  return { subject: stripLineBreaks(c.subject), html, text }
}
