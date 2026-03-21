import type { Story } from '../../types'

interface FeaturedStoryProps {
  story: Story
}

export default function FeaturedStory({ story }: FeaturedStoryProps) {
  return (
    <article className="mb-6 pb-6 border-b border-[var(--border-color)]">
      <h2
        className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-3 text-[var(--text-primary)]"
        style={{ fontFamily: 'var(--font-headline)' }}
      >
        {story.link ? (
          <a href={story.link} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)]">
            {story.title}
          </a>
        ) : (
          story.title
        )}
      </h2>
      {story.image_url && (
        <div className="mb-4">
          <img
            src={story.image_url}
            alt={story.title}
            className="w-full max-h-96 object-cover border border-[var(--border-color)]"
          />
        </div>
      )}
      <div
        className="text-base sm:text-lg leading-relaxed text-[var(--text-primary)]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <span className="text-4xl font-bold float-left mr-2 leading-none" style={{ fontFamily: 'var(--font-headline)' }}>
          {story.body.charAt(0)}
        </span>
        {story.body.slice(1)}
      </div>
      {story.link && (
        <a
          href={story.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-sm text-[var(--accent)] hover:underline italic"
        >
          Read full story &rarr;
        </a>
      )}
    </article>
  )
}
