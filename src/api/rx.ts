import { z } from 'zod'
import client from './client'

export type RxConnectConfig = {
  frequency: number   // Hz
  sample_rate: number // Hz
  gain: number        // dB
  bandwidth: number   // Hz
  channel?: number
  antenna?: string | null
}

export async function connectRx(config: RxConnectConfig): Promise<void> {
  await client.post('/rx/connect', config)
}

export async function disconnectRx(): Promise<void> {
  await client.delete('/rx/disconnect', { timeout: 30_000 })
}

export async function startStream(chunkDuration = 0.5): Promise<void> {
  await client.post('/rx/stream_start', null, { params: { chunk_duration: chunkDuration } })
}

export async function stopStream(): Promise<void> {
  await client.post('/rx/stream_stop')
}

const StreamStatusSchema = z.object({ is_receiving: z.boolean() })

export async function fetchStreamStatus(): Promise<boolean> {
  const res = await client.get('/rx/status')
  return StreamStatusSchema.parse(res.data).is_receiving
}
