import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/components/Toast'
import { RxStreamProvider } from '@/features/rx/RxStreamContext'
import { ScanProvider } from '@/features/scan/ScanContext'
import { PlayerProvider } from '@/features/player/PlayerContext'
import { App } from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  4_000,
      gcTime:     60_000,
      retry:      1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>
              <RxStreamProvider>
                <ScanProvider>
                  <PlayerProvider>
                    <App />
                  </PlayerProvider>
                </ScanProvider>
              </RxStreamProvider>
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
