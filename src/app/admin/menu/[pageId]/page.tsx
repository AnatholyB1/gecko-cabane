'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import type { MenuPage, MenuCategory, MenuItem } from '@/types/database'

export default function MenuEditorPage() {
  const router = useRouter()
  const params = useParams()
  const pageId = params.pageId as string
  
  const [page, setPage] = useState<MenuPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Edit page form
  const [editingPage, setEditingPage] = useState(false)
  const [pageForm, setPageForm] = useState({ name: '', slug: '', description: '' })
  
  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  
  // Item form
  const [showItemForm, setShowItemForm] = useState<number | null>(null) // category_id
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [uploading, setUploading] = useState(false)
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    price_label: '',
    image_url: '',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false,
    allergens: ''
  })

  const fetchPage = useCallback(async () => {
    try {
      const response = await fetch('/api/menu/pages')
      const data = await response.json()
      
      if (data.data) {
        const foundPage = data.data.find((p: MenuPage) => p.id === parseInt(pageId))
        if (foundPage) {
          setPage(foundPage)
          setPageForm({
            name: foundPage.name,
            slug: foundPage.slug,
            description: foundPage.description || ''
          })
        } else {
          router.push('/admin/menu')
        }
      }
    } catch (error) {
      console.error('Error fetching page:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }, [pageId, router])

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  // Page functions
  async function updatePage() {
    setSaving(true)
    try {
      const response = await fetch('/api/menu/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(pageId),
          ...pageForm
        })
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Page mise à jour!' })
        setEditingPage(false)
        fetchPage()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur' })
    } finally {
      setSaving(false)
    }
  }

  // Category functions
  async function saveCategory() {
    if (!categoryForm.name.trim()) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/menu/categories', {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingCategory ? { id: editingCategory.id } : { menu_page_id: parseInt(pageId) }),
          ...categoryForm
        })
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: editingCategory ? 'Catégorie mise à jour!' : 'Catégorie créée!' })
        setShowCategoryForm(false)
        setEditingCategory(null)
        setCategoryForm({ name: '', description: '' })
        fetchPage()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur' })
    } finally {
      setSaving(false)
    }
  }

  async function deleteCategory(category: MenuCategory) {
    if (!confirm(`Supprimer "${category.name}" et tous ses plats?`)) return
    
    try {
      const response = await fetch(`/api/menu/categories?id=${category.id}`, { method: 'DELETE' })
      if (response.ok) {
        setMessage({ type: 'success', text: 'Catégorie supprimée' })
        fetchPage()
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur' })
    }
  }

  async function reorderCategories(dragIndex: number, dropIndex: number) {
    if (!page?.categories || dragIndex === dropIndex) return
    
    const newCategories = [...page.categories]
    const [removed] = newCategories.splice(dragIndex, 1)
    newCategories.splice(dropIndex, 0, removed)
    
    setPage({ ...page, categories: newCategories })
    
    try {
      await fetch('/api/menu/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'categories',
          items: newCategories.map((cat, i) => ({ id: cat.id, display_order: i }))
        })
      })
    } catch {
      fetchPage()
    }
  }

  // Item functions
  async function saveItem(categoryId: number) {
    if (!itemForm.name.trim()) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/menu/items', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingItem ? { id: editingItem.id } : { category_id: categoryId }),
          name: itemForm.name,
          description: itemForm.description || null,
          price: itemForm.price ? parseFloat(itemForm.price) : null,
          price_label: itemForm.price_label || null,
          image_url: itemForm.image_url || null,
          is_available: itemForm.is_available,
          is_vegetarian: itemForm.is_vegetarian,
          is_spicy: itemForm.is_spicy,
          allergens: itemForm.allergens || null
        })
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: editingItem ? 'Plat mis à jour!' : 'Plat ajouté!' })
        setShowItemForm(null)
        setEditingItem(null)
        resetItemForm()
        fetchPage()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur' })
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(item: MenuItem) {
    if (!confirm(`Supprimer "${item.name}"?`)) return
    
    try {
      const response = await fetch(`/api/menu/items?id=${item.id}`, { method: 'DELETE' })
      if (response.ok) {
        setMessage({ type: 'success', text: 'Plat supprimé' })
        fetchPage()
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur' })
    }
  }

  async function toggleItemAvailable(item: MenuItem) {
    try {
      await fetch('/api/menu/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_available: !item.is_available })
      })
      fetchPage()
    } catch {
      console.error('Error toggling item')
    }
  }

  async function reorderItems(categoryId: number, dragIndex: number, dropIndex: number) {
    if (!page?.categories || dragIndex === dropIndex) return
    
    const category = page.categories.find(c => c.id === categoryId)
    if (!category?.items) return
    
    const newItems = [...category.items]
    const [removed] = newItems.splice(dragIndex, 1)
    newItems.splice(dropIndex, 0, removed)
    
    // Update local state
    setPage({
      ...page,
      categories: page.categories.map(c => 
        c.id === categoryId ? { ...c, items: newItems } : c
      )
    })
    
    try {
      await fetch('/api/menu/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'items',
          items: newItems.map((item, i) => ({ id: item.id, display_order: i }))
        })
      })
    } catch {
      fetchPage()
    }
  }

  function resetItemForm() {
    setItemForm({
      name: '',
      description: '',
      price: '',
      price_label: '',
      image_url: '',
      is_available: true,
      is_vegetarian: false,
      is_spicy: false,
      allergens: ''
    })
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/menu/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setItemForm(prev => ({ ...prev, image_url: data.url }))
        setMessage({ type: 'success', text: 'Image uploadée!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'upload' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de l\'upload' })
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  function startEditItem(item: MenuItem) {
    setEditingItem(item)
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price?.toString() || '',
      price_label: item.price_label || '',
      image_url: item.image_url || '',
      is_available: item.is_available,
      is_vegetarian: item.is_vegetarian,
      is_spicy: item.is_spicy,
      allergens: item.allergens || ''
    })
    setShowItemForm(item.category_id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce">🦎</div>
          <p className="mt-4 text-[var(--warm-gray)]">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!page) return null

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[var(--jungle-dark)] to-[var(--primary-dark)] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🦎</span>
            <div>
              <h1 className="text-xl font-bold">{page.name}</h1>
              <p className="text-sm opacity-80">Édition du menu</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/menu" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
              ← Retour
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Page Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-[var(--primary-dark)]">{page.name}</h2>
              {page.description && <p className="text-[var(--warm-gray)]">{page.description}</p>}
              <p className="text-sm text-[var(--warm-gray)] mt-1">/{page.slug}</p>
            </div>
            <button
              onClick={() => setEditingPage(!editingPage)}
              className="text-[var(--tropical)] hover:underline"
            >
              {editingPage ? 'Annuler' : '✏️ Modifier'}
            </button>
          </div>
          
          {editingPage && (
            <div className="mt-4 pt-4 border-t grid gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Nom"
                value={pageForm.name}
                onChange={(e) => setPageForm(p => ({ ...p, name: e.target.value }))}
                className="px-4 py-2 rounded-lg border focus:border-[var(--tropical)] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Slug"
                value={pageForm.slug}
                onChange={(e) => setPageForm(p => ({ ...p, slug: e.target.value }))}
                className="px-4 py-2 rounded-lg border focus:border-[var(--tropical)] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Description"
                value={pageForm.description}
                onChange={(e) => setPageForm(p => ({ ...p, description: e.target.value }))}
                className="md:col-span-2 px-4 py-2 rounded-lg border focus:border-[var(--tropical)] focus:outline-none"
              />
              <button
                onClick={updatePage}
                disabled={saving}
                className="bg-[var(--tropical)] text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>

        {/* Add Category Button */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[var(--primary-dark)]">📂 Catégories</h3>
          <button
            onClick={() => {
              setShowCategoryForm(!showCategoryForm)
              setEditingCategory(null)
              setCategoryForm({ name: '', description: '' })
            }}
            className="bg-[var(--tropical)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary)]"
          >
            {showCategoryForm ? '✕ Annuler' : '+ Catégorie'}
          </button>
        </div>

        {/* Category Form */}
        {showCategoryForm && (
          <div className="bg-amber-50 rounded-xl p-6 mb-6 border border-amber-200">
            <h4 className="font-semibold mb-4">{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Nom (ex: Entrées, Plats, Desserts)"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(p => ({ ...p, name: e.target.value }))}
                className="px-4 py-2 rounded-lg border focus:border-[var(--tropical)] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Description (optionnel)"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(p => ({ ...p, description: e.target.value }))}
                className="px-4 py-2 rounded-lg border focus:border-[var(--tropical)] focus:outline-none"
              />
            </div>
            <button
              onClick={saveCategory}
              disabled={saving}
              className="mt-4 bg-[var(--tropical)] text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : (editingCategory ? 'Mettre à jour' : 'Créer')}
            </button>
          </div>
        )}

        {/* Categories */}
        {(!page.categories || page.categories.length === 0) ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-[var(--warm-gray)]">Aucune catégorie. Ajoutez-en une pour commencer!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {page.categories.map((category, catIndex) => (
              <div
                key={category.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('catIndex', catIndex.toString())}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const dragIndex = parseInt(e.dataTransfer.getData('catIndex'))
                  if (!isNaN(dragIndex)) reorderCategories(dragIndex, catIndex)
                }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                {/* Category Header */}
                <div className="bg-gradient-to-r from-[var(--accent-light)] to-white p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="cursor-grab text-xl">⠿</span>
                    <div>
                      <h4 className="font-bold text-[var(--primary-dark)]">{category.name}</h4>
                      {category.description && <p className="text-sm text-[var(--warm-gray)]">{category.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowItemForm(showItemForm === category.id ? null : category.id)
                        setEditingItem(null)
                        resetItemForm()
                      }}
                      className="bg-[var(--tropical)] text-white px-3 py-1 rounded-lg text-sm"
                    >
                      + Plat
                    </button>
                    <button
                      onClick={() => {
                        setEditingCategory(category)
                        setCategoryForm({ name: category.name, description: category.description || '' })
                        setShowCategoryForm(true)
                      }}
                      className="text-[var(--tropical)] p-1"
                    >
                      ✏️
                    </button>
                    <button onClick={() => deleteCategory(category)} className="text-red-500 p-1">
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Item Form */}
                {showItemForm === category.id && (
                  <div className="p-4 bg-blue-50 border-t border-blue-200">
                    <h5 className="font-semibold mb-3">{editingItem ? 'Modifier le plat' : 'Nouveau plat'}</h5>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Nom du plat *"
                        value={itemForm.name}
                        onChange={(e) => setItemForm(p => ({ ...p, name: e.target.value }))}
                        className="px-3 py-2 rounded-lg border focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Prix (€)"
                          value={itemForm.price}
                          onChange={(e) => setItemForm(p => ({ ...p, price: e.target.value }))}
                          className="w-24 px-3 py-2 rounded-lg border focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="ou label (ex: 15€/25€)"
                          value={itemForm.price_label}
                          onChange={(e) => setItemForm(p => ({ ...p, price_label: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg border focus:outline-none"
                        />
                      </div>
                      <textarea
                        placeholder="Description"
                        value={itemForm.description}
                        onChange={(e) => setItemForm(p => ({ ...p, description: e.target.value }))}
                        className="md:col-span-2 px-3 py-2 rounded-lg border focus:outline-none resize-none"
                        rows={2}
                      />
                      
                      {/* Image upload section */}
                      <div className="md:col-span-2 space-y-3">
                        <div className="flex flex-wrap gap-3 items-center">
                          <label className="flex items-center gap-2 bg-[var(--accent-light)] hover:bg-[var(--moss)]/20 text-[var(--primary-dark)] px-4 py-2 rounded-lg cursor-pointer transition-colors">
                            <span>📷</span>
                            <span>{uploading ? 'Upload en cours...' : 'Uploader une image'}</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              onChange={handleImageUpload}
                              disabled={uploading}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[var(--warm-gray)] text-sm">ou</span>
                          <input
                            type="text"
                            placeholder="Coller une URL d'image"
                            value={itemForm.image_url}
                            onChange={(e) => setItemForm(p => ({ ...p, image_url: e.target.value }))}
                            className="flex-1 px-3 py-2 rounded-lg border focus:outline-none text-sm min-w-[200px]"
                          />
                          {itemForm.image_url && (
                            <button
                              type="button"
                              onClick={() => setItemForm(p => ({ ...p, image_url: '' }))}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              ✕ Supprimer
                            </button>
                          )}
                        </div>
                        {itemForm.image_url && (
                          <div className="flex items-center gap-3">
                            <img 
                              src={itemForm.image_url} 
                              alt="Aperçu"
                              className="w-20 h-20 object-cover rounded-lg border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                            <span className="text-xs text-[var(--warm-gray)] truncate max-w-xs">
                              {itemForm.image_url}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Allergènes"
                        value={itemForm.allergens}
                        onChange={(e) => setItemForm(p => ({ ...p, allergens: e.target.value }))}
                        className="md:col-span-2 px-3 py-2 rounded-lg border focus:outline-none"
                      />
                      <div className="md:col-span-2 flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={itemForm.is_available}
                            onChange={(e) => setItemForm(p => ({ ...p, is_available: e.target.checked }))}
                          />
                          <span>Disponible</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={itemForm.is_vegetarian}
                            onChange={(e) => setItemForm(p => ({ ...p, is_vegetarian: e.target.checked }))}
                          />
                          <span>🌱 Végétarien</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={itemForm.is_spicy}
                            onChange={(e) => setItemForm(p => ({ ...p, is_spicy: e.target.checked }))}
                          />
                          <span>🌶️ Épicé</span>
                        </label>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => saveItem(category.id)}
                        disabled={saving}
                        className="bg-[var(--tropical)] text-white px-4 py-2 rounded-lg disabled:opacity-50"
                      >
                        {saving ? 'Enregistrement...' : (editingItem ? 'Mettre à jour' : 'Ajouter')}
                      </button>
                      {editingItem && (
                        <button
                          onClick={() => {
                            setEditingItem(null)
                            resetItemForm()
                          }}
                          className="px-4 py-2 rounded-lg border"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="p-4">
                  {(!category.items || category.items.length === 0) ? (
                    <p className="text-center text-[var(--warm-gray)] py-4">Aucun plat dans cette catégorie</p>
                  ) : (
                    <div className="space-y-2">
                      {category.items.map((item, itemIndex) => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('itemIndex', itemIndex.toString())
                            e.dataTransfer.setData('itemCatId', category.id.toString())
                            e.stopPropagation()
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.stopPropagation()
                            const dragIndex = parseInt(e.dataTransfer.getData('itemIndex'))
                            const dragCatId = parseInt(e.dataTransfer.getData('itemCatId'))
                            if (dragCatId === category.id && !isNaN(dragIndex)) {
                              reorderItems(category.id, dragIndex, itemIndex)
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-move ${
                            item.is_available ? 'bg-gray-50' : 'bg-red-50 opacity-60'
                          }`}
                        >
                          <span className="cursor-grab">⠿</span>
                          {item.image_url && (
                            <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[var(--primary-dark)]">{item.name}</span>
                              {item.is_vegetarian && <span title="Végétarien">🌱</span>}
                              {item.is_spicy && <span title="Épicé">🌶️</span>}
                              {!item.is_available && <span className="text-xs bg-red-200 text-red-700 px-2 rounded">Indisponible</span>}
                            </div>
                            {item.description && (
                              <p className="text-sm text-[var(--warm-gray)] truncate">{item.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            {item.price_label ? (
                              <span className="font-semibold text-[var(--tropical)]">{item.price_label}</span>
                            ) : item.price ? (
                              <span className="font-semibold text-[var(--tropical)]">{item.price}€</span>
                            ) : null}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => toggleItemAvailable(item)} className="p-1" title="Disponibilité">
                              {item.is_available ? '✓' : '✗'}
                            </button>
                            <button onClick={() => startEditItem(item)} className="p-1 text-[var(--tropical)]">✏️</button>
                            <button onClick={() => deleteItem(item)} className="p-1 text-red-500">🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
