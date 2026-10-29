/**
 * Shared payment line (plan 05-03, MENU-03, D-21).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')
const norm = (s: string) => s.replace(/[  ]/g, ' ')

describe('payment.note', () => {
  it('has the exact copy in fr and en', () => {
    const fr = JSON.parse(read('messages/fr.json'))
    const en = JSON.parse(read('messages/en.json'))
    expect(norm(fr.payment.note)).toBe('Espèces, cartes, PromptPay — frais de 5 % pour les paiements par carte.')
    expect(en.payment.note).toBe('Cash, cards, PromptPay — a 5% fee applies to card payments.')
    for (const m of [fr, en]) expect(m.payment.note).not.toMatch(/offert|promo|discount|free/i)
  })

  it('is rendered under the reservation form and on /menu', () => {
    const page = read('src/app/[locale]/page.tsx')
    expect(page).toContain("t('payment.note')")
    expect(page.indexOf("t('payment.note')")).toBeGreaterThan(page.indexOf('<ReservationForm'))
    expect(read('src/app/[locale]/menu/page.tsx')).toContain("namespace: 'payment'")
  })
})
