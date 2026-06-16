import { z } from 'zod'
import client from './client'
import type { ApiScanRow, ScanDefaults } from '@/types/scan'

export type { ApiScanRow }

const ScanRowSchema = z.object({
  duration:          z.number(),
  entrance_freq_ghz: z.number(),
  out_freq_mhz:      z.number(),
  bandwidth:         z.union([z.literal(80), z.literal(160), z.literal(320)]),
  gain_db:           z.number(),
  sample_rate:       z.number(),
})

async function validateScan(path: string): Promise<ApiScanRow[]> {
  const res = await client.post('/scan/validate', { path })
  return z.array(ScanRowSchema).parse(res.data)
}

export async function runScan(
  rows: ApiScanRow[],
  output_dir: string,
  mock: boolean,
  use_vortex: boolean,
): Promise<string[]> {
  const res = await client.post('/scan/run', { rows, output_dir, mock, use_vortex })
  return z.array(z.string()).parse(res.data)
}

const ScanDefaultsSchema = z.object({
  gain_db:      z.number(),
  out_freq_mhz: z.number(),
  output_dir:   z.string(),
})

export async function fetchScanDefaults(): Promise<ScanDefaults> {
  const res = await client.get('/scan/defaults')
  return ScanDefaultsSchema.parse(res.data)
}

export async function updateScanDefaults(body: ScanDefaults): Promise<ScanDefaults> {
  const res = await client.put('/scan/defaults', body)
  return ScanDefaultsSchema.parse(res.data)
}
