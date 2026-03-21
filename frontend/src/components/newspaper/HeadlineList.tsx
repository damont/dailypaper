import type { Story } from '../../types'

interface HeadlineListProps {
  stories: Story[]
}

export default function HeadlineList({ stories }: HeadlineListProps) {
  if (stories.length === 0) return null

  return (
    <div className="border-t border-[var(--border-color)] pt-4">
      <h4
        className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-3 font-bold"
        style={{ fontFamily: 'var(--font-headline)' }}
      >
        In Brief
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {stories.map(story => (
          <div key={story.id} className="flex items-start gap-2 py-1">
            <span className="text-[var(--accent)] mt-0.5 select-none">&bull;</span>
            <div>
              <span
                className="text-sm font-bold text-[var(--text-primary)]"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {story.link ? (
                  <a href={story.link} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)]">
                    {story.title}
                  </a>
                ) : (
                  story.title
                )}
              </span>
              {story.body && (
                <span className="text-xs text-[var(--text-muted)] ml-1" style={{ fontFamily: 'var(--font-body)' }}>
                  &mdash; {story.body.length > 80 ? story.body.slice(0, 80) + '...' : story.body}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
