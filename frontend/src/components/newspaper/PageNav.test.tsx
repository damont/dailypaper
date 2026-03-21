import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PageNav from './PageNav'
import type { EditionPage } from '../../types'

const makePage = (slug: string, name: string): EditionPage => ({
  page_slug: slug,
  page_name: name,
  display_order: 0,
  headline: null,
  stories: [],
})

describe('PageNav', () => {
  it('renders page names', () => {
    const pages = [makePage('news', 'News'), makePage('sports', 'Sports')]
    render(<PageNav pages={pages} activeSlug="news" onSelect={vi.fn()} />)
    expect(screen.getByText('News')).toBeInTheDocument()
    expect(screen.getByText('Sports')).toBeInTheDocument()
  })

  it('calls onSelect when tab clicked', () => {
    const onSelect = vi.fn()
    const pages = [makePage('news', 'News'), makePage('sports', 'Sports')]
    render(<PageNav pages={pages} activeSlug="news" onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Sports'))
    expect(onSelect).toHaveBeenCalledWith('sports')
  })

  it('renders nothing when pages is empty', () => {
    const { container } = render(<PageNav pages={[]} activeSlug={null} onSelect={vi.fn()} />)
    expect(container.innerHTML).toBe('')
  })

  it('highlights the active tab', () => {
    const pages = [makePage('news', 'News'), makePage('sports', 'Sports')]
    render(<PageNav pages={pages} activeSlug="sports" onSelect={vi.fn()} />)
    const sportsBtn = screen.getByText('Sports')
    expect(sportsBtn.className).toContain('border-b-2')
  })
})
