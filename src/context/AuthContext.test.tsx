import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from './AuthContext'
import { useAuth } from '@/hooks/useAuth'

const SESSION_KEY = 'auth-session'

beforeEach(() => {
  localStorage.clear()
})

describe('AuthContext', () => {
  it('starts with no user when localStorage is empty', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.user).toBeNull()
  })

  it('login with valid credentials sets user and persists the session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    let ok = false
    await act(async () => {
      ok = await result.current.login('admin', 'admin123')
    })

    expect(ok).toBe(true)
    await waitFor(() => expect(result.current.user).toBe('admin'))
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)!).username).toBe('admin')
  })

  it('login with invalid credentials leaves user unset', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    let ok = true
    await act(async () => {
      ok = await result.current.login('admin', 'wrong-password')
    })

    expect(ok).toBe(false)
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('logout clears the user and the stored session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await act(async () => {
      await result.current.login('admin', 'admin123')
    })
    await waitFor(() => expect(result.current.user).toBe('admin'))

    act(() => result.current.logout())

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('rejects an expired stored session on mount', () => {
    const expiredLoginAt = Date.now() - 13 * 60 * 60 * 1_000 // 13h ago, > 12h expiry
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: 'admin', loginAt: expiredLoginAt }))

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('restores a non-expired stored session on mount', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: 'operator', loginAt: Date.now() }))

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    expect(result.current.user).toBe('operator')
  })
})
