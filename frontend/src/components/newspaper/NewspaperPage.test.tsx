import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import NewspaperPage from './NewspaperPage'
import type { EditionPage } from '../../types'

describe('NewspaperPage', () => {
  it('renders headline', () => {
    const page: EditionPage = {
      page_slug: 'news',
      page_name: 'News',
      display_order: 0,
      headline: 'Breaking News Today',
      stories: [],
    }
    render(<NewspaperPage page={page} />)
    expect(screen.getByText('Breaking News Today')).toBeInTheDocument()
  })

  it('separates stories by priority', () => {
    const page: EditionPage = {
      page_slug: 'news',
      page_name: 'News',
      display_order: 0,
      headline: null,
      stories: [
        { id: '1', title: 'Featured Story', body: 'Big news here with a long body text.', image_url: null, link: null, priority: 'high', position: 0 },
        { id: '2', title: 'Mid Story', body: 'Medium importance.', image_url: null, link: null, priority: 'medium', position: 0 },
        { id: '3', title: 'Brief Item', body: 'Quick note.', image_url: null, link: null, priority: 'low', position: 0 },
      ],
    }
    render(<NewspaperPage page={page} />)
    expect(screen.getByText('Featured Story')).toBeInTheDocument()
    expect(screen.getByText('Mid Story')).toBeInTheDocument()
    expect(screen.getByText('Brief Item')).toBeInTheDocument()
  })

  it('shows empty message when no stories', () => {
    const page: EditionPage = {
      page_slug: 'news',
      page_name: 'News',
      display_order: 0,
      headline: null,
      stories: [],
    }
    render(<NewspaperPage page={page} />)
    expect(screen.getByText(/no stories/i)).toBeInTheDocument()
  })

  it('renders "In Brief" section for low priority stories', () => {
    const page: EditionPage = {
      page_slug: 'news',
      page_name: 'News',
      display_order: 0,
      headline: null,
      stories: [
        { id: '1', title: 'Quick Update', body: 'Short.', image_url: null, link: null, priority: 'low', position: 0 },
      ],
    }
    render(<NewspaperPage page={page} />)
    expect(screen.getByText('In Brief')).toBeInTheDocument()
  })
})
