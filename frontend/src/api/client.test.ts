import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from './client'

describe('ApiClient', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('includes auth header when token exists', async () => {
    api.setToken('test-token')
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await api.get('/api/test')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    )
  })

  it('does not include auth header without token', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })
    vi.stubGlobal('fetch', mockFetch)

    await api.get('/api/test')

    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers.Authorization).toBeUndefined()
  })

  it('clears token on 401 response', async () => {
    api.setToken('expired-token')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ detail: 'Unauthorized' }),
    }))

    await expect(api.get('/api/test')).rejects.toThrow('Unauthorized')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: 'Server error' }),
    }))

    await expect(api.get('/api/test')).rejects.toThrow('Server error')
  })

  it('handles 204 no content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    }))

    const result = await api.delete('/api/test')
    expect(result).toBeUndefined()
  })

  it('sends JSON body on post', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '1' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await api.post('/api/test', { name: 'test' })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      }),
    )
  })

  it('upload sends FormData without Content-Type header', async () => {
    api.setToken('test-token')
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ image_key: 'key' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })
    await api.upload('/api/pages/news/images', file)

    const callHeaders = mockFetch.mock.calls[0][1].headers
    // Should NOT have Content-Type (browser sets it with boundary for FormData)
    expect(callHeaders['Content-Type']).toBeUndefined()
    expect(callHeaders['Authorization']).toBe('Bearer test-token')
  })

  it('token management works correctly', () => {
    expect(api.isAuthenticated()).toBe(false)
    api.setToken('abc')
    expect(api.isAuthenticated()).toBe(true)
    expect(api.getToken()).toBe('abc')
    api.clearToken()
    expect(api.isAuthenticated()).toBe(false)
  })
})
