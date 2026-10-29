/**
 * Image bands for newsletter emails (header, photo strips, divider). Offline.
 * Crops existing site photos from public/ (no stock, no invented photo) into
 * 1040 px wide JPEG/PNG strips (displayed at 520 px, 2x for retina).
 * Output: public/email/ (served from the site domain, absolute URLs in emails).
 *
 * Usage: node scripts/generate-email-bands.mjs
 */
import fs from 'node:fs'
import sharp from 'sharp'

const OUT = 'public/email'
const W = 1040

const photoBands = [
  // [output, source, crop {left, top, width, height}, output height]
  ['band-header.jpg', 'public/hero-bg.jpg', { left: 760, top: 40, width: 1200, height: 300 }, 260],
  ['band-dish.jpg', 'public/food-massaman.jpg', { left: 0, top: 300, width: 1072, height: 268 }, 260],
  ['band-table.jpg', 'public/food-bourguignon.jpg', { left: 0, top: 260, width: 1080, height: 270 }, 260],
]

fs.mkdirSync(OUT, { recursive: true })

for (const [file, src, crop, h] of photoBands) {
  await sharp(src)
    .extract(crop)
    .resize(W, h, { fit: 'cover' })
    .jpeg({ quality: 72, mozjpeg: true })
    .toFile(`${OUT}/${file}`)
  console.log(`${OUT}/${file} (${fs.statSync(`${OUT}/${file}`).size} bytes)`)
}

// Divider: cream background, gold rules either side of the site's palm motif.
const palm = fs.readFileSync('public/botanical-palm.svg', 'utf8')
const palmInner = palm.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
const divider = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="88" viewBox="0 0 ${W} 88">
  <rect width="${W}" height="88" fill="#FAF0E6"/>
  <line x1="120" y1="44" x2="440" y2="44" stroke="#C69B3C" stroke-width="2"/>
  <line x1="600" y1="44" x2="920" y2="44" stroke="#C69B3C" stroke-width="2"/>
  <g transform="translate(${W / 2 - 30} 4) scale(0.2)" fill="none" stroke="#C69B3C" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${palmInner}</g>
</svg>`
await sharp(Buffer.from(divider)).png({ compressionLevel: 9, palette: true }).toFile(`${OUT}/band-divider.png`)
console.log(`${OUT}/band-divider.png (${fs.statSync(`${OUT}/band-divider.png`).size} bytes)`)
