import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Login from './Login'

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn().mockRejectedValue(new Error('Invalid credentials')),
  }),
}))

describe('Login', () => {
  it('renders login form', () => {
    render(<Login onSwitch={vi.fn()} onForgot={vi.fn()} />)
    expect(screen.getByText('The Daily Paper')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('has link to register', () => {
    const onSwitch = vi.fn()
    render(<Login onSwitch={onSwitch} onForgot={vi.fn()} />)
    fireEvent.click(screen.getByText('Register'))
    expect(onSwitch).toHaveBeenCalledOnce()
  })

  it('shows error on failed login', async () => {
    render(<Login onSwitch={vi.fn()} onForgot={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } })
    fireEvent.submit(screen.getByText('Sign In'))

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
  })
})
