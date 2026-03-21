import type { EditionPage } from '../../types'

interface PageNavProps {
  pages: EditionPage[]
  activeSlug: string | null
  onSelect: (slug: string) => void
}

export default function PageNav({ pages, activeSlug, onSelect }: PageNavProps) {
  if (pages.length === 0) return null

  return (
    <nav className="flex justify-center gap-1 py-3 border-b border-[var(--border-color)] overflow-x-auto">
      {pages.map((page, i) => (
        <span key={page.page_slug} className="flex items-center">
          {i > 0 && (
            <span className="text-[var(--text-muted)] mx-2 select-none">|</span>
          )}
          <button
            onClick={() => onSelect(page.page_slug)}
            className={`text-xs sm:text-sm uppercase tracking-widest px-2 py-1 font-bold transition-colors ${
              activeSlug === page.page_slug
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            {page.page_name}
          </button>
        </span>
      ))}
    </nav>
  )
}
