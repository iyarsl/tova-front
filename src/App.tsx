import { useLocation, Navigate, Route, Routes } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Sidebar }     from '@/components/Sidebar'
import { HeroPage }    from '@/features/hero/HeroPage'
import { VortexPage }  from '@/features/vortex/VortexPage'
import { ScanPage }    from '@/features/scan/ScanPage'
import { RxPage }      from '@/features/rx/RxPage'
import { PlayerPage }  from '@/features/player/PlayerPage'
import { SwitchPanel } from '@/features/arduino/SwitchPanel'

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

export function App() {
  const location = useLocation()
  const isHero   = location.pathname === '/'

  if (isHero) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HeroPage />} />
        </Routes>
      </AnimatePresence>
    )
  }

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/vortex" element={<VortexPage />}  />
          <Route path="/config" element={<ScanPage />}    />
          <Route path="/rx"     element={<RxPage />}      />
          <Route path="/player" element={<PlayerPage />}  />
          <Route path="/arduino" element={<SwitchPanel />} />
          <Route path="*"       element={<Navigate to="/vortex" replace />} />
        </Routes>
      </AnimatePresence>
    </AppShell>
  )
}
