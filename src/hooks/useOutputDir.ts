import { useState, useEffect } from 'react'
import { useScanDefaults } from './useScanDefaults'

const KEY = 'scan_output_dir'

export function useOutputDir(): [string, (value: string) => void] {
  const { defaults } = useScanDefaults()
  const [dir, setDir] = useState(() => localStorage.getItem(KEY) ?? '')

  useEffect(() => {
    if (defaults?.output_dir && localStorage.getItem(KEY) === null) {
      setDir(defaults.output_dir)
    }
  }, [defaults?.output_dir])

  function save(value: string) {
    localStorage.setItem(KEY, value)
    setDir(value)
  }

  return [dir, save]
}
