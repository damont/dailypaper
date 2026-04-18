import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

export default function Register({ onSwitch }: { onSwitch: () => void }) {
  const { register, googleLogin } = useAuth()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [newspaperName, setNewspaperName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(email, displayName, password, newspaperName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credential: string | undefined) => {
    if (!credential) return
    setLoading(true)
    setError('')
    try {
      await googleLogin(credential)
    } catch {
      setError('Google login failed')
    } finally {
      setLoading(false)
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

        {googleClientId && (
          <div className="mb-4">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={(resp) => handleGoogleSuccess(resp.credential)}
                onError={() => setError('Google login failed')}
              />
            </div>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-color)]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[var(--bg-surface)] px-2 text-[var(--text-muted)]">or</span>
              </div>
            </div>
          </div>
        )}

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
            disabled={loading}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Account'}
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
