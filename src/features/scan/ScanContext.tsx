import { createContext, use, useState, useCallback, useMemo, type ReactNode } from 'react'
import { useScanRows } from './useScanRows'
import { useScanDefaults } from '@/hooks/useScanDefaults'
import type { ScanRowResult } from '@/types/scan'

type ScanContextValue = ReturnType<typeof useScanRows> & {
  importedFileName: string | null
  setImportedFileName: (name: string | null) => void
  results: ScanRowResult[] | null
  setResults: (results: ScanRowResult[] | null) => void
}

const ScanContext = createContext<ScanContextValue | null>(null)

export function ScanProvider({ children }: { children: ReactNode }) {
  const scanRows = useScanRows()
  const { defaults } = useScanDefaults()
  const [importedFileName, setImportedFileName] = useState<string | null>(null)
  const [results, setResults] = useState<ScanRowResult[] | null>(null)

  const addRow = useCallback(() => {
    scanRows.addRow(
      defaults ? { gain_db: defaults.gain_db, out_freq_mhz: defaults.out_freq_mhz } : undefined
    )
  }, [scanRows.addRow, defaults])

  const ctxValue = useMemo<ScanContextValue>(
    () => ({ ...scanRows, addRow, importedFileName, setImportedFileName, results, setResults }),
    [scanRows, addRow, importedFileName, results],
  )

  return (
    <ScanContext.Provider value={ctxValue}>
      {children}
    </ScanContext.Provider>
  )
}

export function useScan() {
  const ctx = use(ScanContext)
  if (!ctx) throw new Error('useScan must be used within ScanProvider')
  return ctx
}
