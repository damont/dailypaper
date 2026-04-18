class ApiClient {
  private baseUrl = ''

  getToken(): string | null {
    return localStorage.getItem('token')
  }

  setToken(token: string) {
    localStorage.setItem('token', token)
  }

  clearToken() {
    localStorage.removeItem('token')
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (res.status === 401) {
      this.clearToken()
      throw new Error('Unauthorized')
    }

    if (!res.ok) {
      const detail = await res.json().catch(() => null)
      throw new Error(detail?.detail || `API error: ${res.status}`)
    }

    if (res.status === 204) return undefined as T
    return res.json()
  }

  async upload<T>(path: string, file: File): Promise<T> {
    const headers: Record<string, string> = {}
    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (res.status === 401) {
      this.clearToken()
      throw new Error('Unauthorized')
    }

    if (!res.ok) {
      const detail = await res.json().catch(() => null)
      throw new Error(detail?.detail || `API error: ${res.status}`)
    }

    return res.json()
  }

  get<T>(path: string) { return this.request<T>('GET', path) }
  post<T>(path: string, body: unknown) { return this.request<T>('POST', path, body) }
  put<T>(path: string, body: unknown) { return this.request<T>('PUT', path, body) }
  delete<T>(path: string) { return this.request<T>('DELETE', path) }

  async googleLogin(idToken: string): Promise<{ access_token: string; token_type: string }> {
    const res = await fetch(`${this.baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    })

    if (!res.ok) {
      const detail = await res.json().catch(() => null)
      throw new ApiError(res.status, detail?.detail || 'Google login failed')
    }

    return res.json()
  }
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const api = new ApiClient()
