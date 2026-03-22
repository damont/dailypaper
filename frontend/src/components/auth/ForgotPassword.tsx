import { useState } from 'react'
import { api } from '../../api/client'

export default function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/auth/forgot-password', { email })
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
      <div className="w-full max-w-sm p-8 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded">
        <h1
          className="text-2xl font-bold text-center mb-4 text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          Reset Password
        </h1>
        {submitted ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              If that email is registered, you'll receive a password reset link shortly.
            </p>
            <button onClick={onBack} className="text-sm text-[var(--accent)] hover:underline">
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-[var(--text-muted)] text-center">
              Enter your email and we'll send you a reset link.
            </p>
            {error && <p className="text-sm text-[var(--danger)] text-center">{error}</p>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-main)] rounded text-[var(--text-primary)]"
              required
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            <p className="text-sm text-center">
              <button onClick={onBack} className="text-[var(--accent)] hover:underline">
                Back to sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
