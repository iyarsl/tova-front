/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react'
import { useRxStream } from './useRxStream'
import type { SignalData, RxStatus } from '@/types/rx'

interface RxStreamState {
  data: SignalData | null
  status: RxStatus
  sampleRate: number
}

const RxStreamContext = createContext<RxStreamState | null>(null)

export function RxStreamProvider({ children }: { children: ReactNode }) {
  const stream = useRxStream()
  return <RxStreamContext.Provider value={stream}>{children}</RxStreamContext.Provider>
}

export function useRxStreamContext(): RxStreamState {
  const ctx = useContext(RxStreamContext)
  if (!ctx) throw new Error('useRxStreamContext must be used inside RxStreamProvider')
  return ctx
}
