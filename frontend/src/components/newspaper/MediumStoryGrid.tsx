import type { Story } from '../../types'

interface MediumStoryGridProps {
  stories: Story[]
}

function MediumStoryCard({ story }: { story: Story }) {
  return (
    <article className="pb-4 border-b border-[var(--border-color)]">
      {story.image_url && (
        <img
          src={story.image_url}
          alt={story.title}
          className="w-full h-40 object-cover mb-2 border border-[var(--border-color)]"
        />
      )}
      <h3
        className="text-lg sm:text-xl font-bold leading-snug mb-2 text-[var(--text-primary)]"
        style={{ fontFamily: 'var(--font-headline)' }}
      >
        {story.link ? (
          <a href={story.link} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)]">
            {story.title}
          </a>
        ) : (
          story.title
        )}
      </h3>
      <p
        className="text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-4"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {story.body}
      </p>
      {story.link && (
        <a
          href={story.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-xs text-[var(--accent)] hover:underline italic"
        >
          Read more &rarr;
        </a>
      )}
    </article>
  )
}

export default function MediumStoryGrid({ stories }: MediumStoryGridProps) {
  if (stories.length === 0) return null

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 mb-6"
      style={{ columnGap: 0 }}
    >
      {stories.map((story, i) => (
        <div
          key={story.id}
          className={`px-4 ${
            stories.length > 1 && i % 2 === 0 ? 'sm:border-r sm:border-[var(--border-color)]' : ''
          }`}
        >
          <MediumStoryCard story={story} />
        </div>
      ))}
    </div>
  )
}
