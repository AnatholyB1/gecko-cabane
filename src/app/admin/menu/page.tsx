'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MenuPage } from '@/types/database'

export default function MenuAdminPage() {
  const router = useRouter()
  const [pages, setPages] = useState<MenuPage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // New page form
  const [showNewForm, setShowNewForm] = useState(false)
  const [newPage, setNewPage] = useState({ name: '', slug: '', description: '' })

  useEffect(() => {
    fetchPages()
  }, [])

  async function fetchPages() {
    try {
      const response = await fetch('/api/menu/pages')
      const data = await response.json()
      
      if (data.data) {
        setPages(data.data)
      }
    } catch (error) {
      console.error('Error fetching menu pages:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async function createPage() {
    if (!newPage.name.trim()) {
      setMessage({ type: 'error', text: 'Le nom est requis' })
      return
    }
    
    setSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/menu/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPage.name,
          slug: newPage.slug || generateSlug(newPage.name),
          description: newPage.description,
          is_active: true
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Page créée!' })
        setShowNewForm(false)
        setNewPage({ name: '', slug: '', description: '' })
        fetchPages()
      } else {
        if (data.error === 'Unauthorized') {
          router.push('/admin/login')
          return
        }
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la création' })
      }
    } catch (error) {
      console.error('Error creating page:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la création' })
    } finally {
      setSaving(false)
    }
  }

  async function deletePage(id: number, name: string) {
    if (!confirm(`Supprimer la page "${name}" et tout son contenu?`)) return
    
    try {
      const response = await fetch(`/api/menu/pages?id=${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Page supprimée' })
        fetchPages()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Erreur' })
      }
    } catch (error) {
      console.error('Error deleting page:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' })
    }
  }

  async function togglePageActive(page: MenuPage) {
    try {
      const response = await fetch('/api/menu/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: page.id,
          name: page.name,
          slug: page.slug,
          description: page.description,
          is_active: !page.is_active
        })
      })
      
      if (response.ok) {
        fetchPages()
      }
    } catch (error) {
      console.error('Error toggling page:', error)
    }
  }

  async function reorderPages(dragIndex: number, dropIndex: number) {
    if (dragIndex === dropIndex) return
    
    const newPages = [...pages]
    const [removed] = newPages.splice(dragIndex, 1)
    newPages.splice(dropIndex, 0, removed)
    
    // Update display_order
    const reorderedItems = newPages.map((page, index) => ({
      id: page.id,
      display_order: index
    }))
    
    setPages(newPages)
    
    try {
      await fetch('/api/menu/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pages', items: reorderedItems })
      })
    } catch (error) {
      console.error('Error reordering:', error)
      fetchPages() // Revert on error
    }
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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Admin Header */}
      <header className="bg-gradient-to-r from-[var(--jungle-dark)] to-[var(--primary-dark)] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🦎</span>
            <div>
              <h1 className="text-xl font-bold">Gecko Cabane Admin</h1>
              <p className="text-sm opacity-80">Gestion du menu</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              ← Retour
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-[var(--primary-dark)] flex items-center gap-3">
            <span>🍽️</span> Pages de menu
          </h2>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="bg-[var(--tropical)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary)] transition-colors"
          >
            {showNewForm ? '✕ Annuler' : '+ Nouvelle page'}
          </button>
        </div>

        {/* New Page Form */}
        {showNewForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="font-semibold text-[var(--primary-dark)] mb-4">Nouvelle page de menu</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--primary-dark)] mb-1">
                  Nom de la page *
                </label>
                <input
                  type="text"
                  placeholder="ex: Carte du midi, Boissons..."
                  value={newPage.name}
                  onChange={(e) => {
                    setNewPage(prev => ({ 
                      ...prev, 
                      name: e.target.value,
                      slug: generateSlug(e.target.value)
                    }))
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[var(--tropical)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--primary-dark)] mb-1">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  placeholder="carte-du-midi"
                  value={newPage.slug}
                  onChange={(e) => setNewPage(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[var(--tropical)] focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--primary-dark)] mb-1">
                  Description (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Description de la page..."
                  value={newPage.description}
                  onChange={(e) => setNewPage(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[var(--tropical)] focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={createPage}
              disabled={saving}
              className="mt-4 bg-[var(--tropical)] text-white px-6 py-2 rounded-lg hover:bg-[var(--primary)] transition-colors disabled:opacity-50"
            >
              {saving ? 'Création...' : '✓ Créer la page'}
            </button>
          </div>
        )}

        {/* Pages List */}
        {pages.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-[var(--warm-gray)] mb-4">Aucune page de menu</p>
            <p className="text-sm text-[var(--warm-gray)]">
              Créez votre première page de menu pour commencer
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pages.map((page, index) => (
              <div 
                key={page.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('index', index.toString())}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const dragIndex = parseInt(e.dataTransfer.getData('index'))
                  reorderPages(dragIndex, index)
                }}
                className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${
                  page.is_active ? 'border-[var(--tropical)]' : 'border-gray-300'
                } cursor-move hover:shadow-xl transition-shadow`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl cursor-grab">⠿</span>
                    <div>
                      <h3 className="font-bold text-[var(--primary-dark)] text-lg">
                        {page.name}
                      </h3>
                      {page.description && (
                        <p className="text-sm text-[var(--warm-gray)]">{page.description}</p>
                      )}
                      <p className="text-xs text-[var(--warm-gray)] mt-1">
                        /{page.slug} • {page.categories?.length || 0} catégories
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => togglePageActive(page)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        page.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {page.is_active ? '✓ Actif' : 'Inactif'}
                    </button>
                    <Link
                      href={`/admin/menu/${page.id}`}
                      className="bg-[var(--tropical)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary)] transition-colors"
                    >
                      Éditer
                    </Link>
                    <button
                      onClick={() => deletePage(page.id, page.name)}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <p className="font-medium mb-1">💡 Conseils</p>
          <ul className="list-disc list-inside space-y-1 opacity-80">
            <li>Glissez-déposez les pages pour changer leur ordre</li>
            <li>Désactivez une page pour la masquer du site sans la supprimer</li>
            <li>Cliquez sur &quot;Éditer&quot; pour ajouter des catégories et des plats</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
