/**
 * One-time Resend setup for the newsletter: creates the contact properties used to mirror
 * segments (language, country, resident, source, consent_at, last_visit).
 * WRITES to the owner's Resend account: run only after the owner approved it (07-LAUNCH.md).
 * Reads RESEND_API_KEY from .env.local or the environment and never prints it.
 *
 * Usage: node scripts/setup-resend-newsletter.mjs [--dry]
 */
import fs from 'node:fs'
import { Resend } from 'resend'

const KEYS = ['language', 'country', 'resident', 'source', 'consent_at', 'last_visit']
const dry = process.argv.includes('--dry')

function readEnvLocal() {
  try {
    const m = fs.readFileSync('.env.local', 'utf8').match(/^RESEND_API_KEY=(.*)$/m)
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : undefined
  } catch {
    return undefined
  }
}

const apiKey = process.env.RESEND_API_KEY ?? readEnvLocal()
if (!apiKey) {
  console.error('RESEND_API_KEY is not set (environment or .env.local).')
  process.exit(1)
}

if (dry) {
  console.log(`dry run: would create ${KEYS.length} string properties: ${KEYS.join(', ')}`)
  process.exit(0)
}

const resend = new Resend(apiKey)
const existing = await resend.contactProperties.list()
if (existing.error) {
  console.error(`list failed: ${existing.error.name}`)
  process.exit(1)
}
const have = new Set((existing.data?.data ?? []).map((p) => p.key))
for (const key of KEYS) {
  if (have.has(key)) {
    console.log(`${key}: already exists`)
    continue
  }
  const res = await resend.contactProperties.create({ key, type: 'string', fallbackValue: null })
  console.log(res.error ? `${key}: FAILED (${res.error.name})` : `${key}: created`)
}
