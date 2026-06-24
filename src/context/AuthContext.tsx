import { createContext, useState } from 'react'
import { verifyCredentials } from '@/features/auth/verifyCredentials'
import { logger } from '@/utils/logger'

const SESSION_KEY = 'auth-session'
const SESSION_DURATION_MS = 12 * 60 * 60 * 1_000 // 12 h

type StoredSession = {
  username: string
  loginAt: number
}

export type AuthContextValue = {
  user: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => false,
  logout: () => {},
})

function readStoredSession(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const { username, loginAt } = JSON.parse(raw) as StoredSession
    if (Date.now() - loginAt > SESSION_DURATION_MS) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return username
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(() => readStoredSession())

  async function login(username: string, password: string): Promise<boolean> {
    const ok = await verifyCredentials(username, password)
    if (!ok) {
      logger.warn('[auth] login failed for', username)
      return false
    }
    const session: StoredSession = { username, loginAt: Date.now() }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(username)
    logger.log('[auth] login:', username)
    return true
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
    logger.log('[auth] logout')
  }

  return (
    <AuthContext value={{ user, login, logout }}>
      {children}
    </AuthContext>
  )
}
