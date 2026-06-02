import { useState } from 'react'

const KEY = 'scan_output_dir'
const FALLBACK = ''

export function useOutputDir(): [string, (value: string) => void] {
  const [dir, setDir] = useState(() => localStorage.getItem(KEY) ?? FALLBACK)

  function save(value: string) {
    localStorage.setItem(KEY, value)
    setDir(value)
  }

  return [dir, save]
}
