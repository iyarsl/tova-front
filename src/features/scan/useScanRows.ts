import { useCallback, useState } from 'react'
import type { ScanRow, ScanRowErrors } from '@/types/scan'

function makeRow(): ScanRow {
  return {
    id: crypto.randomUUID(),
    duration: 1.0,
    entrance_freq_ghz: 2.4,
    out_freq_mhz: 70.0,
    bandwidth: 80,
    gain_db: 20.0,
    sample_rate: 1_000_000,
  }
}

function validate(row: ScanRow): ScanRowErrors {
  const e: ScanRowErrors = {}
  if (row.duration <= 0)                          e.duration = 'Must be > 0'
  if (row.entrance_freq_ghz < 0.01 || row.entrance_freq_ghz > 26) e.entrance_freq_ghz = '0.01–26 GHz'
  if (row.out_freq_mhz < 0 || row.out_freq_mhz > 3500)           e.out_freq_mhz = '0–3500 MHz'
  if (![80, 160, 320].includes(row.bandwidth))                    e.bandwidth = '80/160/320'
  if (row.gain_db < 0 || row.gain_db > 90)                        e.gain_db = '0–90 dB'
  if (row.sample_rate <= 0)                                       e.sample_rate = 'Must be > 0'
  return e
}

export function useScanRows() {
  const [rows, setRows] = useState<ScanRow[]>([])
  const [errors, setErrors] = useState<Record<string, ScanRowErrors>>({})

  const addRow = useCallback(() =>
    setRows(prev => [...prev, makeRow()]), [])

  const removeRow = useCallback((id: string) =>
    setRows(prev => prev.filter(r => r.id !== id)), [])

  const updateCell = useCallback(<K extends keyof Omit<ScanRow, 'id'>>(
    id: string,
    field: K,
    value: ScanRow[K],
  ) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }, [])

  const validateAll = useCallback(() => {
    const errs: Record<string, ScanRowErrors> = {}
    let valid = true
    rows.forEach(r => {
      const e = validate(r)
      if (Object.keys(e).length > 0) { errs[r.id] = e; valid = false }
    })
    setErrors(errs)
    return valid
  }, [rows])

  const clearErrors = useCallback(() => setErrors({}), [])

  const loadRows = useCallback((incoming: ScanRow[]): boolean => {
    setRows(incoming)
    const errs: Record<string, ScanRowErrors> = {}
    let valid = true
    incoming.forEach(r => {
      const e = validate(r)
      if (Object.keys(e).length > 0) { errs[r.id] = e; valid = false }
    })
    setErrors(errs)
    return valid
  }, [])

  return { rows, errors, addRow, removeRow, updateCell, validateAll, clearErrors, loadRows }
}
