import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function Login({ onSwitch, onForgot }: { onSwitch: () => void; onForgot: () => void }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
    } catch {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
      <div className="w-full max-w-sm p-8 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded">
        <h1
          className="text-3xl font-bold text-center mb-6 text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          The Daily Paper
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-main)] rounded text-[var(--text-primary)]"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-main)] rounded text-[var(--text-primary)]"
            required
          />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)]"
          >
            Sign In
          </button>
        </form>
        <p className="text-sm text-center mt-3 text-[var(--text-muted)]">
          <button onClick={onForgot} className="text-[var(--accent)] hover:underline">
            Forgot password?
          </button>
        </p>
        <p className="text-sm text-center mt-2 text-[var(--text-muted)]">
          Don't have an account?{' '}
          <button onClick={onSwitch} className="text-[var(--accent)] hover:underline">
            Register
          </button>
        </p>
      </div>
    </div>
  )
}
