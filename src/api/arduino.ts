import { z } from 'zod'
import client from './client'
import type { PortState } from '@/types/arduino'

const PortStateSchema = z.object({
  name: z.string(),
  pin:  z.number(),
  on:   z.boolean(),
})

const PortStateListSchema = z.array(PortStateSchema)

export async function fetchPorts(): Promise<PortState[]> {
  const res = await client.get('/arduino/state')
  return PortStateListSchema.parse(res.data)
}

export async function setPort(name: string, on: boolean): Promise<void> {
  await client.post('/arduino/port', { name, on })
}

export async function restartArduino(): Promise<void> {
  await client.post('/arduino/restart')
}
