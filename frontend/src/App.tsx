import { useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { useRouter, matchPath } from './hooks/useRouter'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import EditionView from './components/newspaper/EditionView'
import PageManager from './components/editor/PageManager'
import SettingsPage from './components/layout/SettingsPage'

type View = 'edition' | 'pages' | 'settings'

function getView(path: string): { view: View; params: Record<string, string> } {
  const editionMatch = matchPath('/edition/:date', path)
  if (editionMatch) return { view: 'edition', params: editionMatch }
  if (path === '/edition' || path === '/') return { view: 'edition', params: {} }
  if (path === '/pages') return { view: 'pages', params: {} }
  if (path === '/settings') return { view: 'settings', params: {} }
  return { view: 'edition', params: {} }
}

export default function App() {
  const { user, isLoading, logout } = useAuth()
  const { path, navigate } = useRouter()

  useEffect(() => {
    if (!isLoading && user && path === '/') {
      navigate('/edition', true)
    }
  }, [isLoading, user, path, navigate])

  useEffect(() => {
    if (!isLoading && !user && path !== '/' && path !== '/register') {
      navigate('/', true)
    }
  }, [isLoading, user, path, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <p className="text-[var(--text-secondary)] italic" style={{ fontFamily: 'var(--font-body)' }}>
          Loading...
        </p>
      </div>
    )
  }

  if (!user) {
    if (path === '/register') {
      return <Register onSwitch={() => navigate('/')} />
    }
    return <Login onSwitch={() => navigate('/register')} />
  }

  const { view, params } = getView(path)

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <header className="bg-[var(--header-bg)] border-b border-[var(--border-color)] px-4 py-2 flex items-center justify-between">
        <a
          href="/edition"
          onClick={e => { e.preventDefault(); navigate('/edition') }}
          className="text-lg font-bold text-[var(--bg-main)] hover:opacity-80"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          {user.newspaper_name}
        </a>
        <nav className="flex items-center gap-3">
          <NavLink href="/edition" label="Edition" active={view === 'edition'} navigate={navigate} />
          <NavLink href="/pages" label="Pages" active={view === 'pages'} navigate={navigate} />
          <NavLink href="/settings" label="Settings" active={view === 'settings'} navigate={navigate} />
          <span className="text-sm text-gray-400 hidden sm:inline">{user.display_name}</span>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            Logout
          </button>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-4">
        {view === 'edition' && <EditionView date={params.date} navigate={navigate} />}
        {view === 'pages' && <PageManager />}
        {view === 'settings' && <SettingsPage />}
      </main>
    </div>
  )
}

function NavLink({ href, label, active, navigate }: {
  href: string; label: string; active: boolean; navigate: (path: string) => void
}) {
  return (
    <a
      href={href}
      onClick={e => { e.preventDefault(); navigate(href) }}
      className={`text-sm px-2 py-1 ${
        active
          ? 'text-[var(--bg-main)] border-b-2 border-[var(--bg-main)]'
          : 'text-gray-400 hover:text-gray-300'
      }`}
    >
      {label}
    </a>
  )
}
