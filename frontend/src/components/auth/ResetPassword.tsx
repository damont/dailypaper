import { useState } from 'react'
import { api } from '../../api/client'

interface ResetPasswordProps {
  token: string
  onBack: () => void
}

export default function ResetPassword({ token, onBack }: ResetPasswordProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', { token, new_password: password })
      setSuccess(true)
    } catch {
      setError('Invalid or expired reset link.')
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
          Set New Password
        </h1>
        {success ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">Your password has been reset successfully.</p>
            <button onClick={onBack} className="text-sm text-[var(--accent)] hover:underline">
              Sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <p className="text-sm text-[var(--danger)] text-center">{error}</p>}
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-main)] rounded text-[var(--text-primary)]"
              minLength={6}
              required
              autoFocus
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-main)] rounded text-[var(--text-primary)]"
              minLength={6}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
