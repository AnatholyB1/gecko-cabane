/**
 * Privacy disclosure checks for plan 05-11 (Plausible audience measurement and
 * "Un souci ?" feedback messages).
 *
 * Hosting claim verification: https://plausible.io/data-policy was fetched
 * read-only on 2026-10-17 and states "All visitor data is securely processed
 * and stored in the EU", so the EU hosting wording is allowed.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import fr from '../messages/fr.json'
import en from '../messages/en.json'

const page = readFileSync(join(__dirname, '../src/app/[locale]/privacy/page.tsx'), 'utf8')

describe('privacy copy', () => {
  it('discloses the feedback form handling (data.item7)', () => {
    expect(fr.privacy.data.item7).toContain('Un souci')
    expect(fr.privacy.data.item7).toMatch(/email/i)
    expect(fr.privacy.data.item7).toMatch(/non enregistr/)
    expect(en.privacy.data.item7).toContain('Something wrong')
    expect(en.privacy.data.item7).toMatch(/email/i)
    expect(en.privacy.data.item7).toMatch(/not stored/)
  })

  it('discloses Plausible cookieless measurement (sharing.item4)', () => {
    expect(fr.privacy.sharing.item4).toContain('Plausible')
    expect(fr.privacy.sharing.item4).toMatch(/sans cookies/)
    expect(fr.privacy.sharing.item4).toMatch(/identifiant personnel/)
    expect(en.privacy.sharing.item4).toContain('Plausible')
    expect(en.privacy.sharing.item4).toMatch(/without cookies/)
    expect(en.privacy.sharing.item4).toMatch(/personal identifier/)
  })

  it('renders 7 data items and 4 sharing items', () => {
    expect(page).toMatch(/id: 'data', items: 7/)
    expect(page).toMatch(/id: 'sharing', items: 4/)
  })

  it('has an updated date', () => {
    expect(fr.privacy.lastUpdated).not.toContain('16 octobre 2026')
    expect(en.privacy.lastUpdated).not.toContain('16 October 2026')
  })
})
