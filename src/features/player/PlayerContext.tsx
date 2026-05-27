import { createContext, use, type ReactNode } from 'react'
import { useFilePlayer } from './useFilePlayer'

type PlayerContextValue = ReturnType<typeof useFilePlayer>

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = useFilePlayer()

  return (
    <PlayerContext.Provider value={player}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = use(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
