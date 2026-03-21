import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'

interface AgentTokenInfo {
  id: string
  name: string
  created_at: string
  expires_at: string
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [newspaperName, setNewspaperName] = useState(user?.newspaper_name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [nameMsg, setNameMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  // Agent tokens
  const [tokens, setTokens] = useState<AgentTokenInfo[]>([])
  const [tokenName, setTokenName] = useState('')
  const [tokenDays, setTokenDays] = useState(30)
  const [newToken, setNewToken] = useState('')
  const [tokenError, setTokenError] = useState('')

  const loadTokens = () => {
    api.get<{ tokens: AgentTokenInfo[] }>('/api/auth/agent-tokens')
      .then(res => setTokens(res.tokens))
      .catch(() => {})
  }

  useEffect(loadTokens, [])

  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameMsg('')
    try {
      await updateUser({ display_name: displayName, newspaper_name: newspaperName })
      setNameMsg('Saved!')
    } catch {
      setNameMsg('Failed to update')
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg('')
    if (!newPassword) return
    try {
      await api.put('/api/auth/me', { password: newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setPwMsg('Password updated!')
    } catch {
      setPwMsg('Failed to update password')
    }
  }

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setTokenError('')
    setNewToken('')
    const password = prompt('Enter your password to create an agent token:')
    if (!password) return
    try {
      const res = await api.post<{ access_token: string }>('/api/auth/agent-token', {
        email: user?.email,
        password,
        name: tokenName || 'default',
        expires_in_days: tokenDays,
      })
      setNewToken(res.access_token)
      setTokenName('')
      loadTokens()
    } catch (err) {
      setTokenError(err instanceof Error ? err.message : 'Failed to create token')
    }
  }

  const handleRevokeToken = async (id: string, name: string) => {
    if (!confirm(`Revoke token "${name}"?`)) return
    await api.delete(`/api/auth/agent-tokens/${id}`)
    loadTokens()
  }

  return (
    <div className="max-w-lg">
      <h2
        className="text-2xl font-bold mb-6 text-[var(--text-primary)]"
        style={{ fontFamily: 'var(--font-headline)' }}
      >
        Settings
      </h2>

      <section className="mb-8">
        <h3 className="text-lg font-bold mb-3 text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-headline)' }}>
          Profile
        </h3>
        <form onSubmit={handleNameSave} className="space-y-3">
          <div>
            <label className="text-sm text-[var(--text-secondary)] block mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-main)] rounded text-[var(--text-primary)] min-h-[44px] sm:min-h-0"
              required
            />
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)] block mb-1">Newspaper Name</label>
            <input
              type="text"
              value={newspaperName}
              onChange={e => setNewspaperName(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-main)] rounded text-[var(--text-primary)] min-h-[44px] sm:min-h-0"
              style={{ fontFamily: 'var(--font-headline)' }}
              required
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] min-h-[44px] sm:min-h-0">
            Save
          </button>
        </form>
        {nameMsg && <p className="text-sm mt-1 text-[var(--success)]">{nameMsg}</p>}
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-bold mb-3 text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-headline)' }}>
          Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <input type="password" placeholder="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-main)] rounded text-[var(--text-primary)] min-h-[44px] sm:min-h-0" />
          <input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-main)] rounded text-[var(--text-primary)] min-h-[44px] sm:min-h-0" required />
          <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] min-h-[44px] sm:min-h-0">
            Update Password
          </button>
        </form>
        {pwMsg && <p className="text-sm mt-1 text-[var(--success)]">{pwMsg}</p>}
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-bold mb-3 text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-headline)' }}>
          Agent Tokens
        </h3>
        <p className="text-sm text-[var(--text-muted)] mb-3">
          Create tokens for agents and scripts to access your newspaper's API.
          Tokens use the same endpoints as the browser.
          API docs available at <a href="/api/agent" target="_blank" className="text-[var(--accent)] hover:underline">/api/agent</a>.
        </p>

        <form onSubmit={handleCreateToken} className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Token name (e.g., openclaw)"
            value={tokenName}
            onChange={e => setTokenName(e.target.value)}
            className="flex-1 px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-main)] rounded text-[var(--text-primary)] min-h-[44px] sm:min-h-0"
          />
          <select
            value={tokenDays}
            onChange={e => setTokenDays(Number(e.target.value))}
            className="px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-main)] rounded text-[var(--text-primary)] min-h-[44px] sm:min-h-0"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={365}>1 year</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] min-h-[44px] sm:min-h-0">
            Create
          </button>
        </form>
        {tokenError && <p className="text-sm text-[var(--danger)] mb-2">{tokenError}</p>}

        {newToken && (
          <div className="p-3 bg-[var(--bg-raised)] border border-[var(--border-color)] rounded mb-4">
            <p className="text-sm font-bold text-[var(--text-primary)] mb-1">Token created! Copy it now — it won't be shown again.</p>
            <code className="text-xs break-all text-[var(--text-secondary)] select-all block p-2 bg-[var(--bg-main)] rounded border border-[var(--border-color)]">
              {newToken}
            </code>
          </div>
        )}

        {tokens.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] italic">No active tokens.</p>
        ) : (
          <div className="space-y-2">
            {tokens.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded">
                <div>
                  <span className="font-bold text-sm text-[var(--text-primary)]">{t.name}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-2">
                    expires {new Date(t.expires_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => handleRevokeToken(t.id, t.name)}
                  className="text-xs text-[var(--danger)] hover:underline"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-bold mb-3 text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-headline)' }}>
          Account
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Email: <span className="font-bold">{user?.email}</span>
        </p>
      </section>
    </div>
  )
}
