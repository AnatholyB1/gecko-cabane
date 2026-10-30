/**
 * Local generator for the hotel concierge partnership dossier (OPS-07, D-14/D-18).
 * Offline: no network call, no secret. Output goes to docs/ph6/.
 *
 * Usage: node scripts/generate-concierge-dossier.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import QRCode from 'qrcode'
import PDFDocument from 'pdfkit'

const SITE = 'https://geckocabanerestaurant.com'
const RESERVATION_URL = 'https://geckocabanerestaurant.com/en#reservation'
const OUT_DIR = 'docs/ph6'
const OUT_FILE = path.join(OUT_DIR, 'concierge-dossier.pdf')
const MM = 2.8346

const DARK = '#0D1F17'
const MID = '#5C4A3A'
const GOLD = '#C69B3C'
const RULE = '#E8DCC8'

const ADDRESS = '1/36-37 Soi Ruamjit, Maharat Road, Krabi Town 81000, Thailand'
const PHONE = '+66 81 958 5945'
const COMMISSION = 'Commission : [à définir par le propriétaire]'

const PRESENTATION = {
  fr: {
    title: 'Gecko Cabane — Partenariat concierges',
    body: "Gecko Cabane est un restaurant franco-thaï gastronomique au coeur de Krabi Town (Maharat Road). La cheffe Jariya y associe techniques françaises et saveurs thaïes dans une salle intime de 40 couverts maximum. La cuisine prend les commandes jusqu'à 22h ; le restaurant est ouvert tous les jours. Réservation en ligne, par téléphone ou par WhatsApp.",
  },
  en: {
    title: 'Gecko Cabane — Concierge partnership',
    body: 'Gecko Cabane is a gastronomic French-Thai restaurant in the heart of Krabi Town (Maharat Road). Chef Jariya combines French technique with Thai flavours in an intimate dining room of 40 seats maximum. The kitchen takes orders until 10:00 PM; the restaurant is open every day. Book online, by phone or on WhatsApp.',
  },
}

const TERMS = [
  'Comment réserver pour un client / How to book for a guest',
  `1. WhatsApp or phone: ${PHONE}`,
  `2. Online form: ${RESERVATION_URL}`,
  '3. Give date, time, party size and guest name.',
  '',
  'Groupes et occasions spéciales / Groups and special occasions',
  '40 seats. For groups of more than 10, please book by phone or WhatsApp. The online form has an occasion field.',
  '',
  'Conditions de partenariat / Partnership terms',
  COMMISSION,
  'Modalités de suivi et de paiement : [à définir par le propriétaire]',
  "Aucun engagement n'est pris tant que le propriétaire n'a pas validé ces conditions par écrit.",
  'No commitment is made until the owner has confirmed these terms in writing.',
]

const pt = (mm) => mm * MM

/** White square of the full size (quiet zone included) + one vector rect per dark module. */
function drawQr(doc, xPt, yPt, sizeMm, url) {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' })
  const n = qr.modules.size
  const margin = 4
  const sizePt = pt(sizeMm)
  const m = sizePt / (n + margin * 2)
  doc.rect(xPt, yPt, sizePt, sizePt).fill('#FFFFFF')
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.data[r * n + c]) {
        doc.rect(xPt + (c + margin) * m, yPt + (r + margin) * m, m + 0.02, m + 0.02).fill(DARK)
      }
    }
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true })

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: pt(20), left: pt(20), bottom: pt(20), right: pt(20) },
  info: { Title: 'Gecko Cabane - dossier concierges', Author: 'Gecko Cabane', CreationDate: new Date('2026-10-17T00:00:00Z') },
})
const stream = fs.createWriteStream(OUT_FILE)
doc.pipe(stream)
const done = new Promise((resolve, reject) => {
  stream.on('finish', resolve)
  stream.on('error', reject)
})

const W = 210 - 40

// Page 1: presentation FR then EN
doc.rect(pt(20), pt(20), pt(10), 1.5).fill(GOLD)
let y = pt(26)
for (const lang of ['fr', 'en']) {
  const c = PRESENTATION[lang]
  doc.font('Times-Roman').fontSize(18).fillColor(DARK).text(c.title, pt(20), y, { width: pt(W) })
  doc.font('Times-Roman').fontSize(11).fillColor(MID).text(c.body, pt(20), doc.y + 6, { width: pt(W), lineGap: 4 })
  y = doc.y + 18
  doc.lineWidth(0.5).moveTo(pt(20), y - 8).lineTo(pt(20 + W), y - 8).stroke(RULE)
}
doc.font('Helvetica').fontSize(9).fillColor(MID)
doc.text(`${ADDRESS}\n${PHONE} (phone / WhatsApp)\n${SITE}`, pt(20), y, { width: pt(W), lineGap: 3 })

// Page 2: partnership terms
doc.addPage()
doc.rect(pt(20), pt(20), pt(10), 1.5).fill(GOLD)
doc.font('Times-Roman').fontSize(18).fillColor(DARK).text('Partenariat / Partnership', pt(20), pt(26), { width: pt(W) })
doc.moveDown(0.8)
for (const line of TERMS) {
  doc.font('Times-Roman').fontSize(11).fillColor(MID).text(line === '' ? ' ' : line, { width: pt(W), lineGap: 4 })
}

// Page 3: A6 recommendation card (105 x 148 mm)
doc.addPage({ size: [pt(105), pt(148)], margins: { top: 0, left: 0, bottom: 0, right: 0 } })
const cw = pt(105)
doc.font('Helvetica').fontSize(8).fillColor(MID)
doc.text('GECKO CABANE · KRABI', 0, pt(10), { width: cw, align: 'center', characterSpacing: 1.5 })
doc.rect(cw / 2 - pt(4), pt(17), pt(8), 1.5).fill(GOLD)
doc.font('Times-Roman').fontSize(16).fillColor(DARK)
doc.text('Gecko Cabane Restaurant', pt(8), pt(22), { width: cw - pt(16), align: 'center' })
doc.font('Times-Roman').fontSize(10).fillColor(MID)
doc.text(
  'Cuisine franco-thaïe gastronomique de la cheffe Jariya.\nFrench-Thai fine dining by Chef Jariya.\n40 seats, Krabi Town.',
  pt(8),
  doc.y + 4,
  { width: cw - pt(16), align: 'center', lineGap: 3 },
)
const qrMm = 34
drawQr(doc, cw / 2 - pt(qrMm / 2), pt(62), qrMm, RESERVATION_URL)
doc.font('Helvetica').fontSize(8).fillColor(MID)
doc.text('geckocabanerestaurant.com', 0, pt(62 + qrMm + 2), { width: cw, align: 'center' })
doc.text(`${ADDRESS}\nWhatsApp / tel ${PHONE}`, pt(8), pt(62 + qrMm + 10), { width: cw - pt(16), align: 'center', lineGap: 2 })

doc.end()
await done
console.log(`${OUT_FILE} (${fs.statSync(OUT_FILE).size} bytes)`)
