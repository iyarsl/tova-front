import type { ApiScanRow, ScanRow } from '@/types/scan'

type BuildApiScanRowsOptions = {
  defaultOutFreqMhz: number
  useVortex: boolean
}

export function buildApiScanRows(
  rows: ScanRow[],
  { defaultOutFreqMhz, useVortex }: BuildApiScanRowsOptions,
): ApiScanRow[] {
  return rows.map(({ id: _id, duration, entrance_freq_ghz, out_freq_mhz, bandwidth, gain_db, sample_rate }) => ({
    duration:          duration!,
    entrance_freq_ghz: entrance_freq_ghz!,
    out_freq_mhz:      useVortex ? (out_freq_mhz ?? defaultOutFreqMhz) : entrance_freq_ghz !== null ? entrance_freq_ghz * 1000 : defaultOutFreqMhz,
    bandwidth:         bandwidth!,
    gain_db:           gain_db!,
    sample_rate:       sample_rate!,
  }))
}
