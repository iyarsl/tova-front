import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Sidebar }       from '@/components/Sidebar'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { HeroPage }      from '@/features/hero/HeroPage'
import { VortexPage }    from '@/features/vortex/VortexPage'
import { ScanPage }      from '@/features/scan/ScanPage'
import { RxPage }        from '@/features/rx/RxPage'
import { PlayerPage }    from '@/features/player/PlayerPage'
import { LoginPage }     from '@/features/auth/LoginPage'

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden dark:bg-base-950 bg-sky-canvas">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}

function AppShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export function App() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — all other pages require auth */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HeroPage />} />
          <Route element={<AppShellLayout />}>
            <Route path="/vortex" element={<VortexPage />} />
            <Route path="/config" element={<ScanPage />}   />
            <Route path="/rx"     element={<RxPage />}     />
            <Route path="/player" element={<PlayerPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/vortex" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}
