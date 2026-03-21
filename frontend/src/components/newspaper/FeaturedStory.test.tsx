import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FeaturedStory from './FeaturedStory'
import type { Story } from '../../types'

describe('FeaturedStory', () => {
  const baseStory: Story = {
    id: '1',
    title: 'Big Discovery',
    body: 'Scientists found something amazing today.',
    image_url: null,
    link: null,
    priority: 'high',
    position: 0,
  }

  it('renders title and body with drop cap', () => {
    render(<FeaturedStory story={baseStory} />)
    expect(screen.getByText('Big Discovery')).toBeInTheDocument()
    // Drop cap: first letter is separate, rest of body follows
    expect(screen.getByText('S')).toBeInTheDocument()
    expect(screen.getByText(/cientists found something/)).toBeInTheDocument()
  })

  it('renders link on title when link is provided', () => {
    const story = { ...baseStory, link: 'https://example.com' }
    render(<FeaturedStory story={story} />)
    const link = screen.getByText('Big Discovery').closest('a')
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders "Read full story" link', () => {
    const story = { ...baseStory, link: 'https://example.com' }
    render(<FeaturedStory story={story} />)
    const readMore = screen.getByText(/read full story/i)
    expect(readMore).toHaveAttribute('href', 'https://example.com')
  })

  it('does not render link elements when no link', () => {
    render(<FeaturedStory story={baseStory} />)
    expect(screen.queryByText(/read full story/i)).not.toBeInTheDocument()
  })

  it('renders image when image_url is provided', () => {
    const story = { ...baseStory, image_url: '/api/images/test.jpg' }
    render(<FeaturedStory story={story} />)
    const img = screen.getByAltText('Big Discovery')
    expect(img).toHaveAttribute('src', '/api/images/test.jpg')
  })
})
