import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import type { Page } from '../../types'

export default function PageManager() {
  const [pages, setPages] = useState<Page[]>([])
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  const loadPages = () => {
    api.get<Page[]>('/api/pages/').then(setPages).catch(() => {})
  }

  useEffect(loadPages, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const slug = newSlug || newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (!slug) return
    try {
      await api.post('/api/pages/', {
        name: newName,
        slug,
        display_order: pages.length,
      })
      setNewName('')
      setNewSlug('')
      loadPages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page')
    }
  }

  const handleRename = async (page: Page) => {
    if (!editName.trim()) return
    await api.put(`/api/pages/${page.slug}`, { name: editName })
    setEditingId(null)
    loadPages()
  }

  const handleReorder = async (page: Page, direction: -1 | 1) => {
    const idx = pages.findIndex(p => p.id === page.id)
    const swapIdx = idx + direction
    if (swapIdx < 0 || swapIdx >= pages.length) return
    const other = pages[swapIdx]
    await Promise.all([
      api.put(`/api/pages/${page.slug}`, { display_order: other.display_order }),
      api.put(`/api/pages/${other.slug}`, { display_order: page.display_order }),
    ])
    loadPages()
  }

  const handleDelete = async (page: Page) => {
    if (!confirm(`Delete "${page.name}" and all its content?`)) return
    await api.delete(`/api/pages/${page.slug}`)
    loadPages()
  }

  return (
    <div>
      <h2
        className="text-2xl font-bold mb-6 text-[var(--text-primary)]"
        style={{ fontFamily: 'var(--font-headline)' }}
      >
        Manage Pages
      </h2>

      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="text"
          placeholder="Page name (e.g., Sports)"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="flex-1 px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-main)] rounded text-[var(--text-primary)] min-h-[44px] sm:min-h-0"
          required
        />
        <input
          type="text"
          placeholder="Slug (auto-generated)"
          value={newSlug}
          onChange={e => setNewSlug(e.target.value)}
          className="sm:w-40 px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-main)] rounded text-[var(--text-primary)] min-h-[44px] sm:min-h-0"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] min-h-[44px] sm:min-h-0"
        >
          Add Page
        </button>
      </form>
      {error && <p className="text-sm text-[var(--danger)] mb-4">{error}</p>}

      {pages.length === 0 ? (
        <p className="text-[var(--text-muted)] italic">No pages yet. Create one above.</p>
      ) : (
        <div className="space-y-2">
          {pages.map((page, idx) => (
            <div
              key={page.id}
              className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleReorder(page, -1)}
                  disabled={idx === 0}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30"
                >
                  &#9650;
                </button>
                <button
                  onClick={() => handleReorder(page, 1)}
                  disabled={idx === pages.length - 1}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30"
                >
                  &#9660;
                </button>
              </div>

              <div className="flex-1">
                {editingId === page.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRename(page)}
                      className="flex-1 px-2 py-1 border border-[var(--border-color)] bg-[var(--bg-main)] rounded text-sm text-[var(--text-primary)]"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRename(page)}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-[var(--text-muted)] hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <span className="font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-headline)' }}>
                      {page.name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] ml-2">/{page.slug}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingId(page.id); setEditName(page.name) }}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDelete(page)}
                  className="text-xs text-[var(--danger)] hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
