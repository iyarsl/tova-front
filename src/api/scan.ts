import { z } from 'zod'
import client from './client'

const ScanRowSchema = z.object({
  duration:           z.number(),
  entrance_freq_ghz:  z.number(),
  out_freq_mhz:       z.number(),
  bandwidth:          z.union([z.literal(80), z.literal(160), z.literal(320)]),
  gain_db:            z.number(),
  sample_rate:        z.number(),
})

export type ApiScanRow = z.infer<typeof ScanRowSchema>

export async function validateScan(path: string): Promise<ApiScanRow[]> {
  const res = await client.post('/scan/validate', { path })
  return z.array(ScanRowSchema).parse(res.data)
}

export async function runScan(
  rows: ApiScanRow[],
  output_dir: string,
  mock: boolean,
): Promise<string[]> {
  const res = await client.post('/scan/run', { rows, output_dir, mock })
  return z.array(z.string()).parse(res.data)
}
