import * as Sentry from '@sentry/nextjs'
import { requireAdmin } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { MENU_TAG } from '@/utils/menu'

// /menu (cached under MENU_TAG) follows admin edits on the next request

// GET all menu pages
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('gecko_menu_pages')
      .select(`
        *,
        categories:gecko_menu_categories(
          *,
          items:gecko_menu_items(*)
        )
      `)
      .order('display_order', { ascending: true })
    
    if (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    
    // Sort categories and items by display_order
    const sortedData = data?.map(page => ({
      ...page,
      categories: page.categories
        ?.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)
        .map((cat: { items?: { display_order: number }[] }) => ({
          ...cat,
          items: cat.items?.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)
        }))
    }))
    
    return NextResponse.json({ data: sortedData })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create a new menu page
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth
    
    const body = await request.json()
    const { name, slug, description, is_active } = body
    
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }
    
    // Get max display_order
    const { data: maxOrder } = await supabase
      .from('gecko_menu_pages')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()
    
    const newOrder = (maxOrder?.display_order || 0) + 1
    
    const { data, error } = await supabase
      .from('gecko_menu_pages')
      .insert({
        name,
        slug,
        description: description || null,
        is_active: is_active ?? true,
        display_order: newOrder
      })
      .select()
      .single()
    
    if (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    
    revalidateTag(MENU_TAG, 'max')
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update a menu page
export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth
    
    const body = await request.json()
    const { id, name, slug, description, is_active } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('gecko_menu_pages')
      .update({
        name,
        slug,
        description: description || null,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    
    revalidateTag(MENU_TAG, 'max')
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE a menu page
export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('gecko_menu_pages')
      .delete()
      .eq('id', parseInt(id))
    
    if (error) {
      Sentry.captureException(error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    
    revalidateTag(MENU_TAG, 'max')
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
