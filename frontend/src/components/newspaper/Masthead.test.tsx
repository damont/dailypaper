import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Masthead from './Masthead'

describe('Masthead', () => {
  const defaultProps = {
    newspaperName: 'The Test Gazette',
    date: '2026-03-21',
    onPrevDay: vi.fn(),
    onNextDay: vi.fn(),
    onToday: vi.fn(),
    isToday: true,
  }

  it('renders the newspaper name', () => {
    render(<Masthead {...defaultProps} />)
    expect(screen.getByText('The Test Gazette')).toBeInTheDocument()
  })

  it('renders the formatted date', () => {
    render(<Masthead {...defaultProps} />)
    expect(screen.getByText(/March 21, 2026/)).toBeInTheDocument()
  })

  it('calls onPrevDay when left arrow clicked', () => {
    const onPrevDay = vi.fn()
    render(<Masthead {...defaultProps} onPrevDay={onPrevDay} />)
    fireEvent.click(screen.getByLabelText('Previous day'))
    expect(onPrevDay).toHaveBeenCalledOnce()
  })

  it('calls onNextDay when right arrow clicked', () => {
    const onNextDay = vi.fn()
    render(<Masthead {...defaultProps} onNextDay={onNextDay} />)
    fireEvent.click(screen.getByLabelText('Next day'))
    expect(onNextDay).toHaveBeenCalledOnce()
  })

  it('hides "Back to Today" when isToday is true', () => {
    render(<Masthead {...defaultProps} isToday={true} />)
    expect(screen.queryByText('Back to Today')).not.toBeInTheDocument()
  })

  it('shows "Back to Today" when isToday is false', () => {
    const onToday = vi.fn()
    render(<Masthead {...defaultProps} isToday={false} onToday={onToday} />)
    const btn = screen.getByText('Back to Today')
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onToday).toHaveBeenCalledOnce()
  })
})
