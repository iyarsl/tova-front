import { z } from 'zod'
import client from './client'

const ControlStatusSchema = z.object({
  owner:         z.string().nullable(),
  locked:        z.boolean(),
  held_by_me:    z.boolean(),
  ttl_remaining: z.number(),
})

export type ControlStatus = z.infer<typeof ControlStatusSchema>

export async function fetchControlStatus(): Promise<ControlStatus> {
  const res = await client.get('/control/status')
  return ControlStatusSchema.parse(res.data)
}

export async function acquireControl(): Promise<ControlStatus> {
  const res = await client.post('/control/acquire')
  return ControlStatusSchema.parse(res.data)
}

export async function heartbeatControl(): Promise<ControlStatus> {
  const res = await client.post('/control/heartbeat')
  return ControlStatusSchema.parse(res.data)
}

export async function releaseControl(): Promise<void> {
  await client.post('/control/release')
}
