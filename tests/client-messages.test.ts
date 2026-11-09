/**
 * PERF-04: the client provider only receives CLIENT_NAMESPACES. Every namespace read through
 * useTranslations() in a Client Component must be listed, or the string would silently disappear.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { CLIENT_NAMESPACES, pickMessages } from '../src/utils/client-messages'

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.tsx?$/.test(name)) out.push(p)
  }
  return out
}

const ROOT = join(__dirname, '..', 'src')
const clientFiles = walk(ROOT).filter((f) => {
  const rel = f.slice(ROOT.length).replace(/\\/g, '/')
  if (rel.startsWith('/app/admin/') || rel.startsWith('/components/admin/')) return false
  return /^\s*['"]use client['"]/.test(readFileSync(f, 'utf8'))
})

describe('client messages', () => {
  it('covers every namespace used by public Client Components', () => {
    expect(clientFiles.length).toBeGreaterThan(5)
    for (const file of clientFiles) {
      const src = readFileSync(file, 'utf8')
      // A bare useTranslations() would need every message.
      expect(src, file).not.toMatch(/useTranslations\(\s*\)/)
      expect(src, file).not.toMatch(/useMessages\(/)
      for (const m of src.matchAll(/useTranslations\(\s*['"]([^'"]+)['"]\s*\)/g)) {
        expect(CLIENT_NAMESPACES as readonly string[], `${file} reads ${m[1]}`).toContain(m[1])
      }
    }
  })

  it('pickMessages keeps nesting and drops the rest', () => {
    const picked = pickMessages({ a: { b: { c: 'x', d: 'y' }, e: 'z' }, f: 'g' }, ['a.b', 'f'])
    expect(picked).toEqual({ a: { b: { c: 'x', d: 'y' } }, f: 'g' })
  })

  it('every namespace exists in every locale', () => {
    for (const locale of ['fr', 'en', 'de', 'sv']) {
      const messages = JSON.parse(readFileSync(join(__dirname, '..', 'messages', `${locale}.json`), 'utf8'))
      const picked = pickMessages(messages, CLIENT_NAMESPACES)
      for (const ns of CLIENT_NAMESPACES) {
        let node: unknown = picked
        for (const part of ns.split('.')) node = (node as Record<string, unknown> | undefined)?.[part]
        expect(node, `${locale}:${ns}`).toBeDefined()
      }
    }
  })
})
