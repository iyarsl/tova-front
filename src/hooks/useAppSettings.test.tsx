import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppSettings } from './useAppSettings'
import { fetchAppSettings } from '@/api/settings'

vi.mock('@/api/settings', () => ({
  fetchAppSettings: vi.fn(),
}))

const mockFetch = vi.mocked(fetchAppSettings)

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useAppSettings', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('is pending with undefined useVortex during the first fetch', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useAppSettings(), { wrapper })
    expect(result.current.isPending).toBe(true)
    expect(result.current.useVortex).toBeUndefined()
  })

  it('resolves useVortex to the backend value (true)', async () => {
    mockFetch.mockResolvedValue({ use_vortex: true })
    const { result } = renderHook(() => useAppSettings(), { wrapper })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.useVortex).toBe(true)
  })

  it('resolves useVortex to the backend value (false)', async () => {
    mockFetch.mockResolvedValue({ use_vortex: false })
    const { result } = renderHook(() => useAppSettings(), { wrapper })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.useVortex).toBe(false)
  })

  it('falls back to true when the fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useAppSettings(), { wrapper })
    await waitFor(() => expect(result.current.isPending).toBe(false), { timeout: 5000 })
    expect(result.current.useVortex).toBe(true)
  })
})
