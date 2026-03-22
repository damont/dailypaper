import { useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { useRouter, matchPath } from './hooks/useRouter'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import ForgotPassword from './components/auth/ForgotPassword'
import ResetPassword from './components/auth/ResetPassword'
import EditionView from './components/newspaper/EditionView'
import UserProfile from './components/layout/UserProfile'

type View = 'edition' | 'profile'

function getView(path: string): { view: View; params: Record<string, string> } {
  const editionMatch = matchPath('/edition/:date', path)
  if (editionMatch) return { view: 'edition', params: editionMatch }
  if (path === '/profile') return { view: 'profile', params: {} }
  return { view: 'edition', params: {} }
}

const UNAUTH_PATHS = ['/', '/register', '/forgot-password']

export default function App() {
  const { user, isLoading, logout } = useAuth()
  const { path, navigate } = useRouter()

  useEffect(() => {
    if (!isLoading && user && path === '/') {
      navigate('/edition', true)
    }
  }, [isLoading, user, path, navigate])

  useEffect(() => {
    if (!isLoading && !user && !UNAUTH_PATHS.includes(path) && !path.startsWith('/reset-password/')) {
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
    if (path === '/forgot-password') {
      return <ForgotPassword onBack={() => navigate('/')} />
    }
    const resetMatch = matchPath('/reset-password/:token', path)
    if (resetMatch) {
      return <ResetPassword token={resetMatch.token} onBack={() => navigate('/')} />
    }
    return <Login onSwitch={() => navigate('/register')} onForgot={() => navigate('/forgot-password')} />
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
        <div className="flex items-center gap-3">
          <a
            href="/profile"
            onClick={e => { e.preventDefault(); navigate('/profile') }}
            className="text-sm text-gray-400 hover:text-gray-300"
          >
            {user.display_name}
          </a>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-4">
        {view === 'edition' && <EditionView date={params.date} navigate={navigate} />}
        {view === 'profile' && <UserProfile />}
      </main>
    </div>
  )
}
