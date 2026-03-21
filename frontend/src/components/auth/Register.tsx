import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function Register({ onSwitch }: { onSwitch: () => void }) {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [newspaperName, setNewspaperName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await register(email, displayName, password, newspaperName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
      <div className="w-full max-w-sm p-8 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded">
        <h1
          className="text-3xl font-bold text-center mb-2 text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          Create Your Paper
        </h1>
        <p className="text-sm text-center mb-6 text-[var(--text-muted)]">
          Choose a name for your daily newspaper
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your Paper's Name (e.g., The Smith Gazette)"
            value={newspaperName}
            onChange={e => setNewspaperName(e.target.value)}
            className="px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-main)] rounded text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-headline)' }}
            required
          />
          <input
            type="text"
            placeholder="Your Name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-main)] rounded text-[var(--text-primary)]"
            required
          />
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
            Create Account
          </button>
        </form>
        <p className="text-sm text-center mt-4 text-[var(--text-muted)]">
          Already have an account?{' '}
          <button onClick={onSwitch} className="text-[var(--accent)] hover:underline">
            Sign In
          </button>
        </p>
      </div>
    </div>
  )
}
