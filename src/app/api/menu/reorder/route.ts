import * as Sentry from '@sentry/nextjs'
import { requireAdmin } from '@/utils/auth'
import { NextResponse } from 'next/server'

// POST reorder items
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { supabase } = auth
    
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
        Sentry.captureException(error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }
    
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
