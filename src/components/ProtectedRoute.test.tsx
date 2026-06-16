import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ProtectedRoute } from './ProtectedRoute'
import { AuthProvider } from '@/context/AuthContext'

const SESSION_KEY = 'auth-session'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/vortex" element={<div>Vortex Page</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('ProtectedRoute', () => {
  it('redirects to /login when unauthenticated', () => {
    renderAt('/vortex')
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Vortex Page')).not.toBeInTheDocument()
  })

  it('renders the protected page when authenticated', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: 'admin', loginAt: Date.now() }))
    renderAt('/vortex')
    expect(screen.getByText('Vortex Page')).toBeInTheDocument()
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
  })
})
