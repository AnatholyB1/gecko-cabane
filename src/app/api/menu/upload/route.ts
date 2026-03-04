import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non autorisé. Utilisez JPG, PNG, WebP ou GIF.' }, { status: 400 })
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Fichier trop volumineux. Maximum 5MB.' }, { status: 400 })
    }
    
    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `menu-${timestamp}.${extension}`
    
    // Convert File to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('menu-images')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      })
    
    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: 'Erreur lors de l\'upload: ' + error.message }, { status: 500 })
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('menu-images')
      .getPublicUrl(data.path)
    
    return NextResponse.json({ 
      url: publicUrl,
      path: data.path 
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    
    if (!path) {
      return NextResponse.json({ error: 'Chemin du fichier requis' }, { status: 400 })
    }
    
    const { error } = await supabase.storage
      .from('menu-images')
      .remove([path])
    
    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
