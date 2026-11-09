/**
 * ONP-09: the restaurant is presented through Chef Jariya, never as a "French-Thai couple".
 * Scans every visible string of messages/*.json.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const COUPLE =
  /couple\s+franco|franco-tha[iï]\s+couple|french-thai\s+couple|french-thai couple|französisch-thailändischen?\s+paar|fransk-thailändskt\s+par|pars restaurang/i

function strings(o: unknown, path = ''): [string, string][] {
  if (typeof o === 'string') return [[path, o]]
  if (typeof o !== 'object' || o === null) return []
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k))
}

describe('no "couple franco-thaï" wording', () => {
  for (const locale of ['fr', 'en', 'de', 'sv']) {
    it(`messages/${locale}.json`, () => {
      const all = strings(JSON.parse(readFileSync(join(__dirname, '..', 'messages', `${locale}.json`), 'utf8')))
      const hits = all.filter(([, v]) => COUPLE.test(v)).map(([k]) => k)
      expect(hits).toEqual([])
    })
  }
})
