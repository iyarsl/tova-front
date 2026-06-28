import { z } from 'zod'
import client from './client'

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
