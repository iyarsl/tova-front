import { describe, expect, it } from 'vitest'
import { buildApiScanRows } from './buildApiScanRows'
import type { ScanRow } from '@/types/scan'

describe('buildApiScanRows', () => {
  it('when VORTEX is on, sends the entrance frequency as-is and the configured default as output frequency', () => {
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
        out_freq_mhz: 1250,
        bandwidth: 20,
        gain_db: 42,
        sample_rate: 1_000_000,
      },
    ])
  })

  it('when VORTEX is off, sends the entrance frequency (converted to MHz) as both entrance and output, ignoring the configured default', () => {
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

    expect(buildApiScanRows(rows, { defaultOutFreqMhz: 1250, useVortex: false })).toEqual([
      {
        duration: 1,
        entrance_freq_ghz: 2.4,
        out_freq_mhz: 2400,
        bandwidth: 20,
        gain_db: 42,
        sample_rate: 1_000_000,
      },
    ])
  })
})
