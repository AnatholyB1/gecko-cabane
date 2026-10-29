/**
 * Local generator for the newsletter rewards and print supports (NEWS-03/04/05, D-12/D-13/D-17).
 * Offline: no network call, no secret. Refuses to run on empty content (nothing is invented).
 *
 * Usage: node scripts/generate-newsletter-print.mjs
 * Output: public/ (guide + recipe, FR/EN) and docs/print/ (bill insert, WiFi card, QR SVGs).
 */
import fs from 'node:fs'
import path from 'node:path'
import QRCode from 'qrcode'
import PDFDocument from 'pdfkit'

const NEWSLETTER_QR_URL = 'https://geckocabanerestaurant.com/newsletter?src=qr'
const WIFI_QR_URL = 'https://geckocabanerestaurant.com/wifi?src=wifi'
const PRINT_DIR = 'docs/print'
const PUBLIC_DIR = 'public'
const CONTENT_DIR = 'docs/newsletter'
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

const OVERLINE = 'Gecko Cabane · Krabi'
const ADDRESS = 'Gecko Cabane, Maharat Road, Krabi Town'
const LOCALES = ['fr', 'en']

const INSERT_COPY = {
  fr: 'Recevez la recette du curry de crabe de la cheffe Jariya',
  en: "Get Chef Jariya's crab curry recipe",
}
const WIFI_COPY = {
  fr: 'Scannez pour le mot de passe du WiFi',
  en: 'Scan for the WiFi password',
}

const pt = (mm) => mm * MM

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, name), 'utf8'))
}

function fail(message) {
  console.error(`generate-newsletter-print: ${message}`)
  process.exit(1)
}

function loadContent() {
  const guide = readJson('guide-content.json')
  const recipe = readJson('recipe-content.json')
  if (!Array.isArray(guide.places) || guide.places.length === 0) {
    fail('guide-content.json has no places: the owner must supply the recommendations (D-17).')
  }
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    fail('recipe-content.json has no ingredients: the owner must supply the recipe (D-12).')
  }
  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
    fail('recipe-content.json has no steps: the owner must supply the recipe (D-12).')
  }
  return { guide, recipe }
}

function localized(value, lang) {
  if (value && typeof value === 'object') return value[lang] ?? value.fr ?? ''
  return value ?? ''
}

function newDoc(file, title, size, margin = 0) {
  const doc = new PDFDocument({
    size,
    margins: { top: margin, left: margin, bottom: margin, right: margin },
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

function drawQr(doc, url, xPt, yPt, sizeMm) {
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

async function writeSvgs() {
  for (const [file, url] of [['newsletter-qr.svg', NEWSLETTER_QR_URL], ['wifi-qr.svg', WIFI_QR_URL]]) {
    const svg = await QRCode.toString(url, QR_OPTIONS)
    fs.writeFileSync(path.join(PRINT_DIR, file), svg)
    console.log(`${path.join(PRINT_DIR, file)} (${svg.length} bytes)`)
  }
}

/** Trim-size card with bleed and crop marks; body(doc, tx, ty) draws inside the trim box. */
async function writeCard(file, title, trimW, trimH, body) {
  const off = BLEED_MM + MARK_MM
  const { doc, done } = newDoc(file, title, [pt(trimW + off * 2), pt(trimH + off * 2)])
  const tx = pt(off)
  const ty = pt(off)
  doc.rect(tx - pt(BLEED_MM), ty - pt(BLEED_MM), pt(trimW + BLEED_MM * 2), pt(trimH + BLEED_MM * 2)).fill('#FFFFFF')
  body(doc, tx, ty)
  drawCropMarks(doc, tx, ty, pt(trimW), pt(trimH))
  doc.end()
  await done
  console.log(file)
}

async function writeInsert() {
  const trimW = 100
  const trimH = 60
  await writeCard(
    path.join(PRINT_DIR, 'newsletter-addition-insert.pdf'),
    'Gecko Cabane - insert addition newsletter',
    trimW,
    trimH,
    (doc, tx, ty) => {
      const panelW = 38
      const qrMm = 28
      const qrY = ty + pt(12)
      drawQr(doc, NEWSLETTER_QR_URL, tx + pt((panelW - qrMm) / 2), qrY, qrMm)
      doc.font('Helvetica').fontSize(7).fillColor(MID)
      doc.text('geckocabanerestaurant.com/newsletter', tx, qrY + pt(qrMm) + 6, { width: pt(panelW), align: 'center' })
      const rx = tx + pt(panelW)
      const rw = pt(trimW - panelW - SAFE_MM)
      let cy = ty + pt(SAFE_MM)
      doc.rect(rx, cy, pt(8), 1.5).fill(GOLD)
      cy += 10
      LOCALES.forEach((lang, i) => {
        doc.font('Times-Roman').fontSize(13).fillColor(DARK)
        doc.text(INSERT_COPY[lang], rx, cy, { width: rw, lineGap: 2 })
        cy = doc.y + 6
        if (i < LOCALES.length - 1) {
          doc.lineWidth(0.5).moveTo(rx, cy).lineTo(rx + rw, cy).stroke(RULE)
          cy += 8
        }
      })
    },
  )
}

async function writeWifiCard() {
  const trimW = 105
  const trimH = 148
  await writeCard(
    path.join(PRINT_DIR, 'wifi-table-card.pdf'),
    'Gecko Cabane - carte WiFi de table',
    trimW,
    trimH,
    (doc, tx, ty) => {
      const w = pt(trimW)
      const cx = tx + w / 2
      doc.font('Helvetica').fontSize(8).fillColor(MID)
      doc.text(OVERLINE.toUpperCase(), tx, ty + pt(14), { width: w, align: 'center', characterSpacing: 1.5 })
      doc.rect(cx - pt(4), ty + pt(22), pt(8), 1.5).fill(GOLD)
      doc.font('Times-Roman').fontSize(30).fillColor(DARK)
      doc.text('WiFi', tx, ty + pt(30), { width: w, align: 'center' })
      const qrMm = 40
      const qrY = ty + pt(52)
      drawQr(doc, WIFI_QR_URL, cx - pt(qrMm / 2), qrY, qrMm)
      let cy = qrY + pt(qrMm) + pt(8)
      for (const lang of LOCALES) {
        doc.font('Times-Roman').fontSize(14).fillColor(DARK)
        doc.text(WIFI_COPY[lang], tx + pt(SAFE_MM), cy, { width: w - pt(SAFE_MM * 2), align: 'center' })
        cy = doc.y + 6
      }
    },
  )
}

const A5 = [148 * MM, 210 * MM]
const PAGE_MARGIN = pt(14)

function ensureRoom(doc, needed) {
  if (doc.y + needed > doc.page.height - PAGE_MARGIN) doc.addPage()
}

async function writeGuide(guide, lang) {
  const file = path.join(PUBLIC_DIR, `guide-gourmand-krabi-town-${lang}.pdf`)
  const copy = guide.locales[lang]
  const { doc, done } = newDoc(file, copy.title, A5, PAGE_MARGIN)
  const width = A5[0] - PAGE_MARGIN * 2
  doc.font('Helvetica').fontSize(8).fillColor(MID)
  doc.text(OVERLINE.toUpperCase(), { characterSpacing: 1.5 })
  doc.moveDown(6)
  doc.font('Times-Bold').fontSize(30).fillColor(DARK).text(copy.title, { width })
  doc.moveDown(1)
  doc.rect(doc.x, doc.y, pt(14), 2).fill(GOLD)
  doc.addPage()
  doc.font('Times-Roman').fontSize(12).fillColor(DARK).text(copy.intro, { width, lineGap: 4 })
  doc.moveDown(1.5)
  for (const place of guide.places) {
    ensureRoom(doc, pt(40))
    doc.font('Times-Bold').fontSize(14).fillColor(DARK).text(place.name, { width })
    doc.font('Helvetica').fontSize(8).fillColor(GOLD).text(String(place.category ?? '').toUpperCase(), { characterSpacing: 1 })
    doc.font('Times-Roman').fontSize(11).fillColor(MID).text(localized(place.why, lang), { width, lineGap: 3 })
    if (place.address) doc.font('Helvetica').fontSize(8).fillColor(MID).text(place.address, { width })
    if (place.mapsUrl) doc.font('Helvetica').fontSize(8).fillColor(MID).text(place.mapsUrl, { width, link: place.mapsUrl })
    if (place.photo) {
      const photo = path.join(CONTENT_DIR, 'photos', place.photo)
      if (fs.existsSync(photo)) {
        ensureRoom(doc, pt(45))
        doc.moveDown(0.5)
        doc.image(photo, doc.x, doc.y, { fit: [width, pt(40)] })
        doc.y += pt(42)
      }
    }
    doc.moveDown(1.2)
  }
  ensureRoom(doc, pt(40))
  doc.moveDown(1)
  doc.font('Times-Roman').fontSize(12).fillColor(DARK).text(copy.outro, { width, lineGap: 4 })
  doc.moveDown(0.5)
  doc.font('Helvetica').fontSize(8).fillColor(MID).text(ADDRESS, { width })
  doc.end()
  await done
  console.log(file)
}

async function writeRecipe(recipe, lang) {
  const file = path.join(PUBLIC_DIR, `recette-curry-crabe-${lang}.pdf`)
  const copy = recipe.locales[lang]
  const { doc, done } = newDoc(file, copy.title, A5, PAGE_MARGIN)
  const width = A5[0] - PAGE_MARGIN * 2
  doc.font('Helvetica').fontSize(8).fillColor(MID).text(OVERLINE.toUpperCase(), { characterSpacing: 1.5 })
  doc.moveDown(1)
  doc.font('Times-Bold').fontSize(26).fillColor(DARK).text(copy.title, { width })
  doc.moveDown(0.5)
  if (recipe.serves) doc.font('Helvetica').fontSize(9).fillColor(MID).text(String(localized(recipe.serves, lang)))
  doc.moveDown(1)
  const section = (label, items, numbered) => {
    if (!items.length) return
    ensureRoom(doc, pt(30))
    doc.font('Times-Bold').fontSize(14).fillColor(DARK).text(label, { width })
    doc.moveDown(0.4)
    items.forEach((item, i) => {
      ensureRoom(doc, pt(12))
      const text = localized(item, lang)
      doc.font('Times-Roman').fontSize(11).fillColor(MID).text(numbered ? `${i + 1}. ${text}` : `- ${text}`, { width, lineGap: 3 })
    })
    doc.moveDown(1)
  }
  section(lang === 'fr' ? 'Ingrédients' : 'Ingredients', recipe.ingredients, false)
  section(lang === 'fr' ? 'Préparation' : 'Method', recipe.steps, true)
  section(lang === 'fr' ? 'Conseils de la cheffe' : "Chef's tips", recipe.tips ?? [], false)
  ensureRoom(doc, pt(12))
  doc.font('Helvetica').fontSize(8).fillColor(MID).text(ADDRESS, { width })
  doc.end()
  await done
  console.log(file)
}

const { guide, recipe } = loadContent()
fs.mkdirSync(PRINT_DIR, { recursive: true })
await writeSvgs()
await writeInsert()
await writeWifiCard()
for (const lang of LOCALES) {
  await writeGuide(guide, lang)
  await writeRecipe(recipe, lang)
}
