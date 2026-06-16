import { useState, useEffect } from 'react'
import { useScanDefaults } from './useScanDefaults'
import { isAbsolutePath } from '@/utils/path'

const KEY = 'scan_output_dir'

export function useOutputDir(): [string, (value: string) => void] {
  const { defaults } = useScanDefaults()
  const [dir, setDir] = useState(() => localStorage.getItem(KEY) ?? '')

  useEffect(() => {
    if (defaults?.output_dir) {
      const stored = localStorage.getItem(KEY)
      if (!stored || !isAbsolutePath(stored)) {
        localStorage.setItem(KEY, defaults.output_dir)
        setDir(defaults.output_dir)
      }
    }
  }, [defaults?.output_dir])

  function save(value: string) {
    localStorage.setItem(KEY, value)
    setDir(value)
  }

  return [dir, save]
}
