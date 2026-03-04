import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET all menu pages
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('menu_pages')
      .select(`
        *,
        categories:menu_categories(
          *,
          items:menu_items(*)
        )
      `)
      .order('display_order', { ascending: true })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
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
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { name, slug, description, is_active } = body
    
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }
    
    // Get max display_order
    const { data: maxOrder } = await supabase
      .from('menu_pages')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()
    
    const newOrder = (maxOrder?.display_order || 0) + 1
    
    const { data, error } = await supabase
      .from('menu_pages')
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update a menu page
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { id, name, slug, description, is_active } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('menu_pages')
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE a menu page
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('menu_pages')
      .delete()
      .eq('id', parseInt(id))
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
