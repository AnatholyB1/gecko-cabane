import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// POST reorder items
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { type, items } = body
    
    // type: 'pages' | 'categories' | 'items'
    // items: [{ id: number, display_order: number }]
    
    if (!type || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Type and items array are required' }, { status: 400 })
    }
    
    const tableName = type === 'pages' 
      ? 'menu_pages' 
      : type === 'categories' 
        ? 'menu_categories' 
        : 'menu_items'
    
    // Update each item's display_order
    for (const item of items) {
      const { error } = await supabase
        .from(tableName)
        .update({ 
          display_order: item.display_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
    
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
