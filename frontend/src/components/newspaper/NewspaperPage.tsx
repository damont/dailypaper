import type { EditionPage } from '../../types'
import FeaturedStory from './FeaturedStory'
import MediumStoryGrid from './MediumStoryGrid'
import HeadlineList from './HeadlineList'

interface NewspaperPageProps {
  page: EditionPage
}

export default function NewspaperPage({ page }: NewspaperPageProps) {
  const sorted = [...page.stories].sort((a, b) => a.position - b.position)
  const high = sorted.filter(s => s.priority === 'high')
  const medium = sorted.filter(s => s.priority === 'medium')
  const low = sorted.filter(s => s.priority === 'low')

  return (
    <div className="py-4">
      {page.headline && (
        <h2
          className="text-center text-xl sm:text-2xl font-bold mb-4 pb-2 border-b border-[var(--border-color)] text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          {page.headline}
        </h2>
      )}

      {high.map(story => (
        <FeaturedStory key={story.id} story={story} />
      ))}

      <MediumStoryGrid stories={medium} />

      <HeadlineList stories={low} />

      {high.length === 0 && medium.length === 0 && low.length === 0 && (
        <p className="text-center text-[var(--text-muted)] italic py-8">
          No stories on this page yet.
        </p>
      )}
    </div>
  )
}
