import { createContext, use, useState, type ReactNode } from 'react'
import { useScanRows } from './useScanRows'

type ScanContextValue = ReturnType<typeof useScanRows> & {
  importedFileName: string | null
  setImportedFileName: (name: string | null) => void
  results: string[] | null
  setResults: (files: string[] | null) => void
}

const ScanContext = createContext<ScanContextValue | null>(null)

export function ScanProvider({ children }: { children: ReactNode }) {
  const scanRows = useScanRows()
  const [importedFileName, setImportedFileName] = useState<string | null>(null)
  const [results, setResults] = useState<string[] | null>(null)

  return (
    <ScanContext.Provider value={{ ...scanRows, importedFileName, setImportedFileName, results, setResults }}>
      {children}
    </ScanContext.Provider>
  )
}

export function useScan() {
  const ctx = use(ScanContext)
  if (!ctx) throw new Error('useScan must be used within ScanProvider')
  return ctx
}
