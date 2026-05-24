import * as XLSX from 'xlsx'
import type { ScanRow } from '@/types/scan'

// Aliases map: canonical field → accepted lowercase header substrings
const COLUMN_ALIASES: Record<keyof Omit<ScanRow, 'id'>, string[]> = {
  duration:          ['duration (s)', 'duration', 'dur'],
  entrance_freq_ghz: ['entrance freq (ghz)', 'entrance freq', 'entrance_freq_ghz'],
  out_freq_mhz:      ['out freq (mhz)', 'out freq', 'out_freq_mhz', 'output'],
  bandwidth:         ['bandwidth (mhz)', 'bandwidth', 'bw'],
  gain_db:           ['gain (db)', 'gain', 'gain_db'],
  sample_rate:       ['sample rate (hz)', 'sample rate', 'sample_rate'],
}

type ScanField = keyof Omit<ScanRow, 'id'>
const ALL_FIELDS = Object.keys(COLUMN_ALIASES) as ScanField[]

function matchField(header: string): ScanField | null {
  const normalized = header.toLowerCase().trim()
  for (const field of ALL_FIELDS) {
    for (const alias of COLUMN_ALIASES[field]) {
      if (normalized === alias || normalized.includes(alias)) {
        return field
      }
    }
  }
  return null
}

function isEmptyRow(cells: unknown[]): boolean {
  return cells.every(c => c === undefined || c === null || c === '')
}

export async function parseExcelToScanRows(file: File): Promise<ScanRow[]> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'xlsx' && ext !== 'xls') {
    throw new Error('Only .xlsx / .xls files supported')
  }

  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' })

  const sheetName = wb.SheetNames[0]
  if (!sheetName) throw new Error('Excel has no sheets')

  const sheet = wb.Sheets[sheetName]
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })

  if (raw.length < 1) throw new Error('Excel has no data rows')

  // Build header → field index map
  const headerRow = raw[0] as unknown[]
  const fieldColIndex: Partial<Record<ScanField, number>> = {}

  headerRow.forEach((cell, idx) => {
    const matched = matchField(String(cell ?? ''))
    if (matched && !(matched in fieldColIndex)) {
      fieldColIndex[matched] = idx
    }
  })

  // Check all required fields present
  const missing = ALL_FIELDS.filter(f => !(f in fieldColIndex))
  if (missing.length > 0) {
    const labels: Record<ScanField, string> = {
      duration:          'Duration (s)',
      entrance_freq_ghz: 'Entrance Freq (GHz)',
      out_freq_mhz:      'Out Freq (MHz)',
      bandwidth:         'Bandwidth (MHz)',
      gain_db:           'Gain (dB)',
      sample_rate:       'Sample Rate (Hz)',
    }
    throw new Error(`Missing columns: ${missing.map(f => labels[f]).join(', ')}`)
  }

  const dataRows = raw.slice(1)
  const parsed: ScanRow[] = []

  for (const row of dataRows) {
    const cells = row as unknown[]
    if (isEmptyRow(cells)) continue

    const get = (field: ScanField): number => {
      const idx = fieldColIndex[field] as number
      const val = cells[idx]
      const n = Number(val)
      return isNaN(n) ? 0 : n
    }

    const bwRaw = get('bandwidth')
    const bandwidth = [80, 160, 320].includes(bwRaw)
      ? (bwRaw as 80 | 160 | 320)
      : 80

    parsed.push({
      id:                crypto.randomUUID(),
      duration:          get('duration'),
      entrance_freq_ghz: get('entrance_freq_ghz'),
      out_freq_mhz:      get('out_freq_mhz'),
      bandwidth,
      gain_db:           get('gain_db'),
      sample_rate:       get('sample_rate'),
    })
  }

  if (parsed.length === 0) throw new Error('Excel has no data rows')

  return parsed
}
