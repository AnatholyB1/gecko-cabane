import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/utils/auth'
import {
  checkClosureDate,
  isClosureRow,
  memoryKey,
  planClose,
  planReopen,
  serializeMemory,
  type SpecialRow,
  type WeeklyRow,
} from '@/utils/service-closure'

/**
 * « Complet ce soir » (ACC-03) : ferme / rouvre le DÎNER d'une date, pour les administrateurs.
 *
 * Ne touche ni à l'API de réservation, ni à la fonction SQL, ni aux emails, cron ou KPI : il écrit
 * seulement un horaire exceptionnel (gecko_special_hours) que la disponibilité publique et la
 * validation de création lisent déjà. Client Supabase de l'administrateur (RLS gecko_is_admin) :
 * pas de clé service-role ici. Voir src/utils/service-closure.ts pour le modèle.
 *
 *   GET    ?date=YYYY-MM-DD  -> { data: { date, closed } }
 *   POST   { date }          -> ferme le dîner (idempotent)
 *   DELETE ?date=YYYY-MM-DD  -> rouvre et rétablit l'état antérieur (idempotent)
 */

const SPECIAL_COLUMNS = 'date, title, is_open, open_time, close_time, note'

const DATE_MESSAGES = {
  invalid_date: 'Date invalide (format AAAA-MM-JJ attendu)',
  date_past: 'Cette date est déjà passée',
  date_too_far: 'Cette date est trop éloignée',
} as const

type Supabase = Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>['supabase']

const serverError = () => NextResponse.json({ error: 'Internal server error' }, { status: 500 })

async function readSpecial(supabase: Supabase, date: string) {
  const { data, error } = await supabase.from('gecko_special_hours').select(SPECIAL_COLUMNS).eq('date', date).maybeSingle()
  return { row: (data ?? null) as SpecialRow | null, error }
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const date = new URL(request.url).searchParams.get('date')
    const check = checkClosureDate(date, new Date())
    // Une date passée reste lisible (état affiché), seule une date mal formée est refusée.
    if (!check.ok && check.code === 'invalid_date') {
      return NextResponse.json({ error: DATE_MESSAGES.invalid_date }, { status: 400 })
    }

    const { row, error } = await readSpecial(auth.supabase, date as string)
    if (error) {
      Sentry.captureException(error)
      return serverError()
    }
    return NextResponse.json({ data: { date, closed: isClosureRow(row) } })
  } catch {
    return serverError()
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
    }
    const date = (body as { date?: unknown }).date

    const dateCheck = checkClosureDate(date, new Date())
    if (!dateCheck.ok) {
      return NextResponse.json({ error: DATE_MESSAGES[dateCheck.code] }, { status: 400 })
    }

    const [hoursRes, special] = await Promise.all([
      supabase.from('gecko_opening_hours').select('day_of_week, is_open, open_time, close_time'),
      readSpecial(supabase, date as string),
    ])
    if (hoursRes.error || special.error) {
      Sentry.captureException(hoursRes.error ?? special.error)
      return serverError()
    }

    const plan = planClose({
      date,
      regular: (hoursRes.data ?? []) as WeeklyRow[],
      special: special.row,
      now: new Date(),
    })
    if (!plan.ok) {
      if (plan.code === 'already_closed_day') {
        return NextResponse.json({ error: "Aucun service du soir n'est ouvert à cette date" }, { status: 409 })
      }
      return NextResponse.json({ error: DATE_MESSAGES[plan.code] }, { status: 400 })
    }
    if (plan.alreadyClosed) {
      return NextResponse.json({ data: { date, closed: true } })
    }

    // 1) mémoriser l'état précédent, 2) poser la fermeture. Échec du 2) : on retire la mémoire.
    const key = memoryKey(date as string)
    const saved = await supabase
      .from('gecko_restaurant_settings')
      .upsert({ key, value: serializeMemory(plan.prev), description: 'Complet ce soir : horaire antérieur de la date' }, { onConflict: 'key' })
    if (saved.error) {
      Sentry.captureException(saved.error)
      return serverError()
    }

    const written = await supabase
      .from('gecko_special_hours')
      .upsert({ date, ...plan.next, updated_at: new Date().toISOString() }, { onConflict: 'date' })
    if (written.error) {
      Sentry.captureException(written.error)
      await supabase.from('gecko_restaurant_settings').delete().eq('key', key)
      return serverError()
    }

    return NextResponse.json({ data: { date, closed: true } })
  } catch {
    return serverError()
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth

    const date = new URL(request.url).searchParams.get('date')
    const dateCheck = checkClosureDate(date, new Date())
    if (!dateCheck.ok) {
      return NextResponse.json({ error: DATE_MESSAGES[dateCheck.code] }, { status: 400 })
    }

    const special = await readSpecial(supabase, date as string)
    if (special.error) {
      Sentry.captureException(special.error)
      return serverError()
    }

    const key = memoryKey(date as string)
    const memory = await supabase.from('gecko_restaurant_settings').select('value').eq('key', key).maybeSingle()
    if (memory.error) {
      Sentry.captureException(memory.error)
      return serverError()
    }

    const plan = planReopen(special.row, (memory.data as { value?: string } | null)?.value ?? null)
    if (plan.action === 'delete') {
      const { error } = await supabase.from('gecko_special_hours').delete().eq('date', date as string)
      if (error) {
        Sentry.captureException(error)
        return serverError()
      }
    } else if (plan.action === 'restore') {
      const { error } = await supabase
        .from('gecko_special_hours')
        .upsert({ date, ...plan.snapshot, updated_at: new Date().toISOString() }, { onConflict: 'date' })
      if (error) {
        Sentry.captureException(error)
        return serverError()
      }
    }

    // Mémoire retirée seulement après le rétablissement (un échec ici laisse une clé orpheline inoffensive).
    const cleaned = await supabase.from('gecko_restaurant_settings').delete().eq('key', key)
    if (cleaned.error) Sentry.captureException(cleaned.error)

    return NextResponse.json({ data: { date, closed: false } })
  } catch {
    return serverError()
  }
}
