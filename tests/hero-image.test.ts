/** Hero / image performance tests (SEO-08) - source scan + file size. */
import { describe, it, expect } from 'vitest'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const page = read('src/app/[locale]/page.tsx')

// Extract the JSX element opening at the first occurrence of `marker` (up to '/>').
function elementAround(src: string, marker: string): string {
  const idx = src.indexOf(marker)
  expect(idx).toBeGreaterThan(-1)
  const start = src.lastIndexOf('<Image', idx)
  const end = src.indexOf('/>', idx)
  return src.slice(start, end + 2)
}

describe('image budget', () => {
  it('hero source is under 1 MB and chef portrait under 250 KB', () => {
    expect(statSync(join(root, 'public/hero-bg.jpg')).size).toBeLessThan(1_000_000)
    expect(statSync(join(root, 'public/chef-jariya.jpg')).size).toBeLessThan(250_000)
  })
})

describe('home page uses next/image', () => {
  it('imports next/image', () => {
    expect(page).toContain("import Image from 'next/image'")
  })

  it('hero Image is fill + preload + sizes + quality 60, opacity 0.28', () => {
    const el = elementAround(page, 'src="/hero-bg.jpg"')
    expect(el).toContain('fill')
    expect(el).toContain('preload')
    expect(el).toContain('sizes="100vw"')
    expect(el).toContain('quality={60}')
    expect(el).toContain('opacity: 0.28')
    expect(el).not.toContain('loading="lazy"')
  })

  it('only the hero has preload', () => {
    expect(page.match(/preload/g)?.length).toBe(1)
  })

  it('no raw <img> for jpg sources', () => {
    expect(/<img[^>]*\.jpg/.test(page)).toBe(false)
    expect(/no-img-element \*\/\}\s*<img[^>]*\.jpg/.test(page)).toBe(false)
  })

  it('chef portrait is an Image with sizes and the sepia filter', () => {
    const el = elementAround(page, 'src="/chef-jariya.jpg"')
    expect(el).toContain('sizes=')
    expect(el).toContain('sepia(0.3) contrast(1.05)')
  })
})

describe('next.config images', () => {
  it('enables avif/webp and the qualities allowlist', () => {
    const cfg = read('next.config.ts')
    expect(cfg).toContain("'image/avif'")
    expect(cfg).toContain("'image/webp'")
    expect(cfg).toMatch(/qualities:\s*\[[^\]]*60[^\]]*75[^\]]*\]/)
  })
})
