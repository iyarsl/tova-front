import { useCallback, useState } from 'react'
import type { ScanRow, ScanRowErrors } from '@/types/scan'

function makeRow(defaults?: Pick<ScanRow, 'gain_db' | 'out_freq_mhz'>): ScanRow {
  return {
    id: crypto.randomUUID(),
    duration:          null,
    entrance_freq_ghz: null,
    out_freq_mhz:      defaults?.out_freq_mhz ?? null,
    bandwidth:         null,
    gain_db:           defaults?.gain_db ?? null,
    sample_rate:       null,
  }
}

function validate(row: ScanRow): ScanRowErrors {
  const e: ScanRowErrors = {}

  if (row.duration === null)                                        e.duration = 'Required'
  else if (row.duration <= 0)                                       e.duration = 'Must be > 0'

  if (row.entrance_freq_ghz === null)                               e.entrance_freq_ghz = 'Required'
  else if (row.entrance_freq_ghz < 0.01 || row.entrance_freq_ghz > 26) e.entrance_freq_ghz = '0.01–26 GHz'

  if (row.bandwidth === null)                                       e.bandwidth = 'Required'
  else if (row.bandwidth <= 0 || row.bandwidth > 320)              e.bandwidth = '0–320 MHz'

  if (row.gain_db === null)                                         e.gain_db = 'Required'
  else if (row.gain_db < 0 || row.gain_db > 90)                    e.gain_db = '0–90 dB'

  if (row.sample_rate === null)                                     e.sample_rate = 'Required'
  else if (row.sample_rate <= 0)                                    e.sample_rate = 'Must be > 0'

  return e
}

export function useScanRows() {
  const [rows, setRows] = useState<ScanRow[]>([])
  const [errors, setErrors] = useState<Record<string, ScanRowErrors>>({})

  const addRow = useCallback((defaults?: Pick<ScanRow, 'gain_db' | 'out_freq_mhz'>) =>
    setRows(prev => [...prev, makeRow(defaults)]), [])

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
    if (rows.length === 0) {
      setErrors({})
      return false          // empty table is not valid
    }
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
