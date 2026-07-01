import * as XLSX from 'xlsx'

const HEADERS = [
  'Duration (s)',
  'Frequency (GHz)',
  'Out Freq (MHz)',
  'Bandwidth (MHz)',
  'Gain (dB)',
  'Sample Rate (Hz)',
]

export function downloadScanTemplate(): void {
  const ws = XLSX.utils.aoa_to_sheet([HEADERS])

  // Set column widths for readability
  ws['!cols'] = HEADERS.map(h => ({ wch: Math.max(h.length + 4, 16) }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Scan Parameters')
  XLSX.writeFile(wb, 'scan-template.xlsx')
}
