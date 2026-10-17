/**
 * Local generator for the review print supports (REV-04, D-15/D-16).
 * Offline: no network call, no secret. Output goes to docs/print/.
 *
 * Usage: node scripts/generate-review-print.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import QRCode from 'qrcode'
import PDFDocument from 'pdfkit'

const REVIEW_QR_URL = 'https://geckocabanerestaurant.com/review?src=qr'
const OUT_DIR = 'docs/print'
const MM = 2.8346
const BLEED_MM = 3
const SAFE_MM = 5
const MARK_MM = 8

const DARK = '#0D1F17'
const MID = '#5C4A3A'
const GOLD = '#C69B3C'
const RULE = '#E8DCC8'

const QR_OPTIONS = {
  type: 'svg',
  margin: 4,
  errorCorrectionLevel: 'M',
  color: { dark: DARK, light: '#FFFFFF' },
}

const COPY = {
  fr: {
    heading: 'Un avis nous aide beaucoup',
    body: "Scannez le code pour laisser un avis sur Google ou TripAdvisor. Merci d'avoir partagé ce moment avec nous.",
  },
  en: {
    heading: 'A review helps us a great deal',
    body: 'Scan the code to leave a review on Google or TripAdvisor. Thank you for sharing this moment with us.',
  },
  de: {
    heading: 'Eine Bewertung hilft uns sehr',
    body: 'Scannen Sie den Code, um eine Bewertung bei Google oder TripAdvisor zu hinterlassen. Danke, dass Sie diesen Moment mit uns geteilt haben.',
  },
}

const CAPTION = 'geckocabanerestaurant.com/review'
const OVERLINE = 'Gecko Cabane · Krabi'

const pt = (mm) => mm * MM

async function writeSvg() {
  const svg = await QRCode.toString(REVIEW_QR_URL, QR_OPTIONS)
  const file = path.join(OUT_DIR, 'review-qr.svg')
  fs.writeFileSync(file, svg)
  console.log(`${file} (${svg.length} bytes)`)
}

/** White square of the full size (quiet zone included) + one vector rect per dark module. */
function drawQr(doc, xPt, yPt, sizeMm) {
  const qr = QRCode.create(REVIEW_QR_URL, { errorCorrectionLevel: 'M' })
  const n = qr.modules.size
  const margin = 4
  const total = n + margin * 2
  const sizePt = pt(sizeMm)
  const m = sizePt / total
  doc.rect(xPt, yPt, sizePt, sizePt).fill('#FFFFFF')
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.data[r * n + c]) {
        doc.rect(xPt + (c + margin) * m, yPt + (r + margin) * m, m + 0.02, m + 0.02).fill(DARK)
      }
    }
  }
}

function drawCropMarks(doc, trimX, trimY, trimW, trimH) {
  const gap = pt(BLEED_MM + 1)
  const len = pt(MARK_MM - BLEED_MM - 2)
  doc.lineWidth(0.25).strokeColor('#000000')
  for (const x of [trimX, trimX + trimW]) {
    for (const [y, dir] of [[trimY, -1], [trimY + trimH, 1]]) {
      doc.moveTo(x, y + dir * gap).lineTo(x, y + dir * (gap + len)).stroke()
    }
  }
  for (const y of [trimY, trimY + trimH]) {
    for (const [x, dir] of [[trimX, -1], [trimX + trimW, 1]]) {
      doc.moveTo(x + dir * gap, y).lineTo(x + dir * (gap + len), y).stroke()
    }
  }
}

/** FR, EN, DE stacked; returns the y reached. */
function drawCopyBlock(doc, x, y, width, scale = 1) {
  let cy = y
  const order = ['fr', 'en', 'de']
  order.forEach((lang, i) => {
    const c = COPY[lang]
    doc.font('Times-Roman').fontSize(16 * scale).fillColor(DARK)
    doc.text(c.heading, x, cy, { width, lineGap: 1 })
    cy = doc.y + 2
    doc.font('Times-Roman').fontSize(11 * scale).fillColor(MID)
    doc.text(c.body, x, cy, { width, lineGap: 4 * scale })
    cy = doc.y + 5
    if (i < order.length - 1) {
      doc.lineWidth(0.5).moveTo(x, cy).lineTo(x + width, cy).stroke(RULE)
      cy += 6
    }
  })
  return cy
}

function newDoc(file, title, wMm, hMm) {
  const doc = new PDFDocument({
    size: [pt(wMm), pt(hMm)],
    margins: { top: 0, left: 0, bottom: 0, right: 0 },
    autoFirstPage: true,
    info: { Title: title, Author: 'Gecko Cabane', CreationDate: new Date('2026-10-17T00:00:00Z') },
  })
  const stream = fs.createWriteStream(file)
  doc.pipe(stream)
  const done = new Promise((resolve, reject) => {
    stream.on('finish', resolve)
    stream.on('error', reject)
  })
  return { doc, done }
}

async function writeInsert() {
  const file = path.join(OUT_DIR, 'review-addition-insert.pdf')
  const trimW = 100
  const trimH = 60
  const off = BLEED_MM + MARK_MM
  const { doc, done } = newDoc(file, 'Gecko Cabane - insert addition avis', trimW + off * 2, trimH + off * 2)
  const tx = pt(off)
  const ty = pt(off)
  // Bleed + trim background (white, bleed extends artwork)
  doc.rect(tx - pt(BLEED_MM), ty - pt(BLEED_MM), pt(trimW + BLEED_MM * 2), pt(trimH + BLEED_MM * 2)).fill('#FFFFFF')

  // Left panel 38 mm: QR 28 mm centered + caption
  const panelW = 38
  const qrMm = 28
  const qrX = tx + pt((panelW - qrMm) / 2)
  const qrY = ty + pt(12)
  drawQr(doc, qrX, qrY, qrMm)
  doc.font('Helvetica').fontSize(8).fillColor(MID)
  doc.text(CAPTION, tx, qrY + pt(qrMm) + 6, { width: pt(panelW), align: 'center' })

  // Right panel: gold rule + copy within safe zone
  const rx = tx + pt(panelW)
  const rw = pt(trimW - panelW - SAFE_MM)
  const top = ty + pt(SAFE_MM)
  doc.rect(rx, top, pt(8), 1.5).fill(GOLD)
  const maxBottom = ty + pt(trimH - SAFE_MM)
  // Try decreasing scales until the copy fits the safe zone
  let scale = 1
  let fitted = false
  for (const s of [1, 0.8, 0.7, 0.6, 0.55, 0.5]) {
    const probe = new PDFDocument({ size: [pt(200), pt(400)], margins: { top: 0, left: 0, bottom: 0, right: 0 } })
    const end = drawCopyBlock(probe, 0, 0, rw, s)
    probe.end()
    if (end <= maxBottom - (top + 8)) {
      scale = s
      fitted = true
      break
    }
  }
  if (!fitted) scale = 0.5
  drawCopyBlock(doc, rx, top + 8, rw, scale)

  drawCropMarks(doc, tx, ty, pt(trimW), pt(trimH))
  doc.end()
  await done
  console.log(`${file} (copy scale ${scale})`)
}

function drawFace(doc, x, y, w, h) {
  // Face drawn in the box (x, y, w, h), content centred horizontally
  const cx = x + w / 2
  doc.font('Helvetica').fontSize(8).fillColor(MID)
  doc.text(OVERLINE.toUpperCase(), x, y + pt(14), { width: w, align: 'center', characterSpacing: 1.5 })
  doc.rect(cx - pt(4), y + pt(22), pt(8), 1.5).fill(GOLD)
  const qrMm = 36
  const qrY = y + pt(32)
  drawQr(doc, cx - pt(qrMm / 2), qrY, qrMm)
  let ty = qrY + pt(qrMm) + pt(8)
  for (const lang of ['fr', 'en', 'de']) {
    doc.font('Times-Roman').fontSize(16).fillColor(DARK)
    doc.text(COPY[lang].heading, x + pt(SAFE_MM), ty, { width: w - pt(SAFE_MM * 2), align: 'center' })
    ty = doc.y + 6
  }
  doc.font('Helvetica').fontSize(8).fillColor(MID)
  doc.text(CAPTION, x, ty + 4, { width: w, align: 'center' })
}

async function writeChevalet() {
  const file = path.join(OUT_DIR, 'review-chevalet-a6.pdf')
  const trimW = 105
  const trimH = 296
  const faceH = trimH / 2
  const off = BLEED_MM + MARK_MM
  const { doc, done } = newDoc(file, 'Gecko Cabane - chevalet A6 avis', trimW + off * 2, trimH + off * 2)
  const tx = pt(off)
  const ty = pt(off)
  doc.rect(tx - pt(BLEED_MM), ty - pt(BLEED_MM), pt(trimW + BLEED_MM * 2), pt(trimH + BLEED_MM * 2)).fill('#FFFFFF')

  // Face A (top half)
  drawFace(doc, tx, ty, pt(trimW), pt(faceH))
  // Face B (bottom half), rotated 180 degrees about the face centre
  doc.save()
  const fcx = tx + pt(trimW) / 2
  const fcy = ty + pt(faceH) + pt(faceH) / 2
  doc.rotate(180, { origin: [fcx, fcy] })
  drawFace(doc, tx, ty + pt(faceH), pt(trimW), pt(faceH))
  doc.restore()

  // Fold line: dashed gold hairline in the margin only (outside trim, both sides)
  const foldY = ty + pt(faceH)
  doc.lineWidth(0.25).dash(3, { space: 2 })
  doc.moveTo(pt(2), foldY).lineTo(pt(off - 2), foldY).stroke(GOLD)
  doc.moveTo(tx + pt(trimW) + pt(2), foldY).lineTo(tx + pt(trimW) + pt(off - 2), foldY).stroke(GOLD)
  doc.undash()

  drawCropMarks(doc, tx, ty, pt(trimW), pt(trimH))
  doc.end()
  await done
  console.log(`${file}`)
}

fs.mkdirSync(OUT_DIR, { recursive: true })
await writeSvg()
await writeInsert()
await writeChevalet()
