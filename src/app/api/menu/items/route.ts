import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET items for a category
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    
    let query = supabase
      .from('menu_items')
      .select('*')
      .order('display_order', { ascending: true })
    
    if (categoryId) {
      query = query.eq('category_id', parseInt(categoryId))
    }
    
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create a new item
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { 
      category_id, 
      name, 
      description, 
      price, 
      price_label,
      image_url,
      is_available,
      is_vegetarian,
      is_spicy,
      allergens
    } = body
    
    if (!category_id || !name) {
      return NextResponse.json({ error: 'category_id and name are required' }, { status: 400 })
    }
    
    // Get max display_order for this category
    const { data: maxOrder } = await supabase
      .from('menu_items')
      .select('display_order')
      .eq('category_id', category_id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()
    
    const newOrder = (maxOrder?.display_order || 0) + 1
    
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        category_id,
        name,
        description: description || null,
        price: price || null,
        price_label: price_label || null,
        image_url: image_url || null,
        is_available: is_available ?? true,
        is_vegetarian: is_vegetarian ?? false,
        is_spicy: is_spicy ?? false,
        allergens: allergens || null,
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

// PUT update an item
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { 
      id,
      category_id,
      name, 
      description, 
      price, 
      price_label,
      image_url,
      is_available,
      is_vegetarian,
      is_spicy,
      allergens
    } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }
    
    if (category_id !== undefined) updateData.category_id = category_id
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description || null
    if (price !== undefined) updateData.price = price
    if (price_label !== undefined) updateData.price_label = price_label || null
    if (image_url !== undefined) updateData.image_url = image_url || null
    if (is_available !== undefined) updateData.is_available = is_available
    if (is_vegetarian !== undefined) updateData.is_vegetarian = is_vegetarian
    if (is_spicy !== undefined) updateData.is_spicy = is_spicy
    if (allergens !== undefined) updateData.allergens = allergens || null
    
    const { data, error } = await supabase
      .from('menu_items')
      .update(updateData)
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

// DELETE an item
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
      .from('menu_items')
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
