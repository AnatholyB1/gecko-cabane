# Testing Patterns

**Analysis Date:** 2026-10-16

## Test Framework

**Runner:**
- Vitest ^4.1.0
- Config: `vitest.config.ts` (`environment: 'node'`, `include: ['tests/**/*.test.ts']`)

**Assertion Library:**
- Vitest built-in `expect`

**Run Commands:**
```bash
npm test                 # vitest run (all tests, single pass)
npx vitest               # Watch mode
npx vitest run --coverage  # Coverage (no coverage provider installed; add @vitest/coverage-v8 first)
npm run build            # Runs `vitest run && next build` -- failing tests block the build
```

## Test File Organization

**Location:**
- Separate top-level `tests/` directory (not co-located).

**Naming:**
- `tests/<topic>.test.ts`

**Structure:**
```
tests/
  api-validation.test.ts   # pure validators in src/utils/validation.ts
  i18n.test.ts             # fr.json / en.json key symmetry and non-empty values
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from 'vitest'
import { normalizePhone } from '../src/utils/validation'

// ---------------------------------------------------------------------------
// normalizePhone
// ---------------------------------------------------------------------------

describe('normalizePhone', () => {
  it('converts Thai local format (08x) to E.164', () => {
    expect(normalizePhone('0812345678')).toBe('+66812345678')
  })
})
```

**Patterns:**
- File-header doc comment states purpose; section banners separate `describe` blocks, one per function.
- Explicit imports from `vitest` (no globals).
- Multiple related assertions per `it`; test names are behavior sentences ("rejects missing leading +").
- Boundary cases are annotated with inline comments (digit counts).
- Custom failure messages as second argument of `expect(value, message)` listing offending keys (`tests/i18n.test.ts`).
- No setup/teardown hooks used.

## Mocking

**Framework:** None in use (`vi.mock` not used).

**Patterns:**
- Tests target pure, framework-free functions, so no mocking is needed. Keep new testable logic in `src/utils/` as pure functions to follow this approach.

**What to Mock:**
- If testing route handlers, mock `@/utils/supabase/server` (`createClient`, `createAdminClient`), `@/utils/resend`, and Twilio with `vi.mock`; note `@/` alias is not configured in `vitest.config.ts` (add `resolve.alias` first).

**What NOT to Mock:**
- Pure validation utilities and JSON message files.

## Fixtures and Factories

**Test Data:**
- Inline literals only. i18n tests read real files via `readFileSync(join(process.cwd(), 'messages', 'fr.json'))`.

**Location:**
- No fixtures directory.

## Coverage

**Requirements:** None enforced; no coverage config.

## Test Types

**Unit Tests:**
- `tests/api-validation.test.ts`: phone normalization/E.164, reservation field/party size/date validation, OTP format.

**Integration Tests:**
- `tests/i18n.test.ts` acts as a content-integrity check across message files.

**E2E Tests:**
- Not used. No tests for API routes, React components, Supabase interaction, admin pages, or MCP route.

## Common Patterns

**Async Testing:**
```typescript
// No async tests exist yet; use
it('...', async () => { await expect(fn()).resolves.toBe(x) })
```

**Error Testing:**
```typescript
// Validators return values rather than throw
expect(isE164Phone('')).toBe(false)
expect(validateReservationFields({})).not.toBeNull()
```

---

*Testing analysis: 2026-10-16*
