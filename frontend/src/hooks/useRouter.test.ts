import { describe, it, expect } from 'vitest'
import { matchPath } from './useRouter'

describe('matchPath', () => {
  it('matches exact paths', () => {
    expect(matchPath('/edition', '/edition')).toEqual({})
  })

  it('extracts path params', () => {
    expect(matchPath('/edition/:date', '/edition/2026-03-21')).toEqual({ date: '2026-03-21' })
  })

  it('returns null for non-matching paths', () => {
    expect(matchPath('/edition/:date', '/pages')).toBeNull()
  })

  it('returns null for different segment counts', () => {
    expect(matchPath('/edition/:date', '/edition')).toBeNull()
  })

  it('matches multi-segment paths', () => {
    expect(matchPath('/pages/:slug/content', '/pages/news/content')).toEqual({ slug: 'news' })
  })

  it('returns null when static segments differ', () => {
    expect(matchPath('/pages/:id', '/settings/123')).toBeNull()
  })
})
