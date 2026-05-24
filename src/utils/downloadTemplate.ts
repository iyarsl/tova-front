import * as XLSX from 'xlsx'

const HEADERS = [
  'Duration (s)',
  'Entrance Freq (GHz)',
  'Out Freq (MHz)',
  'Bandwidth (MHz)',
  'Gain (dB)',
  'Sample Rate (Hz)',
]

const EXAMPLE_ROW = [1.0, 2.4, 70, 80, 20, 1_000_000]

export function downloadScanTemplate(): void {
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, EXAMPLE_ROW])

  // Set column widths for readability
  ws['!cols'] = HEADERS.map(h => ({ wch: Math.max(h.length + 4, 16) }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Scan Parameters')
  XLSX.writeFile(wb, 'scan-template.xlsx')
}
