import { z } from 'zod'
import client from './client'
import type { ApiScanRow, ScanDefaults } from '@/types/scan'

export type { ApiScanRow }

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

const RabbitStatusSchema = z.object({ enabled: z.boolean() })

export async function fetchRabbitStatus(): Promise<boolean> {
  const res = await client.get('/scan/rabbitmq/status')
  return RabbitStatusSchema.parse(res.data).enabled
}

export async function toggleRabbit(enabled: boolean): Promise<boolean> {
  const res = await client.post('/scan/rabbitmq/toggle', { enabled })
  return RabbitStatusSchema.parse(res.data).enabled
}
