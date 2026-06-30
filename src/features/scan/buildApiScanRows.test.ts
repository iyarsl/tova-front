import { describe, expect, it } from 'vitest'
import { buildApiScanRows } from './buildApiScanRows'
import type { ScanRow } from '@/types/scan'

describe('buildApiScanRows', () => {
  it('uses the edited per-row output frequency and gain values', () => {
    const rows: ScanRow[] = [
      {
        id: 'row-1',
        duration: 1,
        entrance_freq_ghz: 2.4,
        out_freq_mhz: 1550,
        bandwidth: 20,
        gain_db: 42,
        sample_rate: 1_000_000,
      },
    ]

    expect(buildApiScanRows(rows, { defaultOutFreqMhz: 1250, useVortex: true })).toEqual([
      {
        duration: 1,
        entrance_freq_ghz: 2.4,
        out_freq_mhz: 1550,
        bandwidth: 20,
        gain_db: 42,
        sample_rate: 1_000_000,
      },
    ])
  })

  it('falls back to the configured output frequency when the hidden row value is empty', () => {
    const rows: ScanRow[] = [
      {
        id: 'row-1',
        duration: 1,
        entrance_freq_ghz: 2.4,
        out_freq_mhz: null,
        bandwidth: 20,
        gain_db: 42,
        sample_rate: 1_000_000,
      },
    ]

    expect(buildApiScanRows(rows, { defaultOutFreqMhz: 1250, useVortex: true })[0].out_freq_mhz).toBe(1250)
  })

  it('uses the table entrance frequency as MHz when VORTEX is disabled', () => {
    const rows: ScanRow[] = [
      {
        id: 'row-1',
        duration: 1,
        entrance_freq_ghz: 2.4,
        out_freq_mhz: 1250,
        bandwidth: 20,
        gain_db: 42,
        sample_rate: 1_000_000,
      },
    ]

    expect(buildApiScanRows(rows, { defaultOutFreqMhz: 1250, useVortex: false })[0].out_freq_mhz).toBe(2400)
  })
})
