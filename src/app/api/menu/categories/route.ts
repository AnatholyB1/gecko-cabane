import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET categories for a menu page
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const menuPageId = searchParams.get('menuPageId')
    
    let query = supabase
      .from('menu_categories')
      .select('*, items:menu_items(*)')
      .order('display_order', { ascending: true })
    
    if (menuPageId) {
      query = query.eq('menu_page_id', parseInt(menuPageId))
    }
    
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Sort items by display_order
    const sortedData = data?.map(cat => ({
      ...cat,
      items: cat.items?.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)
    }))
    
    return NextResponse.json({ data: sortedData })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create a new category
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { menu_page_id, name, description } = body
    
    if (!menu_page_id || !name) {
      return NextResponse.json({ error: 'menu_page_id and name are required' }, { status: 400 })
    }
    
    // Get max display_order for this menu page
    const { data: maxOrder } = await supabase
      .from('menu_categories')
      .select('display_order')
      .eq('menu_page_id', menu_page_id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()
    
    const newOrder = (maxOrder?.display_order || 0) + 1
    
    const { data, error } = await supabase
      .from('menu_categories')
      .insert({
        menu_page_id,
        name,
        description: description || null,
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

// PUT update a category
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { id, name, description } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('menu_categories')
      .update({
        name,
        description: description || null,
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

// DELETE a category
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
      .from('menu_categories')
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
