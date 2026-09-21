import { createBrowserClient } from '@supabase/ssr'

// Force Turbopack build-cache invalidation when NEXT_PUBLIC_SUPABASE_* env
// vars change on Vercel (see src/utils/supabase/server.ts for details).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
