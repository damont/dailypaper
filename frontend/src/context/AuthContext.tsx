import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../api/client'
import type { User } from '../types'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, displayName: string, password: string, newspaperName: string) => Promise<void>
  googleLogin: (credential: string) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<Pick<User, 'newspaper_name' | 'display_name'>>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (api.isAuthenticated()) {
      api.get<User>('/api/auth/me')
        .then(setUser)
        .catch(() => api.clearToken())
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post<{ access_token: string }>('/api/auth/login', { email, password })
    api.setToken(res.access_token)
    const userData = await api.get<User>('/api/auth/me')
    setUser(userData)
  }

  const register = async (email: string, displayName: string, password: string, newspaperName: string) => {
    await api.post('/api/auth/register', {
      email, display_name: displayName, password, newspaper_name: newspaperName,
    })
    await login(email, password)
  }

  const googleLogin = async (credential: string) => {
    const res = await api.googleLogin(credential)
    api.setToken(res.access_token)
    const userData = await api.get<User>('/api/auth/me')
    setUser(userData)
  }

  const logout = () => {
    api.clearToken()
    setUser(null)
  }

  const updateUser = async (data: Partial<Pick<User, 'newspaper_name' | 'display_name'>>) => {
    const updated = await api.put<User>('/api/auth/me', data)
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, isLoading, user, login, register, googleLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)!
