/**
 * Floating contact stack tests (RESA-05, RESA-06, D-03, D-22) - source scan.
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

describe('FloatingContact', () => {
  const src = read('src/components/FloatingContact.tsx')

  it('is a client component', () => {
    expect(src.trimStart().startsWith("'use client'")).toBe(true)
  })

  it.each([
    'getLineUrl()',
    'buildWhatsAppUrl(',
    "getElementById('reservation-submit')",
    "'(max-width: 639px)'",
    'track(EVENTS.whatsappClick',
    'track(EVENTS.lineClick',
    'readAttribution()',
    "useTranslations('line')",
    "useTranslations('whatsapp')",
    'tabIndex={hidden ? -1 : undefined}',
    'aria-hidden={hidden',
    'bg-gc-line',
    'flex flex-col gap-3',
  ])('contains %s', (needle) => {
    expect(src).toContain(needle)
  })

  it('stacks LINE before WhatsApp', () => {
    expect(src.indexOf('bg-gc-line')).toBeGreaterThan(-1)
    expect(src.indexOf('bg-gc-line')).toBeLessThan(src.indexOf('bg-gc-whatsapp'))
  })

  it('only renders LINE when the URL is configured', () => {
    expect(/lineUrl\s*(&&|\?)/.test(src)).toBe(true)
  })

  it('never blocks navigation', () => {
    expect(src).not.toContain('preventDefault')
  })
})

describe('wiring', () => {
  it('removes WhatsAppButton and mounts FloatingContact', () => {
    expect(existsSync(join(root, 'src/components/WhatsAppButton.tsx'))).toBe(false)
    const layout = read('src/app/[locale]/layout.tsx')
    expect(layout).toContain('<FloatingContact')
    expect(layout).not.toContain('WhatsAppButton')
  })

  it('defines LINE color tokens', () => {
    const css = read('src/app/globals.css')
    expect(css).toContain('--gc-line: #06A94D')
    expect(css).toContain('--gc-line-dark: #058A3E')
    expect(css).toContain('--color-gc-line: var(--gc-line)')
    expect(css).toContain('--color-gc-line-dark: var(--gc-line-dark)')
  })

  it('has line i18n keys', () => {
    const fr = JSON.parse(read('messages/fr.json'))
    const en = JSON.parse(read('messages/en.json'))
    expect(fr.line.ariaLabel).toBe('Nous écrire sur LINE')
    expect(en.line.ariaLabel).toBe('Message us on LINE')
    expect(fr.line.label).toBeTruthy()
    expect(en.line.label).toBeTruthy()
  })
})
